"""Document persistence, DNA, and decision-brief assembly."""

from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from .dna import extract_structured_dna, serialize_dna
from .models import DecisionBriefRecord, Document, ProcessingStatus, ProposalAnalysis, Requirement
from .retrieval import search_demo_index
from .settings import SYNTHETIC_LABEL, UPLOAD_DIR, VENDOR_NOTICE


def set_status(db: Session, key: str, status: str, stage: str) -> None:
    row = db.get(ProcessingStatus, key)
    now = datetime.now().isoformat()
    if row is None:
        row = ProcessingStatus(id=key, status=status, stage=stage, started_at=now)
        db.add(row)
        db.flush()
    else:
        row.status = status
        row.stage = stage
        if status == "completed":
            row.completed_at = now
        else:
            row.started_at = now


def resolve_document(db: Session, token: Optional[str]) -> Optional[Document]:
    if not token:
        return None
    doc = db.get(Document, token)
    if doc:
        return doc
    return db.scalar(select(Document).where(Document.filename == token).limit(1))


def save_upload(db: Session, filename: str, raw: bytes, text: str, detected: str | None) -> Document:
    doc_id = str(uuid.uuid4())
    dest = UPLOAD_DIR / f"{doc_id}_{Path(filename).name}"
    dest.write_bytes(raw)
    doc = Document(
        id=doc_id,
        filename=filename,
        filepath=str(dest),
        content=text,
        size=len(raw),
        mime_detected=detected,
    )
    db.add(doc)
    db.flush()
    return doc


def analyze_proposal(db: Session, documents: str, proposal_id: Optional[str]) -> dict[str, Any]:
    supplied_id = (proposal_id or "").strip() or None
    resolved = resolve_document(db, documents) or resolve_document(db, supplied_id)
    if resolved:
        document_id = resolved.id
        text = resolved.content or ""
        # Uploaded file: key everything by the stored document id unless the caller named it.
        proposal_id = supplied_id if supplied_id and supplied_id != resolved.filename else resolved.id
    else:
        proposal_id = supplied_id or str(uuid.uuid4())
        document_id = proposal_id
        text = documents or ""

    set_status(db, proposal_id, "processing", "dna_extraction")
    dna = extract_structured_dna(text, str(document_id), proposal_id)
    payload = serialize_dna(dna, proposal_id)
    analysis = ProposalAnalysis(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        document_id=resolved.id if resolved else None,
        dna=payload["proposal_dna"],
        completeness_score=payload["completeness_score"],
        filled_fields=payload["filled_fields"],
        missing_fields=payload["missing_fields"],
    )
    db.add(analysis)
    set_status(db, proposal_id, "completed", "dna_extraction")
    return payload


def generate_brief(db: Session, documents: str, proposal_id: Optional[str], top_k: int = 5) -> dict[str, Any]:
    proposal_id = proposal_id or str(uuid.uuid4())
    stored = db.scalar(
        select(ProposalAnalysis).where(ProposalAnalysis.proposal_id == proposal_id).limit(1)
    )
    doc = resolve_document(db, proposal_id) or resolve_document(db, documents)
    text = documents or ""
    if doc:
        text = doc.content or ""
        if not stored or stored.document_id != doc.id:
            stored = db.scalar(
                select(ProposalAnalysis)
                .where(ProposalAnalysis.document_id == doc.id)
                .order_by(ProposalAnalysis.created_at.desc())
                .limit(1)
            )
        proposal_id = (stored.proposal_id if stored else None) or doc.id
    dna_flat: dict[str, Any] = stored.dna if stored else {}
    if not dna_flat:
        dna_result = analyze_proposal(db, documents or (doc.id if doc else ""), proposal_id)
        dna_flat = dna_result.get("proposal_dna") or {}

    set_status(db, proposal_id, "processing", "brief_generation")
    query = " ".join(
        str(dna_flat.get(k) or "")
        for k in ("objective", "technology", "location", "domain")
    ) or text or proposal_id or "CCTV proposal budget training"
    sources = search_demo_index(query, top_k=top_k)

    from prism.generators.brief_generator import DecisionBriefGenerator
    from prism.llm import MockLLMProvider
    from prism.schemas.proposal_dna import ProposalDNA

    dna_obj = extract_structured_dna(text or query, proposal_id, proposal_id)
    precedents = [
        {
            "document_id": src.get("document_id"),
            "title": src.get("proposal_id") or src.get("document_id"),
            "document_title": src.get("proposal_id") or src.get("document_id"),
            "similarity_score": min(max(src.get("score", 0) / 10.0, 0.0), 1.0),
            "excerpt": (src.get("text") or "")[:400],
            "source_reference": src.get("chunk_id"),
            "match_reason": "Retrieved from the isolated synthetic demo index",
            "synthetic": True,
        }
        for src in sources
    ]
    generator = DecisionBriefGenerator(MockLLMProvider())
    brief_result = generator.generate_brief(proposal_dna=dna_obj, precedents=precedents)
    brief_payload = brief_result.model_dump(mode="json")
    brief_payload.update(
        {
            "precedents_count": len(brief_result.top_precedents or []),
            "review_signals_count": len(brief_result.review_signals or []),
            "high_priority_signals": len(brief_result.get_high_priority_signals()),
            "processing_time_seconds": brief_result.processing_time_seconds,
            "proposal_summary": brief_result.proposal_summary,
            "missing_information": brief_result.missing_information,
            "vendor_selection": "not_performed",
            "notice": VENDOR_NOTICE,
            "data_classification": SYNTHETIC_LABEL,
        }
    )
    executive = brief_result.to_executive_summary()
    row = DecisionBriefRecord(
        id=str(uuid.uuid4()),
        proposal_id=proposal_id,
        payload=brief_payload,
        executive_summary=executive,
    )
    db.add(row)
    set_status(db, proposal_id, "completed", "brief_generation")
    return {
        "success": True,
        "proposal_id": proposal_id,
        "brief": brief_payload,
        "executive_summary": executive,
        "timestamp": datetime.now().isoformat(),
        "notice": VENDOR_NOTICE,
    }


def list_documents(db: Session) -> list[dict[str, Any]]:
    rows = db.scalars(select(Document).order_by(Document.uploaded_at.desc())).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "size": d.size,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "content": d.content,
        }
        for d in rows
    ]


def save_requirement(db: Session, payload: dict[str, Any]) -> Requirement:
    row = Requirement(
        id=str(uuid.uuid4()),
        what_is_needed=payload.get("what_is_needed") or "",
        quantity=payload.get("quantity"),
        location=payload.get("location"),
        purpose=payload.get("purpose"),
        equipment_class=payload.get("equipment_class") or "other",
        document_id=payload.get("document_id"),
    )
    db.add(row)
    db.flush()
    return row
