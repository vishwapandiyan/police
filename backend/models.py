"""SQLite tables for uploads, analyses, and labelled reference data."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    filename: Mapped[str] = mapped_column(String(512))
    filepath: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    content: Mapped[str] = mapped_column(Text, default="")
    size: Mapped[int] = mapped_column(Integer, default=0)
    mime_detected: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    extra: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    analyses: Mapped[list["ProposalAnalysis"]] = relationship(back_populates="document")


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    what_is_needed: Mapped[str] = mapped_column(Text)
    quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    equipment_class: Mapped[str] = mapped_column(String(64), default="other")
    document_id: Mapped[Optional[str]] = mapped_column(ForeignKey("documents.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ProposalAnalysis(Base):
    __tablename__ = "proposal_analyses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(String(128), index=True)
    document_id: Mapped[Optional[str]] = mapped_column(ForeignKey("documents.id"), nullable=True)
    dna: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0)
    filled_fields: Mapped[list] = mapped_column(JSON, default=list)
    missing_fields: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    document: Mapped[Optional[Document]] = relationship(back_populates="analyses")


class DecisionBriefRecord(Base):
    __tablename__ = "decision_briefs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    executive_summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ProcessingStatus(Base):
    __tablename__ = "processing_status"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[str] = mapped_column(String(32), default="processing")
    stage: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    started_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    completed_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class EquipmentCategory(Base):
    __tablename__ = "equipment_categories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text, default="")
    comparison_points: Mapped[list] = mapped_column(JSON, default=list)
    evaluation_points: Mapped[list] = mapped_column(JSON, default=list)
    synthetic: Mapped[bool] = mapped_column(default=True)


class EquipmentModel(Base):
    __tablename__ = "equipment_models"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("equipment_categories.id"))
    category_name: Mapped[str] = mapped_column(String(128))
    specs: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    notes: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(64), default="synthetic_catalogue")
    synthetic: Mapped[bool] = mapped_column(default=True)


class SpecChecklistItem(Base):
    __tablename__ = "spec_checklist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[str] = mapped_column(String(64), index=True)
    field_key: Mapped[str] = mapped_column(String(64))
    label: Mapped[str] = mapped_column(String(256))
    why_it_matters: Mapped[str] = mapped_column(Text, default="")
    aliases: Mapped[list] = mapped_column(JSON, default=list)


class HistoricalTender(Base):
    __tablename__ = "historical_tenders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(512))
    equipment_class: Mapped[str] = mapped_column(String(64), index=True)
    procurement_type: Mapped[str] = mapped_column(String(128))
    quantity: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    indicative_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    decision_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    specification_summary: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    synthetic: Mapped[bool] = mapped_column(default=True)
    bidders: Mapped[list["TenderBidder"]] = relationship(back_populates="tender")


class TenderBidder(Base):
    __tablename__ = "tender_bidders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tender_id: Mapped[str] = mapped_column(ForeignKey("historical_tenders.id"))
    display_name: Mapped[str] = mapped_column(String(256))
    quoted_amount_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    result: Mapped[str] = mapped_column(String(64), default="participated")
    synthetic: Mapped[bool] = mapped_column(default=True)
    tender: Mapped[HistoricalTender] = relationship(back_populates="bidders")


class PolicyRecord(Base):
    __tablename__ = "policy_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(512))
    record_type: Mapped[str] = mapped_column(String(64))
    issuer: Mapped[str] = mapped_column(String(256), default="Demo training corpus")
    excerpt: Mapped[str] = mapped_column(Text, default="")
    effective_status: Mapped[str] = mapped_column(String(128), default="training_reference_only")
    validity_warning: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    synthetic: Mapped[bool] = mapped_column(default=True)
    official: Mapped[bool] = mapped_column(default=False)
