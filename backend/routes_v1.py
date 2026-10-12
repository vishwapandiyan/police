"""PRISM-PY v1 API routes — full lifecycle.

Mounts at /api/v1 and implements:
- Auth (login/logout/me)
- Proposals (CRUD + lifecycle)
- Documents (per-proposal)
- DNA (extract/confirm)
- Completeness
- Precedents with why-match
- Policies
- GeM Intelligence
- Cost Analysis
- Overlap Detection
- Decision Brief
- Officer Decision
- Implementation
- Outcomes & Lessons
- Audit Trail
- Dashboard Stats
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .auth_v1 import (
    DEMO_USERS,
    audit,
    create_session,
    get_current_user,
    get_current_user_optional,
    has_permission,
    invalidate_session,
    require_permission,
    verify_password,
)
from .database import get_db
from .dna import extract_structured_dna, serialize_dna
from .extract import extract_text
from .intelligence import (
    classify_requirement,
    equipment_intelligence,
    outcome_risk_intelligence,
    policy_search,
    procurement_intelligence,
    specification_intelligence,
)
from .models import (
    DecisionBriefRecord,
    Document,
    HistoricalTender,
    PolicyRecord,
    ProposalAnalysis,
)
from .models_v1 import (
    AuditEvent,
    DecisionAction,
    GeMReference,
    GeMSearch,
    ImplementationRecord,
    ImplementationUpdate,
    LessonRecord,
    OutcomeRecord,
    PoliceStation,
    Proposal,
    ProposalDNARecord,
    ProposalDocument,
    User,
)
from .retrieval import search_demo_index
from .settings import SYNTHETIC_LABEL, UPLOAD_DIR, VENDOR_NOTICE

router = APIRouter(prefix="/api/v1", tags=["v1"])

SYNTHETIC_NOTICE = "SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _proposal_number() -> str:
    ts = datetime.now().strftime("%Y%m%d")
    uid = str(uuid.uuid4())[:6].upper()
    return f"PRISM-{ts}-{uid}"


def _proposal_dict(p: Proposal) -> dict[str, Any]:
    return {
        "id": p.id,
        "proposal_number": p.proposal_number,
        "title": p.title,
        "description": p.description,
        "department": p.department,
        "unit": p.unit,
        "region": p.region,
        "station": p.station,
        "category": p.category,
        "priority": p.priority,
        "status": p.status,
        "estimated_cost": p.estimated_cost,
        "currency": p.currency,
        "quantity": p.quantity,
        "purpose": p.purpose,
        "problem_statement": p.problem_statement,
        "expected_outcome": p.expected_outcome,
        "technology": p.technology,
        "specification": p.specification,
        "expected_completion_date": p.expected_completion_date,
        "created_by": p.created_by,
        "current_owner": p.current_owner,
        "classification": p.classification,
        "analysis_status": p.analysis_status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        "submitted_at": p.submitted_at.isoformat() if p.submitted_at else None,
        "synthetic": p.synthetic,
        "document_count": len(p.documents) if p.documents else 0,
    }


def _fail(status_code: int, msg: str):
    raise HTTPException(status_code=status_code, detail=msg)


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username, User.is_active == True))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_session(db, user)
    audit(db, "LOGIN", actor=user, object_type="USER", object_id=user.id)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "role": user.role,
            "department": user.department,
        },
    }


@router.post("/auth/logout")
def logout(
    authorization: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import Request
    if authorization:
        token = authorization[7:].strip()
        invalidate_session(db, token)
    audit(db, "LOGOUT", actor=user)
    return {"message": "Logged out"}


@router.get("/auth/me")
def me(user: User = Depends(get_current_user)):
    from .auth_v1 import ROLES
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "unit": user.unit,
        "permissions": ROLES.get(user.role, []),
    }


@router.get("/auth/users")
def list_users(user: User = Depends(require_permission("admin:manage_users")), db: Session = Depends(get_db)):
    users = db.scalars(select(User)).all()
    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "display_name": u.display_name,
                "role": u.role,
                "department": u.department,
                "is_active": u.is_active,
            }
            for u in users
        ]
    }


# ---------------------------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------------------------

@router.get("/dashboard/stats")
def dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.scalar(select(func.count(Proposal.id))) or 0
    by_status = {}
    for row in db.execute(select(Proposal.status, func.count(Proposal.id)).group_by(Proposal.status)).all():
        by_status[row[0]] = row[1]

    recent = db.scalars(
        select(Proposal).order_by(Proposal.created_at.desc()).limit(5)
    ).all()
    recent_activity = db.scalars(
        select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(10)
    ).all()

    impl_count = db.scalar(select(func.count(ImplementationRecord.id))) or 0
    outcome_count = db.scalar(select(func.count(OutcomeRecord.id))) or 0

    return {
        "success": True,
        "kpis": {
            "total_proposals": total,
            "draft": by_status.get("DRAFT", 0),
            "submitted": by_status.get("SUBMITTED_FOR_REVIEW", 0) + by_status.get("RESUBMITTED", 0),
            "under_review": by_status.get("UNDER_REVIEW", 0),
            "approved": by_status.get("APPROVED", 0),
            "rejected": by_status.get("REJECTED", 0),
            "returned": by_status.get("RETURNED_FOR_MODIFICATION", 0),
            "in_procurement": by_status.get("PROCUREMENT", 0),
            "in_implementation": by_status.get("IMPLEMENTATION", 0) + impl_count,
            "completed": by_status.get("COMPLETED", 0),
            "total_outcomes": outcome_count,
        },
        "recent_proposals": [_proposal_dict(p) for p in recent],
        "recent_activity": [
            {
                "id": e.id,
                "action": e.action,
                "actor": e.actor_name,
                "object_type": e.object_type,
                "object_id": e.object_id,
                "detail": e.detail,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in recent_activity
        ],
        "by_status": by_status,
        "data_note": SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# PROPOSALS
# ---------------------------------------------------------------------------

class ProposalCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    department: Optional[str] = None
    unit: Optional[str] = None
    region: Optional[str] = None
    station: Optional[str] = None
    category: Optional[str] = None
    priority: str = "NORMAL"
    estimated_cost: Optional[float] = None
    currency: str = "INR"
    cost_basis: Optional[str] = None
    funding_source: Optional[str] = None
    quantity: Optional[str] = None
    unit_of_measure: Optional[str] = None
    purpose: Optional[str] = None
    problem_statement: Optional[str] = None
    expected_outcome: Optional[str] = None
    technology: Optional[str] = None
    specification: Optional[str] = None
    expected_completion_date: Optional[str] = None


@router.post("/proposals")
def create_proposal(
    body: ProposalCreateRequest,
    user: User = Depends(require_permission("proposal:create")),
    db: Session = Depends(get_db),
):
    p = Proposal(
        id=str(uuid.uuid4()),
        proposal_number=_proposal_number(),
        title=body.title,
        description=body.description,
        department=body.department or user.department,
        unit=body.unit or user.unit,
        region=body.region,
        station=body.station,
        category=body.category,
        priority=body.priority,
        estimated_cost=body.estimated_cost,
        currency=body.currency,
        cost_basis=body.cost_basis,
        funding_source=body.funding_source,
        quantity=body.quantity,
        unit_of_measure=body.unit_of_measure,
        purpose=body.purpose,
        problem_statement=body.problem_statement,
        expected_outcome=body.expected_outcome,
        technology=body.technology,
        specification=body.specification,
        expected_completion_date=body.expected_completion_date,
        created_by=user.id,
        current_owner=user.id,
        status="DRAFT",
        classification="SYNTHETIC_DEMO",
    )
    db.add(p)
    db.flush()
    audit(db, "PROPOSAL_CREATED", actor=user, object_type="PROPOSAL", object_id=p.id, detail=p.title)
    return {"success": True, "proposal": _proposal_dict(p)}


@router.get("/proposals")
def list_proposals(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = select(Proposal).options(selectinload(Proposal.documents))
    if status:
        q = q.where(Proposal.status == status.upper())
    if category:
        q = q.where(Proposal.category == category)
    if region:
        q = q.where(Proposal.region == region)
    q = q.order_by(Proposal.created_at.desc()).offset(offset).limit(limit)
    proposals = db.scalars(q).all()
    total = db.scalar(select(func.count(Proposal.id)))
    return {
        "success": True,
        "proposals": [_proposal_dict(p) for p in proposals],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/proposals/{proposal_id}")
def get_proposal(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    return {"success": True, "proposal": _proposal_dict(p)}


@router.patch("/proposals/{proposal_id}")
def update_proposal(
    proposal_id: str,
    body: ProposalCreateRequest,
    user: User = Depends(require_permission("proposal:edit")),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    if p.status not in ("DRAFT", "RETURNED_FOR_MODIFICATION"):
        _fail(400, f"Cannot edit proposal in status: {p.status}")
    old = {"title": p.title, "status": p.status}
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(p, field, val)
    p.updated_at = _now()
    audit(db, "PROPOSAL_UPDATED", actor=user, object_type="PROPOSAL", object_id=p.id, old_value=old)
    return {"success": True, "proposal": _proposal_dict(p)}


def _transition(db: Session, proposal_id: str, user: User, action: str,
                from_statuses: list[str], to_status: str,
                comment: Optional[str] = None, reason: Optional[str] = None) -> Proposal:
    p = db.get(Proposal, proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if p.status not in from_statuses:
        raise HTTPException(status_code=400, detail=f"Action '{action}' not valid in status '{p.status}'")
    prev = p.status
    p.status = to_status
    p.updated_at = _now()
    if to_status in ("SUBMITTED_FOR_REVIEW", "RESUBMITTED"):
        p.submitted_at = _now()
    da = DecisionAction(
        id=str(uuid.uuid4()),
        proposal_id=p.id,
        action=action,
        previous_status=prev,
        new_status=to_status,
        officer_id=user.id,
        officer_name=user.display_name,
        comment=comment,
        reason=reason,
    )
    db.add(da)
    audit(db, f"PROPOSAL_{action}", actor=user, object_type="PROPOSAL", object_id=p.id,
          old_value={"status": prev}, new_value={"status": to_status}, detail=comment or reason)
    return p


class DecisionBody(BaseModel):
    comment: Optional[str] = None
    reason: Optional[str] = None


@router.post("/proposals/{proposal_id}/submit")
def submit_proposal(
    proposal_id: str,
    body: DecisionBody = Body(default=DecisionBody()),
    user: User = Depends(require_permission("proposal:submit")),
    db: Session = Depends(get_db),
):
    p = _transition(db, proposal_id, user, "SUBMITTED",
                    ["DRAFT", "RETURNED_FOR_MODIFICATION"], "SUBMITTED_FOR_REVIEW",
                    comment=body.comment)
    return {"success": True, "proposal": _proposal_dict(p)}


@router.post("/proposals/{proposal_id}/return")
def return_proposal(
    proposal_id: str,
    body: DecisionBody,
    user: User = Depends(require_permission("proposal:return")),
    db: Session = Depends(get_db),
):
    if not body.reason:
        _fail(400, "Reason required when returning a proposal")
    p = _transition(db, proposal_id, user, "RETURNED",
                    ["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "RESUBMITTED"], "RETURNED_FOR_MODIFICATION",
                    reason=body.reason)
    return {"success": True, "proposal": _proposal_dict(p)}


@router.post("/proposals/{proposal_id}/approve")
def approve_proposal(
    proposal_id: str,
    body: DecisionBody = Body(default=DecisionBody()),
    user: User = Depends(require_permission("proposal:approve")),
    db: Session = Depends(get_db),
):
    p = _transition(db, proposal_id, user, "APPROVED",
                    ["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "RESUBMITTED"], "APPROVED",
                    comment=body.comment)
    return {"success": True, "proposal": _proposal_dict(p)}


@router.post("/proposals/{proposal_id}/reject")
def reject_proposal(
    proposal_id: str,
    body: DecisionBody,
    user: User = Depends(require_permission("proposal:reject")),
    db: Session = Depends(get_db),
):
    if not body.reason:
        _fail(400, "Reason required when rejecting a proposal")
    p = _transition(db, proposal_id, user, "REJECTED",
                    ["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "RESUBMITTED", "RETURNED_FOR_MODIFICATION"],
                    "REJECTED", reason=body.reason)
    return {"success": True, "proposal": _proposal_dict(p)}


@router.get("/proposals/{proposal_id}/history")
def proposal_history(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    actions = db.scalars(
        select(DecisionAction).where(DecisionAction.proposal_id == proposal_id)
        .order_by(DecisionAction.created_at.asc())
    ).all()
    return {
        "success": True,
        "history": [
            {
                "id": a.id,
                "action": a.action,
                "previous_status": a.previous_status,
                "new_status": a.new_status,
                "officer_name": a.officer_name,
                "comment": a.comment,
                "reason": a.reason,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in actions
        ],
    }


# ---------------------------------------------------------------------------
# DOCUMENTS (per-proposal)
# ---------------------------------------------------------------------------

@router.post("/proposals/{proposal_id}/documents")
async def upload_proposal_document(
    proposal_id: str,
    file: UploadFile = File(...),
    user: User = Depends(require_permission("document:upload")),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    from pathlib import Path
    raw = await file.read()
    settings_mod = __import__("backend.settings", fromlist=["get_settings"])
    settings = settings_mod.get_settings()
    limit = settings.max_upload_mb * 1024 * 1024
    if len(raw) > limit:
        _fail(413, f"File exceeds {settings.max_upload_mb} MB")

    safe_name = Path(file.filename or "upload").name
    tmp = UPLOAD_DIR / f"tmp_{uuid.uuid4()}_{safe_name}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    tmp.write_bytes(raw)
    try:
        text, detected = extract_text(tmp, raw)
    finally:
        tmp.unlink(missing_ok=True)

    # Save to Document table (existing)
    doc_id = str(uuid.uuid4())
    dest = UPLOAD_DIR / f"{doc_id}_{safe_name}"
    dest.write_bytes(raw)
    doc = Document(
        id=doc_id,
        filename=safe_name,
        filepath=str(dest),
        content=text or "",
        size=len(raw),
        mime_detected=detected,
    )
    db.add(doc)

    # Also save to ProposalDocument (new)
    pdoc = ProposalDocument(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        document_id=doc_id,
        filename=safe_name,
        document_type="SUPPORTING",
        uploaded_by=user.id,
        processing_status="EXTRACTED" if text else "EXTRACTION_FAILED",
    )
    db.add(pdoc)
    db.flush()
    audit(db, "DOCUMENT_UPLOADED", actor=user, object_type="DOCUMENT", object_id=doc_id,
          detail=f"Uploaded to proposal {proposal_id}")

    return {
        "success": True,
        "document_id": doc_id,
        "proposal_document_id": pdoc.id,
        "filename": safe_name,
        "size": len(raw),
        "mime": detected,
        "characters_extracted": len(text or ""),
        "processing_status": pdoc.processing_status,
    }


@router.get("/proposals/{proposal_id}/documents")
def list_proposal_documents(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = db.scalars(
        select(ProposalDocument).where(ProposalDocument.proposal_id == proposal_id)
        .order_by(ProposalDocument.uploaded_at.asc())
    ).all()
    return {
        "success": True,
        "documents": [
            {
                "id": d.id,
                "document_id": d.document_id,
                "filename": d.filename,
                "document_type": d.document_type,
                "uploaded_by": d.uploaded_by,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "processing_status": d.processing_status,
            }
            for d in docs
        ],
    }


# ---------------------------------------------------------------------------
# DNA
# ---------------------------------------------------------------------------

@router.post("/proposals/{proposal_id}/analyze")
def analyze_proposal_v1(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    # Build text from proposal fields + any uploaded documents
    text_parts = [
        f"Title: {p.title or ''}",
        f"Description: {p.description or ''}",
        f"Department: {p.department or ''}",
        f"Purpose: {p.purpose or ''}",
        f"Problem Statement: {p.problem_statement or ''}",
        f"Expected Outcome: {p.expected_outcome or ''}",
        f"Location: {p.station or p.region or ''}",
        f"Technology: {p.technology or ''}",
        f"Quantity: {p.quantity or ''}",
        f"Budget: {p.estimated_cost or ''} {p.currency or 'INR'}",
        f"Specification: {p.specification or ''}",
    ]
    # Pull content from uploaded documents
    pdocs = db.scalars(
        select(ProposalDocument).where(ProposalDocument.proposal_id == proposal_id)
    ).all()
    for pdoc in pdocs:
        if pdoc.document_id:
            stored_doc = db.get(Document, pdoc.document_id)
            if stored_doc and stored_doc.content:
                text_parts.append(stored_doc.content[:3000])

    text = "\n".join(text_parts)
    dna = extract_structured_dna(text, proposal_id, proposal_id)
    payload = serialize_dna(dna, proposal_id)

    # Upsert DNA record
    existing = db.scalar(
        select(ProposalDNARecord).where(ProposalDNARecord.proposal_id == proposal_id).limit(1)
    )
    if existing:
        existing.ai_extracted = payload["proposal_dna"]
        existing.completeness_score = payload["completeness_score"]
        existing.missing_fields = payload["missing_fields"]
    else:
        dna_rec = ProposalDNARecord(
            id=str(uuid.uuid4()),
            proposal_id=proposal_id,
            ai_extracted=payload["proposal_dna"],
            completeness_score=payload["completeness_score"],
            missing_fields=payload["missing_fields"],
        )
        db.add(dna_rec)

    p.analysis_status = "ANALYSIS_COMPLETE"
    p.updated_at = _now()
    db.flush()
    audit(db, "AI_ANALYSIS_COMPLETED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return {"success": True, "proposal_id": proposal_id, **payload}


@router.get("/proposals/{proposal_id}/dna")
def get_dna(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = db.scalar(
        select(ProposalDNARecord).where(ProposalDNARecord.proposal_id == proposal_id)
        .order_by(ProposalDNARecord.created_at.desc()).limit(1)
    )
    if not rec:
        _fail(404, "No DNA record found. Run /analyze first.")
    return {
        "success": True,
        "proposal_id": proposal_id,
        "ai_extracted": rec.ai_extracted,
        "confirmed": rec.confirmed,
        "confirmed_by": rec.confirmed_by,
        "confirmed_at": rec.confirmed_at.isoformat() if rec.confirmed_at else None,
        "completeness_score": rec.completeness_score,
        "missing_fields": rec.missing_fields,
    }


class DNAConfirmRequest(BaseModel):
    confirmed: dict[str, Any]


@router.patch("/proposals/{proposal_id}/dna")
def confirm_dna(
    proposal_id: str,
    body: DNAConfirmRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = db.scalar(
        select(ProposalDNARecord).where(ProposalDNARecord.proposal_id == proposal_id)
        .order_by(ProposalDNARecord.created_at.desc()).limit(1)
    )
    if not rec:
        _fail(404, "No DNA record found. Run /analyze first.")
    rec.confirmed = body.confirmed
    rec.confirmed_by = user.id
    rec.confirmed_at = _now()
    db.flush()
    audit(db, "DNA_CONFIRMED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return {"success": True, "message": "DNA confirmed", "confirmed": rec.confirmed}


# ---------------------------------------------------------------------------
# COMPLETENESS
# ---------------------------------------------------------------------------

@router.post("/proposals/{proposal_id}/completeness")
def check_completeness(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    checks = []
    score = 0
    total = 10

    def _check(field_name: str, value, label: str, why: str, how: str):
        nonlocal score
        present = bool(value)
        if present:
            score += 1
        checks.append({
            "field": field_name,
            "label": label,
            "status": "PASS" if present else "FAIL",
            "value": str(value)[:100] if present else None,
            "why_it_matters": why,
            "how_to_fix": how,
        })

    _check("title", p.title, "Proposal Title", "Uniquely identifies the proposal", "Add a clear descriptive title")
    _check("department", p.department, "Department", "Required for routing and jurisdiction matching", "Select the initiating department")
    _check("problem_statement", p.problem_statement, "Problem Statement", "Establishes justification for the request", "Describe the operational gap being addressed")
    _check("purpose", p.purpose, "Purpose", "Explains what the proposal will achieve", "State the operational objective clearly")
    _check("expected_outcome", p.expected_outcome, "Expected Outcome", "Enables post-implementation evaluation", "Describe measurable outcomes")
    _check("quantity", p.quantity, "Quantity", "Required for procurement intelligence and cost comparison", "Specify number of units and unit of measure")
    _check("estimated_cost", p.estimated_cost, "Estimated Cost", "Enables budget validation and historical comparison", "Provide cost estimate with basis")
    _check("station", p.station or p.region, "Location/Station", "Required for jurisdiction matching and precedent search", "Specify the station or region")
    _check("technology", p.technology, "Technology/Equipment", "Required for specification intelligence and GeM search", "Describe the technology or equipment category")
    _check("specification", p.specification, "Technical Specification", "Required for procurement and vendor-neutral comparison", "Add minimum technical requirements")

    pct = (score / total) * 100
    overall = "PASS" if pct >= 80 else "WARNING" if pct >= 50 else "FAIL"

    return {
        "success": True,
        "proposal_id": proposal_id,
        "completeness_percentage": round(pct, 1),
        "overall_status": overall,
        "score": score,
        "total": total,
        "checks": checks,
        "summary": f"{score}/{total} required fields present ({round(pct)}%)",
        "data_classification": SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# PRECEDENTS
# ---------------------------------------------------------------------------

JURISDICTION_RINGS = {
    0: "Same Station",
    1: "Neighboring Station",
    2: "Same Region",
    3: "Puducherry District",
    4: "UT-wide",
}

WHY_FACTORS = [
    ("objective", "Objective"),
    ("technology", "Technology"),
    ("location", "Location"),
    ("domain", "Domain"),
    ("budget", "Budget Range"),
    ("procurement_type", "Procurement Type"),
]


def _why_match(chunk: dict, query_tokens: set[str]) -> dict[str, Any]:
    text = (chunk.get("text") or "").lower()
    factors = {}
    for key, label in WHY_FACTORS:
        val = str(chunk.get(key) or "")
        token_hits = sum(1 for t in query_tokens if t in text and len(t) > 3)
        if token_hits >= 2:
            factors[label] = "Strong match"
        elif token_hits == 1:
            factors[label] = "Partial match"
    # Jurisdiction ring
    station = chunk.get("station") or ""
    ring = 4
    if station:
        ring = 2
    factors["Jurisdiction"] = JURISDICTION_RINGS.get(ring, "UT-wide")

    decision = "Unknown"
    if "approved" in text and "successful" in text:
        decision = "Approved / Implemented"
    elif "deferred" in text:
        decision = "Deferred"
    elif "rejected" in text:
        decision = "Rejected"
    elif "approved" in text:
        decision = "Approved"
    factors["Decision"] = decision

    return factors


@router.post("/search/precedents")
def search_precedents(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = body.get("query") or ""
    top_k = min(int(body.get("top_k", 10)), 20)
    if not query:
        _fail(400, "query required")
    audit(db, "PRECEDENT_SEARCHED", actor=user, detail=query[:120])
    sources = search_demo_index(query, top_k=top_k)
    query_tokens = set(query.lower().split())
    results = []
    for i, src in enumerate(sources, 1):
        why = _why_match(src, query_tokens)
        results.append({
            "rank": i,
            "id": src.get("chunk_id") or f"prec-{i}",
            "proposal_id": src.get("proposal_id"),
            "title": src.get("proposal_id") or f"Synthetic Proposal {i}",
            "match_score": round(min(src.get("score", 0) / 10.0, 1.0), 3),
            "jurisdiction_ring": 4,
            "jurisdiction_label": "UT-wide",
            "why_match": why,
            "excerpt": (src.get("text") or "")[:300],
            "document_type": src.get("document_type"),
            "source_filename": src.get("source_filename"),
            "synthetic": True,
            "data_classification": SYNTHETIC_NOTICE,
        })
    return {
        "success": True,
        "query": query,
        "total_found": len(results),
        "precedents": results,
        "data_classification": SYNTHETIC_NOTICE,
    }


@router.get("/proposals/{proposal_id}/precedents")
def proposal_precedents(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    query = " ".join(filter(None, [p.title, p.technology, p.purpose, p.station]))
    if not query.strip():
        query = p.title or "police proposal"
    return search_precedents(body={"query": query, "top_k": 8}, user=user, db=db)


# ---------------------------------------------------------------------------
# POLICIES
# ---------------------------------------------------------------------------

@router.post("/search/policies")
def search_policies(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = body.get("query") or ""
    if not query:
        _fail(400, "query required")
    audit(db, "POLICY_SEARCHED", actor=user, detail=query[:120])
    payload = {"what_is_needed": query, "equipment_class": None}
    result = policy_search(db, payload)
    return {"success": True, **result}


@router.get("/proposals/{proposal_id}/policies")
def proposal_policies(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    query = " ".join(filter(None, [p.technology, p.category, p.title]))
    payload = {"what_is_needed": query or p.title, "equipment_class": None}
    result = policy_search(db, payload)
    return {"success": True, **result}


# ---------------------------------------------------------------------------
# PROCUREMENT
# ---------------------------------------------------------------------------

@router.post("/search/procurement")
def search_procurement(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    what = body.get("what_is_needed") or body.get("query") or ""
    if not what:
        _fail(400, "what_is_needed required")
    audit(db, "PROCUREMENT_SEARCHED", actor=user, detail=what[:120])
    payload = {
        "what_is_needed": what,
        "quantity": body.get("quantity"),
        "location": body.get("location"),
        "equipment_class": body.get("equipment_class"),
    }
    result = procurement_intelligence(db, payload)
    return {"success": True, **result}


@router.get("/proposals/{proposal_id}/procurement")
def proposal_procurement(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    payload = {
        "what_is_needed": " ".join(filter(None, [p.title, p.technology, p.purpose])),
        "quantity": p.quantity,
        "location": p.station or p.region,
        "equipment_class": None,
    }
    result = procurement_intelligence(db, payload)
    return {"success": True, **result}


@router.get("/proposals/{proposal_id}/cost-analysis")
def cost_analysis(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    payload = {
        "what_is_needed": " ".join(filter(None, [p.title, p.technology])),
        "equipment_class": None,
    }
    from .intelligence import classify_requirement
    eq_class = classify_requirement(payload)

    tenders = db.scalars(
        select(HistoricalTender).where(HistoricalTender.equipment_class == eq_class)
    ).all()
    amounts = [t.indicative_amount_inr for t in tenders if t.indicative_amount_inr]

    variance_pct = None
    is_significant = False
    if amounts and p.estimated_cost:
        from statistics import median
        med = median(amounts)
        if med > 0:
            variance_pct = round(((p.estimated_cost - med) / med) * 100, 1)
            is_significant = abs(variance_pct) > 25

    return {
        "success": True,
        "proposal_id": proposal_id,
        "proposed_cost": p.estimated_cost,
        "currency": p.currency,
        "equipment_class": eq_class,
        "historical_min": min(amounts) if amounts else None,
        "historical_median": round(sum(amounts) / len(amounts), 0) if amounts else None,
        "historical_max": max(amounts) if amounts else None,
        "sample_size": len(amounts),
        "variance_percentage": variance_pct,
        "is_significant_variance": is_significant,
        "variance_signal": "Price variance detected. Verification recommended." if is_significant else None,
        "tenders": [
            {
                "id": t.id,
                "title": t.title,
                "year": t.year,
                "quantity": t.quantity,
                "amount_inr": t.indicative_amount_inr,
                "procurement_type": t.procurement_type,
                "synthetic": True,
            }
            for t in tenders
        ],
        "limitations": [
            "Illustrative demo amounts only.",
            "Scope, quantity, installation and warranty may differ across files.",
            "Do not use historical figures as official price benchmarks.",
        ],
        "data_classification": SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# OVERLAP DETECTION
# ---------------------------------------------------------------------------

@router.post("/proposals/{proposal_id}/overlap")
def detect_overlap(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    # Search for similar proposals in the synthetic index
    query = " ".join(filter(None, [p.title, p.technology, p.station, p.purpose]))
    sources = search_demo_index(query + " overlap similar duplicate", top_k=6)

    overlaps = []
    for src in sources:
        text = (src.get("text") or "").lower()
        overlap_score = src.get("score", 0)
        reasons = []
        if p.technology and p.technology.lower()[:5] in text:
            reasons.append(f"Similar technology: {p.technology}")
        if p.station and p.station.lower() in text:
            reasons.append(f"Same station: {p.station}")
        if p.category and p.category.lower() in text:
            reasons.append(f"Same category: {p.category}")
        if reasons:
            overlaps.append({
                "proposal_id": src.get("proposal_id"),
                "similarity": round(min(overlap_score / 8.0, 0.95), 2),
                "reasons": reasons,
                "excerpt": (src.get("text") or "")[:200],
                "source": src.get("source_filename"),
                "synthetic": True,
            })

    signal = None
    if overlaps:
        signal = {
            "type": "POTENTIAL_DUPLICATE",
            "severity": "MEDIUM" if len(overlaps) > 1 else "LOW",
            "message": f"Potential overlap detected with {len(overlaps)} existing record(s). Officer review recommended.",
            "advisory": True,
        }

    return {
        "success": True,
        "proposal_id": proposal_id,
        "overlap_signal": signal,
        "potential_overlaps": overlaps,
        "total_found": len(overlaps),
        "note": "This is a review signal only, not an automatic rejection.",
        "data_classification": SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# GEM INTELLIGENCE
# ---------------------------------------------------------------------------

class GeMSearchRequest(BaseModel):
    proposal_id: Optional[str] = None
    category: Optional[str] = None
    product: Optional[str] = None
    keywords: Optional[str] = None
    quantity: Optional[str] = None
    delivery_location: Optional[str] = None
    technical_params: dict = Field(default_factory=dict)


@router.post("/gem/search")
def gem_search(
    body: GeMSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    audit(db, "GEM_SEARCHED", actor=user, object_type="GEM",
          detail=f"{body.category} / {body.product}")

    # Save search record
    gs = GeMSearch(
        id=str(uuid.uuid4()),
        proposal_id=body.proposal_id,
        category=body.category,
        product=body.product,
        keywords=body.keywords,
        quantity=body.quantity,
        delivery_location=body.delivery_location,
        technical_params=body.technical_params,
        searched_by=user.id,
    )

    # Build demo results from existing procurement data
    query = " ".join(filter(None, [body.category, body.product, body.keywords]))
    payload = {"what_is_needed": query or "police equipment", "equipment_class": None}
    proc = procurement_intelligence(db, payload)
    equip = equipment_intelligence(db, payload)

    # Synthesize GeM-style results from procurement data
    gem_results = []
    for t in proc.get("historical_tenders", [])[:5]:
        gem_results.append({
            "product": t.get("title", ""),
            "category": t.get("equipment_class", ""),
            "specification_summary": t.get("specification_summary", ""),
            "quantity": t.get("quantity"),
            "observed_price_inr": t.get("indicative_amount_inr"),
            "procurement_mode": t.get("procurement_type", ""),
            "observed_at": f"{t.get('year', 2024)}-01-01",
            "source": "Synthetic demo procurement record",
            "source_type": "SYNTHETIC_DEMO",
            "warranty": "As per demo spec",
            "delivery": "To be confirmed",
            "country_preference": "Make in India (refer GeM guidelines)",
            "synthetic": True,
        })

    gs.results = gem_results
    db.add(gs)
    db.flush()

    return {
        "success": True,
        "search_id": gs.id,
        "query": {"category": body.category, "product": body.product, "keywords": body.keywords},
        "results": gem_results,
        "procurement_modes": [
            {
                "mode": "Direct Purchase",
                "context": "Refer to current GeM guidelines for applicable thresholds",
                "source": "GeM official documentation",
                "officer_verification_required": True,
            },
            {
                "mode": "Direct Purchase with L1",
                "context": "Refer to current GeM guidelines for applicable thresholds",
                "source": "GeM official documentation",
                "officer_verification_required": True,
            },
            {
                "mode": "e-Bid / Reverse Auction",
                "context": "Used for larger procurements per GeM guidelines",
                "source": "GeM official documentation",
                "officer_verification_required": True,
            },
        ],
        "gem_portal_url": "https://gem.gov.in/",
        "note": "Results are synthetic demo data only. Use the official GeM portal for actual procurement.",
        "data_classification": SYNTHETIC_NOTICE,
        "live_data": False,
    }


@router.post("/gem/package")
def gem_package(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proposal_id = body.get("proposal_id")
    p = db.get(Proposal, proposal_id) if proposal_id else None
    audit(db, "GEM_PACKAGE_GENERATED", actor=user, object_type="GEM", object_id=proposal_id)

    package = {
        "package_id": str(uuid.uuid4()),
        "proposal_number": p.proposal_number if p else "N/A",
        "proposal_title": p.title if p else body.get("title", ""),
        "requirement": p.purpose if p else body.get("requirement", ""),
        "quantity": p.quantity if p else body.get("quantity", ""),
        "delivery_location": (p.station or p.region) if p else body.get("location", ""),
        "technical_specification": p.specification if p else body.get("specification", ""),
        "estimated_cost_inr": p.estimated_cost if p else body.get("estimated_cost"),
        "justification": p.problem_statement if p else body.get("justification", ""),
        "gem_search_parameters": {
            "category": body.get("category", p.category if p else ""),
            "keywords": body.get("keywords", (p.technology or "") if p else ""),
            "quantity": (p.quantity or "") if p else "",
            "delivery_location": ((p.station or p.region) or "") if p else "",
        },
        "generated_by": user.display_name,
        "generated_at": _now().isoformat(),
        "gem_portal_url": "https://gem.gov.in/",
        "officer_instructions": [
            "Review all parameters before initiating procurement on GeM portal.",
            "Ensure the technical specification does not favour a specific manufacturer.",
            "Select procurement mode per applicable GeM guidelines and departmental approval.",
            "Record the GeM Bid/Order number in PRISM-PY after procurement initiation.",
        ],
        "data_classification": SYNTHETIC_NOTICE,
        "vendor_selection": "NOT_PERFORMED — final procurement decisions remain with the authorized officer.",
    }
    return {"success": True, "package": package}


@router.post("/gem/reference")
def record_gem_reference(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proposal_id = body.get("proposal_id")
    if not proposal_id:
        _fail(400, "proposal_id required")
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    ref = GeMReference(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        reference_type=body.get("reference_type", "BID"),
        reference_number=body.get("reference_number"),
        date=body.get("date"),
        status=body.get("status"),
        officer=user.display_name,
        notes=body.get("notes"),
    )
    db.add(ref)
    db.flush()
    audit(db, "GEM_REFERENCE_RECORDED", actor=user, object_type="GEM", object_id=proposal_id,
          detail=f"Reference: {ref.reference_number}")
    return {"success": True, "reference_id": ref.id}


@router.get("/proposals/{proposal_id}/gem")
def proposal_gem_status(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    refs = db.scalars(
        select(GeMReference).where(GeMReference.proposal_id == proposal_id)
        .order_by(GeMReference.created_at.desc())
    ).all()
    return {
        "success": True,
        "proposal_id": proposal_id,
        "references": [
            {
                "id": r.id,
                "reference_type": r.reference_type,
                "reference_number": r.reference_number,
                "date": r.date,
                "status": r.status,
                "officer": r.officer,
                "notes": r.notes,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in refs
        ],
        "gem_portal": "https://gem.gov.in/",
    }


@router.get("/gem/guidance")
def gem_guidance(user: User = Depends(get_current_user)):
    return {
        "success": True,
        "guidance": {
            "portal": "https://gem.gov.in/",
            "handbook": "https://assets-bg.gem.gov.in/resources/pdf/GeM_handbook.pdf",
            "buyer_learning": "https://elearning.gem.gov.in/course/index.php?categoryid=1",
            "procurement_modes": [
                {
                    "mode": "Direct Purchase",
                    "description": "For purchases below applicable threshold per current GeM rules",
                    "source": "GeM official guidelines",
                },
                {
                    "mode": "Direct Purchase with L1",
                    "description": "For purchases above direct purchase threshold, L1 quote required",
                    "source": "GeM official guidelines",
                },
                {
                    "mode": "e-Bid / Reverse Auction",
                    "description": "For larger procurements; competitive bidding via platform",
                    "source": "GeM official guidelines",
                },
            ],
            "important_notes": [
                "Final procurement mode selection rests with the authorized officer.",
                "PRISM-PY provides intelligence only; it does not place orders.",
                "Refer to current departmental procurement policy for thresholds.",
                "All purchases require appropriate approvals per DFP/GFR.",
            ],
        },
        "data_classification": SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# DECISION BRIEF
# ---------------------------------------------------------------------------

@router.post("/proposals/{proposal_id}/decision-brief")
def generate_decision_brief(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")

    audit(db, "DECISION_BRIEF_GENERATED", actor=user, object_type="PROPOSAL", object_id=proposal_id)

    # Get DNA if available
    dna_rec = db.scalar(
        select(ProposalDNARecord).where(ProposalDNARecord.proposal_id == proposal_id)
        .order_by(ProposalDNARecord.created_at.desc()).limit(1)
    )
    dna = dna_rec.confirmed or dna_rec.ai_extracted if dna_rec else {}

    # Get completeness
    query_text = " ".join(filter(None, [p.title, p.technology, p.purpose, p.station]))

    # Precedents
    precedents = search_demo_index(query_text, top_k=5) if query_text else []

    # Policies
    policy_payload = {"what_is_needed": query_text, "equipment_class": None}
    policies = policy_search(db, policy_payload)

    # Procurement
    proc_payload = {"what_is_needed": query_text, "quantity": p.quantity, "equipment_class": None}
    procurement = procurement_intelligence(db, proc_payload)

    # Build brief
    brief = {
        "brief_id": str(uuid.uuid4()),
        "proposal_id": proposal_id,
        "proposal_number": p.proposal_number,
        "generated_at": _now().isoformat(),
        "generated_by": user.display_name,
        "sections": {
            "1_proposal_summary": {
                "title": p.title,
                "department": p.department,
                "station": p.station,
                "category": p.category,
                "priority": p.priority,
                "estimated_cost_inr": p.estimated_cost,
                "status": p.status,
            },
            "2_requirement": {
                "purpose": p.purpose,
                "problem_statement": p.problem_statement,
                "expected_outcome": p.expected_outcome,
                "quantity": p.quantity,
                "technology": p.technology,
            },
            "3_proposal_dna": dna,
            "4_completeness": {
                "note": "Run /completeness endpoint for full check",
            },
            "5_precedents": {
                "count": len(precedents),
                "precedents": [
                    {
                        "proposal_id": s.get("proposal_id"),
                        "excerpt": (s.get("text") or "")[:200],
                        "score": s.get("score"),
                        "synthetic": True,
                    }
                    for s in precedents
                ],
            },
            "6_policies": {
                "count": len(policies.get("policies", [])),
                "policies": policies.get("policies", [])[:3],
            },
            "7_procurement": {
                "tenders": procurement.get("historical_tenders", [])[:3],
                "price_summary": procurement.get("indicative_price_summary"),
            },
            "8_cost_intelligence": {
                "proposed": p.estimated_cost,
                "historical_summary": procurement.get("indicative_price_summary"),
                "note": "Compare scope, quantity, warranty before using historical figures.",
            },
            "9_risk_signals": _build_risk_signals(p, dna),
            "10_missing_information": _missing_fields(p),
            "11_review_points": [
                "Confirm quantity and specification match the actual requirement.",
                "Verify no overlapping work exists at the same station.",
                "Check whether similar proposals were previously deferred or rejected.",
                "Confirm funding source and approval authority.",
                "Review procurement mode with reference to current GeM guidelines.",
            ],
            "12_officer_decision": "PENDING — Awaiting authorized officer review.",
        },
        "overall_confidence": "MEDIUM",
        "confidence_note": "Based on synthetic demo corpus only. Confidence reflects demo data quality.",
        "vendor_selection": "NOT_PERFORMED",
        "notice": VENDOR_NOTICE,
        "data_classification": SYNTHETIC_NOTICE,
    }

    # Persist
    row = DecisionBriefRecord(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        payload=brief,
        executive_summary=f"Decision Brief for {p.title} ({p.proposal_number}). Status: {p.status}. Precedents: {len(precedents)}. Policies: {len(policies.get('policies', []))}.",
    )
    db.add(row)
    db.flush()

    return {"success": True, "brief": brief}


@router.get("/proposals/{proposal_id}/decision-brief")
def get_decision_brief(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.scalar(
        select(DecisionBriefRecord).where(DecisionBriefRecord.proposal_id == proposal_id)
        .order_by(DecisionBriefRecord.created_at.desc()).limit(1)
    )
    if not row:
        _fail(404, "No decision brief found. Generate one first.")
    return {
        "success": True,
        "brief_id": row.id,
        "proposal_id": proposal_id,
        "brief": row.payload,
        "executive_summary": row.executive_summary,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _build_risk_signals(p: Proposal, dna: dict) -> list[dict]:
    signals = []
    if not p.problem_statement:
        signals.append({"type": "MISSING_INFORMATION", "severity": "HIGH",
                        "title": "Missing Problem Statement",
                        "description": "A clear problem statement is required to justify the proposal."})
    if not p.specification:
        signals.append({"type": "MISSING_INFORMATION", "severity": "MEDIUM",
                        "title": "Missing Technical Specification",
                        "description": "Specification required for vendor-neutral procurement."})
    if p.estimated_cost and p.estimated_cost > 5000000:
        signals.append({"type": "COST_VARIANCE", "severity": "MEDIUM",
                        "title": "High-Value Proposal",
                        "description": f"Estimated cost INR {p.estimated_cost:,.0f} — verify additional approval requirements."})
    if not p.quantity:
        signals.append({"type": "MISSING_INFORMATION", "severity": "MEDIUM",
                        "title": "Quantity Not Specified",
                        "description": "Quantity is required for accurate procurement intelligence."})
    return signals


def _missing_fields(p: Proposal) -> list[str]:
    missing = []
    for field, label in [
        ("problem_statement", "Problem Statement"),
        ("specification", "Technical Specification"),
        ("quantity", "Quantity"),
        ("expected_outcome", "Expected Outcome"),
        ("estimated_cost", "Estimated Cost"),
        ("station", "Station/Location"),
    ]:
        if not getattr(p, field, None):
            missing.append(label)
    return missing


# ---------------------------------------------------------------------------
# IMPLEMENTATION
# ---------------------------------------------------------------------------

class ImplementationCreateRequest(BaseModel):
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    planned_cost: Optional[float] = None
    planned_quantity: Optional[str] = None
    responsible_unit: Optional[str] = None


@router.post("/proposals/{proposal_id}/implementation")
def create_implementation(
    proposal_id: str,
    body: ImplementationCreateRequest,
    user: User = Depends(require_permission("implementation:update")),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    existing = db.scalar(
        select(ImplementationRecord).where(ImplementationRecord.proposal_id == proposal_id)
    )
    if existing:
        _fail(400, "Implementation record already exists")

    rec = ImplementationRecord(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        status="NOT_STARTED",
        planned_start=body.planned_start,
        planned_end=body.planned_end,
        planned_cost=body.planned_cost or p.estimated_cost,
        planned_quantity=body.planned_quantity or p.quantity,
        responsible_unit=body.responsible_unit or p.unit,
    )
    db.add(rec)
    p.status = "IMPLEMENTATION"
    p.updated_at = _now()
    db.flush()
    audit(db, "IMPLEMENTATION_STARTED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return {"success": True, "implementation_id": rec.id, "status": rec.status}


@router.get("/proposals/{proposal_id}/implementation")
def get_implementation(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = db.scalar(
        select(ImplementationRecord)
        .where(ImplementationRecord.proposal_id == proposal_id)
        .options(selectinload(ImplementationRecord.updates))
    )
    if not rec:
        _fail(404, "No implementation record found")
    return {
        "success": True,
        "implementation": {
            "id": rec.id,
            "proposal_id": proposal_id,
            "status": rec.status,
            "planned_start": rec.planned_start,
            "planned_end": rec.planned_end,
            "actual_start": rec.actual_start,
            "actual_end": rec.actual_end,
            "planned_cost": rec.planned_cost,
            "actual_cost": rec.actual_cost,
            "planned_quantity": rec.planned_quantity,
            "delivered_quantity": rec.delivered_quantity,
            "responsible_unit": rec.responsible_unit,
            "issues": rec.issues,
            "observations": rec.observations,
            "updates": [
                {
                    "id": u.id,
                    "update_type": u.update_type,
                    "note": u.note,
                    "updated_by": u.updated_by,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                }
                for u in (rec.updates or [])
            ],
            "synthetic": rec.synthetic,
        },
    }


class ImplementationUpdateRequest(BaseModel):
    status: Optional[str] = None
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None
    actual_cost: Optional[float] = None
    delivered_quantity: Optional[str] = None
    issues: Optional[str] = None
    observations: Optional[str] = None
    update_note: Optional[str] = None


@router.patch("/implementation/{impl_id}")
def update_implementation(
    impl_id: str,
    body: ImplementationUpdateRequest,
    user: User = Depends(require_permission("implementation:update")),
    db: Session = Depends(get_db),
):
    rec = db.get(ImplementationRecord, impl_id)
    if not rec:
        _fail(404, "Implementation record not found")
    for field in ("status", "actual_start", "actual_end", "actual_cost", "delivered_quantity", "issues", "observations"):
        val = getattr(body, field)
        if val is not None:
            setattr(rec, field, val)
    rec.updated_at = _now()
    if body.update_note:
        upd = ImplementationUpdate(
            id=str(uuid.uuid4()),
            record_id=impl_id,
            note=body.update_note,
            updated_by=user.display_name,
        )
        db.add(upd)
    db.flush()
    audit(db, "IMPLEMENTATION_UPDATED", actor=user, object_type="IMPLEMENTATION", object_id=impl_id)
    return {"success": True, "status": rec.status}


# ---------------------------------------------------------------------------
# OUTCOMES & LESSONS
# ---------------------------------------------------------------------------

class OutcomeRequest(BaseModel):
    outcome_status: str = "SUCCESS"
    actual_cost: Optional[float] = None
    actual_duration: Optional[str] = None
    success_metrics: Optional[str] = None
    implementation_issues: Optional[str] = None
    observations: Optional[str] = None
    benefits: Optional[str] = None
    failures: Optional[str] = None


@router.post("/proposals/{proposal_id}/outcome")
def create_outcome(
    proposal_id: str,
    body: OutcomeRequest,
    user: User = Depends(require_permission("outcome:create")),
    db: Session = Depends(get_db),
):
    p = db.get(Proposal, proposal_id)
    if not p:
        _fail(404, "Proposal not found")
    existing = db.scalar(select(OutcomeRecord).where(OutcomeRecord.proposal_id == proposal_id))
    if existing:
        _fail(400, "Outcome already recorded")
    rec = OutcomeRecord(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        outcome_status=body.outcome_status,
        actual_cost=body.actual_cost,
        actual_duration=body.actual_duration,
        success_metrics=body.success_metrics,
        implementation_issues=body.implementation_issues,
        observations=body.observations,
        benefits=body.benefits,
        failures=body.failures,
        recorded_by=user.id,
    )
    db.add(rec)
    p.status = "COMPLETED"
    p.updated_at = _now()
    db.flush()
    audit(db, "OUTCOME_CREATED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return {"success": True, "outcome_id": rec.id}


@router.get("/proposals/{proposal_id}/outcome")
def get_outcome(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = db.scalar(
        select(OutcomeRecord).where(OutcomeRecord.proposal_id == proposal_id)
        .options(selectinload(OutcomeRecord.lessons))
    )
    if not rec:
        _fail(404, "No outcome recorded")
    return {
        "success": True,
        "outcome": {
            "id": rec.id,
            "outcome_status": rec.outcome_status,
            "actual_cost": rec.actual_cost,
            "actual_duration": rec.actual_duration,
            "success_metrics": rec.success_metrics,
            "observations": rec.observations,
            "benefits": rec.benefits,
            "failures": rec.failures,
            "verified": rec.verified,
            "lessons": [
                {"id": l.id, "title": l.title, "lesson_text": l.lesson_text, "category": l.category}
                for l in (rec.lessons or [])
            ],
        },
    }


class LessonRequest(BaseModel):
    title: str
    lesson_text: str
    category: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)


@router.post("/proposals/{proposal_id}/lesson")
def add_lesson(
    proposal_id: str,
    body: LessonRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    outcome = db.scalar(select(OutcomeRecord).where(OutcomeRecord.proposal_id == proposal_id))
    if not outcome:
        _fail(404, "Record outcome before adding lessons")
    lesson = LessonRecord(
        id=str(uuid.uuid4()),
        outcome_id=outcome.id,
        proposal_id=proposal_id,
        title=body.title,
        lesson_text=body.lesson_text,
        category=body.category,
        keywords=body.keywords,
    )
    db.add(lesson)
    db.flush()
    audit(db, "LESSON_CREATED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return {"success": True, "lesson_id": lesson.id}


# ---------------------------------------------------------------------------
# INSTITUTIONAL MEMORY (search lessons)
# ---------------------------------------------------------------------------

@router.post("/institutional-memory/search")
def search_institutional_memory(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (body.get("query") or "").lower()
    lessons = db.scalars(select(LessonRecord)).all()
    results = []
    for l in lessons:
        hay = f"{l.title} {l.lesson_text} {' '.join(l.keywords or [])}".lower()
        if not query or any(t in hay for t in query.split() if len(t) > 3):
            results.append({
                "id": l.id,
                "proposal_id": l.proposal_id,
                "title": l.title,
                "lesson": l.lesson_text[:300],
                "category": l.category,
                "keywords": l.keywords,
                "indexed": l.indexed,
                "synthetic": l.synthetic,
            })
    # Also search demo index
    if query:
        chunks = search_demo_index(query + " outcome lesson", top_k=5)
        for c in chunks:
            results.append({
                "proposal_id": c.get("proposal_id"),
                "title": "Retrieved from synthetic corpus",
                "lesson": (c.get("text") or "")[:200],
                "category": "DEMO",
                "keywords": [],
                "synthetic": True,
            })
    return {
        "success": True,
        "results": results[:20],
        "total": len(results),
        "data_classification": SYNTHETIC_NOTICE,
    }


# ---------------------------------------------------------------------------
# AUDIT
# ---------------------------------------------------------------------------

@router.get("/audit")
def get_audit_log(
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    action: Optional[str] = Query(None),
    object_type: Optional[str] = Query(None),
    user: User = Depends(require_permission("audit:view")),
    db: Session = Depends(get_db),
):
    q = select(AuditEvent).order_by(AuditEvent.created_at.desc())
    if action:
        q = q.where(AuditEvent.action == action.upper())
    if object_type:
        q = q.where(AuditEvent.object_type == object_type.upper())
    q = q.offset(offset).limit(limit)
    events = db.scalars(q).all()
    total = db.scalar(select(func.count(AuditEvent.id)))
    return {
        "success": True,
        "events": [
            {
                "id": e.id,
                "action": e.action,
                "actor": e.actor_name,
                "object_type": e.object_type,
                "object_id": e.object_id,
                "detail": e.detail,
                "result": e.result,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/proposals/{proposal_id}/audit")
def proposal_audit(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = db.scalars(
        select(AuditEvent).where(AuditEvent.object_id == proposal_id)
        .order_by(AuditEvent.created_at.asc())
    ).all()
    return {
        "success": True,
        "events": [
            {
                "id": e.id,
                "action": e.action,
                "actor": e.actor_name,
                "detail": e.detail,
                "old_value": e.old_value,
                "new_value": e.new_value,
                "result": e.result,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
    }
