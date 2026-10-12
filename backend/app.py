"""PRISM-PY FastAPI application.

Routes keep the same paths and JSON shapes as the Flask demo
(``main_complete.py``) so ``streamlit_app_enhanced.py`` works unchanged, and
add the requirement-driven intelligence endpoints (specification,
justification, procurement history, equipment catalogue, policy, outcomes).

Hard rule: no endpoint ranks, shortlists, or recommends a vendor for award.
"""

from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import __version__
from .auth import require_bearer
from .database import Base, engine, get_db, session_scope
from .extract import extract_text
from .intelligence import (
    classify_requirement,
    equipment_intelligence,
    intelligence_pack,
    justification_assistant,
    outcome_risk_intelligence,
    policy_search,
    procurement_intelligence,
    specification_intelligence,
)
from .models import DecisionBriefRecord, Document, ProcessingStatus, ProposalAnalysis, Requirement
from .models_v1 import (  # ensure v1 tables are created
    AuditEvent, DecisionAction, GeMReference, GeMSearch, ImplementationRecord,
    ImplementationUpdate, LessonRecord, OutcomeRecord, PoliceStation,
    Proposal, ProposalDNARecord, ProposalDocument, Session as UserSession, User,
    ProcessingJob,
)
from .retrieval import answer_from_sources, demo_index_ready, demo_manifest, search_demo_index
from .seed import seed_reference_data
from .seed_v1 import seed_proposals_v1
from .auth_v1 import seed_demo_users
from .routes_v1 import router as v1_router
from .services import analyze_proposal, generate_brief, list_documents, save_requirement, save_upload
from .settings import SYNTHETIC_LABEL, UPLOAD_DIR, VENDOR_NOTICE, get_settings

logger = logging.getLogger("prism.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=get_settings().log_level)
    Base.metadata.create_all(engine)
    with session_scope() as db:
        seed_reference_data(db)
        seed_demo_users(db)
        seed_proposals_v1(db)
    logger.info("PRISM-PY API %s ready (sqlite=%s)", __version__, get_settings().sqlite_url)
    yield


app = FastAPI(
    title="PRISM-PY API",
    version=__version__,
    description="Police proposal intelligence backend. Synthetic demo corpus; no vendor award.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount v1 routes
app.include_router(v1_router)


@app.exception_handler(Exception)
async def _unhandled(_request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"success": False, "error": "Internal server error"})


def _fail(status_code: int, error: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": False, "error": error})


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class AnalyzeRequest(BaseModel):
    documents: str = ""
    proposal_id: Optional[str] = None


class BriefRequest(BaseModel):
    documents: str = ""
    proposal_id: Optional[str] = None
    top_k: int = 5


class QueryRequest(BaseModel):
    question: str = ""
    query: str = ""
    mode: str = "document_grounded"
    top_k: int = 5


class PrecedentSearchRequest(BaseModel):
    query: str = ""
    jurisdiction: str = "all"
    domain: Optional[str] = None
    date_range: Optional[Any] = None
    top_k: int = 10


class CompareRequest(BaseModel):
    precedent_ids: list[str] = Field(default_factory=list)


class RequirementRequest(BaseModel):
    """Officer requirement. Free text is enough; the class is detected if omitted."""

    what_is_needed: str = ""
    query: str = ""
    quantity: Optional[str] = None
    location: Optional[str] = None
    purpose: Optional[str] = None
    equipment_class: Optional[str] = None
    document_id: Optional[str] = None
    document_text: Optional[str] = None
    requirement_id: Optional[str] = None
    persist: bool = False


# ---------------------------------------------------------------------------
# Health / status
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "service": "PRISM-PY FastAPI",
        "version": __version__,
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "dna_extraction": "/prism/analyze-proposal",
            "decision_brief": "/prism/decision-brief",
            "query": "/api/query",
            "precedents": "/api/precedents/search",
            "documents": "/api/documents",
            "status": "/api/documents/{id}/status",
            "requirements": "/api/requirements",
            "intelligence": "/api/intelligence/{specification|justification|procurement|equipment|policy|outcomes|pack}",
        },
        "vendor_policy": VENDOR_NOTICE,
    }


