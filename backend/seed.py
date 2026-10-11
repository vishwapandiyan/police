"""Load labelled synthetic reference data into SQLite (not official records)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    EquipmentCategory,
    EquipmentModel,
    HistoricalTender,
    PolicyRecord,
    SpecChecklistItem,
    TenderBidder,
)
from .settings import SYNTHETIC_LABEL, VENDOR_NOTICE

VALIDITY = (
    "Not an official Government Order or SOP. Current legal validity has not been verified. "
    "Do not cite as authority for a real procurement."
)

CHECKLISTS = {
    "cctv": [
        ("resolution", "Camera resolution", "Affects identification quality", ["1080p", "2mp", "4mp", "resolution"]),
        ("ir_range", "Night vision / IR range", "Outdoor night coverage", ["ir", "night vision", "infrared"]),
        ("storage_days", "Recording retention (days)", "Evidence window and storage cost", ["30-day", "retention", "storage"]),
        ("poe", "Power over Ethernet", "Cabling and switch design", ["poe"]),
        ("nvr", "NVR / VMS", "Recording backbone", ["nvr", "vms"]),
        ("onvif", "ONVIF / interoperability", "Avoid lock-in on mix-and-match cameras", ["onvif"]),
        ("warranty", "Warranty / AMC", "Lifecycle cost", ["warranty", "amc", "maintenance"]),
        ("installation", "Installation included", "Compare like-for-like quotes", ["installation", "cabling"]),
        ("quantity", "Quantity", "Unit-rate comparison", ["cameras", "units", "quantity"]),
        ("coverage", "Coverage / sites", "Scope must match previous jobs", ["entry", "exit", "station"]),
    ],
    "radio": [
        ("band", "Frequency band", "Must match existing network", ["vhf", "uhf", "band"]),
        ("encryption", "Encryption", "Operational security", ["encryption", "aes"]),
        ("battery", "Battery / spare", "Shift endurance", ["battery"]),
        ("warranty", "Warranty", "Repair path", ["warranty"]),
        ("quantity", "Quantity", "Unit rate", ["handset", "units"]),
    ],
    "vehicle": [
        ("type", "Vehicle type", "Role fit", ["patrol", "van", "suv"]),
        ("fuel", "Fuel", "Running cost", ["diesel", "petrol", "ev"]),
        ("warranty", "Warranty", "AMC", ["warranty"]),
        ("quantity", "Quantity", "Fleet comparison", ["units", "vehicles"]),
    ],
    "training": [
        ("topic", "Topic", "Skill gap", ["evidence", "cctv", "cyber"]),
        ("batch_size", "Batch size", "Cost per officer", ["officers", "batch"]),
        ("duration", "Duration", "Duty impact", ["days", "weeks"]),
    ],
    "other": [
        ("description", "Item description", "What is being bought", ["item"]),
        ("quantity", "Quantity", "Scale", ["quantity", "units"]),
        ("warranty", "Warranty", "Support", ["warranty"]),
    ],
}

EVALUATION = {
    "cctv": [
        "Confirm identical scope (cameras + NVR + installation + warranty) before comparing INR figures.",
        "Check resolution, IR range, and retention days against the last approved CCTV file.",
        "Ask whether overlapping camera work already covers the same site.",
        "Do not treat a previous bidder as the selected vendor.",
    ],
    "radio": [
        "Confirm band compatibility with the existing demo radio network.",
        "Spare batteries and warranty must be in the comparison, not only handset price.",
    ],
    "vehicle": [
        "Compare role (patrol vs van) before comparing on-road cost.",
        "Fuel and AMC often dominate lifetime cost.",
    ],
    "training": [
        "Check whether a similar workshop was already completed and what SOP change followed.",
    ],
    "other": [
        "Match quantity, specification, and whether installation is included.",
    ],
}


def _categories() -> list[EquipmentCategory]:
    return [
        EquipmentCategory(
            id="cctv",
            name="CCTV / video surveillance",
            description="IP cameras, NVR, storage, installation — SI-highlighted example class.",
            comparison_points=["resolution", "ir_range", "storage_days", "poe", "warranty", "unit_indicative_inr"],
            evaluation_points=EVALUATION["cctv"],
        ),
        EquipmentCategory(
            id="radio",
            name="Radio / communication handsets",
            description="Handheld radios and spares.",
            comparison_points=["band", "encryption", "battery", "warranty"],
            evaluation_points=EVALUATION["radio"],
        ),
        EquipmentCategory(
            id="vehicle",
            name="Vehicles",
            description="Patrol and support vehicles (demo categories only).",
            comparison_points=["type", "fuel", "warranty"],
            evaluation_points=EVALUATION["vehicle"],
        ),
        EquipmentCategory(
            id="training",
            name="Training services",
            description="Workshops and skill programmes.",
            comparison_points=["topic", "batch_size", "duration"],
            evaluation_points=EVALUATION["training"],
        ),
        EquipmentCategory(
            id="other",
            name="Other equipment",
            description="Generic checklist when class is unknown.",
            comparison_points=["description", "quantity", "warranty"],
            evaluation_points=EVALUATION["other"],
        ),
    ]


def _models() -> list[EquipmentModel]:
    return [
        EquipmentModel(
            id="cctv-ip-1080p",
            category_id="cctv",
            category_name="IP camera (1080p class)",
            specs={
                "resolution": "1080p / ~2 MP",
                "ir_range": "30 m (illustrative)",
                "poe": "Yes",
                "onvif": "Typically required in demo checklist",
                "unit_indicative_inr": 15000,
            },
            notes="Matches the fictional CCTV pilot camera class. Not a brand recommendation.",
        ),
        EquipmentModel(
            id="cctv-ip-4mp",
            category_id="cctv",
            category_name="IP camera (4 MP class)",
            specs={
                "resolution": "4 MP",
                "ir_range": "30–40 m (illustrative)",
                "poe": "Yes",
                "onvif": "Typically required in demo checklist",
                "unit_indicative_inr": 22000,
            },
            notes="Higher-resolution class for comparison only. PRISM does not pick a make/model for award.",
        ),
        EquipmentModel(
            id="cctv-nvr-2tb",
            category_id="cctv",
            category_name="NVR with ~2 TB / 30-day class",
            specs={"storage_days": "30", "compression": "H.265 (illustrative)", "unit_indicative_inr": 80000},
            notes="Aligned with SYN-PDY-CCTV-001 storage note.",
        ),
        EquipmentModel(
            id="radio-digital-hh",
            category_id="radio",
            category_name="Digital handheld radio (demo class)",
            specs={"band": "UHF/VHF as per existing net", "battery": "Spare battery recommended"},
            notes="Class used in the fictional radio replacement pilot.",
        ),
    ]


def _tenders() -> list[tuple[HistoricalTender, list[TenderBidder]]]:
    rows = []
    t1 = HistoricalTender(
        id="TND-SYN-CCTV-001",
        proposal_id="SYN-PDY-CCTV-001",
        title="CCTV surveillance pilot (8 cameras) — fictional limited tender",
        equipment_class="cctv",
        procurement_type="Limited Tender",
        quantity="8 cameras + NVR",
        indicative_amount_inr=450000,
        decision_status="Approved / implemented (demo)",
        year=2024,
        location="Demo Central Station",
        specification_summary="1080p IP, IR 30 m, PoE, NVR 2TB, 30-day retention, 1-year maintenance.",
        notes=VENDOR_NOTICE,
    )
    b1 = [
        TenderBidder(tender_id=t1.id, display_name="Demo Integrator Alpha (fictional)", quoted_amount_inr=445000, result="historical_participant"),
        TenderBidder(tender_id=t1.id, display_name="Demo Integrator Beta (fictional)", quoted_amount_inr=470000, result="historical_participant"),
        TenderBidder(tender_id=t1.id, display_name="Demo Integrator Gamma (fictional)", quoted_amount_inr=455000, result="historical_participant"),
    ]
    rows.append((t1, b1))

    t2 = HistoricalTender(
        id="TND-SYN-CCTV-002",
        proposal_id="SYN-PDY-CCTV-002",
        title="CCTV expansion — fictional open tender (deferred)",
        equipment_class="cctv",
        procurement_type="Open Tender",
        quantity="Expansion vs 8-camera pilot",
        indicative_amount_inr=1200000,
        decision_status="Deferred (demo — budget / scope)",
        year=2024,
        location="Demo North and Demo South",
        specification_summary="IP cameras matching pilot spec; bulk discount assumed — comparison note says do not treat as like-for-like.",
        notes=VENDOR_NOTICE + " Deferred in the demo story; not an award.",
    )
    b2 = [
        TenderBidder(tender_id=t2.id, display_name="Demo Integrator Alpha (fictional)", quoted_amount_inr=None, result="not_awarded_demo_deferred"),
        TenderBidder(tender_id=t2.id, display_name="Demo Integrator Delta (fictional)", quoted_amount_inr=None, result="not_awarded_demo_deferred"),
    ]
    rows.append((t2, b2))

    t3 = HistoricalTender(
        id="TND-SYN-RAD-001",
        proposal_id="SYN-PDY-RAD-001",
        title="Radio handset replacement pilot — fictional limited tender",
        equipment_class="radio",
        procurement_type="Limited Tender",
        quantity="20 handsets",
        indicative_amount_inr=320000,
        decision_status="Approved (demo)",
        year=2024,
        location="Demo Central Station",
        specification_summary="Digital handheld radios with spare batteries.",
        notes=VENDOR_NOTICE,
    )
    b3 = [
        TenderBidder(tender_id=t3.id, display_name="Demo Radio House (fictional)", quoted_amount_inr=318000, result="historical_participant"),
        TenderBidder(tender_id=t3.id, display_name="Demo Comms Supply (fictional)", quoted_amount_inr=335000, result="historical_participant"),
    ]
    rows.append((t3, b3))

    t4 = HistoricalTender(
        id="TND-SYN-TRN-004",
        proposal_id="SYN-PDY-TRN-004",
        title="Digital evidence training — fictional training services",
        equipment_class="training",
        procurement_type="Training Services",
        quantity="Workshop batch",
        indicative_amount_inr=None,
        decision_status="Completed (demo)",
        year=2024,
        location="Demo district training",
        specification_summary="Digital evidence handling workshop; SOP update noted in outcome file.",
        notes=VENDOR_NOTICE,
    )
    rows.append((t4, []))
    return rows


def _policies() -> list[PolicyRecord]:
    return [
        PolicyRecord(
            id="SYN-PDY-POLICY-001",
            title="Synthetic Equipment Procurement Guidelines (training reference)",
            record_type="POLICY_REF",
            issuer="PRISM-PY synthetic corpus — not a government office",
            excerpt=(
                "Illustrative structure only: fictional thresholds (direct purchase / limited tender / open tender), "
                "sample technical evaluation weights, example warranty language. "
                + SYNTHETIC_LABEL
            ),
            effective_status="not_official",
            validity_warning=VALIDITY,
            keywords=["policy", "procurement", "tender", "warranty", "cctv"],
            official=False,
        ),
        PolicyRecord(
            id="SYN-PDY-POLICY-CHECKLIST",
            title="Officer verification checklist (synthetic)",
            record_type="CHECKLIST",
            issuer="PRISM-PY training corpus",
            excerpt=(
                "Verify: scope match, quantity, installation included, warranty, overlapping works, "
                "and that no vendor is pre-selected in the noting. " + SYNTHETIC_LABEL
            ),
            effective_status="not_official",
            validity_warning=VALIDITY,
            keywords=["checklist", "verification", "sop", "review"],
            official=False,
        ),
    ]


def seed_reference_data(db: Session) -> None:
    if db.scalar(select(EquipmentCategory.id).limit(1)):
        return

    db.add_all(_categories())
    db.add_all(_models())
    for category_id, items in CHECKLISTS.items():
        for key, label, why, aliases in items:
            db.add(
                SpecChecklistItem(
                    category_id=category_id,
                    field_key=key,
                    label=label,
                    why_it_matters=why,
                    aliases=aliases,
                )
            )
    for tender, bidders in _tenders():
        db.add(tender)
        db.flush()
        for bidder in bidders:
            db.add(bidder)
    db.add_all(_policies())
    db.flush()
