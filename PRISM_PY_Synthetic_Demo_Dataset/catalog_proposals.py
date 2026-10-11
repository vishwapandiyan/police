"""Deterministic extra synthetic proposals to reach the 30-record default.

These records are fictional training examples. They never invent real
Government Orders, vendor names, official sanctions, or real outcomes.
"""

from datetime import date, timedelta
from typing import Any, Dict, List

from paths import SYNTHETIC_LABEL


STATIONS = [
    "Demo Central Station",
    "Demo North Station",
    "Demo South Station",
    "Demo East Station",
    "Demo West Station",
]

REGIONS = [
    "Demo North Region",
    "Demo South Region",
    "Demo Central Region",
    "Demo East Region",
    "Demo West Region",
]

DISTRICT = "Demo Puducherry District"

# Each spec produces one proposal record with 4-6 linked documents.
CATALOG: List[Dict[str, Any]] = [
    {
        "prefix": "RAD",
        "title": "Demo Radio Handset Replacement Pilot",
        "domain": "Technology",
        "objective": "Replace ageing demo radio handsets at one fictional station",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 320000,
        "technology": "Digital handheld radios with spare batteries",
        "quantity": "20 handsets",
        "timeline": "4 months",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-02-10",
        "keywords": ["radio", "communication", "handset", "warranty"],
        "related": ["SYN-PDY-MAINT-001"],
        "notes": "Warranty and repair history should be recorded after issue.",
    },
    {
        "prefix": "GPS",
        "title": "Demo Patrol Vehicle Location Unit Trial",
        "domain": "Technology",
        "objective": "Trial vehicle location units on a fictional demo fleet",
        "station": STATIONS[1],
        "region": REGIONS[0],
        "budget": 275000,
        "technology": "GPS tracking units with control-room dashboard",
        "quantity": "8 vehicles",
        "timeline": "5 months",
        "procurement_type": "Limited Tender",
        "path": "rejected",
        "start": "2024-03-01",
        "keywords": ["GPS", "vehicle", "location", "rejected"],
        "related": [],
        "notes": "Rejected in the demo scenario due to incomplete privacy notes.",
    },
    {
        "prefix": "LGT",
        "title": "Demo Station Lighting Retrofit",
        "domain": "Infrastructure",
        "objective": "Replace outdoor lighting at a fictional station compound",
        "station": STATIONS[2],
        "region": REGIONS[1],
        "budget": 180000,
        "technology": "LED floodlights with timers",
        "quantity": "24 fixtures",
        "timeline": "3 months",
        "procurement_type": "Limited Tender",
        "path": "modified",
        "start": "2024-01-20",
        "keywords": ["lighting", "LED", "retrofit", "modified"],
        "related": [],
        "notes": "First draft omitted wattage and was resubmitted.",
    },
    {
        "prefix": "VIS",
        "title": "Demo Visitor Kiosk Pilot",
        "domain": "Information Systems",
        "objective": "Pilot a visitor check-in kiosk at a fictional reception desk",
        "station": STATIONS[3],
        "region": REGIONS[3],
        "budget": 210000,
        "technology": "Touchscreen kiosk with paper backup register",
        "quantity": "1 kiosk",
        "timeline": "4 months",
        "procurement_type": "Single Source (demo only)",
        "path": "deferred",
        "start": "2024-04-05",
        "keywords": ["visitor", "kiosk", "deferred", "reception"],
        "related": ["SYN-PDY-CCTV-001"],
        "notes": "Deferred pending a clearer data-retention note.",
    },
    {
        "prefix": "BWC",
        "title": "Demo Body-Worn Camera Familiarisation",
        "domain": "Technology",
        "objective": "Familiarisation kit for fictional body-worn camera handling",
        "station": STATIONS[4],
        "region": REGIONS[4],
        "budget": 390000,
        "technology": "Body-worn cameras with docking station",
        "quantity": "12 cameras",
        "timeline": "6 months",
        "procurement_type": "Open Tender",
        "path": "unknown",
        "start": "2024-05-12",
        "keywords": ["body-worn", "camera", "unknown", "evidence"],
        "related": ["SYN-PDY-TRN-004"],
        "notes": "No implementation outcome is recorded in this demo set.",
    },
    {
        "prefix": "NET",
        "title": "Demo Network Switch Replacement",
        "domain": "Technology",
        "objective": "Replace a fictional access switch used by the CCTV pilot LAN",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 145000,
        "technology": "24-port PoE access switch",
        "quantity": "2 switches",
        "timeline": "2 months",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-03-15",
        "keywords": ["network", "switch", "PoE", "CCTV"],
        "related": ["SYN-PDY-CCTV-001"],
        "notes": "Supports the fictional CCTV pilot LAN.",
    },
    {
        "prefix": "RFID",
        "title": "Demo Evidence Locker Tag Pilot",
        "domain": "Information Systems",
        "objective": "Tag a fictional evidence locker set for location checks",
        "station": STATIONS[1],
        "region": REGIONS[0],
        "budget": 260000,
        "technology": "Passive RFID tags and handheld reader",
        "quantity": "200 tags",
        "timeline": "5 months",
        "procurement_type": "Limited Tender",
        "path": "in_progress",
        "start": "2024-06-01",
        "keywords": ["RFID", "evidence", "locker", "asset"],
        "related": ["SYN-PDY-ASSET-003"],
        "notes": "Intended to feed the fictional asset register.",
    },
    {
        "prefix": "GEN",
        "title": "Demo Backup Generator Capacity Note",
        "domain": "Infrastructure",
        "objective": "Assess a fictional standby generator for CCTV power backup",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 510000,
        "technology": "Diesel standby generator with ATS",
        "quantity": "1 unit",
        "timeline": "6 months",
        "procurement_type": "Open Tender",
        "path": "rejected",
        "start": "2024-02-20",
        "keywords": ["generator", "backup", "power", "rejected"],
        "related": ["SYN-PDY-CCTV-001"],
        "notes": "Rejected in demo because load calculations were missing.",
    },
    {
        "prefix": "HYG",
        "title": "Demo Cyber Hygiene Workshop",
        "domain": "Training",
        "objective": "Run a fictional cyber hygiene workshop for demo staff",
        "station": STATIONS[2],
        "region": REGIONS[1],
        "budget": 95000,
        "technology": "Classroom kits and practice accounts",
        "quantity": "30 seats",
        "timeline": "6 weeks",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-04-18",
        "keywords": ["training", "cyber", "hygiene", "workshop"],
        "related": ["SYN-PDY-TRN-004"],
        "notes": "Fictional training outcome recorded as completed.",
    },
    {
        "prefix": "AID",
        "title": "Demo First-Aid Refresher Sessions",
        "domain": "Training",
        "objective": "Schedule fictional first-aid refreshers at two demo sites",
        "station": STATIONS[3],
        "region": REGIONS[3],
        "budget": 72000,
        "technology": "Training mannequins and consumable kits",
        "quantity": "2 batches",
        "timeline": "8 weeks",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-05-02",
        "keywords": ["training", "first-aid", "refresher"],
        "related": [],
        "notes": "Outcome recorded as completed in the demo story.",
    },
    {
        "prefix": "DRN",
        "title": "Demo Drone Awareness Briefing",
        "domain": "Training",
        "objective": "Hold a fictional awareness briefing on drone sighting logs",
        "station": STATIONS[4],
        "region": REGIONS[4],
        "budget": 64000,
        "technology": "Briefing slides and sighting log templates",
        "quantity": "1 session series",
        "timeline": "1 month",
        "procurement_type": "Internal allocation (demo)",
        "path": "deferred",
        "start": "2024-07-08",
        "keywords": ["drone", "training", "deferred", "awareness"],
        "related": [],
        "notes": "Deferred because no trainer availability was recorded.",
    },
    {
        "prefix": "HLP",
        "title": "Demo IT Helpdesk Ticket Board",
        "domain": "Information Systems",
        "objective": "Trial a fictional helpdesk board for station IT requests",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 88000,
        "technology": "Shared ticket board with printed fallback log",
        "quantity": "1 board",
        "timeline": "3 months",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-03-22",
        "keywords": ["helpdesk", "ticket", "IT", "maintenance"],
        "related": ["SYN-PDY-ASSET-003"],
        "notes": "Repair history can be copied into the asset register.",
    },
    {
        "prefix": "SCN",
        "title": "Demo Document Scanner Fleet Note",
        "domain": "Technology",
        "objective": "Add fictional desktop scanners for case-file digitisation practice",
        "station": STATIONS[1],
        "region": REGIONS[0],
        "budget": 156000,
        "technology": "A4 document scanners",
        "quantity": "6 scanners",
        "timeline": "3 months",
        "procurement_type": "Limited Tender",
        "path": "modified",
        "start": "2024-04-11",
        "keywords": ["scanner", "digitisation", "modified"],
        "related": ["SYN-PDY-TRN-004"],
        "notes": "Quantity reduced after review of unused desks.",
    },
    {
        "prefix": "WTR",
        "title": "Demo Drinking Water Cooler Replacement",
        "domain": "Infrastructure",
        "objective": "Replace two fictional water coolers at Demo East Station",
        "station": STATIONS[3],
        "region": REGIONS[3],
        "budget": 42000,
        "technology": "Standard water coolers",
        "quantity": "2 units",
        "timeline": "6 weeks",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-01-08",
        "keywords": ["water", "cooler", "maintenance", "warranty"],
        "related": [],
        "notes": "Warranty start date recorded in the outcome note.",
    },
    {
        "prefix": "FNC",
        "title": "Demo Perimeter Sensor Familiarisation",
        "domain": "Technology",
        "objective": "Familiarise staff with fictional perimeter vibration sensors",
        "station": STATIONS[2],
        "region": REGIONS[1],
        "budget": 430000,
        "technology": "Vibration sensors on a demo fence segment",
        "quantity": "1 fence segment",
        "timeline": "5 months",
        "procurement_type": "Open Tender",
        "path": "deferred",
        "start": "2024-06-18",
        "keywords": ["perimeter", "sensor", "overlap", "CCTV"],
        "related": ["SYN-PDY-CCTV-002"],
        "notes": "Deferred due to overlap with the fictional CCTV expansion.",
    },
    {
        "prefix": "RST",
        "title": "Demo Duty Roster Spreadsheet Replacement",
        "domain": "Information Systems",
        "objective": "Trial a fictional duty roster tool for one demo station",
        "station": STATIONS[4],
        "region": REGIONS[4],
        "budget": 67000,
        "technology": "Shared roster workbook with printouts",
        "quantity": "1 workstation license (demo)",
        "timeline": "2 months",
        "procurement_type": "Limited Tender",
        "path": "rejected",
        "start": "2024-05-20",
        "keywords": ["roster", "spreadsheet", "rejected"],
        "related": [],
        "notes": "Rejected because backup-print procedures were missing.",
    },
    {
        "prefix": "AV",
        "title": "Demo Interview Room Audio-Visual Kit",
        "domain": "Technology",
        "objective": "Fit a fictional interview room with basic AV capture",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 198000,
        "technology": "Camera, microphone, and locked storage drive",
        "quantity": "1 room kit",
        "timeline": "4 months",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-02-28",
        "keywords": ["interview", "audio", "video", "evidence"],
        "related": ["SYN-PDY-TRN-004"],
        "notes": "Links to the fictional digital evidence training.",
    },
    {
        "prefix": "PRK",
        "title": "Demo Parking-Lot Camera Add-On",
        "domain": "Technology",
        "objective": "Add two fictional cameras to a demo parking lot",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 125000,
        "technology": "IP cameras matching the CCTV pilot specification",
        "quantity": "2 cameras",
        "timeline": "2 months",
        "procurement_type": "Limited Tender",
        "path": "in_progress",
        "start": "2024-08-01",
        "keywords": ["CCTV", "parking", "overlap", "expansion"],
        "related": ["SYN-PDY-CCTV-001", "SYN-PDY-CCTV-002"],
        "notes": "Scope overlaps the fictional CCTV pilot and expansion.",
    },
    {
        "prefix": "BAT",
        "title": "Demo UPS Battery Replacement Cycle",
        "domain": "Maintenance",
        "objective": "Replace fictional UPS batteries used by the CCTV NVR",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 54000,
        "technology": "Sealed lead-acid UPS batteries",
        "quantity": "8 batteries",
        "timeline": "1 month",
        "procurement_type": "Limited Tender",
        "path": "approved_complete",
        "start": "2024-09-01",
        "keywords": ["UPS", "battery", "repair", "maintenance", "warranty"],
        "related": ["SYN-PDY-CCTV-001", "SYN-PDY-MAINT-001"],
        "notes": "Repair history and warranty dates are in the maintenance note.",
    },
    {
        "prefix": "VEN",
        "title": "Demo Radio Vendor Comparison Note",
        "domain": "Procurement",
        "objective": "Compare two fictional radio quotes for illustration only",
        "station": STATIONS[0],
        "region": REGIONS[2],
        "budget": 320000,
        "technology": "Digital handheld radios",
        "quantity": "20 handsets",
        "timeline": "n/a",
        "procurement_type": "Comparison note",
        "path": "comparison",
        "start": "2024-02-18",
        "keywords": ["comparison", "budget", "radio", "caveat"],
        "related": ["SYN-PDY-RAD-005"],
        "notes": "Amounts are illustrative. Scope and warranty must be checked first.",
    },
    {
        "prefix": "SOP",
        "title": "Demo Procurement Checklist (Training Example)",
        "domain": "Policy",
        "objective": "Provide a fictional checklist for demo reviewers",
        "station": "Demo Training Desk",
        "region": REGIONS[2],
        "budget": 0,
        "technology": "n/a",
        "quantity": "n/a",
        "timeline": "n/a",
        "procurement_type": "Training reference",
        "path": "policy",
        "start": "2024-01-05",
        "keywords": ["policy", "checklist", "synthetic", "not official"],
        "related": [],
        "notes": "Not a legal authority. Training example only.",
    },
    {
        "prefix": "VAN",
        "title": "Demo Community Outreach Van Fit-Out",
        "domain": "Infrastructure",
        "objective": "Describe a fictional outreach van fit-out with missing outcome",
        "station": STATIONS[1],
        "region": REGIONS[0],
        "budget": 610000,
        "technology": "Portable PA, folding tables, power inverter",
        "quantity": "1 van fit-out",
        "timeline": "7 months",
        "procurement_type": "Open Tender",
        "path": "unknown",
        "start": "2024-03-30",
        "keywords": ["outreach", "van", "unknown", "missing outcome"],
        "related": [],
        "notes": "This proposal has no recorded implementation outcome.",
    },
    {
        "prefix": "STO",
        "title": "Demo Stationery Bulk Request",
        "domain": "Administration",
        "objective": "Record a fictional stationery request with a modified quantity",
        "station": STATIONS[2],
        "region": REGIONS[1],
        "budget": 28000,
        "technology": "n/a",
        "quantity": "Annual pack",
        "timeline": "1 month",
        "procurement_type": "Limited Tender",
        "path": "modified",
        "start": "2024-07-01",
        "keywords": ["stationery", "modified", "missing information"],
        "related": [],
        "notes": "Unit rates were missing in the first draft.",
    },
    {
        "prefix": "CLN",
        "title": "Demo Compound Cleaning Contract Note",
        "domain": "Administration",
        "objective": "Illustrate a fictional short cleaning contract",
        "station": STATIONS[3],
        "region": REGIONS[3],
        "budget": 96000,
        "technology": "n/a",
        "quantity": "12 months",
        "timeline": "12 months",
        "procurement_type": "Limited Tender",
        "path": "in_progress",
        "start": "2024-08-12",
        "keywords": ["cleaning", "contract", "in progress"],
        "related": [],
        "notes": "Implementation started; outcome not yet due.",
    },
    {
        "prefix": "ACS",
        "title": "Demo Access-Card Printer Request",
        "domain": "Technology",
        "objective": "Request a fictional access-card printer for demo badges",
        "station": STATIONS[4],
        "region": REGIONS[4],
        "budget": 74000,
        "technology": "Desktop PVC card printer",
        "quantity": "1 printer",
        "timeline": "2 months",
        "procurement_type": "Limited Tender",
        "path": "deferred",
        "start": "2024-09-10",
        "keywords": ["access card", "printer", "deferred"],
        "related": ["SYN-PDY-VIS-008"],
        "notes": "Deferred until the visitor kiosk decision is recorded.",
    },
]