@app.get("/api/status")
def api_status(db: Session = Depends(get_db)) -> dict[str, Any]:
    active = db.scalar(
        select(ProcessingStatus).where(ProcessingStatus.status == "processing").limit(1)
    )
    return {
        "success": True,
        "components": {
            "retriever": demo_index_ready(),
            "dna_extractor": True,
            "brief_generator": True,
            "sqlite": True,
        },
        "stats": {
            "documents_processed": len(db.scalars(select(Document.id)).all()),
            "analyses": len(db.scalars(select(ProposalAnalysis.id)).all()),
            "briefs": len(db.scalars(select(DecisionBriefRecord.id)).all()),
            "requirements": len(db.scalars(select(Requirement.id)).all()),
            "active_processing": 1 if active else 0,
        },
    }


# ---------------------------------------------------------------------------
# Pipeline 1: upload -> DNA -> brief
# ---------------------------------------------------------------------------


@app.post("/api/upload")
async def upload(
    file: UploadFile = File(...),
    _: str = Depends(require_bearer),
    db: Session = Depends(get_db),
):
    if not file.filename:
        return _fail(400, "Empty filename")
    raw = await file.read()
    limit = get_settings().max_upload_mb * 1024 * 1024
    if len(raw) > limit:
        return _fail(413, f"File exceeds {get_settings().max_upload_mb} MB")
    safe_name = Path(file.filename).name
    tmp = UPLOAD_DIR / f"tmp_{uuid.uuid4()}_{safe_name}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    tmp.write_bytes(raw)
    try:
        text, detected = extract_text(tmp, raw)
    finally:
        tmp.unlink(missing_ok=True)
    if not text.strip():
        return _fail(400, f"Could not extract text from {safe_name} (detected {detected})")
    doc = save_upload(db, safe_name, raw, text, detected)
    return {
        "success": True,
        "document_id": doc.id,
        "filename": doc.filename,
        "size": doc.size,
        "detected": detected,
        "characters": len(text),
        "message": "File uploaded successfully",
    }


