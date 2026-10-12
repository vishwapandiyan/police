"""Seed synthetic procurement lifecycle demo data.

Creates end-to-end procurement examples for 3 approved proposals:
 1. CCTV Modernisation (prop-syn-001) — full lifecycle: event→bids→tech eval→fin eval→L1→PO
 2. Digital Radio (prop-syn-004)      — technical evaluation stage
 3. CCTNS Workstation (prop-syn-020)  — bid stage only

Also seeds the ApprovalMatrix with illustrative (not legally binding) thresholds.

ALL RECORDS ARE SYNTHETIC DEMO DATA — NOT OFFICIAL GOVERNMENT RECORDS.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models_procurement import (
    ApprovalMatrix,
    Bid,
    BidderEvaluation,
    EvaluationCommittee,
    FinancialBidLine,
    FinancialEvaluation,
    ProcurementEvent,
    ProcurementRequirement,
    PurchaseOrder,
    TechnicalEvaluation,
)

SYNTHETIC_NOTICE = "SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD"
VENDOR_NOTICE = (
    "PRISM-PY does not select or recommend a vendor for award. "
    "Historical bidder information is shown for officer review only."
)


def _id() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Approval Matrix
# ---------------------------------------------------------------------------

APPROVAL_MATRIX_DATA = [
    {
        "id": "am-001",
        "authority_level": "UNIT_LEVEL",
        "required_role": "REVIEWER",
        "min_amount_inr": 0.0,
        "max_amount_inr": 100000.0,
        "description": (
            "Up to INR 1,00,000 — unit/division level sanction. "
            "Illustrative demo threshold only. "
            + SYNTHETIC_NOTICE
        ),
    },
    {
        "id": "am-002",
        "authority_level": "DGP_LEVEL",
        "required_role": "APPROVING_AUTHORITY",
        "min_amount_inr": 100001.0,
        "max_amount_inr": 1000000.0,
        "description": (
            "INR 1,00,001 to INR 10,00,000 — DGP/SP level approval. "
            "Illustrative demo threshold only. "
            + SYNTHETIC_NOTICE
        ),
    },
    {
        "id": "am-003",
        "authority_level": "DEPARTMENT_LEVEL",
        "required_role": "APPROVING_AUTHORITY",
        "min_amount_inr": 1000001.0,
        "max_amount_inr": 5000000.0,
        "description": (
            "INR 10,00,001 to INR 50,00,000 — Home Department / Finance Department approval. "
            "Illustrative demo threshold only. "
            + SYNTHETIC_NOTICE
        ),
    },
    {
        "id": "am-004",
        "authority_level": "GOVERNMENT_LEVEL",
        "required_role": "GOVERNMENT_AUTHORITY",
        "min_amount_inr": 5000001.0,
        "max_amount_inr": None,
        "description": (
            "Above INR 50,00,000 — Government of Puducherry / CS / CM level approval. "
            "Illustrative demo threshold only. "
            + SYNTHETIC_NOTICE
        ),
    },
]


# ---------------------------------------------------------------------------
# SCENARIO 1: CCTV Modernisation — full lifecycle
# ---------------------------------------------------------------------------

def _seed_cctv_procurement(db: Session) -> None:
    """Full lifecycle: Requirement → Event → Bids → Tech Eval → Fin Eval → L1 → PO"""

    req = ProcurementRequirement(
        id="preq-cctv-001",
        proposal_id="prop-syn-001",
        category="technology",
        item_description="AI-Enabled IP CCTV Cameras & Video Analytics System — Puducherry Central Station",
        quantity="50 cameras + 5 NVR units + 1 AI analytics server",
        unit_of_measure="system",
        functional_requirements=(
            "Real-time HD surveillance with AI-powered anomaly detection. "
            "Integration with ERSS. 30-day evidence retention."
        ),
        technical_specification=(
            "Minimum 4MP IP cameras; H.265 compression; 30m IR range; ONVIF compliant; "
            "PoE enabled; 30-day NVR retention (minimum 2TB per NVR); AI video analytics module "
            "with human detection, intrusion alert; UPS backup minimum 4 hours."
        ),
        compliance_requirements=(
            "BIS/STQC certified where applicable; NDAA compliant; "
            "IP66 weatherproofing for outdoor cameras."
        ),
        delivery_requirements="Delivery within 45 days of PO; installation within 30 days of delivery.",
        warranty_requirements="3-year comprehensive warranty including labour; AMC provision for 2 years post-warranty.",
        estimated_unit_cost=45000.0,
        total_estimated_cost=2500000.0,
        justification=(
            "Current CCTV infrastructure (2018-vintage analogue) provides poor night-time resolution "
            "and is insufficient for evidence quality required for identification purposes. "
            + SYNTHETIC_NOTICE
        ),
        gem_category_code="CCTV-IP-CAM",
        gem_search_params={"category": "Surveillance Equipment", "keywords": "IP CCTV 4MP AI analytics"},
        prepared_by="user-proc-001",
        approved_by="user-sp-001",
        status="APPROVED",
        synthetic=True,
    )
    db.add(req)
    db.flush()

    event = ProcurementEvent(
        id="pe-cctv-001",
        requirement_id="preq-cctv-001",
        proposal_id="prop-syn-001",
        event_number="PE-20240301-CCTV",
        procurement_mode="e-Bid / Reverse Auction",
        gem_bid_number="GEM/2024/B/1234567",
        gem_order_number="GEMC-511687",
        status="AWARDED",
        bid_start_date="2024-03-01",
        bid_close_date="2024-03-22",
        bid_open_date="2024-03-23",
        bid_duration_days=21,
        total_bids_received=4,
        notes=(
            "Bid published on GeM portal 01-Mar-2024. "
            "Bid period: 21 days per GeM platform guidance. "
            "4 bids received. Technical evaluation completed 28-Mar-2024. "
            "Financial evaluation completed 02-Apr-2024. "
            + SYNTHETIC_NOTICE
        ),
        created_by="user-proc-001",
        synthetic=True,
    )
    db.add(event)
    db.flush()

    # Bids
    bids_data = [
        ("bid-cctv-a", "Demo Systems Alpha Pvt Ltd (Fictional)", "BID-A-2024-001", 2350000.0, "QUALIFIED", True, False,
         "4MP Hikvision-class IP camera (fictional), H.265, IR 40m, ONVIF, PoE, 3-year warranty",
         "4MP Sony STARVIS sensor class cameras, 40m IR, H.265, PoE, ONVIF v21.12, BIS certified"),
        ("bid-cctv-b", "Demo Surveillance Solutions Pvt Ltd (Fictional)", "BID-B-2024-001", 2480000.0, "QUALIFIED", False, False,
         "4MP Dahua-class IP camera (fictional), H.265, IR 30m, ONVIF, PoE, 3-year warranty",
         "4MP 1/3\" CMOS, 30m IR, H.265, ONVIF, PoE IEEE 802.3af, IP66"),
        ("bid-cctv-c", "Demo Tech Integrators (Fictional)", "BID-C-2024-001", 2280000.0, "NOT_QUALIFIED", False, False,
         "2MP class cameras (below spec), IR 20m",
         "2MP resolution offered — does not meet 4MP minimum specification"),
        ("bid-cctv-d", "Demo Security Systems Pvt Ltd (Fictional)", "BID-D-2024-001", 2550000.0, "QUALIFIED", False, False,
         "4MP Axis-class IP camera (fictional), H.265, IR 35m, ONVIF, PoE, 5-year warranty",
         "4MP with 5-year warranty; slight premium for extended warranty"),
    ]

    bid_objs = {}
    for bid_id, company, ref, amount, tech_status, is_l1, is_awarded, spec_offered, notes in bids_data:
        b = Bid(
            id=bid_id, event_id="pe-cctv-001", bid_reference=ref,
            company_name=company, bid_amount_inr=amount,
            quantity_offered="50 cameras + 5 NVR + 1 AI server",
            delivery_period="45 days from PO",
            warranty_offered="3 years comprehensive" if "Alpha" in company or "Surveillance" in company else ("5 years" if "Security" in company else "1 year"),
            offered_specification=spec_offered,
            country_of_origin="India (demo)",
            technical_qualification_status=tech_status,
            is_l1=is_l1, is_awarded=is_l1,
            notes=notes + " " + SYNTHETIC_NOTICE,
            synthetic=True,
        )
        db.add(b)
        bid_objs[bid_id] = b
    db.flush()

    # Technical evaluation
    te = TechnicalEvaluation(
        id="te-cctv-001",
        event_id="pe-cctv-001",
        evaluation_date="2024-03-28",
        demo_date="2024-03-26",
        venue="Police Headquarters Conference Room, Puducherry (Demo)",
        status="COMPLETED",
        overall_observations=(
            "Three of four bids met the technical specification. "
            "BID-C failed on resolution (2MP offered vs 4MP required). "
            "Product demonstrations conducted on 26-Mar-2024. "
            "BID-A, BID-B, BID-D qualified for financial evaluation. "
            + SYNTHETIC_NOTICE
        ),
        created_by="user-sp-001",
        synthetic=True,
    )
    db.add(te)
    db.flush()

    # Committee members
    committee = [
        ("DGP / SP Puducherry (Demo)", "Superintendent of Police", "CHAIRMAN", "Puducherry District"),
        ("DSP North (Demo)", "Dy. Superintendent of Police", "MEMBER", "North Division"),
        ("Procurement Officer (Demo)", "Procurement Officer", "MEMBER", "Stores & Finance"),
        ("Technical Expert (Demo)", "IT Wing In-charge", "TECHNICAL_EXPERT", "IT Wing"),
    ]
    for name, desig, role, dept in committee:
        db.add(EvaluationCommittee(
            id=_id(), evaluation_id="te-cctv-001",
            member_name=name, designation=desig, role=role, department=dept,
            synthetic=True,
        ))

    # Bidder evaluation lines (per spec field, per qualified bid)
    spec_fields = [
        ("resolution", "Minimum 4MP", {"bid-cctv-a": ("4MP", "COMPLIANT"), "bid-cctv-b": ("4MP", "COMPLIANT"), "bid-cctv-c": ("2MP", "NON_COMPLIANT"), "bid-cctv-d": ("4MP", "COMPLIANT")}),
        ("ir_range", "Minimum 30m", {"bid-cctv-a": ("40m", "COMPLIANT"), "bid-cctv-b": ("30m", "COMPLIANT"), "bid-cctv-c": ("20m", "NON_COMPLIANT"), "bid-cctv-d": ("35m", "COMPLIANT")}),
        ("compression", "H.265", {"bid-cctv-a": ("H.265", "COMPLIANT"), "bid-cctv-b": ("H.265", "COMPLIANT"), "bid-cctv-c": ("H.264 only", "NON_COMPLIANT"), "bid-cctv-d": ("H.265", "COMPLIANT")}),
        ("onvif", "ONVIF compliant", {"bid-cctv-a": ("ONVIF v21.12", "COMPLIANT"), "bid-cctv-b": ("ONVIF", "COMPLIANT"), "bid-cctv-c": ("Not certified", "NON_COMPLIANT"), "bid-cctv-d": ("ONVIF v20.06", "COMPLIANT")}),
        ("warranty", "3 years minimum", {"bid-cctv-a": ("3 years", "COMPLIANT"), "bid-cctv-b": ("3 years", "COMPLIANT"), "bid-cctv-c": ("1 year only", "NON_COMPLIANT"), "bid-cctv-d": ("5 years", "COMPLIANT")}),
    ]
    for field, req_val, bid_vals in spec_fields:
        for bid_id, (offered, status) in bid_vals.items():
            db.add(BidderEvaluation(
                id=_id(), evaluation_id="te-cctv-001", bid_id=bid_id,
                spec_field=field, required_value=req_val, offered_value=offered,
                compliance_status=status,
                evaluator_notes=(
                    "Specification confirmed during demo" if status == "COMPLIANT"
                    else "Does not meet minimum requirement — bid disqualified"
                ),
                evaluated_by="Technical Expert (Demo)",
                synthetic=True,
            ))
    db.flush()

    # Financial evaluation
    fe = FinancialEvaluation(
        id="fe-cctv-001",
        event_id="pe-cctv-001",
        evaluation_date="2024-04-02",
        technically_qualified_count=3,
        l1_bid_id="bid-cctv-a",
        l1_amount_inr=2350000.0,
        l1_identified_by="SP Puducherry (Demo)",
        finalized_by="user-sp-001",
        finalized_at=_utcnow(),
        status="FINALIZED",
        notes=(
            "Financial bids opened for 3 technically qualified bidders. "
            "BID-A (Demo Systems Alpha) is L1 at INR 23,50,000. "
            "Final award decision recorded by SP Puducherry. "
            + SYNTHETIC_NOTICE
        ),
        synthetic=True,
    )
    db.add(fe)
    db.flush()

    # Financial lines
    qualified_bids = [("bid-cctv-a", "Demo Systems Alpha Pvt Ltd (Fictional)", 2350000.0, True, 1, True),
                      ("bid-cctv-b", "Demo Surveillance Solutions Pvt Ltd (Fictional)", 2480000.0, True, 2, False),
                      ("bid-cctv-d", "Demo Security Systems Pvt Ltd (Fictional)", 2550000.0, True, 3, False),
                      ("bid-cctv-c", "Demo Tech Integrators (Fictional)", 2280000.0, False, None, False)]
    for bid_id, company, amount, qualified, rank, is_l1 in qualified_bids:
        db.add(FinancialBidLine(
            id=_id(), evaluation_id="fe-cctv-001", bid_id=bid_id,
            company_name=company, bid_amount_inr=amount,
            is_technically_qualified=qualified, rank=rank, is_l1=is_l1,
            notes="Disqualified at technical stage — amount not opened" if not qualified else None,
            synthetic=True,
        ))
    db.flush()

    # Purchase Order
    po = PurchaseOrder(
        id="po-cctv-001",
        event_id="pe-cctv-001",
        proposal_id="prop-syn-001",
        po_number="PO/PDY/CCTV/2024/001",
        gem_order_number="GEMC-511687",
        vendor_name="Demo Systems Alpha Pvt Ltd (Fictional)",
        vendor_reference="DSA-2024-PDY-001",
        quantity="50 cameras + 5 NVR + 1 AI server",
        unit_price_inr=47000.0,
        total_amount_inr=2350000.0,
        po_date="2024-04-10",
        expected_delivery_date="2024-05-25",
        actual_delivery_date="2024-05-28",
        delivery_location="Police Headquarters, Puducherry (Demo)",
        status="ACCEPTED",
        inspection_note=(
            "Delivery received 28-May-2024. Inspection committee verified all 50 cameras, "
            "5 NVR units and AI server. All items conform to specification. "
            "Installation completed 15-Jun-2024. Accepted. "
            + SYNTHETIC_NOTICE
        ),
        created_by="user-proc-001",
        synthetic=True,
    )
    db.add(po)
    db.flush()


# ---------------------------------------------------------------------------
# SCENARIO 2: Digital Radio — technical evaluation stage
# ---------------------------------------------------------------------------

def _seed_radio_procurement(db: Session) -> None:
    req = ProcurementRequirement(
        id="preq-radio-001",
        proposal_id="prop-syn-004",
        category="communication",
        item_description="Digital Encrypted Radio Handsets for Patrol Units",
        quantity="40 handsets + spare batteries",
        unit_of_measure="handset",
        functional_requirements="Encrypted field communications; 8-hour battery life; ERSS integration.",
        technical_specification=(
            "DMR standard; AES-256 encryption; UHF/VHF dual band; "
            "minimum 8h battery per shift; IP55 dust/water protection; "
            "BIS certified."
        ),
        compliance_requirements="BIS/TEC type approval; encryption certification.",
        delivery_requirements="Delivery within 30 days of PO.",
        warranty_requirements="2-year comprehensive warranty.",
        total_estimated_cost=640000.0,
        justification=(
            "Analogue radios susceptible to monitoring; frequent battery failures; "
            "incompatible with new ERSS system. " + SYNTHETIC_NOTICE
        ),
        gem_category_code="COMM-RADIO-DIGITAL",
        gem_search_params={"category": "Communication Equipment", "keywords": "Digital Radio DMR AES encrypted"},
        prepared_by="user-proc-001",
        status="FINALIZED",
        synthetic=True,
    )
    db.add(req)
    db.flush()

    event = ProcurementEvent(
        id="pe-radio-001",
        requirement_id="preq-radio-001",
        proposal_id="prop-syn-004",
        event_number="PE-20240601-RADIO",
        procurement_mode="Direct Purchase with L1",
        gem_bid_number="GEM/2024/B/7654321",
        status="TECHNICAL_EVALUATION",
        bid_start_date="2024-06-01",
        bid_close_date="2024-06-21",
        bid_open_date="2024-06-22",
        bid_duration_days=21,
        total_bids_received=3,
        notes="3 bids received. Technical evaluation in progress. " + SYNTHETIC_NOTICE,
        created_by="user-proc-001",
        synthetic=True,
    )
    db.add(event)
    db.flush()

    for bid_id, company, ref, amount, tech_status, spec_offered in [
        ("bid-radio-a", "Demo Radio House Pvt Ltd (Fictional)", "BID-RA-001", 618000.0, "QUALIFIED",
         "Motorola-class DMR, AES-256, UHF/VHF, 10h battery, IP55, BIS certified"),
        ("bid-radio-b", "Demo Comms Supply Co. (Fictional)", "BID-RB-001", 635000.0, "UNDER_EVALUATION",
         "Kenwood-class DMR, AES-256, UHF/VHF, 8h battery, IP55"),
        ("bid-radio-c", "Demo Electronics Ltd (Fictional)", "BID-RC-001", 592000.0, "UNDER_EVALUATION",
         "Generic brand DMR, encryption to be verified, VHF only"),
    ]:
        db.add(Bid(
            id=bid_id, event_id="pe-radio-001", bid_reference=ref,
            company_name=company, bid_amount_inr=amount,
            quantity_offered="40 handsets + 40 spare batteries",
            delivery_period="30 days from PO",
            warranty_offered="2 years",
            offered_specification=spec_offered,
            technical_qualification_status=tech_status,
            notes=SYNTHETIC_NOTICE, synthetic=True,
        ))
    db.flush()

    te = TechnicalEvaluation(
        id="te-radio-001",
        event_id="pe-radio-001",
        evaluation_date="2024-06-28",
        demo_date="2024-06-27",
        venue="Police HQ Wireless Room, Puducherry (Demo)",
        status="IN_PROGRESS",
        overall_observations="Technical evaluation in progress. Demo conducted 27-Jun-2024. " + SYNTHETIC_NOTICE,
        created_by="user-sp-001",
        synthetic=True,
    )
    db.add(te)
    db.flush()

    db.add(EvaluationCommittee(
        id=_id(), evaluation_id="te-radio-001",
        member_name="SP Puducherry (Demo)", designation="Superintendent of Police",
        role="CHAIRMAN", department="Puducherry District", synthetic=True,
    ))
    db.add(EvaluationCommittee(
        id=_id(), evaluation_id="te-radio-001",
        member_name="Wireless Officer (Demo)", designation="Inspector Wireless",
        role="TECHNICAL_EXPERT", department="Wireless Section", synthetic=True,
    ))
    db.flush()


# ---------------------------------------------------------------------------
# SCENARIO 3: CCTNS Workstation — bid stage
# ---------------------------------------------------------------------------

def _seed_cctns_procurement(db: Session) -> None:
    req = ProcurementRequirement(
        id="preq-cctns-001",
        proposal_id="prop-syn-020",
        category="technology",
        item_description="CCTNS Workstations — 12 units for all police stations",
        quantity="12 workstations",
        unit_of_measure="workstation",
        functional_requirements="Run CCTNS client application; stable 24×7 operation; crash-free data entry.",
        technical_specification=(
            "Intel Core i5 minimum; 16GB RAM; 512GB SSD; Windows 11 Pro; "
            "UPS 600VA; CCTNS-certified hardware configuration."
        ),
        compliance_requirements="CCTNS technical specifications from NIC.",
        delivery_requirements="Delivery and setup within 30 days.",
        warranty_requirements="3-year onsite warranty.",
        total_estimated_cost=840000.0,
        justification="6 stations have non-functional CCTNS machines causing data entry delays. " + SYNTHETIC_NOTICE,
        gem_category_code="COMP-DESKTOP",
        gem_search_params={"category": "Desktop Computers", "keywords": "i5 16GB 512GB SSD Windows 11 Pro"},
        prepared_by="user-proc-001",
        status="DRAFT",
        synthetic=True,
    )
    db.add(req)
    db.flush()

    event = ProcurementEvent(
        id="pe-cctns-001",
        requirement_id="preq-cctns-001",
        proposal_id="prop-syn-020",
        event_number="PE-20240901-CCTNS",
        procurement_mode="Direct Purchase with L1",
        gem_bid_number="GEM/2024/B/9999001",
        status="BID_OPENING",
        bid_start_date="2024-09-01",
        bid_close_date="2024-09-21",
        bid_open_date="2024-09-22",
        bid_duration_days=21,
        total_bids_received=5,
        notes="5 bids received. Bid opening in progress. " + SYNTHETIC_NOTICE,
        created_by="user-proc-001",
        synthetic=True,
    )
    db.add(event)
    db.flush()


# ---------------------------------------------------------------------------
# Main seed function
# ---------------------------------------------------------------------------

def seed_procurement_data(db: Session) -> None:
    """Idempotent seed — runs only if ApprovalMatrix table is empty."""
    if db.scalar(select(ApprovalMatrix.id).limit(1)):
        return  # already seeded

    # Approval matrix
    for am in APPROVAL_MATRIX_DATA:
        db.add(ApprovalMatrix(
            id=am["id"],
            authority_level=am["authority_level"],
            required_role=am["required_role"],
            min_amount_inr=am["min_amount_inr"],
            max_amount_inr=am["max_amount_inr"],
            description=am["description"],
            is_active=True,
            synthetic=True,
        ))
    db.flush()

    # Check that the referenced proposals exist before seeding procurement data
    try:
        from .models_v1 import Proposal as _Prop
        cctv_exists  = db.scalar(select(_Prop).where(_Prop.id == "prop-syn-001")) is not None
        radio_exists = db.scalar(select(_Prop).where(_Prop.id == "prop-syn-004")) is not None
        cctns_exists = db.scalar(select(_Prop).where(_Prop.id == "prop-syn-020")) is not None
    except Exception:
        cctv_exists = radio_exists = cctns_exists = False

    if cctv_exists:
        _seed_cctv_procurement(db)
    if radio_exists:
        _seed_radio_procurement(db)
    if cctns_exists:
        _seed_cctns_procurement(db)

    db.flush()