DOC_PATHS = {
    "approved_complete": ["PROPOSAL", "REVIEW", "DECISION", "IMPLEMENTATION", "OUTCOME"],
    "rejected": ["PROPOSAL", "REVIEW", "DECISION"],
    "deferred": ["PROPOSAL", "REVIEW", "DECISION"],
    "modified": ["PROPOSAL", "REVIEW", "RESUBMISSION", "DECISION"],
    "unknown": ["PROPOSAL", "REVIEW"],
    "in_progress": ["PROPOSAL", "DECISION", "IMPLEMENTATION"],
    "comparison": ["COMPARISON"],
    "policy": ["POLICY_REF"],
}

STATUS_LABEL = {
    "approved_complete": ("Approved", "Completed", "Successful in the fictional scenario"),
    "rejected": ("Rejected", "Not Started", "No implementation in this demo"),
    "deferred": ("Deferred", "Not Started", "Pending a later demo review"),
    "modified": ("Modified then Approved", "Not Started", "Awaiting the revised start"),
    "unknown": ("Unknown", "Unknown", "No recorded implementation outcome"),
    "in_progress": ("Approved", "In Progress", "Outcome not yet recorded"),
    "comparison": ("Reference", "n/a", "Illustrative comparison only"),
    "policy": ("Training reference", "n/a", "Not official policy"),
}