@app.post("/prism/analyze-proposal")
def analyze(body: AnalyzeRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    if not body.documents and not body.proposal_id:
        return _fail(400, "No documents provided")
    return analyze_proposal(db, body.documents, body.proposal_id)


@app.post("/prism/decision-brief")
def decision_brief(body: BriefRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    if not body.documents and not body.proposal_id:
        return _fail(400, "Provide either documents or proposal_id")
    return generate_brief(db, body.documents, body.proposal_id, top_k=body.top_k)


# ---------------------------------------------------------------------------
# Pipeline 2: question -> retrieve -> answer (synthetic index only)
# ---------------------------------------------------------------------------


@app.get("/api/demo/status")
def demo_status():
    manifest = demo_manifest()
    if manifest is None:
        return _fail(404, "Demo index not built. Run manage_synthetic.py build")
    return {"success": True, "manifest": manifest, "chunks_loaded": demo_index_ready()}


@app.post("/api/demo/search")
def demo_search(body: QueryRequest, _: str = Depends(require_bearer)):
    question = body.question or body.query
    if not question:
        return _fail(400, "No question provided")
    if not demo_index_ready():
        return _fail(404, "Demo index missing. Run python manage_synthetic.py build")
    sources = search_demo_index(question, top_k=body.top_k)
    return {
        "success": True,
        "question": question,
        "answer": answer_from_sources(question, sources),
        "sources": sources,
        "retrieved_count": len(sources),
        "synthetic_only": True,
        "data_classification": SYNTHETIC_LABEL,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/query")
def query(body: QueryRequest, _: str = Depends(require_bearer)):
    question = body.question or body.query
    if not question:
        return _fail(400, "No question provided")
    if not demo_index_ready():
        return _fail(404, "Demo index missing. Run python manage_synthetic.py build")
    sources = search_demo_index(question, top_k=body.top_k)
    return {
        "success": True,
        "question": question,
        "mode": body.mode,
        "answer": answer_from_sources(question, sources),
        "sources": sources,
        "citations": [s.get("chunk_id") for s in sources if s.get("chunk_id")],
        "retrieved_count": len(sources),
        "synthetic_only": True,
        "data_classification": SYNTHETIC_LABEL,
        "timestamp": datetime.now().isoformat(),
    }


# ---------------------------------------------------------------------------
# Pipeline 3: search -> compare
# ---------------------------------------------------------------------------


@app.post("/api/precedents/search")
def precedents_search(body: PrecedentSearchRequest, _: str = Depends(require_bearer)):
    if not body.query:
        return _fail(400, "No query provided")
    sources = search_demo_index(body.query, top_k=body.top_k)
    precedents = [
        {
            "id": src.get("chunk_id") or f"prec_{i}",
            "title": src.get("proposal_id") or f"Similar Proposal {i}",
            "match_score": src.get("score", 0),
            "jurisdiction": body.jurisdiction,
            "domain": src.get("document_type") or "Unknown",
            "summary": (src.get("text") or "")[:200],
            "source": src,
            "synthetic": True,
        }
        for i, src in enumerate(sources, start=1)
    ]
    return {
        "success": True,
        "query": body.query,
        "filters": {"jurisdiction": body.jurisdiction, "domain": body.domain, "date_range": body.date_range},
        "precedents": precedents,
        "total_found": len(precedents),
        "data_classification": SYNTHETIC_LABEL,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/precedents/compare")
def precedents_compare(body: CompareRequest, _: str = Depends(require_bearer)):
    """Side-by-side of retrieved chunks by chunk id. No invented figures."""
    if len(body.precedent_ids) < 2:
        return _fail(400, "Provide at least 2 precedent IDs")
    from .retrieval import load_demo_chunks

    by_id = {c.get("chunk_id"): c for c in load_demo_chunks()}
    rows = []
    for pid in body.precedent_ids:
        chunk = by_id.get(pid)
        rows.append(
            {
                "id": pid,
                "found": chunk is not None,
                "proposal_id": (chunk or {}).get("proposal_id"),
                "document_type": (chunk or {}).get("document_type"),
                "excerpt": ((chunk or {}).get("text") or "")[:400] or "not in file",
                "synthetic": True,
            }
        )
    return {
        "success": True,
        "comparison": {"precedents": rows, "note": "Compare scope, quantity, warranty, installation before comparing INR."},
        "data_classification": SYNTHETIC_LABEL,
    }


# ---------------------------------------------------------------------------
# Document library
# ---------------------------------------------------------------------------


@app.get("/api/documents")
def documents(_: str = Depends(require_bearer), db: Session = Depends(get_db)):
    docs = list_documents(db)
    return {"success": True, "documents": docs, "total": len(docs), "timestamp": datetime.now().isoformat()}


@app.get("/api/documents/{doc_id}")
def document(doc_id: str, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    doc = db.get(Document, doc_id)
    if doc is None:
        return _fail(404, "Document not found")
    analyses = db.scalars(
        select(ProposalAnalysis).where(ProposalAnalysis.document_id == doc_id).order_by(ProposalAnalysis.created_at.desc())
    ).all()
    return {
        "success": True,
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "size": doc.size,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "content": doc.content,
            "analyses": [
                {"id": a.id, "proposal_id": a.proposal_id, "completeness_score": a.completeness_score, "dna": a.dna}
                for a in analyses
            ],
        },
    }


@app.get("/api/documents/{doc_id}/status")
def document_status(doc_id: str, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    row = db.get(ProcessingStatus, doc_id)
    if row is None:
        return _fail(404, "Status not found")
    return {
        "success": True,
        "document_id": doc_id,
        "status": row.status,
        "stage": row.stage,
        "started_at": row.started_at,
        "completed_at": row.completed_at,
        "progress_percentage": 100 if row.status == "completed" else 50,
    }


@app.get("/api/briefs")
def briefs(_: str = Depends(require_bearer), db: Session = Depends(get_db)):
    rows = db.scalars(select(DecisionBriefRecord).order_by(DecisionBriefRecord.created_at.desc()).limit(50)).all()
    return {
        "success": True,
        "briefs": [
            {"id": r.id, "proposal_id": r.proposal_id, "executive_summary": r.executive_summary, "created_at": r.created_at.isoformat()}
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# Requirement -> intelligence modules (no vendor award)
# ---------------------------------------------------------------------------


def _requirement_payload(body: RequirementRequest, db: Session) -> dict[str, Any]:
    payload = body.model_dump()
    if body.requirement_id:
        row = db.get(Requirement, body.requirement_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Requirement not found")
        for key in ("what_is_needed", "quantity", "location", "purpose", "equipment_class", "document_id"):
            if not payload.get(key):
                payload[key] = getattr(row, key)
    if payload.get("document_id") and not payload.get("document_text"):
        doc = db.get(Document, payload["document_id"])
        if doc:
            payload["document_text"] = doc.content
    if not (payload.get("what_is_needed") or payload.get("query") or payload.get("document_text")):
        raise HTTPException(status_code=400, detail="Describe what is needed (what_is_needed) or supply a document_id")
    payload["equipment_class"] = classify_requirement(payload)
    return payload


@app.post("/api/requirements")
def create_requirement(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    payload = _requirement_payload(body, db)
    row = save_requirement(db, payload)
    return {
        "success": True,
        "requirement_id": row.id,
        "equipment_class": row.equipment_class,
        "requirement": {
            "what_is_needed": row.what_is_needed,
            "quantity": row.quantity,
            "location": row.location,
            "purpose": row.purpose,
            "document_id": row.document_id,
        },
    }


@app.get("/api/requirements")
def list_requirements(_: str = Depends(require_bearer), db: Session = Depends(get_db)):
    rows = db.scalars(select(Requirement).order_by(Requirement.created_at.desc()).limit(100)).all()
    return {
        "success": True,
        "requirements": [
            {
                "id": r.id,
                "what_is_needed": r.what_is_needed,
                "quantity": r.quantity,
                "location": r.location,
                "purpose": r.purpose,
                "equipment_class": r.equipment_class,
                "document_id": r.document_id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


@app.post("/api/intelligence/specification")
def spec_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    return specification_intelligence(db, _requirement_payload(body, db))


@app.post("/api/intelligence/justification")
def justification_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    return justification_assistant(_requirement_payload(body, db))


@app.post("/api/intelligence/procurement")
def procurement_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    return procurement_intelligence(db, _requirement_payload(body, db))


@app.post("/api/intelligence/equipment")
def equipment_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    return equipment_intelligence(db, _requirement_payload(body, db))


@app.post("/api/intelligence/policy")
def policy_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    return policy_search(db, _requirement_payload(body, db))


@app.post("/api/intelligence/outcomes")
def outcomes_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    return outcome_risk_intelligence(_requirement_payload(body, db))


@app.post("/api/intelligence/pack")
def pack_intel(body: RequirementRequest, _: str = Depends(require_bearer), db: Session = Depends(get_db)):
    payload = _requirement_payload(body, db)
    result = intelligence_pack(db, payload)
    if body.persist:
        row = save_requirement(db, payload)
        result["requirement_id"] = row.id
    return result


@app.get("/api/catalogue")
def catalogue(_: str = Depends(require_bearer), db: Session = Depends(get_db)):
    """Labelled reference data loaded into SQLite (all synthetic unless official=True)."""
    from .models import EquipmentCategory, EquipmentModel, HistoricalTender, PolicyRecord

    return {
        "success": True,
        "categories": [
            {"id": c.id, "name": c.name, "comparison_points": c.comparison_points, "evaluation_points": c.evaluation_points}
            for c in db.scalars(select(EquipmentCategory)).all()
        ],
        "models": [
            {"id": m.id, "category_id": m.category_id, "category_name": m.category_name, "specs": m.specs, "source": m.source}
            for m in db.scalars(select(EquipmentModel)).all()
        ],
        "tenders": [
            {"id": t.id, "title": t.title, "equipment_class": t.equipment_class, "procurement_type": t.procurement_type, "year": t.year}
            for t in db.scalars(select(HistoricalTender)).all()
        ],
        "policies": [
            {"id": p.id, "title": p.title, "official": p.official, "effective_status": p.effective_status}
            for p in db.scalars(select(PolicyRecord)).all()
        ],
        "notice": VENDOR_NOTICE,
        "data_classification": SYNTHETIC_LABEL,
    }
