"""PRISM-PY Procurement Workflow Routes.

All routes mount at /api/v1/procurement-* or /api/v1/proposals/{id}/...

Covers:
- Financial threshold / approval routing
- Procurement Requirements
- Procurement Events (bid lifecycle)
- Bids
- Technical Evaluation + Committee
- Financial Evaluation + L1 identification
- Purchase Orders
- Approval matrix management

IMPORTANT: PRISM-PY provides intelligence and records information only.
It does NOT:
  - automatically select vendors
  - place purchase orders autonomously
  - approve proposals without officer action
  - compute legally binding thresholds (configurable demo values only)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .auth_v1 import audit, get_current_user, has_permission, require_permission
from .database import get_db
from .models_procurement import (
    ApprovalMatrix,
    Bid,
    BidderEvaluation,
    EvaluationCommittee,
    FinancialBidLine,
    FinancialEvaluation,
    ProcurementEvent,
    ProcurementRequirement,
    PurchaseOrder,
    TechnicalEvaluation,
)
from .models_v1 import AuditEvent, ImplementationRecord, Proposal, User
from .settings import SYNTHETIC_LABEL, VENDOR_NOTICE

router = APIRouter(prefix="/api/v1", tags=["procurement"])

SYNTHETIC_NOTICE = "SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _fail(code: int, msg: str):
    raise HTTPException(status_code=code, detail=msg)


def _event_number() -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M")
    uid = str(uuid.uuid4())[:4].upper()
    return f"PE-{ts}-{uid}"


# ============================================================
# APPROVAL MATRIX
# ============================================================

@router.get("/approval-matrix")
def get_approval_matrix(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return configured financial threshold → approval level mapping."""
    rows = db.scalars(select(ApprovalMatrix).where(ApprovalMatrix.is_active == True).order_by(ApprovalMatrix.min_amount_inr)).all()
    return {
        "success": True,
        "matrix": [
            {
                "id": r.id,
                "authority_level": r.authority_level,
                "required_role": r.required_role,
                "min_amount_inr": r.min_amount_inr,
                "max_amount_inr": r.max_amount_inr,
                "description": r.description,
                "synthetic": r.synthetic,
            }
            for r in rows
        ],
        "notice": (
            "These thresholds are illustrative demo values only. "
            "Actual approval thresholds are governed by departmental DFP/GFR rules."
        ),
        "data_classification": SYNTHETIC_NOTICE,
    }