def _d(start: str, days: int) -> str:
    base = date.fromisoformat(start)
    return (base + timedelta(days=days)).isoformat()


def _banner() -> str:
    return (
        f"{SYNTHETIC_LABEL}\n\n"
        "This document is a fictional training example.\n"
        "It is not an official government record, sanction, or legal authority.\n"
        "Do not treat names, amounts, or outcomes as real facts.\n"
    )


def _doc_text(title: str, proposal_id: str, body: str) -> str:
    return f"{_banner()}\n{title}\nProposal ID: {proposal_id}\n\n{body.strip()}\n"


def build_catalog_proposals(next_proposal_number: int, next_document_number: int) -> List[Dict[str, Any]]:
    """Build extra proposals using stable SYN-PDY IDs."""
    proposals = []
    p_num = next_proposal_number
    d_num = next_document_number

    for spec in CATALOG:
        proposal_id = f"SYN-PDY-{spec['prefix']}-{p_num:03d}"
        p_num += 1
        decision, impl, outcome = STATUS_LABEL[spec["path"]]
        documents = []

        for doc_type in DOC_PATHS[spec["path"]]:
            document_id = f"{proposal_id}-{doc_type}-{d_num:03d}"
            d_num += 1
            documents.append(
                _make_document(spec, proposal_id, document_id, doc_type, decision, impl, outcome)
            )

        proposals.append(
            {
                "proposal_id": proposal_id,
                "title": spec["title"],
                "documents": documents,
            }
        )

    return proposals


