"""PRISM-PY Procurement Workflow Models.

Adds the full procurement lifecycle that was missing after the audit:
  - ApprovalMatrix (financial threshold routing)
  - ProcurementRequirement
  - ProcurementEvent (bid lifecycle)
  - Bid + BidDocument
  - TechnicalEvaluation + EvaluationCommittee + BidderEvaluation
  - FinancialEvaluation + FinancialBidLine
  - PurchaseOrder

All records are marked synthetic=True for the demo.
Final procurement decisions always remain with the authorised officer.
PRISM-PY never auto-selects a vendor or places an order.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Approval Matrix  (financial threshold routing)
# ---------------------------------------------------------------------------

class ApprovalMatrix(Base):
    """Configurable financial threshold → required approval authority level.

    Example:
        min_amount_inr=0,        max_amount_inr=100000,     authority_level='UNIT_LEVEL'
        min_amount_inr=100001,   max_amount_inr=500000,     authority_level='DGP_LEVEL'
        min_amount_inr=500001,   max_amount_inr=5000000,    authority_level='DEPARTMENT_LEVEL'
        min_amount_inr=5000001,  max_amount_inr=None,       authority_level='GOVERNMENT_LEVEL'
    """
    __tablename__ = "approval_matrix"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    authority_level: Mapped[str] = mapped_column(String(64))
    # UNIT_LEVEL | DGP_LEVEL | DEPARTMENT_LEVEL | GOVERNMENT_LEVEL
    required_role: Mapped[str] = mapped_column(String(64))
    # Maps to RBAC role: REVIEWER | APPROVING_AUTHORITY | GOVERNMENT_AUTHORITY
    min_amount_inr: Mapped[float] = mapped_column(Float, default=0.0)
    max_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ---------------------------------------------------------------------------
# Procurement Requirement  (structured, persisted)
# ---------------------------------------------------------------------------

class ProcurementRequirement(Base):
    """A structured procurement requirement derived from an approved proposal.

    Separate from the Proposal itself so it can be edited by the
    Procurement Officer without touching the original proposal record.
    """
    __tablename__ = "procurement_requirements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), index=True)
    category: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    item_description: Mapped[str] = mapped_column(Text, default="")
    quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit_of_measure: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    functional_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technical_specification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    compliance_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    warranty_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_unit_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_estimated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    justification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gem_category_code: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    gem_search_params: Mapped[dict] = mapped_column(JSON, default=dict)
    prepared_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT")
    # DRAFT | FINALIZED | APPROVED
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    events: Mapped[list["ProcurementEvent"]] = relationship(back_populates="requirement", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Procurement Event  (bid lifecycle)
# ---------------------------------------------------------------------------

class ProcurementEvent(Base):
    """Represents one complete procurement cycle for a requirement.

    Lifecycle states:
        PREPARING → PUBLISHED → BID_ACTIVE → BID_CLOSED →
        BID_OPENING → TECHNICAL_EVALUATION → FINANCIAL_EVALUATION →
        AWARD_DECISION → AWARDED → CANCELLED
    """
    __tablename__ = "procurement_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    requirement_id: Mapped[str] = mapped_column(ForeignKey("procurement_requirements.id"), index=True)
    proposal_id: Mapped[str] = mapped_column(String(64), index=True)
    event_number: Mapped[str] = mapped_column(String(64), unique=True)
    # e.g. PE-PRISM-20240101-001
    procurement_mode: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    # Direct Purchase | Direct Purchase with L1 | e-Bid/Reverse Auction | Limited Tender | Open Tender
    gem_bid_number: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    gem_order_number: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="PREPARING")
    bid_start_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    bid_close_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    bid_open_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    bid_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Note: ~20-21 days is typical per officer, but this is configurable per GeM/procurement rules
    total_bids_received: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    requirement: Mapped[ProcurementRequirement] = relationship(back_populates="events")
    bids: Mapped[list["Bid"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    technical_evaluations: Mapped[list["TechnicalEvaluation"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    financial_evaluations: Mapped[list["FinancialEvaluation"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    purchase_orders: Mapped[list["PurchaseOrder"]] = relationship(back_populates="event", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Bid
# ---------------------------------------------------------------------------

class Bid(Base):
    """A bid submitted by a supplier/company against a ProcurementEvent.

    PRISM-PY records bid information for evaluation purposes only.
    It never automatically selects or awards a bid.
    """
    __tablename__ = "bids"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("procurement_events.id"), index=True)
    bid_reference: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    # GeM bid reference or internal tracking number
    company_name: Mapped[str] = mapped_column(String(256))
    # Display name only — not verified vendor identity
    company_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    bid_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quantity_offered: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    delivery_period: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    warranty_offered: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    offered_specification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    country_of_origin: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    technical_qualification_status: Mapped[str] = mapped_column(String(32), default="PENDING")
    # PENDING | QUALIFIED | NOT_QUALIFIED | UNDER_EVALUATION
    is_l1: Mapped[bool] = mapped_column(Boolean, default=False)
    is_awarded: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    event: Mapped[ProcurementEvent] = relationship(back_populates="bids")
    evaluation_lines: Mapped[list["BidderEvaluation"]] = relationship(back_populates="bid", cascade="all, delete-orphan")
    financial_lines: Mapped[list["FinancialBidLine"]] = relationship(back_populates="bid", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Technical Evaluation
# ---------------------------------------------------------------------------

class TechnicalEvaluation(Base):
    """Records the technical evaluation conducted for a ProcurementEvent."""
    __tablename__ = "technical_evaluations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("procurement_events.id"), index=True)
    evaluation_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    demo_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    venue: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    # PENDING | IN_PROGRESS | COMPLETED
    overall_observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    event: Mapped[ProcurementEvent] = relationship(back_populates="technical_evaluations")
    committee: Mapped[list["EvaluationCommittee"]] = relationship(back_populates="evaluation", cascade="all, delete-orphan")
    bidder_lines: Mapped[list["BidderEvaluation"]] = relationship(back_populates="evaluation", cascade="all, delete-orphan")


class EvaluationCommittee(Base):
    """Members of the purchase/technical evaluation committee."""
    __tablename__ = "evaluation_committee"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    evaluation_id: Mapped[str] = mapped_column(ForeignKey("technical_evaluations.id"), index=True)
    member_name: Mapped[str] = mapped_column(String(256))
    designation: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    role: Mapped[str] = mapped_column(String(64), default="MEMBER")
    # CHAIRMAN | MEMBER | TECHNICAL_EXPERT | OBSERVER
    department: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    evaluation: Mapped[TechnicalEvaluation] = relationship(back_populates="committee")


class BidderEvaluation(Base):
    """Per-bidder, per-specification technical evaluation result.

    For each bid, each specification field is evaluated as
    COMPLIANT | NON_COMPLIANT | PARTIAL | NOT_VERIFIED.
    """
    __tablename__ = "bidder_evaluations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    evaluation_id: Mapped[str] = mapped_column(ForeignKey("technical_evaluations.id"), index=True)
    bid_id: Mapped[str] = mapped_column(ForeignKey("bids.id"), index=True)
    spec_field: Mapped[str] = mapped_column(String(256))
    required_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    offered_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    compliance_status: Mapped[str] = mapped_column(String(32), default="NOT_VERIFIED")
    # COMPLIANT | NON_COMPLIANT | PARTIAL | NOT_VERIFIED
    evaluator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluated_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    evaluation: Mapped[TechnicalEvaluation] = relationship(back_populates="bidder_lines")
    bid: Mapped[Bid] = relationship(back_populates="evaluation_lines")


# ---------------------------------------------------------------------------
# Financial Evaluation + L1
# ---------------------------------------------------------------------------

class FinancialEvaluation(Base):
    """Records the financial bid opening and comparative statement.

    L1 is identified as the lowest financial bid among technically
    qualified bidders. PRISM-PY computes and records this — the final
    decision remains with the authorised officer/committee.
    """
    __tablename__ = "financial_evaluations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("procurement_events.id"), index=True)
    evaluation_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    technically_qualified_count: Mapped[int] = mapped_column(Integer, default=0)
    l1_bid_id: Mapped[Optional[str]] = mapped_column(ForeignKey("bids.id"), nullable=True)
    l1_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    l1_identified_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    # Officer who recorded the L1 determination
    comparative_statement: Mapped[dict] = mapped_column(JSON, default=dict)
    # {"bids": [{"company": ..., "amount": ..., "rank": ..., "qualified": ...}]}
    finalized_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    finalized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    # PENDING | IN_PROGRESS | FINALIZED
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    event: Mapped[ProcurementEvent] = relationship(back_populates="financial_evaluations")
    lines: Mapped[list["FinancialBidLine"]] = relationship(back_populates="evaluation", cascade="all, delete-orphan")


class FinancialBidLine(Base):
    """One line in the comparative statement — one bid's financial details."""
    __tablename__ = "financial_bid_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    evaluation_id: Mapped[str] = mapped_column(ForeignKey("financial_evaluations.id"), index=True)
    bid_id: Mapped[str] = mapped_column(ForeignKey("bids.id"), index=True)
    company_name: Mapped[str] = mapped_column(String(256))
    bid_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_technically_qualified: Mapped[bool] = mapped_column(Boolean, default=False)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Rank among technically qualified bids only; NULL if not qualified
    is_l1: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    evaluation: Mapped[FinancialEvaluation] = relationship(back_populates="lines")
    bid: Mapped[Bid] = relationship(back_populates="financial_lines")


# ---------------------------------------------------------------------------
# Purchase Order
# ---------------------------------------------------------------------------

class PurchaseOrder(Base):
    """Purchase Order issued after award decision.

    Links procurement event → implementation record.
    PRISM-PY records PO details entered by the authorised officer.
    It never generates or places an order autonomously.
    """
    __tablename__ = "purchase_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("procurement_events.id"), index=True)
    proposal_id: Mapped[str] = mapped_column(String(64), index=True)
    po_number: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    gem_order_number: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    vendor_name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    vendor_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    # Reference only — not verified vendor identity
    quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit_price_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    po_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    expected_delivery_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    actual_delivery_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    delivery_location: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="ISSUED")
    # ISSUED | ACKNOWLEDGED | DELIVERY_PENDING | PARTIALLY_DELIVERED | DELIVERED | ACCEPTED | CLOSED
    inspection_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    implementation_record_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("implementation_records.id"), nullable=True
    )
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    event: Mapped[ProcurementEvent] = relationship(back_populates="purchase_orders")
