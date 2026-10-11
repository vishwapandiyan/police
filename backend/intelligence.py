"""Specification, justification, procurement, equipment, and policy intelligence.

All historical figures are synthetic unless a future ingest marks official=True.
Vendor award is never recommended.
"""

from __future__ import annotations

import re
from statistics import median
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .classify import detect_equipment_class
from .models import EquipmentCategory, EquipmentModel, HistoricalTender, PolicyRecord, SpecChecklistItem
from .retrieval import search_demo_index
from .settings import SYNTHETIC_LABEL, VENDOR_NOTICE


def _excerpt(text: str, limit: int = 220) -> str:
    cleaned = " ".join((text or "").split())
    cleaned = cleaned.replace(SYNTHETIC_LABEL, "").strip(" -")
    if len(cleaned) > limit:
        cleaned = cleaned[: limit - 1].rsplit(" ", 1)[0] + "…"
    return cleaned


def _requirement_query(payload: dict[str, Any]) -> str:
    parts = [
        payload.get("what_is_needed") or payload.get("query") or "",
        str(payload.get("quantity") or ""),
        str(payload.get("location") or ""),
        str(payload.get("purpose") or ""),
        str(payload.get("equipment_class") or ""),
        str(payload.get("document_text") or "")[:1500],
    ]
    return " ".join(p for p in parts if p)


def classify_requirement(payload: dict[str, Any]) -> str:
    return detect_equipment_class(
        _requirement_query(payload),
        payload.get("equipment_class"),
    )