def _make_document(
    spec: Dict[str, Any],
    proposal_id: str,
    document_id: str,
    doc_type: str,
    decision: str,
    impl: str,
    outcome: str,
) -> Dict[str, Any]:
    start = spec["start"]
    offsets = {
        "PROPOSAL": 0,
        "REVIEW": 14,
        "RESUBMISSION": 28,
        "DECISION": 35,
        "IMPLEMENTATION": 80,
        "OUTCOME": 140,
        "COMPARISON": 8,
        "POLICY_REF": 0,
        "MAINTENANCE": 90,
    }
    doc_date = _d(start, offsets.get(doc_type, 0))
    body = _body_for(spec, proposal_id, doc_type, decision, impl, outcome)
    return {
        "proposal_id": proposal_id,
        "document_type": doc_type,
        "synthetic": True,
        "data_classification": SYNTHETIC_LABEL,
        "generated_date": "2026-10-11T00:00:00",
        "version": "2.0",
        "document_id": document_id,
        "title": f"{spec['title']} - {doc_type.replace('_', ' ').title()}",
        "domain": spec["domain"],
        "objective": spec["objective"],
        "location": f"{spec['station']} premises (fictional demo site)",
        "station_or_site": spec["station"],
        "jurisdiction": spec["region"],
        "district": DISTRICT,
        "budget_amount": spec["budget"],
        "currency": "INR",
        "technology": spec["technology"],
        "quantity": spec["quantity"],
        "timeline": spec["timeline"],
        "procurement_type": spec["procurement_type"],
        "expected_outcome": spec["notes"],
        "decision_status": decision,
        "implementation_status": impl,
        "outcome_summary": outcome,
        "date": doc_date,
        "keywords": spec["keywords"],
        "related_proposal_ids": spec["related"],
        "content": _doc_text(spec["title"], proposal_id, body),
        "source_file": f"{document_id}.docx",
    }


