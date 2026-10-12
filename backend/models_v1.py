"""Extended SQLite models for PRISM-PY v1 full lifecycle.

These tables add the complete proposal lifecycle, RBAC, audit trail,
GeM workspace, implementation tracking, outcomes and lessons on top of
the existing models.py tables which are preserved unchanged.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(256))
    email: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(256))
    role: Mapped[str] = mapped_column(String(64), default="INITIATOR")
    department: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


# ---------------------------------------------------------------------------
# Jurisdiction / Org master data
# ---------------------------------------------------------------------------

class PoliceStation(Base):
    __tablename__ = "police_stations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(256))
    region: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    station_type: Mapped[str] = mapped_column(String(64), default="police_station")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)


class JurisdictionRelationship(Base):
    __tablename__ = "jurisdiction_relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("police_stations.id"))
    related_station_id: Mapped[str] = mapped_column(String(64))
    ring: Mapped[int] = mapped_column(Integer, default=1)  # 0=same, 1=neighbor, 2=region, 3=district, 4=UT
    relationship_type: Mapped[str] = mapped_column(String(64), default="neighboring")
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)


# ---------------------------------------------------------------------------
# Proposals (full lifecycle)
# ---------------------------------------------------------------------------

class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    station: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    priority: Mapped[str] = mapped_column(String(32), default="NORMAL")
    status: Mapped[str] = mapped_column(String(64), default="DRAFT")
    estimated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    cost_basis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    funding_source: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit_of_measure: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    problem_statement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technology: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    specification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_completion_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    current_owner: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    classification: Mapped[str] = mapped_column(String(64), default="SYNTHETIC_DEMO")
    analysis_status: Mapped[str] = mapped_column(String(64), default="NOT_ANALYZED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    documents: Mapped[list["ProposalDocument"]] = relationship(back_populates="proposal", cascade="all, delete-orphan")
    dna_records: Mapped[list["ProposalDNARecord"]] = relationship(back_populates="proposal", cascade="all, delete-orphan")
    decisions: Mapped[list["DecisionAction"]] = relationship(back_populates="proposal", cascade="all, delete-orphan")
    implementation: Mapped[Optional["ImplementationRecord"]] = relationship(back_populates="proposal", uselist=False)
    outcome: Mapped[Optional["OutcomeRecord"]] = relationship(back_populates="proposal", uselist=False)
    gem_references: Mapped[list["GeMReference"]] = relationship(back_populates="proposal", cascade="all, delete-orphan")


class ProposalDocument(Base):
    __tablename__ = "proposal_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), index=True)
    document_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    filename: Mapped[str] = mapped_column(String(512))
    document_type: Mapped[str] = mapped_column(String(64), default="SUPPORTING")
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    processing_status: Mapped[str] = mapped_column(String(32), default="PENDING")

    proposal: Mapped[Proposal] = relationship(back_populates="documents")


class ProposalDNARecord(Base):
    __tablename__ = "proposal_dna_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), index=True)
    ai_extracted: Mapped[dict] = mapped_column(JSON, default=dict)
    confirmed: Mapped[dict] = mapped_column(JSON, default=dict)
    confirmed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0)
    missing_fields: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    proposal: Mapped[Proposal] = relationship(back_populates="dna_records")


# ---------------------------------------------------------------------------
# Decisions
# ---------------------------------------------------------------------------

class DecisionAction(Base):
    __tablename__ = "decision_actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), index=True)
    action: Mapped[str] = mapped_column(String(64))  # APPROVED, RETURNED, REJECTED, SUBMITTED
    previous_status: Mapped[str] = mapped_column(String(64))
    new_status: Mapped[str] = mapped_column(String(64))
    officer_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    officer_name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    proposal: Mapped[Proposal] = relationship(back_populates="decisions")


# ---------------------------------------------------------------------------
# Implementation
# ---------------------------------------------------------------------------

class ImplementationRecord(Base):
    __tablename__ = "implementation_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), unique=True)
    status: Mapped[str] = mapped_column(String(64), default="NOT_STARTED")
    planned_start: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    planned_end: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    actual_start: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    actual_end: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    planned_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    planned_quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    delivered_quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    responsible_unit: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    issues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    proposal: Mapped[Proposal] = relationship(back_populates="implementation")
    updates: Mapped[list["ImplementationUpdate"]] = relationship(back_populates="record", cascade="all, delete-orphan")


class ImplementationUpdate(Base):
    __tablename__ = "implementation_updates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    record_id: Mapped[str] = mapped_column(ForeignKey("implementation_records.id"), index=True)
    update_type: Mapped[str] = mapped_column(String(64), default="PROGRESS")
    note: Mapped[str] = mapped_column(Text, default="")
    updated_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    record: Mapped[ImplementationRecord] = relationship(back_populates="updates")


# ---------------------------------------------------------------------------
# Outcomes and Lessons
# ---------------------------------------------------------------------------

class OutcomeRecord(Base):
    __tablename__ = "outcome_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), unique=True)
    outcome_status: Mapped[str] = mapped_column(String(64), default="PENDING")
    actual_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_duration: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    success_metrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    implementation_issues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    benefits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    failures: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    proposal: Mapped[Proposal] = relationship(back_populates="outcome")
    lessons: Mapped[list["LessonRecord"]] = relationship(back_populates="outcome", cascade="all, delete-orphan")


class LessonRecord(Base):
    __tablename__ = "lesson_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    outcome_id: Mapped[str] = mapped_column(ForeignKey("outcome_records.id"), index=True)
    proposal_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(512))
    lesson_text: Mapped[str] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    confirmed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    indexed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    outcome: Mapped[OutcomeRecord] = relationship(back_populates="lessons")


# ---------------------------------------------------------------------------
# GeM workspace
# ---------------------------------------------------------------------------

class GeMSearch(Base):
    __tablename__ = "gem_searches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    product: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    keywords: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    delivery_location: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    technical_params: Mapped[dict] = mapped_column(JSON, default=dict)
    results: Mapped[list] = mapped_column(JSON, default=list)
    searched_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class GeMReference(Base):
    __tablename__ = "gem_references"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(ForeignKey("proposals.id"), index=True)
    reference_type: Mapped[str] = mapped_column(String(64), default="BID")  # BID, ORDER, SEARCH
    reference_number: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    officer: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    proposal: Mapped[Proposal] = relationship(back_populates="gem_references")


# ---------------------------------------------------------------------------
# Audit trail
# ---------------------------------------------------------------------------

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    actor_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    actor_name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    object_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    object_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    old_value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    new_value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result: Mapped[str] = mapped_column(String(32), default="SUCCESS")
    request_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ---------------------------------------------------------------------------
# Processing jobs
# ---------------------------------------------------------------------------

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    job_type: Mapped[str] = mapped_column(String(64), index=True)
    object_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="QUEUED")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