@router.get("/proposals/{proposal_id}/approval-level")
def get_proposal_approval_level(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compute the required approval authority level for a proposal based on its estimated cost."""
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    cost = p.estimated_cost or 0.0
    matrix = db.scalars(
        select(ApprovalMatrix)
        .where(ApprovalMatrix.is_active == True)
        .order_by(ApprovalMatrix.min_amount_inr)
    ).all()

    applicable = None
    for row in matrix:
        if cost >= row.min_amount_inr:
            if row.max_amount_inr is None or cost <= row.max_amount_inr:
                applicable = row
                break

    if not applicable and matrix:
        # Take the highest tier if cost exceeds all defined ranges
        applicable = sorted(matrix, key=lambda r: r.min_amount_inr, reverse=True)[0]

    return {
        "success": True,
        "proposal_id": proposal_id,
        "estimated_cost_inr": cost,
        "applicable_level": applicable.authority_level if applicable else "DGP_LEVEL",
        "required_role": applicable.required_role if applicable else "APPROVING_AUTHORITY",
        "description": applicable.description if applicable else "",
        "matrix_applied": applicable is not None,
        "notice": (
            "Approval level is computed from the demo ApprovalMatrix. "
            "Actual routing must follow departmental DFP/GFR and applicable Government Orders."
        ),
        "data_classification": SYNTHETIC_NOTICE,
    }


class GovernmentApproveBody(BaseModel):
    reference: Optional[str] = None
    comment: Optional[str] = None


@router.post("/proposals/{proposal_id}/government-approve")
def government_approve(
    proposal_id: str,
    body: GovernmentApproveBody = Body(default=GovernmentApproveBody()),
    user: User = Depends(require_permission("proposal:government_approve")),
    db: Session = Depends(get_db),
):
    """Record Government/Secretariat level approval for a high-value proposal."""
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    if p.status not in ("SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "APPROVED"):
        _fail(400, f"Cannot record Government approval in status: {p.status}")

    # Update via migration-added columns using raw SQL to avoid model redefinition
    from sqlalchemy import text
    with db.bind.connect() as conn:
        conn.execute(
            text(
                "UPDATE proposals SET government_approved_by = :by, "
                "government_approved_at = :at, "
                "government_approval_ref = :ref, "
                "approval_level = 'GOVERNMENT_LEVEL' "
                "WHERE id = :id"
            ),
            {"by": user.display_name, "at": _now().isoformat(), "ref": body.reference or "", "id": proposal_id},
        )
        conn.commit()

    audit(db, "PROPOSAL_GOVERNMENT_APPROVED", actor=user, object_type="PROPOSAL", object_id=proposal_id,
          detail=f"Ref: {body.reference} — {body.comment or ''}")
    return {"success": True, "message": "Government-level approval recorded", "proposal_id": proposal_id}


# ============================================================
# PROCUREMENT REQUIREMENTS
# ============================================================

class ProcurementRequirementBody(BaseModel):
    category: Optional[str] = None
    item_description: str = ""
    quantity: Optional[str] = None
    unit_of_measure: Optional[str] = None
    functional_requirements: Optional[str] = None
    technical_specification: Optional[str] = None
    compliance_requirements: Optional[str] = None
    delivery_requirements: Optional[str] = None
    warranty_requirements: Optional[str] = None
    estimated_unit_cost: Optional[float] = None
    total_estimated_cost: Optional[float] = None
    justification: Optional[str] = None
    gem_category_code: Optional[str] = None
    gem_search_params: dict = Field(default_factory=dict)


@router.post("/proposals/{proposal_id}/procurement-requirement")
def create_procurement_requirement(
    proposal_id: str,
    body: ProcurementRequirementBody,
    user: User = Depends(require_permission("procurement_req:create")),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    if p.status not in ("APPROVED", "PROCUREMENT"):
        _fail(400, f"Procurement requirement can only be created for APPROVED proposals. Current status: {p.status}")

    req = ProcurementRequirement(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        category=body.category or p.category,
        item_description=body.item_description or p.title,
        quantity=body.quantity or p.quantity,
        unit_of_measure=body.unit_of_measure or p.unit_of_measure,
        functional_requirements=body.functional_requirements or p.purpose,
        technical_specification=body.technical_specification or p.specification,
        compliance_requirements=body.compliance_requirements,
        delivery_requirements=body.delivery_requirements,
        warranty_requirements=body.warranty_requirements,
        estimated_unit_cost=body.estimated_unit_cost,
        total_estimated_cost=body.total_estimated_cost or p.estimated_cost,
        justification=body.justification or p.problem_statement,
        gem_category_code=body.gem_category_code,
        gem_search_params=body.gem_search_params,
        prepared_by=user.id,
        status="DRAFT",
    )
    db.add(req)
    # Move proposal to PROCUREMENT stage
    p.status = "PROCUREMENT"
    p.updated_at = _now()
    db.flush()
    audit(db, "PROCUREMENT_REQUIREMENT_CREATED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return {"success": True, "requirement_id": req.id, "requirement": _req_dict(req)}


@router.get("/proposals/{proposal_id}/procurement-requirement")
def get_procurement_requirement(
    proposal_id: str,
    user: User = Depends(require_permission("procurement:view")),
    db: Session = Depends(get_db),
):
    reqs = db.scalars(
        select(ProcurementRequirement).where(ProcurementRequirement.proposal_id == proposal_id)
        .order_by(ProcurementRequirement.created_at.desc())
    ).all()
    return {
        "success": True,
        "requirements": [_req_dict(r) for r in reqs],
        "vendor_selection": "NOT_PERFORMED",
    }


@router.patch("/procurement-requirements/{req_id}")
def update_procurement_requirement(
    req_id: str,
    body: ProcurementRequirementBody,
    user: User = Depends(require_permission("procurement_req:edit")),
    db: Session = Depends(get_db),
):
    req = db.get(ProcurementRequirement, req_id)
    if not req:
        _fail(404, "Procurement requirement not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(req, field, val)
    req.updated_at = _now()
    db.flush()
    audit(db, "PROCUREMENT_REQUIREMENT_UPDATED", actor=user, object_type="PROCUREMENT_REQ", object_id=req_id)
    return {"success": True, "requirement": _req_dict(req)}


def _req_dict(r: ProcurementRequirement) -> dict[str, Any]:
    return {
        "id": r.id, "proposal_id": r.proposal_id, "category": r.category,
        "item_description": r.item_description, "quantity": r.quantity,
        "unit_of_measure": r.unit_of_measure,
        "functional_requirements": r.functional_requirements,
        "technical_specification": r.technical_specification,
        "compliance_requirements": r.compliance_requirements,
        "delivery_requirements": r.delivery_requirements,
        "warranty_requirements": r.warranty_requirements,
        "estimated_unit_cost": r.estimated_unit_cost,
        "total_estimated_cost": r.total_estimated_cost,
        "justification": r.justification,
        "gem_category_code": r.gem_category_code,
        "gem_search_params": r.gem_search_params,
        "prepared_by": r.prepared_by, "approved_by": r.approved_by,
        "status": r.status, "synthetic": r.synthetic,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


# ============================================================
# PROCUREMENT EVENTS  (bid lifecycle)
# ============================================================

class ProcurementEventBody(BaseModel):
    procurement_mode: Optional[str] = None
    gem_bid_number: Optional[str] = None
    bid_start_date: Optional[str] = None
    bid_close_date: Optional[str] = None
    bid_open_date: Optional[str] = None
    bid_duration_days: Optional[int] = None
    notes: Optional[str] = None


@router.post("/procurement-requirements/{req_id}/events")
def create_procurement_event(
    req_id: str,
    body: ProcurementEventBody,
    user: User = Depends(require_permission("procurement:create")),
    db: Session = Depends(get_db),
):
    req = db.get(ProcurementRequirement, req_id)
    if not req:
        _fail(404, "Procurement requirement not found")
    event = ProcurementEvent(
        id=str(uuid.uuid4()),
        requirement_id=req_id,
        proposal_id=req.proposal_id,
        event_number=_event_number(),
        procurement_mode=body.procurement_mode,
        gem_bid_number=body.gem_bid_number,
        bid_start_date=body.bid_start_date,
        bid_close_date=body.bid_close_date,
        bid_open_date=body.bid_open_date,
        bid_duration_days=body.bid_duration_days,
        notes=body.notes,
        created_by=user.id,
        status="PREPARING",
    )
    db.add(event)
    db.flush()
    audit(db, "PROCUREMENT_EVENT_CREATED", actor=user, object_type="PROCUREMENT_EVENT", object_id=event.id,
          detail=f"Mode: {body.procurement_mode} | Req: {req_id}")
    return {"success": True, "event_id": event.id, "event": _event_dict(event)}


@router.get("/proposals/{proposal_id}/procurement-events")
def list_procurement_events(
    proposal_id: str,
    user: User = Depends(require_permission("procurement:view")),
    db: Session = Depends(get_db),
):
    events = db.scalars(
        select(ProcurementEvent)
        .where(ProcurementEvent.proposal_id == proposal_id)
        .options(selectinload(ProcurementEvent.bids))
        .order_by(ProcurementEvent.created_at.desc())
    ).all()
    return {"success": True, "events": [_event_dict(e) for e in events]}


@router.get("/procurement-events/{event_id}")
def get_procurement_event(
    event_id: str,
    user: User = Depends(require_permission("procurement:view")),
    db: Session = Depends(get_db),
):
    event = db.scalar(
        select(ProcurementEvent)
        .where(ProcurementEvent.id == event_id)
        .options(
            selectinload(ProcurementEvent.bids),
            selectinload(ProcurementEvent.technical_evaluations),
            selectinload(ProcurementEvent.financial_evaluations),
            selectinload(ProcurementEvent.purchase_orders),
        )
    )
    if not event:
        _fail(404, "Procurement event not found")
    return {"success": True, "event": _event_dict(event, full=True)}


VALID_EVENT_TRANSITIONS: dict[str, list[str]] = {
    "PREPARING":             ["PUBLISHED"],
    "PUBLISHED":             ["BID_ACTIVE", "CANCELLED"],
    "BID_ACTIVE":            ["BID_CLOSED", "CANCELLED"],
    "BID_CLOSED":            ["BID_OPENING"],
    "BID_OPENING":           ["TECHNICAL_EVALUATION"],
    "TECHNICAL_EVALUATION":  ["FINANCIAL_EVALUATION"],
    "FINANCIAL_EVALUATION":  ["AWARD_DECISION"],
    "AWARD_DECISION":        ["AWARDED", "CANCELLED"],
    "AWARDED":               [],
    "CANCELLED":             [],
}


class EventStatusBody(BaseModel):
    status: str
    note: Optional[str] = None
    gem_bid_number: Optional[str] = None
    gem_order_number: Optional[str] = None
    bid_open_date: Optional[str] = None
    total_bids_received: Optional[int] = None


@router.patch("/procurement-events/{event_id}/status")
def update_event_status(
    event_id: str,
    body: EventStatusBody,
    user: User = Depends(require_permission("procurement:create")),
    db: Session = Depends(get_db),
):
    event = db.get(ProcurementEvent, event_id)
    if not event:
        _fail(404, "Procurement event not found")
    allowed = VALID_EVENT_TRANSITIONS.get(event.status, [])
    if body.status not in allowed:
        _fail(400, f"Cannot transition from '{event.status}' to '{body.status}'. Allowed: {allowed}")
    prev = event.status
    event.status = body.status
    event.updated_at = _now()
    if body.gem_bid_number:
        event.gem_bid_number = body.gem_bid_number
    if body.gem_order_number:
        event.gem_order_number = body.gem_order_number
    if body.bid_open_date:
        event.bid_open_date = body.bid_open_date
    if body.total_bids_received is not None:
        event.total_bids_received = body.total_bids_received
    if body.note:
        event.notes = (event.notes or "") + f"\n[{_now().date()}] {body.note}"
    db.flush()
    audit(db, "PROCUREMENT_EVENT_STATUS_CHANGED", actor=user, object_type="PROCUREMENT_EVENT", object_id=event_id,
          old_value={"status": prev}, new_value={"status": body.status})
    return {"success": True, "event_id": event_id, "status": event.status}


def _event_dict(e: ProcurementEvent, full: bool = False) -> dict[str, Any]:
    d: dict[str, Any] = {
        "id": e.id, "requirement_id": e.requirement_id, "proposal_id": e.proposal_id,
        "event_number": e.event_number, "procurement_mode": e.procurement_mode,
        "gem_bid_number": e.gem_bid_number, "gem_order_number": e.gem_order_number,
        "status": e.status,
        "bid_start_date": e.bid_start_date, "bid_close_date": e.bid_close_date,
        "bid_open_date": e.bid_open_date, "bid_duration_days": e.bid_duration_days,
        "total_bids_received": e.total_bids_received,
        "notes": e.notes, "synthetic": e.synthetic,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
    if full:
        d["bids"] = [_bid_dict(b) for b in (e.bids or [])]
        d["technical_evaluations"] = [{"id": t.id, "status": t.status, "evaluation_date": t.evaluation_date} for t in (e.technical_evaluations or [])]
        d["financial_evaluations"] = [{"id": f.id, "status": f.status, "l1_amount_inr": f.l1_amount_inr} for f in (e.financial_evaluations or [])]
        d["purchase_orders"] = [_po_dict(po) for po in (e.purchase_orders or [])]
    return d


# ============================================================
# BIDS
# ============================================================

class BidBody(BaseModel):
    company_name: str
    company_reference: Optional[str] = None
    bid_reference: Optional[str] = None
    bid_amount_inr: Optional[float] = None
    quantity_offered: Optional[str] = None
    delivery_period: Optional[str] = None
    warranty_offered: Optional[str] = None
    offered_specification: Optional[str] = None
    country_of_origin: Optional[str] = None
    notes: Optional[str] = None


@router.post("/procurement-events/{event_id}/bids")
def add_bid(
    event_id: str,
    body: BidBody,
    user: User = Depends(require_permission("bid:create")),
    db: Session = Depends(get_db),
):
    event = db.get(ProcurementEvent, event_id)
    if not event:
        _fail(404, "Procurement event not found")
    if event.status not in ("BID_OPENING", "TECHNICAL_EVALUATION", "BID_CLOSED"):
        _fail(400, f"Bids can only be recorded after bid opening. Current status: {event.status}")

    bid = Bid(
        id=str(uuid.uuid4()),
        event_id=event_id,
        bid_reference=body.bid_reference,
        company_name=body.company_name,
        company_reference=body.company_reference,
        bid_amount_inr=body.bid_amount_inr,
        quantity_offered=body.quantity_offered,
        delivery_period=body.delivery_period,
        warranty_offered=body.warranty_offered,
        offered_specification=body.offered_specification,
        country_of_origin=body.country_of_origin,
        notes=body.notes,
        technical_qualification_status="PENDING",
    )
    db.add(bid)
    db.flush()
    audit(db, "BID_RECORDED", actor=user, object_type="BID", object_id=bid.id,
          detail=f"Company: {body.company_name} | Event: {event_id}")
    return {"success": True, "bid_id": bid.id, "bid": _bid_dict(bid)}


@router.get("/procurement-events/{event_id}/bids")
def list_bids(
    event_id: str,
    user: User = Depends(require_permission("bid:view")),
    db: Session = Depends(get_db),
):
    bids = db.scalars(select(Bid).where(Bid.event_id == event_id)).all()
    return {
        "success": True,
        "bids": [_bid_dict(b) for b in bids],
        "vendor_selection": "NOT_PERFORMED",
        "notice": VENDOR_NOTICE,
    }


def _bid_dict(b: Bid) -> dict[str, Any]:
    return {
        "id": b.id, "event_id": b.event_id,
        "bid_reference": b.bid_reference,
        "company_name": b.company_name,
        "company_reference": b.company_reference,
        "bid_amount_inr": b.bid_amount_inr,
        "quantity_offered": b.quantity_offered,
        "delivery_period": b.delivery_period,
        "warranty_offered": b.warranty_offered,
        "offered_specification": b.offered_specification,
        "country_of_origin": b.country_of_origin,
        "technical_qualification_status": b.technical_qualification_status,
        "is_l1": b.is_l1, "is_awarded": b.is_awarded,
        "notes": b.notes, "synthetic": b.synthetic,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


# ============================================================
# TECHNICAL EVALUATION
# ============================================================

class TechEvalBody(BaseModel):
    evaluation_date: Optional[str] = None
    demo_date: Optional[str] = None
    venue: Optional[str] = None
    overall_observations: Optional[str] = None


@router.post("/procurement-events/{event_id}/technical-evaluation")
def create_tech_eval(
    event_id: str,
    body: TechEvalBody,
    user: User = Depends(require_permission("techeval:create")),
    db: Session = Depends(get_db),
):
    event = db.get(ProcurementEvent, event_id)
    if not event:
        _fail(404, "Procurement event not found")
    if event.status != "TECHNICAL_EVALUATION":
        _fail(400, f"Event must be in TECHNICAL_EVALUATION status. Current: {event.status}")

    te = TechnicalEvaluation(
        id=str(uuid.uuid4()),
        event_id=event_id,
        evaluation_date=body.evaluation_date,
        demo_date=body.demo_date,
        venue=body.venue,
        overall_observations=body.overall_observations,
        created_by=user.id,
        status="IN_PROGRESS",
    )
    db.add(te)
    db.flush()
    audit(db, "TECHNICAL_EVALUATION_CREATED", actor=user, object_type="TECH_EVAL", object_id=te.id)
    return {"success": True, "evaluation_id": te.id}


@router.get("/procurement-events/{event_id}/technical-evaluation")
def get_tech_eval(
    event_id: str,
    user: User = Depends(require_permission("techeval:view")),
    db: Session = Depends(get_db),
):
    te = db.scalar(
        select(TechnicalEvaluation)
        .where(TechnicalEvaluation.event_id == event_id)
        .options(
            selectinload(TechnicalEvaluation.committee),
            selectinload(TechnicalEvaluation.bidder_lines),
        )
        .order_by(TechnicalEvaluation.created_at.desc())
        .limit(1)
    )
    if not te:
        _fail(404, "No technical evaluation found for this event")
    return {
        "success": True,
        "evaluation": _te_dict(te, full=True),
        "vendor_selection": "NOT_PERFORMED",
    }


class CommitteeMemberBody(BaseModel):
    member_name: str
    designation: Optional[str] = None
    role: str = "MEMBER"
    department: Optional[str] = None


@router.post("/technical-evaluations/{eval_id}/committee")
def add_committee_member(
    eval_id: str,
    body: CommitteeMemberBody,
    user: User = Depends(require_permission("techeval:update")),
    db: Session = Depends(get_db),
):
    te = db.get(TechnicalEvaluation, eval_id)
    if not te:
        _fail(404, "Technical evaluation not found")
    member = EvaluationCommittee(
        id=str(uuid.uuid4()),
        evaluation_id=eval_id,
        member_name=body.member_name,
        designation=body.designation,
        role=body.role,
        department=body.department,
    )
    db.add(member)
    db.flush()
    return {"success": True, "member_id": member.id}


class BidderEvalBody(BaseModel):
    bid_id: str
    spec_field: str
    required_value: Optional[str] = None
    offered_value: Optional[str] = None
    compliance_status: str = "NOT_VERIFIED"
    evaluator_notes: Optional[str] = None


@router.post("/technical-evaluations/{eval_id}/bidder-evaluation")
def add_bidder_evaluation(
    eval_id: str,
    body: BidderEvalBody,
    user: User = Depends(require_permission("techeval:update")),
    db: Session = Depends(get_db),
):
    te = db.get(TechnicalEvaluation, eval_id)
    if not te:
        _fail(404, "Technical evaluation not found")
    bid = db.get(Bid, body.bid_id)
    if not bid:
        _fail(404, "Bid not found")

    line = BidderEvaluation(
        id=str(uuid.uuid4()),
        evaluation_id=eval_id,
        bid_id=body.bid_id,
        spec_field=body.spec_field,
        required_value=body.required_value,
        offered_value=body.offered_value,
        compliance_status=body.compliance_status,
        evaluator_notes=body.evaluator_notes,
        evaluated_by=user.display_name,
    )
    db.add(line)
    db.flush()
    return {"success": True, "line_id": line.id}


class TechQualifyBody(BaseModel):
    qualification_status: str  # QUALIFIED | NOT_QUALIFIED


@router.patch("/technical-evaluations/{eval_id}/bids/{bid_id}/qualify")
def qualify_bid(
    eval_id: str,
    bid_id: str,
    body: TechQualifyBody,
    user: User = Depends(require_permission("techeval:update")),
    db: Session = Depends(get_db),
):
    """Set technical qualification status for a bid.
    Only QUALIFIED bids proceed to financial evaluation.
    This is recorded by the officer — PRISM-PY does NOT auto-qualify.
    """
    if body.qualification_status not in ("QUALIFIED", "NOT_QUALIFIED", "UNDER_EVALUATION"):
        _fail(400, "qualification_status must be QUALIFIED, NOT_QUALIFIED, or UNDER_EVALUATION")
    bid = db.get(Bid, bid_id)
    if not bid:
        _fail(404, "Bid not found")
    bid.technical_qualification_status = body.qualification_status
    db.flush()
    audit(db, "BID_TECHNICALLY_QUALIFIED", actor=user, object_type="BID", object_id=bid_id,
          detail=f"Status: {body.qualification_status} | Eval: {eval_id}")
    return {"success": True, "bid_id": bid_id, "qualification_status": body.qualification_status}


class CompleteTechEvalBody(BaseModel):
    overall_observations: Optional[str] = None


@router.patch("/technical-evaluations/{eval_id}/complete")
def complete_tech_eval(
    eval_id: str,
    body: CompleteTechEvalBody,
    user: User = Depends(require_permission("techeval:update")),
    db: Session = Depends(get_db),
):
    te = db.get(TechnicalEvaluation, eval_id)
    if not te:
        _fail(404, "Technical evaluation not found")
    te.status = "COMPLETED"
    if body.overall_observations:
        te.overall_observations = body.overall_observations
    te.updated_at = _now()
    db.flush()
    audit(db, "TECHNICAL_EVALUATION_COMPLETED", actor=user, object_type="TECH_EVAL", object_id=eval_id)
    return {"success": True, "status": "COMPLETED"}


def _te_dict(te: TechnicalEvaluation, full: bool = False) -> dict[str, Any]:
    d: dict[str, Any] = {
        "id": te.id, "event_id": te.event_id,
        "evaluation_date": te.evaluation_date, "demo_date": te.demo_date,
        "venue": te.venue, "status": te.status,
        "overall_observations": te.overall_observations,
        "synthetic": te.synthetic,
        "created_at": te.created_at.isoformat() if te.created_at else None,
    }
    if full:
        d["committee"] = [
            {"id": m.id, "name": m.member_name, "designation": m.designation,
             "role": m.role, "department": m.department}
            for m in (te.committee or [])
        ]
        d["bidder_lines"] = [
            {"id": l.id, "bid_id": l.bid_id, "spec_field": l.spec_field,
             "required_value": l.required_value, "offered_value": l.offered_value,
             "compliance_status": l.compliance_status, "notes": l.evaluator_notes,
             "evaluated_by": l.evaluated_by}
            for l in (te.bidder_lines or [])
        ]
    return d


# ============================================================
# FINANCIAL EVALUATION + L1
# ============================================================

class FinancialEvalBody(BaseModel):
    evaluation_date: Optional[str] = None
    notes: Optional[str] = None


@router.post("/procurement-events/{event_id}/financial-evaluation")
def create_financial_eval(
    event_id: str,
    body: FinancialEvalBody,
    user: User = Depends(require_permission("fineval:create")),
    db: Session = Depends(get_db),
):
    event = db.get(ProcurementEvent, event_id)
    if not event:
        _fail(404, "Procurement event not found")
    if event.status != "FINANCIAL_EVALUATION":
        _fail(400, f"Event must be in FINANCIAL_EVALUATION status. Current: {event.status}")

    # Count technically qualified bids
    qualified_bids = db.scalars(
        select(Bid).where(Bid.event_id == event_id, Bid.technical_qualification_status == "QUALIFIED")
    ).all()

    fe = FinancialEvaluation(
        id=str(uuid.uuid4()),
        event_id=event_id,
        evaluation_date=body.evaluation_date,
        technically_qualified_count=len(qualified_bids),
        status="IN_PROGRESS",
        notes=body.notes,
    )
    db.add(fe)
    db.flush()

    # Auto-create financial lines for all bids
    for bid in db.scalars(select(Bid).where(Bid.event_id == event_id)).all():
        qualified = bid.technical_qualification_status == "QUALIFIED"
        db.add(FinancialBidLine(
            id=str(uuid.uuid4()),
            evaluation_id=fe.id,
            bid_id=bid.id,
            company_name=bid.company_name,
            bid_amount_inr=bid.bid_amount_inr,
            is_technically_qualified=qualified,
        ))

    db.flush()
    audit(db, "FINANCIAL_EVALUATION_CREATED", actor=user, object_type="FIN_EVAL", object_id=fe.id,
          detail=f"Qualified bids: {len(qualified_bids)}")
    return {"success": True, "evaluation_id": fe.id, "technically_qualified_count": len(qualified_bids)}


@router.get("/procurement-events/{event_id}/financial-evaluation")
def get_financial_eval(
    event_id: str,
    user: User = Depends(require_permission("fineval:view")),
    db: Session = Depends(get_db),
):
    fe = db.scalar(
        select(FinancialEvaluation)
        .where(FinancialEvaluation.event_id == event_id)
        .options(selectinload(FinancialEvaluation.lines))
        .order_by(FinancialEvaluation.created_at.desc())
        .limit(1)
    )
    if not fe:
        _fail(404, "No financial evaluation found")

    # Compute comparative statement
    qualified_lines = sorted(
        [l for l in (fe.lines or []) if l.is_technically_qualified and l.bid_amount_inr is not None],
        key=lambda l: l.bid_amount_inr,
    )
    for rank, line in enumerate(qualified_lines, 1):
        line.rank = rank
        line.is_l1 = (rank == 1)

    db.flush()
    return {
        "success": True,
        "evaluation": _fe_dict(fe),
        "notice": VENDOR_NOTICE,
        "l1_notice": (
            "L1 is computed as the lowest financial bid among technically qualified bidders only. "
            "Final award decision remains with the authorised officer/committee."
        ),
        "data_classification": SYNTHETIC_NOTICE,
    }


class RecordL1Body(BaseModel):
    l1_bid_id: str
    notes: Optional[str] = None


@router.post("/financial-evaluations/{eval_id}/record-l1")
def record_l1(
    eval_id: str,
    body: RecordL1Body,
    user: User = Depends(require_permission("fineval:record_l1")),
    db: Session = Depends(get_db),
):
    """Officer confirms and records the L1 determination.
    PRISM-PY computes the comparative statement; officer makes the final call.
    """
    fe = db.get(FinancialEvaluation, eval_id)
    if not fe:
        _fail(404, "Financial evaluation not found")
    bid = db.get(Bid, body.l1_bid_id)
    if not bid:
        _fail(404, "L1 bid not found")
    if bid.technical_qualification_status != "QUALIFIED":
        _fail(400, "L1 bid must be technically qualified")

    fe.l1_bid_id = body.l1_bid_id
    fe.l1_amount_inr = bid.bid_amount_inr
    fe.l1_identified_by = user.display_name
    fe.finalized_by = user.id
    fe.finalized_at = _now()
    fe.status = "FINALIZED"
    if body.notes:
        fe.notes = (fe.notes or "") + f"\nL1 note: {body.notes}"

    bid.is_l1 = True
    db.flush()
    audit(db, "FINANCIAL_EVALUATION_L1_RECORDED", actor=user, object_type="FIN_EVAL", object_id=eval_id,
          detail=f"L1: {bid.company_name} @ INR {bid.bid_amount_inr}")
    return {
        "success": True,
        "l1_company": bid.company_name,
        "l1_amount_inr": bid.bid_amount_inr,
        "recorded_by": user.display_name,
        "notice": VENDOR_NOTICE,
    }


def _fe_dict(fe: FinancialEvaluation) -> dict[str, Any]:
    qualified_lines = sorted(
        [l for l in (fe.lines or []) if l.is_technically_qualified],
        key=lambda l: (l.rank or 999),
    )
    all_lines = fe.lines or []
    return {
        "id": fe.id, "event_id": fe.event_id,
        "evaluation_date": fe.evaluation_date,
        "technically_qualified_count": fe.technically_qualified_count,
        "l1_bid_id": fe.l1_bid_id, "l1_amount_inr": fe.l1_amount_inr,
        "l1_identified_by": fe.l1_identified_by,
        "status": fe.status, "notes": fe.notes,
        "finalized_by": fe.finalized_by,
        "finalized_at": fe.finalized_at.isoformat() if fe.finalized_at else None,
        "comparative_statement": {
            "qualified_bids": [
                {"rank": l.rank, "company": l.company_name, "amount_inr": l.bid_amount_inr, "is_l1": l.is_l1}
                for l in qualified_lines
            ],
            "disqualified_bids": [
                {"company": l.company_name, "reason": "Technical qualification not met"}
                for l in all_lines if not l.is_technically_qualified
            ],
        },
        "synthetic": fe.synthetic,
    }


# ============================================================
# PURCHASE ORDERS
# ============================================================

class PurchaseOrderBody(BaseModel):
    po_number: Optional[str] = None
    gem_order_number: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_reference: Optional[str] = None
    quantity: Optional[str] = None
    unit_price_inr: Optional[float] = None
    total_amount_inr: Optional[float] = None
    po_date: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    delivery_location: Optional[str] = None
    inspection_note: Optional[str] = None
    implementation_record_id: Optional[str] = None


@router.post("/procurement-events/{event_id}/purchase-order")
def create_purchase_order(
    event_id: str,
    body: PurchaseOrderBody,
    user: User = Depends(require_permission("purchaseorder:create")),
    db: Session = Depends(get_db),
):
    """Record a Purchase Order after award decision.
    PRISM-PY does NOT generate or place the order — it records details
    entered by the authorised officer.
    """
    event = db.get(ProcurementEvent, event_id)
    if not event:
        _fail(404, "Procurement event not found")

    po = PurchaseOrder(
        id=str(uuid.uuid4()),
        event_id=event_id,
        proposal_id=event.proposal_id,
        po_number=body.po_number,
        gem_order_number=body.gem_order_number,
        vendor_name=body.vendor_name,
        vendor_reference=body.vendor_reference,
        quantity=body.quantity,
        unit_price_inr=body.unit_price_inr,
        total_amount_inr=body.total_amount_inr,
        po_date=body.po_date,
        expected_delivery_date=body.expected_delivery_date,
        delivery_location=body.delivery_location,
        inspection_note=body.inspection_note,
        implementation_record_id=body.implementation_record_id,
        created_by=user.id,
        status="ISSUED",
    )
    db.add(po)

    # Link to event
    if body.gem_order_number:
        event.gem_order_number = body.gem_order_number
    event.status = "AWARDED"
    db.flush()
    audit(db, "PURCHASE_ORDER_CREATED", actor=user, object_type="PURCHASE_ORDER", object_id=po.id,
          detail=f"PO: {body.po_number} | Vendor: {body.vendor_name}")
    return {"success": True, "po_id": po.id, "purchase_order": _po_dict(po)}


@router.get("/proposals/{proposal_id}/purchase-orders")
def list_purchase_orders(
    proposal_id: str,
    user: User = Depends(require_permission("purchaseorder:view")),
    db: Session = Depends(get_db),
):
    pos = db.scalars(
        select(PurchaseOrder).where(PurchaseOrder.proposal_id == proposal_id)
        .order_by(PurchaseOrder.created_at.desc())
    ).all()
    return {"success": True, "purchase_orders": [_po_dict(po) for po in pos]}


@router.get("/purchase-orders/{po_id}")
def get_purchase_order(
    po_id: str,
    user: User = Depends(require_permission("purchaseorder:view")),
    db: Session = Depends(get_db),
):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        _fail(404, "Purchase order not found")
    return {"success": True, "purchase_order": _po_dict(po)}


class UpdatePOBody(BaseModel):
    status: Optional[str] = None
    actual_delivery_date: Optional[str] = None
    inspection_note: Optional[str] = None
    gem_order_number: Optional[str] = None


@router.patch("/purchase-orders/{po_id}")
def update_purchase_order(
    po_id: str,
    body: UpdatePOBody,
    user: User = Depends(require_permission("purchaseorder:create")),
    db: Session = Depends(get_db),
):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        _fail(404, "Purchase order not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(po, field, val)
    po.updated_at = _now()
    db.flush()
    audit(db, "PURCHASE_ORDER_UPDATED", actor=user, object_type="PURCHASE_ORDER", object_id=po_id)
    return {"success": True, "purchase_order": _po_dict(po)}


def _po_dict(po: PurchaseOrder) -> dict[str, Any]:
    return {
        "id": po.id, "event_id": po.event_id, "proposal_id": po.proposal_id,
        "po_number": po.po_number, "gem_order_number": po.gem_order_number,
        "vendor_name": po.vendor_name, "vendor_reference": po.vendor_reference,
        "quantity": po.quantity, "unit_price_inr": po.unit_price_inr,
        "total_amount_inr": po.total_amount_inr,
        "po_date": po.po_date,
        "expected_delivery_date": po.expected_delivery_date,
        "actual_delivery_date": po.actual_delivery_date,
        "delivery_location": po.delivery_location,
        "status": po.status, "inspection_note": po.inspection_note,
        "implementation_record_id": po.implementation_record_id,
        "synthetic": po.synthetic,
        "created_at": po.created_at.isoformat() if po.created_at else None,
    }


# ============================================================
# HISTORICAL INTELLIGENCE with PROVENANCE
# ============================================================

@router.get("/proposals/{proposal_id}/procurement-intelligence")
def procurement_intelligence_with_provenance(
    proposal_id: str,
    user: User = Depends(require_permission("procurement:view")),
    db: Session = Depends(get_db),
):
    """Returns historical procurement intelligence with explicit provenance and staleness warnings."""
    from .models import HistoricalTender
    from sqlalchemy import text as sqlt

    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    tenders = db.scalars(select(HistoricalTender)).all()

    records = []
    for t in tenders:
        # Check provenance columns (added by migrations)
        last_verified = None
        is_current = False
        source_url = None
        try:
            row = db.execute(sqlt(
                "SELECT last_verified_date, is_current, source_url FROM historical_tenders WHERE id = :id"
            ), {"id": t.id}).fetchone()
            if row:
                last_verified = row[0]
                is_current = bool(row[1])
                source_url = row[2]
        except Exception:
            pass

        staleness_warning = None
        if not is_current:
            staleness_warning = (
                f"Historical record from {t.year or 'unknown year'}. "
                "This is NOT a current market price. Verify current pricing before using for procurement."
            )

        records.append({
            "tender_id": t.id,
            "title": t.title,
            "equipment_class": t.equipment_class,
            "procurement_type": t.procurement_type,
            "quantity": t.quantity,
            "indicative_amount_inr": t.indicative_amount_inr,
            "decision_status": t.decision_status,
            "year": t.year,
            "location": t.location,
            "specification_summary": t.specification_summary,
            "source_url": source_url,
            "last_verified_date": last_verified,
            "is_current": is_current,
            "staleness_warning": staleness_warning,
            "synthetic": t.synthetic,
            "data_classification": SYNTHETIC_NOTICE,
        })

    return {
        "success": True,
        "proposal_id": proposal_id,
        "historical_tenders": records,
        "provenance_notice": (
            "All records are synthetic demo data from a fixed historical corpus. "
            "is_current=False means this is a historical reference only — not a live price. "
            "Obtain current pricing from official sources before procurement."
        ),
        "vendor_selection": "NOT_PERFORMED",
        "notice": VENDOR_NOTICE,
        "data_classification": SYNTHETIC_NOTICE,
    }