def _body_for(
    spec: Dict[str, Any],
    proposal_id: str,
    doc_type: str,
    decision: str,
    impl: str,
    outcome: str,
) -> str:
    related = ", ".join(spec["related"]) if spec["related"] else "None recorded"
    money = f"INR {spec['budget']:,}" if spec["budget"] else "Not applicable (training note)"

    if doc_type == "PROPOSAL":
        return f"""INITIAL PROPOSAL (FICTIONAL)
Station or site: {spec['station']}
Jurisdiction: {spec['region']} (demo attribute only)
Date: {spec['start']}

OBJECTIVE:
{spec['objective']}

SCOPE AND TECHNOLOGY:
- Technology: {spec['technology']}
- Quantity: {spec['quantity']}
- Timeline: {spec['timeline']}
- Procurement type: {spec['procurement_type']}

ILLUSTRATIVE BUDGET:
{money}
This amount is fictional and must not be presented as an official sanction.

MISSING INFORMATION TO CHECK:
- Exact measurement notes
- Warranty period
- Overlap with related demo records: {related}

REVIEWER NOTE:
{spec['notes']}
"""

    if doc_type == "REVIEW":
        return f"""REVIEW OBSERVATIONS (FICTIONAL)
Reviewed record: {proposal_id}

OBSERVATIONS:
1. Objective is understandable for a demo exercise.
2. Budget figure {money} is illustrative only.
3. Related demo records to check: {related}
4. Unresolved risk: incomplete source notes in the first draft.

RECOMMENDATION FOR THIS SCENARIO:
Continue only as a training example. Confirm missing measurements before any real comparison.
"""

    if doc_type == "RESUBMISSION":
        return f"""MODIFIED RESUBMISSION (FICTIONAL)
Original gaps: missing quantities or unit rates.
Revision: quantity restated as {spec['quantity']}; technology restated as {spec['technology']}.
Illustrative budget remains {money}.
This is not a real resubmission to any office.
"""

    if doc_type == "DECISION":
        reason = {
            "Approved": "The fictional brief was complete enough for a demo approval.",
            "Rejected": "The fictional brief was missing required notes, so the demo decision is rejected.",
            "Deferred": "The fictional brief was paused pending budget or overlap checks.",
            "Modified then Approved": "The resubmission closed the recorded gap in this demo story.",
            "Unknown": "No decision narrative was filed.",
            "Reference": "Not a decision.",
            "Training reference": "Not a decision.",
        }.get(decision, "Demo decision recorded.")
        return f"""ILLUSTRATIVE DECISION
Decision status: {decision}
Rationale in this fictional scenario: {reason}
Related records: {related}
This decision is synthetic and has no official effect.
"""

    if doc_type == "IMPLEMENTATION":
        return f"""IMPLEMENTATION UPDATE (FICTIONAL)
Implementation status: {impl}
Site: {spec['station']}
Work described: install or issue {spec['quantity']} using {spec['technology']}.
Issues recorded for training: scheduling delay and one warranty query.
Repair history should be written into the linked maintenance or asset record.
"""

    if doc_type == "OUTCOME":
        return f"""OUTCOME REPORT (FICTIONAL)
Outcome summary: {outcome}
What was recorded: staff used the demo equipment and noted warranty / repair history.
What is still missing: independent cost comparison against other years.
Values in this file are synthetic and must not be presented as official facts.
"""

    if doc_type == "COMPARISON":
        return f"""PROCUREMENT COMPARISON NOTE (FICTIONAL)
This note compares illustrative amounts only.
Option A (demo): {money}
Option B (demo): INR {int(spec['budget'] * 1.12):,}
Caveats before comparing the two CCTV or radio budgets:
- Confirm identical scope and quantity
- Confirm warranty and repair history
- Confirm whether installation is included
- Do not treat either figure as an official quote
Related records: {related}
"""

    if doc_type == "POLICY_REF":
        return f"""SYNTHETIC TRAINING CHECKLIST - NOT LEGAL AUTHORITY
Use this only as a classroom example.

Check before a demo comparison:
1. Are both records marked synthetic?
2. Is scope the same?
3. Is warranty mentioned?
4. Is evidence missing for a reliable cost comparison?

This is not a Government Order, SOP, or sanctioned policy.
"""

    return f"Supporting fictional note for {proposal_id}. {spec['notes']}"
