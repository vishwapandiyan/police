"""Local Proposal DNA parse (same labelled-text rules as the Flask demo)."""

from __future__ import annotations

import re
from typing import Any

from prism.schemas.proposal_dna import ExtractionStatus, ProposalDNA, ProposalField


def extract_structured_dna(document_text: str, document_id: str, proposal_id: str) -> ProposalDNA:
    def grab(*labels: str) -> str | None:
        for label in labels:
            match = re.search(
                rf"(?:^|\n)\s*{re.escape(label)}\s*[:\-]\s*(.+)",
                document_text,
                flags=re.IGNORECASE,
            )
            if match:
                value = match.group(1).strip().split("\n")[0].strip(" -:\t")
                if value:
                    return value
            match = re.search(
                rf"(?:^|\n)\s*{re.escape(label)}\s*\n+\s*(.+)",
                document_text,
                flags=re.IGNORECASE,
            )
            if match:
                value = match.group(1).strip().split("\n")[0].strip(" -:\t")
                if value and not re.fullmatch(r"[A-Z][A-Z\s/]{2,}", value):
                    return value
        return None

    budget_raw = grab(
        "BUDGET", "Total Estimated Cost", "Total Cost", "Estimated Cost",
        "Cost", "Amount", "illustrative_budget_inr",
    )
    budget_value: Any = None
    if budget_raw:
        digits = re.sub(r"[^\d.]", "", budget_raw.replace(",", ""))
        if digits:
            try:
                budget_value = float(digits)
            except ValueError:
                budget_value = budget_raw
    if budget_value is None:
        money = re.search(r"INR\s*([\d,]+)", document_text, flags=re.IGNORECASE)
        if money:
            budget_value = float(money.group(1).replace(",", ""))

    title = grab("Title", "PROPOSAL FOR", "Subject")
    mapping = {
        "domain": grab("Domain")
        or ("Technology" if re.search(r"CCTV|radio|network|camera", document_text, re.I) else None)
        or ("Training" if re.search(r"training|workshop", document_text, re.I) else None),
        "objective": grab("OBJECTIVE", "Objective", "PURPOSE", "Purpose") or title,
        "location": grab("Location", "Station", "Stations", "Station or site", "Site"),
        "police_station": grab("Police Station", "Station", "Station or site", "Unit"),
        "jurisdiction": grab("Jurisdiction", "Region", "District"),
        "budget": budget_value,
        "currency": grab("Currency") or ("INR" if "INR" in document_text.upper() else None),
        "technology": grab("TECHNICAL SPECIFICATIONS", "Technology", "TECHNOLOGY", "Equipment"),
        "scale": grab("SCOPE", "Quantity", "Scale"),
        "timeline": grab("TIMELINE", "Timeline", "Duration", "Period"),
        "procurement_type": grab("PROCUREMENT METHOD", "Procurement type", "PROCUREMENT TYPE", "Tender"),
        "expected_outcomes": grab("EXPECTED OUTCOMES", "Expected outcome", "OUTCOME"),
        "risks": grab("RISKS", "Risk", "CONCERNS"),
    }

    dna = ProposalDNA(document_id=document_id, proposal_id=proposal_id, extraction_method="structured_text")
    missing = []
    for name, value in mapping.items():
        if value in (None, ""):
            setattr(dna, name, ProposalField(value=None, status=ExtractionStatus.MISSING))
            missing.append(name)
        else:
            setattr(
                dna,
                name,
                ProposalField(value=value, raw_value=str(value), status=ExtractionStatus.EXTRACTED, confidence=0.7),
            )
    dna.missing_fields = missing
    dna.overall_confidence = dna.get_completeness_score()
    return dna


def flatten_proposal_dna(dna: ProposalDNA) -> dict[str, Any]:
    flat: dict[str, Any] = {"proposal_id": dna.proposal_id, "document_id": dna.document_id}
    for name, field in dna.__dict__.items():
        if hasattr(field, "value"):
            flat[name] = field.value
    return flat


def serialize_dna(dna: ProposalDNA, proposal_id: str) -> dict[str, Any]:
    from datetime import datetime

    return {
        "success": True,
        "proposal_id": proposal_id,
        "proposal_dna": flatten_proposal_dna(dna),
        "completeness_score": dna.get_completeness_score(),
        "filled_fields": dna.get_filled_fields(),
        "missing_fields": list(dna.missing_fields or []),
        "timestamp": datetime.now().isoformat(),
    }
