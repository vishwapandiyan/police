"""Keyword retrieval over the isolated synthetic FAISS metadata pickle.

Embeddings are not loaded in the API process (PyTorch/SentenceTransformers
can crash under Python 3.14 / some Windows setups). The index is still
built offline with e5 + FAISS.
"""

from __future__ import annotations

import json
import pickle
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from .settings import DEMO_INDEX_DIR, SYNTHETIC_LABEL


@lru_cache
def demo_manifest() -> dict[str, Any] | None:
    path = DEMO_INDEX_DIR / "manifest.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache
def load_demo_chunks() -> list[dict[str, Any]]:
    meta_path = DEMO_INDEX_DIR / "index_metadata.pkl"
    if not meta_path.exists():
        return []
    with meta_path.open("rb") as handle:
        payload = pickle.load(handle)
    if isinstance(payload, dict):
        return list(payload.get("chunks") or [])
    return []


def expand_query_terms(question: str) -> list[str]:
    text = (question or "").lower()
    terms = [t for t in text.replace("?", " ").split() if len(t) > 3]
    extras: list[str] = []
    mapping = [
        (("cctv", "camera", "surveillance"), ["cctv", "camera", "surveillance", "pilot", "expansion", "nvr"]),
        (("expan",), ["expansion", "expand", "deferred", "overlap", "pilot"]),
        (("similar", "precedent", "historical"), ["proposal", "precedent", "similar", "related"]),
        (("budget", "cost", "price"), ["budget", "inr", "cost", "comparison"]),
        (("defer",), ["deferred", "budget", "constraint"]),
        (("train",), ["training", "evidence", "workshop"]),
        (("tender", "bidder", "vendor", "procurement"), ["tender", "vendor", "procurement", "quotation"]),
        (("policy", "sop", "order"), ["policy", "guideline", "sop", "procurement"]),
        (("radio", "handset"), ["radio", "handset", "communication"]),
        (("spec", "resolution", "warranty"), ["specification", "resolution", "warranty", "1080p"]),
    ]
    for keys, add in mapping:
        if any(k in text for k in keys):
            extras.extend(add)
    return list(dict.fromkeys(terms + extras))


def search_demo_index(question: str, top_k: int = 5, document_types: list[str] | None = None) -> list[dict[str, Any]]:
    chunks = load_demo_chunks()
    terms = expand_query_terms(question)
    scored = []
    for chunk in chunks:
        dtype = str(chunk.get("document_type") or "").upper()
        if document_types and dtype not in {d.upper() for d in document_types}:
            continue
        hay = " ".join(
            [
                (chunk.get("text") or ""),
                str(chunk.get("proposal_id") or ""),
                str(chunk.get("document_id") or ""),
                " ".join(chunk.get("keywords") or []),
                dtype,
            ]
        ).lower()
        score = sum(1 for term in terms if term in hay)
        if score:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    results = []
    for rank, (score, chunk) in enumerate(scored[:top_k], start=1):
        results.append(
            {
                "rank": rank,
                "score": float(score),
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "proposal_id": chunk.get("proposal_id"),
                "document_type": chunk.get("document_type"),
                "source_filename": chunk.get("source_filename"),
                "source_location": chunk.get("source_location"),
                "chunk_sequence": chunk.get("chunk_sequence"),
                "text": chunk.get("text"),
                "synthetic": True,
                "data_classification": chunk.get("data_classification") or SYNTHETIC_LABEL,
            }
        )
    return results


def _source_blob(items: list[dict[str, Any]]) -> str:
    return " ".join((i.get("text") or "") for i in items)


def _brief_item(proposal_id: str, items: list[dict[str, Any]]) -> str:
    blob = _source_blob(items).lower()
    title = "related record"
    for needle, label in [
        ("expansion", "CCTV expansion proposal"),
        ("pilot", "CCTV pilot") if "cctv" in blob else ("", ""),
        ("cost comparison", "cost comparison note"),
        ("parking", "parking-lot camera add-on"),
        ("training", "training proposal"),
        ("maintenance", "maintenance record"),
        ("asset", "asset register proposal"),
        ("radio", "radio handset proposal"),
        ("policy", "synthetic policy reference"),
    ]:
        if needle and needle in blob:
            title = label or title
            break
    if "pilot" in blob and "cctv" in blob:
        title = "CCTV pilot"

    status = ""
    if "deferred" in blob:
        status = " It was deferred in this demo scenario."
    elif "approved" in blob and "successful" in blob:
        status = " The demo record shows it as approved and later assessed as successful."
    elif "rejected" in blob:
        status = " The demo decision on file is rejected."
    elif "approved" in blob:
        status = " The demo decision on file is approved."

    money = ""
    found = re.search(r"INR\s*([\d,]+)", _source_blob(items), flags=re.IGNORECASE)
    if found:
        money = f" An illustrative figure of INR {found.group(1)} appears in the file."

    why = "It is on file because it matches the subject of your question."
    if "cctv" in blob and "expansion" in blob:
        why = "It is the expansion case itself, so it is the direct historical file to read first."
    elif "cctv" in blob and "pilot" in blob:
        why = "It is the earlier pilot that any expansion would be compared against."
    elif "comparison" in blob:
        why = "It sets out what must be checked before two CCTV budgets are compared."
    return f"{proposal_id} is a fictional {title}.{status}{money} {why}"


def answer_from_sources(question: str, sources: list[dict[str, Any]]) -> str:
    notice = (
        "Sir/Madam — this is a working brief from the synthetic demo files only. "
        "None of these are official government records.\n\n"
    )
    if not sources:
        return notice + (
            "I could not find a supporting file for that question, so I should not guess. "
            "Evidence is unavailable in the demo index."
        )

    by_proposal: dict[str, list[dict[str, Any]]] = {}
    for src in sources:
        by_proposal.setdefault(src.get("proposal_id") or "unknown", []).append(src)

    q = (question or "").strip()
    lines = [f"You asked: {q}", "", "Here is what I can put on the table from the retrieved files.", ""]
    for i, (proposal_id, items) in enumerate(by_proposal.items(), start=1):
        lines.append(f"{i}. {_brief_item(proposal_id, items)}")
    lines.append("")
    ql = q.lower()
    if "expan" in ql and "cctv" in ql:
        lines.append(
            "If you are reviewing a CCTV expansion, start with the pilot (SYN-PDY-CCTV-001), "
            "then the expansion file (SYN-PDY-CCTV-002), which was deferred in the demo. "
            "Do not treat the two budgets as like-for-like until scope, warranty, and installation align. "
            "PRISM-PY does not select a vendor."
        )
    elif "budget" in ql or "cost" in ql:
        lines.append(
            "On cost, I can only report illustrative amounts in the files. "
            "Confirm identical scope, quantity, warranty, and installation before comparing."
        )
    else:
        lines.append("I can walk through any of these files in more detail if you want the next page.")
    lines.append("")
    lines.append("Please treat every figure and outcome here as demo data.")
    return notice + "\n".join(lines)


def demo_index_ready() -> bool:
    return bool(load_demo_chunks())