def specification_intelligence(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    equipment_class = classify_requirement(payload)
    items = db.scalars(
        select(SpecChecklistItem).where(SpecChecklistItem.category_id == equipment_class)
    ).all()
    blob = _requirement_query(payload).lower()
    document_text = (payload.get("document_text") or "") + " " + blob

    current: list[dict[str, Any]] = []
    for item in items:
        found = None
        for alias in item.aliases or []:
            match = re.search(rf"(.{{0,40}}{re.escape(alias)}.{{0,40}})", document_text, flags=re.I)
            if match:
                found = " ".join(match.group(1).split())
                break
        current.append(
            {
                "field": item.field_key,
                "label": item.label,
                "why_it_matters": item.why_it_matters,
                "in_this_request": found,
                "status": "stated" if found else "missing_from_request",
            }
        )

    prev_sources = search_demo_index(
        _requirement_query(payload) + " specification technical",
        top_k=6,
    )
    previous_specs = []
    for src in prev_sources:
        previous_specs.append(
            {
                "proposal_id": src.get("proposal_id"),
                "document_id": src.get("document_id"),
                "excerpt": _excerpt(src.get("text") or ""),
                "citation": src.get("chunk_id"),
                "synthetic": True,
            }
        )

    category = db.get(EquipmentCategory, equipment_class)
    missing = [c["label"] for c in current if c["status"] == "missing_from_request"]
    return {
        "success": True,
        "equipment_class": equipment_class,
        "checklist": current,
        "missing_spec_fields": missing,
        "evaluation_points": (category.evaluation_points if category else []),
        "previous_specifications": previous_specs,
        "data_classification": SYNTHETIC_LABEL,
        "note": "Checklist is a review aid. It is not an official technical schedule.",
    }


def justification_assistant(payload: dict[str, Any]) -> dict[str, Any]:
    what = payload.get("what_is_needed") or "the stated requirement"
    quantity = payload.get("quantity") or "quantity not stated"
    location = payload.get("location") or "location not stated"
    purpose = payload.get("purpose") or ""
    sources = search_demo_index(_requirement_query(payload) + " outcome benefit implementation", top_k=5)
    outcome_lines = []
    citations = []
    for src in sources:
        text = (src.get("text") or "").lower()
        if any(k in text for k in ("outcome", "benefit", "successful", "deferred", "risk", "issue")):
            outcome_lines.append(_excerpt(src.get("text") or "", 160))
            citations.append(src.get("chunk_id"))

    draft = (
        f"Justification draft (advisory, synthetic sources only)\n\n"
        f"1. What is needed: {what} ({quantity}) at {location}.\n"
        f"2. Why it is required: {purpose or 'Purpose was not supplied; the officer should state the operational gap.'}\n"
        f"3. How it will be used: operational use should be described by the proposing unit; "
        f"do not invent crime statistics.\n"
        f"4. Expected benefit: only benefits found in retrieved demo files may be cited below. "
        f"If none, write 'evidence unavailable in the loaded corpus'.\n"
    )
    if outcome_lines:
        draft += "5. Historical outcomes on file (demo):\n" + "\n".join(f"   - {line}" for line in outcome_lines)
    else:
        draft += "5. Historical outcomes: none retrieved — do not invent results.\n"
    draft += (
        "\n\nThis draft is for the officer to edit. It is not an official noting. "
        + SYNTHETIC_LABEL
    )
    return {
        "success": True,
        "draft": draft,
        "citations": [c for c in citations if c],
        "sources": sources,
        "data_classification": SYNTHETIC_LABEL,
        "human_must_edit": True,
    }


def procurement_intelligence(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    equipment_class = classify_requirement(payload)
    tenders = db.scalars(
        select(HistoricalTender)
        .where(HistoricalTender.equipment_class == equipment_class)
        .options(selectinload(HistoricalTender.bidders))
    ).all()
    if not tenders:
        tenders = db.scalars(
            select(HistoricalTender).options(selectinload(HistoricalTender.bidders))
        ).all()

    records = []
    amounts = []
    for tender in tenders:
        if tender.indicative_amount_inr:
            amounts.append(tender.indicative_amount_inr)
        records.append(
            {
                "tender_id": tender.id,
                "proposal_id": tender.proposal_id,
                "title": tender.title,
                "procurement_type": tender.procurement_type,
                "quantity": tender.quantity,
                "indicative_amount_inr": tender.indicative_amount_inr,
                "decision_status": tender.decision_status,
                "year": tender.year,
                "location": tender.location,
                "specification_summary": tender.specification_summary,
                "historical_bidders": [
                    {
                        "display_name": b.display_name,
                        "quoted_amount_inr": b.quoted_amount_inr,
                        "result": b.result,
                        "synthetic": True,
                    }
                    for b in tender.bidders
                ],
                "synthetic": True,
            }
        )

    retrieved = search_demo_index(_requirement_query(payload) + " tender vendor procurement", top_k=4)
    return {
        "success": True,
        "equipment_class": equipment_class,
        "historical_tenders": records,
        "indicative_price_summary": {
            "sample_size": len(amounts),
            "min_inr": min(amounts) if amounts else None,
            "max_inr": max(amounts) if amounts else None,
            "median_inr": median(amounts) if amounts else None,
            "limitation": "Illustrative demo amounts only. Quantity and scope differ across files.",
        },
        "retrieved_chunks": retrieved,
        "recommended_vendor": None,
        "award_recommendation": None,
        "vendor_selection": "not_performed",
        "notice": VENDOR_NOTICE,
        "data_classification": SYNTHETIC_LABEL,
    }


def equipment_intelligence(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    equipment_class = classify_requirement(payload)
    category = db.get(EquipmentCategory, equipment_class)
    models = db.scalars(
        select(EquipmentModel).where(EquipmentModel.category_id == equipment_class)
    ).all()
    usage = search_demo_index(_requirement_query(payload) + f" {equipment_class} implementation outcome", top_k=5)
    comparison = []
    for model in models:
        comparison.append(
            {
                "id": model.id,
                "category_name": model.category_name,
                "specs": model.specs,
                "notes": model.notes,
                "source": model.source,
                "synthetic": True,
                "recommended_for_award": False,
            }
        )
    return {
        "success": True,
        "equipment_class": equipment_class,
        "category": None
        if not category
        else {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "comparison_points": category.comparison_points,
            "evaluation_points": category.evaluation_points,
        },
        "models_or_classes": comparison,
        "previous_usage": [
            {
                "proposal_id": s.get("proposal_id"),
                "excerpt": _excerpt(s.get("text") or ""),
                "citation": s.get("chunk_id"),
            }
            for s in usage
        ],
        "recommended_model": None,
        "notice": VENDOR_NOTICE + " Catalogue entries are classes, not branded awards.",
        "data_classification": SYNTHETIC_LABEL,
    }


def policy_search(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    query = _requirement_query(payload).lower()
    records = db.scalars(select(PolicyRecord)).all()
    hits = []
    for rec in records:
        hay = " ".join([rec.title, rec.excerpt, " ".join(rec.keywords or [])]).lower()
        score = sum(1 for token in query.split() if len(token) > 3 and token in hay)
        if score or any(k in query for k in (rec.keywords or [])):
            hits.append(
                {
                    "id": rec.id,
                    "title": rec.title,
                    "record_type": rec.record_type,
                    "issuer": rec.issuer,
                    "excerpt": rec.excerpt,
                    "effective_status": rec.effective_status,
                    "validity_warning": rec.validity_warning,
                    "match_kind": "retrieved_from_knowledge_base",
                    "official": rec.official,
                    "synthetic": rec.synthetic,
                    "score": score,
                }
            )
    hits.sort(key=lambda h: h["score"], reverse=True)
    retrieved = search_demo_index(query + " policy sop guideline", top_k=4, document_types=None)
    policy_chunks = [
        {
            "id": s.get("document_id"),
            "title": s.get("proposal_id"),
            "record_type": s.get("document_type") or "CHUNK",
            "excerpt": _excerpt(s.get("text") or ""),
            "match_kind": "semantic_or_keyword_match",
            "official": False,
            "synthetic": True,
            "citation": s.get("chunk_id"),
            "validity_warning": "Not verified as a current official GO/SOP.",
        }
        for s in retrieved
        if "policy" in (s.get("text") or "").lower()
        or "POLICY" in str(s.get("document_type") or "").upper()
        or "guideline" in (s.get("text") or "").lower()
    ]
    combined = hits + policy_chunks
    if not combined:
        combined = [
            {
                "title": "No applicable GO/SOP found in the loaded corpus",
                "match_kind": "not_a_verified_policy_citation",
                "official": False,
                "validity_warning": "Do not invent a Government Order number.",
                "excerpt": "The available documents do not establish an applicable official policy.",
            }
        ]
    return {
        "success": True,
        "policies": combined,
        "official_corpus_loaded": False,
        "data_classification": SYNTHETIC_LABEL,
        "note": "Production ingest should add department GOs/SOPs with effective dates. Demo corpus is training-only.",
    }


def outcome_risk_intelligence(payload: dict[str, Any]) -> dict[str, Any]:
    sources = search_demo_index(
        _requirement_query(payload) + " outcome issue delayed deferred overlap risk maintenance",
        top_k=8,
    )
    verify = [
        "Confirm the site is not already covered by another camera / equipment file.",
        "Confirm quantity, installation, and warranty before using a historical INR figure.",
        "If a similar request was deferred, read that decision file before re-submitting.",
        "Do not treat demo outcomes as real performance of a vendor or product.",
    ]
    return {
        "success": True,
        "previous_outcomes": [
            {
                "proposal_id": s.get("proposal_id"),
                "document_type": s.get("document_type"),
                "excerpt": _excerpt(s.get("text") or ""),
                "citation": s.get("chunk_id"),
            }
            for s in sources
        ],
        "officer_should_verify": verify,
        "data_classification": SYNTHETIC_LABEL,
    }


def intelligence_pack(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    """Full SI flow for one requirement (no vendor award)."""
    spec = specification_intelligence(db, payload)
    just = justification_assistant(payload)
    proc = procurement_intelligence(db, payload)
    equip = equipment_intelligence(db, payload)
    policy = policy_search(db, payload)
    risk = outcome_risk_intelligence(payload)
    history = search_demo_index(_requirement_query(payload), top_k=8)
    return {
        "success": True,
        "flow": [
            "requirement",
            "specification",
            "justification",
            "historical_data",
            "cost",
            "procurement_tender",
            "decision_support",
        ],
        "requirement": {
            "what_is_needed": payload.get("what_is_needed"),
            "quantity": payload.get("quantity"),
            "location": payload.get("location"),
            "purpose": payload.get("purpose"),
            "equipment_class": spec["equipment_class"],
        },
        "specification": spec,
        "justification": just,
        "historical_proposals": history,
        "cost": proc.get("indicative_price_summary"),
        "procurement": proc,
        "equipment": equip,
        "policy_sop": policy,
        "outcomes_and_risks": risk,
        "recommended_vendor": None,
        "notice": VENDOR_NOTICE,
        "data_classification": SYNTHETIC_LABEL,
        "human_decision": True,
    }
