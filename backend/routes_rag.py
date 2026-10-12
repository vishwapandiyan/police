"""PRISM-PY Native RAG Routes (Consolidated into FastAPI).

Directly executes the RAG retrieval, DNA extraction, and Decision Brief
within the single FastAPI process (port 5001) without requiring any external
Flask service or network proxy.

Architecture:
    React UI  →  FastAPI /api/v1/rag/*  →  Direct In-Memory RAG Engine
                 (auth, audit, RBAC)        (retriever, DNA, brief)
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth_v1 import audit, get_current_user
from .database import get_db
from .extract import extract_text
from .models import DecisionBriefRecord, Document, ProposalAnalysis
from .models_v1 import Proposal, ProposalDocument, User
from .retrieval import (
    answer_from_sources,
    demo_index_ready,
    demo_manifest,
    load_demo_chunks,
    search_demo_index,
)
from .services import analyze_proposal, generate_brief, list_documents, save_upload
from .settings import SYNTHETIC_LABEL, UPLOAD_DIR, get_settings

router = APIRouter(prefix="/api/v1/rag", tags=["rag"])
logger = logging.getLogger("prism.rag")


# ── Health check ────────────────────────────────────────────

@router.get("/health")
def rag_health():
    """Check whether the native RAG engine is ready."""
    ready = demo_index_ready()
    return {
        "status": "online" if ready else "degraded",
        "service": "PRISM-PY Native FastAPI RAG Engine",
        "demo_index_ready": ready,
        "manifest": demo_manifest(),
        "timestamp": datetime.now().isoformat(),
    }


# ── Query → Retrieve → Answer ───────────────────────────────

class QueryRequest(BaseModel):
    question: str = ""
    query: str = ""
    mode: str = "document_grounded"
    top_k: int = 5


@router.post("/query")
def rag_query(
    body: QueryRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Natural-language query over the synthetic RAG corpus."""
    question = body.question or body.query
    if not question:
        raise HTTPException(status_code=400, detail="No question provided")
    if not demo_index_ready():
        raise HTTPException(status_code=404, detail="Demo index missing.")

    audit(db, "RAG_QUERY", actor=user, detail=question[:120])
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


# ── Demo dataset search ─────────────────────────────────────

class DemoSearchRequest(BaseModel):
    question: str = ""
    query: str = ""
    top_k: int = 8


@router.post("/demo/search")
def rag_demo_search(
    body: DemoSearchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Direct keyword search over the synthetic demo index."""
    question = body.question or body.query
    if not question:
        raise HTTPException(status_code=400, detail="No question provided")
    if not demo_index_ready():
        raise HTTPException(status_code=404, detail="Demo index missing.")

    audit(db, "RAG_DEMO_SEARCH", actor=user, detail=question[:120])
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


@router.get("/demo/status")
def rag_demo_status(user: User = Depends(get_current_user)):
    """Check whether the synthetic demo index is built and ready."""
    manifest = demo_manifest()
    if manifest is None:
        raise HTTPException(status_code=404, detail="Demo index manifest not found.")
    return {"success": True, "manifest": manifest, "chunks_loaded": demo_index_ready()}


# ── Proposal DNA extraction ─────────────────────────────────

class AnalyzeRequest(BaseModel):
    documents: str = ""
    proposal_id: Optional[str] = None


@router.post("/analyze")
def rag_analyze(
    body: AnalyzeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extract structured Proposal DNA from raw text or a stored document."""
    if not body.documents and not body.proposal_id:
        raise HTTPException(status_code=400, detail="No documents or proposal_id provided")

    audit(db, "RAG_DNA_EXTRACT", actor=user, detail=f"doc={body.proposal_id or 'inline'}")
    return analyze_proposal(db, body.documents, body.proposal_id)


# ── Decision brief generation ───────────────────────────────

class BriefRequest(BaseModel):
    documents: str = ""
    proposal_id: Optional[str] = None
    top_k: int = 5


@router.post("/brief")
def rag_brief(
    body: BriefRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a Decision Intelligence Brief using native RAG."""
    if not body.documents and not body.proposal_id:
        raise HTTPException(status_code=400, detail="Provide either documents or proposal_id")

    audit(db, "RAG_BRIEF_GENERATED", actor=user, detail=f"proposal={body.proposal_id or 'inline'}")
    return generate_brief(db, body.documents, body.proposal_id, top_k=body.top_k)


# ── Precedent search ────────────────────────────────────────

class PrecedentRequest(BaseModel):
    query: str
    jurisdiction: str = "all"
    domain: Optional[str] = None
    date_range: Optional[Any] = None
    top_k: int = 10


@router.post("/precedents/search")
def rag_precedent_search(
    body: PrecedentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search for historical precedents using the native index."""
    if not body.query:
        raise HTTPException(status_code=400, detail="No query provided")

    audit(db, "RAG_PRECEDENT_SEARCHED", actor=user, detail=body.query[:120])
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
        "filters": {
            "jurisdiction": body.jurisdiction,
            "domain": body.domain,
            "date_range": body.date_range,
        },
        "precedents": precedents,
        "total_found": len(precedents),
        "data_classification": SYNTHETIC_LABEL,
        "timestamp": datetime.now().isoformat(),
    }


# ── Per-proposal RAG intelligence ──────────────────────────

@router.post("/proposals/{proposal_id}/analyze")
def rag_analyze_proposal(
    proposal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run Proposal DNA extraction for a stored database proposal."""
    p = db.get(Proposal, proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")

    parts = [
        f"Title: {p.title or ''}",
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
    pdocs = db.scalars(
        select(ProposalDocument).where(ProposalDocument.proposal_id == proposal_id)
    ).all()
    for pdoc in pdocs:
        if pdoc.document_id:
            doc = db.get(Document, pdoc.document_id)
            if doc and doc.content:
                parts.append(doc.content[:3000])

    text = "\n".join(parts)
    audit(db, "RAG_PROPOSAL_ANALYZED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return analyze_proposal(db, text, proposal_id)


@router.post("/proposals/{proposal_id}/brief")
def rag_proposal_brief(
    proposal_id: str,
    body: dict = Body(default={}),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a Decision Intelligence Brief for a stored database proposal."""
    p = db.get(Proposal, proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")

    parts = [
        f"Title: {p.title or ''}",
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
    pdocs = db.scalars(
        select(ProposalDocument).where(ProposalDocument.proposal_id == proposal_id)
    ).all()
    for pdoc in pdocs:
        if pdoc.document_id:
            doc = db.get(Document, pdoc.document_id)
            if doc and doc.content:
                parts.append(doc.content[:3000])

    text = "\n".join(parts)
    top_k = body.get("top_k", 5)
    audit(db, "RAG_BRIEF_GENERATED", actor=user, object_type="PROPOSAL", object_id=proposal_id)
    return generate_brief(db, text, proposal_id, top_k=top_k)


# ── File upload → Extraction ───────────────────────────────

@router.post("/upload")
async def rag_upload(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Directly uploads and extracts document into database."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")
    raw = await file.read()
    limit = get_settings().max_upload_mb * 1024 * 1024
    if len(raw) > limit:
        raise HTTPException(status_code=413, detail=f"File exceeds {get_settings().max_upload_mb} MB")

    import uuid
    safe_name = Path(file.filename).name
    tmp = UPLOAD_DIR / f"tmp_{uuid.uuid4()}_{safe_name}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    tmp.write_bytes(raw)
    try:
        text, detected = extract_text(tmp, raw)
    finally:
        tmp.unlink(missing_ok=True)

    if not text.strip():
        raise HTTPException(status_code=400, detail=f"Could not extract text from {safe_name}")

    doc = save_upload(db, safe_name, raw, text, detected)
    audit(db, "RAG_DOCUMENT_UPLOADED", actor=user, detail=f"file={file.filename}")
    return {
        "success": True,
        "document_id": doc.id,
        "filename": doc.filename,
        "size": doc.size,
        "detected": detected,
        "characters": len(text),
        "message": "File uploaded successfully",
    }


# ── Detailed RAG pipeline status ───────────────────────────

@router.get("/status")
def rag_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch status and database statistics directly."""
    return {
        "success": True,
        "components": {
            "retriever": demo_index_ready(),
            "dna_extractor": True,
            "brief_generator": True,
            "native_fastapi": True,
        },
        "stats": {
            "documents_processed": len(db.scalars(select(Document.id)).all()),
            "analyses": len(db.scalars(select(ProposalAnalysis.id)).all()),
            "briefs": len(db.scalars(select(DecisionBriefRecord.id)).all()),
        },
    }


# ── Precedent comparison ───────────────────────────────────

class PrecedentCompareRequest(BaseModel):
    precedent_ids: list[str]


@router.post("/precedents/compare")
def rag_precedent_compare(
    body: PrecedentCompareRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compare multiple precedents side-by-side."""
    if len(body.precedent_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 precedent IDs")

    audit(db, "RAG_PRECEDENT_COMPARE", actor=user, detail=f"ids={','.join(body.precedent_ids[:5])}")
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
        "comparison": {
            "precedents": rows,
            "note": "Compare scope, quantity, warranty, installation before comparing INR.",
        },
        "data_classification": SYNTHETIC_LABEL,
    }


# ── Document Library ───────────────────────────────────────

@router.get("/documents")
def rag_list_documents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all documents stored in the database."""
    docs = list_documents(db)
    return {"success": True, "documents": docs, "total": len(docs), "timestamp": datetime.now().isoformat()}


@router.get("/documents/{doc_id}")
def rag_get_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get stored document details."""
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    analyses = db.scalars(
        select(ProposalAnalysis).where(ProposalAnalysis.document_id == doc_id).order_by(ProposalAnalysis.created_at.desc())
    ).all()
    return {
        "success": True,
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "size": doc.size,
            "uploaded_at": doc.created_at.isoformat() if doc.created_at else None,
            "detected_type": doc.detected_type,
            "analyses": [a.id for a in analyses],
        },
    }


@router.get("/documents/{doc_id}/status")
def rag_get_document_status(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get processing status for a specific document."""
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "success": True,
        "document_id": doc_id,
        "status": "completed",
        "stage": "extracted",
        "progress_percentage": 100,
    }


@router.get("/documents/{doc_id}/chunks")
def rag_get_document_chunks(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get text excerpt chunks for a document."""
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    text = doc.content or ""
    chunk_size = 800
    chunks = [
        {"id": f"{doc_id}_chunk_{i}", "text": text[i : i + chunk_size], "sequence": idx + 1}
        for idx, i in enumerate(range(0, min(len(text), 4000), chunk_size))
    ]
    return {
        "success": True,
        "document_id": doc_id,
        "chunks": chunks,
        "total_chunks": len(chunks),
    }
