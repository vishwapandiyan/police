"""Seed synthetic proposals, stations, outcomes and lessons for the v1 lifecycle demo.

All records are clearly labelled SYNTHETIC DEMO DATA.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models_v1 import (
    DecisionAction,
    GeMReference,
    ImplementationRecord,
    LessonRecord,
    OutcomeRecord,
    PoliceStation,
    Proposal,
)

SYNTHETIC = "SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


STATIONS = [
    {"id": "stn-001", "code": "PDY-CTRL", "name": "Puducherry Central Station (Demo)", "region": "Puducherry", "district": "Puducherry"},
    {"id": "stn-002", "code": "PDY-NORTH", "name": "North Puducherry Station (Demo)", "region": "Puducherry", "district": "Puducherry"},
    {"id": "stn-003", "code": "PDY-SOUTH", "name": "South Puducherry Station (Demo)", "region": "Puducherry", "district": "Puducherry"},
    {"id": "stn-004", "code": "PDY-WEST", "name": "West Puducherry Station (Demo)", "region": "Puducherry", "district": "Puducherry"},
    {"id": "stn-005", "code": "KAR-001", "name": "Karaikal Station (Demo)", "region": "Karaikal", "district": "Karaikal"},
    {"id": "stn-006", "code": "MAH-001", "name": "Mahe Station (Demo)", "region": "Mahe", "district": "Mahe"},
    {"id": "stn-007", "code": "YAN-001", "name": "Yanam Station (Demo)", "region": "Yanam", "district": "Yanam"},
]

DEMO_PROPOSALS = [
    # TECHNOLOGY
    {
        "id": "prop-syn-001", "proposal_number": "PRISM-20240101-CCTV1",
        "title": "AI-Enabled CCTV & Video Analytics Modernization — Puducherry Central (Demo)",
        "description": "Flagship modernization of surveillance infrastructure at central station with AI video analytics capabilities.",
        "department": "Technical Wing", "unit": "Surveillance", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "technology", "priority": "HIGH", "estimated_cost": 2500000, "currency": "INR",
        "quantity": "50 cameras + 5 NVR units + AI analytics server",
        "purpose": "Upgrade aging analogue CCTV infrastructure to IP-based system with AI analytics for improved situational awareness",
        "problem_statement": "Current 2018-vintage analogue cameras provide poor night-time resolution. Evidence quality insufficient for identification purposes.",
        "expected_outcome": "Real-time HD surveillance with AI-powered anomaly detection; 30-day evidence retention; integration with ERSS",
        "technology": "IP CCTV, AI Video Analytics, NVR, PoE switches", "specification": "4MP IP cameras; H.265; 30m IR; ONVIF; 30-day retention NVR; AI analytics module",
        "expected_completion_date": "2024-09-30", "status": "APPROVED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-002", "proposal_number": "PRISM-20240102-CCTV2",
        "title": "CCTV Expansion — North and South Stations (Demo)",
        "description": "Expansion of pilot CCTV network to cover North and South stations.",
        "department": "Technical Wing", "unit": "Surveillance", "region": "Puducherry", "station": "North Puducherry Station (Demo)",
        "category": "technology", "priority": "NORMAL", "estimated_cost": 1200000, "currency": "INR",
        "quantity": "24 cameras + 2 NVR units",
        "purpose": "Extend surveillance coverage to remaining district stations following successful central station pilot",
        "problem_statement": "North and South stations lack adequate CCTV coverage following the central station pilot success.",
        "expected_outcome": "Uniform surveillance coverage across Puducherry district",
        "technology": "IP CCTV, NVR", "specification": "Matching pilot spec: 1080p, H.265, IR 30m, ONVIF, 30-day NVR",
        "expected_completion_date": "2024-12-31", "status": "RETURNED_FOR_MODIFICATION", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-003", "proposal_number": "PRISM-20240103-NET",
        "title": "Secure Intranet Network Upgrade — District HQ (Demo)",
        "description": "Upgrade of internal network infrastructure at district headquarters.",
        "department": "IT Wing", "unit": "Communications", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "technology", "priority": "HIGH", "estimated_cost": 850000, "currency": "INR",
        "quantity": "1 network upgrade (switches, cabling, firewall)",
        "purpose": "Replace decade-old network infrastructure that causes frequent outages affecting CCTNS operations",
        "problem_statement": "Current network causes 3-4 outages per month impacting CCTNS connectivity.",
        "expected_outcome": "99.5% uptime; gigabit internal network; improved CCTNS performance",
        "technology": "Managed switches, Cat6 cabling, next-gen firewall", "specification": "48-port managed switch; Cat6A; stateful firewall with IDS/IPS",
        "expected_completion_date": "2024-08-15", "status": "SUBMITTED_FOR_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # COMMUNICATION
    {
        "id": "prop-syn-004", "proposal_number": "PRISM-20240201-RAD",
        "title": "Digital Radio Handset Replacement — Patrol Units (Demo)",
        "description": "Replace aging analogue radio handsets with encrypted digital units.",
        "department": "Operations", "unit": "Patrol", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "communication", "priority": "HIGH", "estimated_cost": 640000, "currency": "INR",
        "quantity": "40 digital handsets + spare batteries",
        "purpose": "Improve field communication security and interoperability with district control room",
        "problem_statement": "Analogue radios susceptible to monitoring; frequent battery failures; incompatible with new ERSS system.",
        "expected_outcome": "Encrypted field communications; 8-hour battery life; ERSS integration",
        "technology": "Digital handheld radio, encryption", "specification": "DMR standard; AES encryption; UHF/VHF dual band; minimum 8h battery",
        "expected_completion_date": "2024-06-30", "status": "COMPLETED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-005", "proposal_number": "PRISM-20240202-ERSS",
        "title": "ERSS Integration Enhancement — Control Room (Demo)",
        "description": "Upgrade Emergency Response Support System integration at district control room.",
        "department": "Control Room", "unit": "Emergency Response", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "communication", "priority": "HIGH", "estimated_cost": 1500000, "currency": "INR",
        "quantity": "1 system integration project",
        "purpose": "Integrate new ERSS 112 platform with existing CAD and dispatch systems",
        "problem_statement": "Current ERSS has manual dispatch; integration with CAD requires manual re-entry causing 2-3 minute delays.",
        "expected_outcome": "Automated dispatch; sub-60-second response initiation; unified dashboard",
        "technology": "ERSS 112, CAD integration, API middleware", "specification": "REST API integration; real-time data sync; fallback manual mode",
        "expected_completion_date": "2024-10-31", "status": "UNDER_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # INFRASTRUCTURE
    {
        "id": "prop-syn-006", "proposal_number": "PRISM-20240301-BLDG",
        "title": "Station Building Renovation — Karaikal (Demo)",
        "description": "Structural renovation and modernization of Karaikal station building.",
        "department": "Infrastructure", "unit": "Works", "region": "Karaikal", "station": "Karaikal Station (Demo)",
        "category": "infrastructure", "priority": "NORMAL", "estimated_cost": 3200000, "currency": "INR",
        "quantity": "1 building renovation project",
        "purpose": "Address structural deficiencies and improve working conditions at aging station building (built 1985)",
        "problem_statement": "Building shows structural cracks; inadequate sanitation; poor accessibility for persons with disabilities.",
        "expected_outcome": "Structurally sound building; modern facilities; PwD accessibility compliance",
        "technology": "Civil construction", "specification": "As per PWD specifications; earthquake resistance Zone II; PwD compliance",
        "expected_completion_date": "2025-03-31", "status": "APPROVED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-007", "proposal_number": "PRISM-20240302-SOLAR",
        "title": "Solar Power Installation — Yanam Station (Demo)",
        "description": "Install rooftop solar panels to reduce electricity costs and ensure uninterrupted power.",
        "department": "Infrastructure", "unit": "Works", "region": "Yanam", "station": "Yanam Station (Demo)",
        "category": "infrastructure", "priority": "NORMAL", "estimated_cost": 580000, "currency": "INR",
        "quantity": "10 kW solar installation",
        "purpose": "Reduce electricity bills and ensure 24x7 power availability for critical equipment",
        "problem_statement": "Frequent power cuts affect CCTNS and communication equipment; high electricity costs.",
        "expected_outcome": "40% reduction in electricity costs; uninterrupted power for critical equipment",
        "technology": "Solar PV, battery backup, inverter", "specification": "10 kW ground-mounted/rooftop; 20 kWh battery backup; net metering capable",
        "expected_completion_date": "2024-11-30", "status": "SUBMITTED_FOR_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # TRAINING
    {
        "id": "prop-syn-008", "proposal_number": "PRISM-20240401-TRAIN1",
        "title": "Digital Evidence Handling Training Programme (Demo)",
        "description": "Structured training programme on digital evidence collection, handling and preservation.",
        "department": "Training", "unit": "Training Wing", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "training", "priority": "NORMAL", "estimated_cost": 180000, "currency": "INR",
        "quantity": "3 batches of 20 officers each",
        "purpose": "Upskill investigating officers on digital evidence per new criminal law requirements",
        "problem_statement": "New criminal laws (BNS/BNSS) mandate digital evidence handling capabilities; current skills gap identified in inspection.",
        "expected_outcome": "60 officers trained; updated SOP for digital evidence; improved court presentation",
        "technology": "Training services, digital evidence tools demonstration", "specification": "2-day workshop per batch; certified trainer; hands-on practical sessions",
        "expected_completion_date": "2024-07-31", "status": "COMPLETED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-009", "proposal_number": "PRISM-20240402-TRAIN2",
        "title": "Cybercrime Investigation Training — Advanced (Demo)",
        "description": "Advanced cybercrime investigation training for cyber cell personnel.",
        "department": "Training", "unit": "Cyber Cell", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "training", "priority": "NORMAL", "estimated_cost": 350000, "currency": "INR",
        "quantity": "1 batch of 10 cyber cell officers",
        "purpose": "Build advanced cybercrime investigation capabilities for increasingly complex cases",
        "problem_statement": "Cyber cases have increased 40% year-on-year; current team lacks advanced forensics skills.",
        "expected_outcome": "10 officers with advanced cyber investigation certification; improved cyber case closure rate",
        "technology": "Cybercrime investigation tools, forensic software", "specification": "5-day intensive; CERT-In certified course; practical lab sessions",
        "expected_completion_date": "2024-09-30", "status": "UNDER_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # VEHICLES
    {
        "id": "prop-syn-010", "proposal_number": "PRISM-20240501-VEH1",
        "title": "Patrol Vehicle Fleet Renewal — District (Demo)",
        "description": "Replace 8 patrol vehicles (>10 years old) with new patrol cars.",
        "department": "Operations", "unit": "Patrol", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "vehicles", "priority": "HIGH", "estimated_cost": 7200000, "currency": "INR",
        "quantity": "8 patrol vehicles (SUV class)",
        "purpose": "Replace high-mileage patrol fleet that causes operational downtime and safety risks",
        "problem_statement": "8 vehicles over 10 years old with >200,000 km mileage; breakdown rate 2.3 per vehicle per month.",
        "expected_outcome": "Reliable patrol capability; reduced maintenance cost; improved officer safety",
        "technology": "Diesel/Petrol SUV", "specification": "SUV, minimum 2000cc, 4-wheel drive, 7-seater, police fitment package",
        "expected_completion_date": "2024-12-31", "status": "DRAFT", "analysis_status": "NOT_ANALYZED",
    },
    # PROCUREMENT
    {
        "id": "prop-syn-011", "proposal_number": "PRISM-20240601-EQUIP1",
        "title": "Body-Worn Camera Pilot — Traffic Wing (Demo)",
        "description": "Pilot deployment of body-worn cameras for traffic enforcement officers.",
        "department": "Traffic", "unit": "Traffic Wing", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "procurement", "priority": "NORMAL", "estimated_cost": 420000, "currency": "INR",
        "quantity": "20 body-worn cameras + docking stations",
        "purpose": "Improve evidence collection for traffic violations and reduce disputes at enforcement points",
        "problem_statement": "Traffic violations increasingly disputed without video evidence; officer accountability concerns.",
        "expected_outcome": "Video evidence for 100% of recorded violations; dispute reduction",
        "technology": "Body-worn camera, docking station, evidence management software", "specification": "Full HD 1080p; 8-hour battery; GPS; tamper-evident seal; cloud evidence management",
        "expected_completion_date": "2024-08-31", "status": "SUBMITTED_FOR_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-012", "proposal_number": "PRISM-20240602-EQUIP2",
        "title": "Fingerprint Scanner Upgrade — Forensic Unit (Demo)",
        "description": "Replace aging fingerprint scanners with new AFIS-compatible devices.",
        "department": "Forensic", "unit": "Forensic Science", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "procurement", "priority": "HIGH", "estimated_cost": 520000, "currency": "INR",
        "quantity": "4 fingerprint scanners",
        "purpose": "Upgrade forensic fingerprint capture capability for AFIS integration",
        "problem_statement": "Current scanners are 8 years old; resolution inadequate for AFIS Level 3 features.",
        "expected_outcome": "AFIS-compatible high-resolution fingerprint capture; improved match rates",
        "technology": "Optical fingerprint scanner, AFIS integration", "specification": "500 dpi minimum; FBI/NIST certified; AFIS integration API; 10-print capture",
        "expected_completion_date": "2024-07-31", "status": "APPROVED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # OPERATIONAL
    {
        "id": "prop-syn-013", "proposal_number": "PRISM-20240701-OPS1",
        "title": "Drone Surveillance Unit Establishment (Demo)",
        "description": "Establish a drone surveillance capability for crowd management and search operations.",
        "department": "Operations", "unit": "Drone Unit", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "operational", "priority": "NORMAL", "estimated_cost": 1800000, "currency": "INR",
        "quantity": "5 surveillance drones + ground control station",
        "purpose": "Provide aerial surveillance capability for large events, VIP security, and search & rescue operations",
        "problem_statement": "Lack of aerial surveillance for large events (Pongal, Tamil New Year) requiring 200+ officers on ground.",
        "expected_outcome": "Aerial coverage for events >5000 persons; SAR capability; VIP advance recon",
        "technology": "Surveillance UAV, gimbal camera, ground control", "specification": "30-min flight time; 4K zoom camera; thermal option; DGCA type-approved",
        "expected_completion_date": "2025-01-31", "status": "UNDER_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-014", "proposal_number": "PRISM-20240702-OPS2",
        "title": "Crowd Management Equipment — Riot Control (Demo)",
        "description": "Procurement of standardized crowd management equipment for special units.",
        "department": "Operations", "unit": "Special Force", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "operational", "priority": "HIGH", "estimated_cost": 960000, "currency": "INR",
        "quantity": "Complete equipment sets for 3 platoons",
        "purpose": "Standardize and modernize crowd management equipment per MHA guidelines",
        "problem_statement": "Current equipment is non-standard across units; some items beyond service life.",
        "expected_outcome": "Standardized equipment across all platoons; MHA compliance",
        "technology": "Protective equipment, crowd control devices", "specification": "As per MHA/CAPF recommended specifications",
        "expected_completion_date": "2024-10-31", "status": "REJECTED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # ADMINISTRATIVE
    {
        "id": "prop-syn-015", "proposal_number": "PRISM-20240801-ADMIN1",
        "title": "e-Office Implementation — District Headquarters (Demo)",
        "description": "Implement e-Office platform for digital file management at district HQ.",
        "department": "Administration", "unit": "IT Wing", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "administrative", "priority": "NORMAL", "estimated_cost": 250000, "currency": "INR",
        "quantity": "1 e-Office implementation",
        "purpose": "Transition from physical file movement to digital workflow management",
        "problem_statement": "Physical files take 3-5 days to route; no tracking; loss of files reported.",
        "expected_outcome": "Digital file routing; real-time tracking; audit trail; 80% reduction in paper",
        "technology": "e-Office, digital signature, scanning", "specification": "NIC e-Office platform; DSC integration; scanning station at each branch",
        "expected_completion_date": "2024-09-30", "status": "COMPLETED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    # More proposals to reach diversity across all statuses
    {
        "id": "prop-syn-016", "proposal_number": "PRISM-20240101-CCTV3",
        "title": "CCTV Pilot — Mahe District (Demo)",
        "description": "Initial CCTV pilot for Mahe district stations.",
        "department": "Technical Wing", "unit": "Surveillance", "region": "Mahe", "station": "Mahe Station (Demo)",
        "category": "technology", "priority": "NORMAL", "estimated_cost": 450000, "currency": "INR",
        "quantity": "8 cameras + 1 NVR",
        "purpose": "Pilot CCTV deployment at Mahe station before district-wide rollout",
        "problem_statement": "Mahe station has no CCTV coverage; incidents at station premises not recorded.",
        "expected_outcome": "24x7 recording; evidence capability; station perimeter coverage",
        "technology": "IP CCTV, NVR", "specification": "1080p; IR 30m; PoE; ONVIF; 30-day NVR",
        "expected_completion_date": "2024-06-30", "status": "COMPLETED", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-017", "proposal_number": "PRISM-20240901-CYBER",
        "title": "Cyber Forensics Laboratory Setup (Demo)",
        "description": "Establish a dedicated cyber forensics laboratory.",
        "department": "Forensic", "unit": "Cyber Cell", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "technology", "priority": "HIGH", "estimated_cost": 4500000, "currency": "INR",
        "quantity": "1 laboratory setup",
        "purpose": "Create dedicated cyber forensics capability for digital evidence extraction and analysis",
        "problem_statement": "Cyber cases sent to state FSL causing 3-6 month delays. Digital evidence backlog of 47 cases.",
        "expected_outcome": "In-house forensic capability; 4-week turnaround; NABL accreditation pathway",
        "technology": "Cellebrite UFED, EnCase/FTK, write blockers, Faraday cages", "specification": "Industry-standard forensic software suite; certified hardware write blockers; clean room facility",
        "expected_completion_date": "2025-03-31", "status": "DRAFT", "analysis_status": "NOT_ANALYZED",
    },
    {
        "id": "prop-syn-018", "proposal_number": "PRISM-20241001-WELFARE",
        "title": "Officers' Welfare — Gymnasium and Recreation Facility (Demo)",
        "description": "Establish gymnasium and recreation facility at police lines.",
        "department": "Welfare", "unit": "Welfare Wing", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "welfare", "priority": "LOW", "estimated_cost": 1200000, "currency": "INR",
        "quantity": "1 facility setup",
        "purpose": "Improve physical fitness and mental wellness of serving officers",
        "problem_statement": "Rising stress-related health issues; fitness standards declining per annual medical examination.",
        "expected_outcome": "Improved fitness scores; stress reduction; better retention",
        "technology": "Gym equipment, recreation equipment", "specification": "Commercial grade gym equipment; indoor games facility; counselling room",
        "expected_completion_date": "2024-12-31", "status": "DRAFT", "analysis_status": "NOT_ANALYZED",
    },
    {
        "id": "prop-syn-019", "proposal_number": "PRISM-20241101-TRAFFIC",
        "title": "Automated Traffic Enforcement — Major Junctions (Demo)",
        "description": "Install automated speed and red-light cameras at 10 major junctions.",
        "department": "Traffic", "unit": "Traffic Wing", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "technology", "priority": "HIGH", "estimated_cost": 6500000, "currency": "INR",
        "quantity": "10 junction systems (speed + red-light cameras)",
        "purpose": "Reduce road accidents at high-risk junctions through automated enforcement",
        "problem_statement": "10 junctions account for 65% of serious road accidents; manual enforcement insufficient.",
        "expected_outcome": "30% accident reduction at target junctions; 200+ automated challan per day",
        "technology": "ANPR, speed radar, signal integration, challan management", "specification": "ANPR; speed radar; signal integration; e-challan API; real-time dashboard",
        "expected_completion_date": "2025-06-30", "status": "SUBMITTED_FOR_REVIEW", "analysis_status": "ANALYSIS_COMPLETE",
    },
    {
        "id": "prop-syn-020", "proposal_number": "PRISM-20241201-CCCTNS",
        "title": "CCTNS Workstation Upgrade — All Stations (Demo)",
        "description": "Upgrade CCTNS workstations across all 12 stations.",
        "department": "IT Wing", "unit": "CCTNS Cell", "region": "Puducherry", "station": "Puducherry Central Station (Demo)",
        "category": "technology", "priority": "HIGH", "estimated_cost": 840000, "currency": "INR",
        "quantity": "12 workstations (one per station)",
        "purpose": "Upgrade aging CCTNS workstations that cause slow data entry and frequent crashes",
        "problem_statement": "CCTNS workstations average 6 years old; 3 stations have non-functional machines; data entry delayed.",
        "expected_outcome": "100% operational CCTNS workstations; faster data entry; no crashes",
        "technology": "Desktop computer, Windows, CCTNS client", "specification": "i5 min; 16GB RAM; 512GB SSD; Windows 11 Pro; UPS; CCTNS certified config",
        "expected_completion_date": "2024-09-30", "status": "APPROVED", "analysis_status": "ANALYSIS_COMPLETE",
    },
]

# More proposals to reach 60 total
ADDITIONAL_PROPOSALS = [
    {"id": f"prop-syn-{i:03d}", "proposal_number": f"PRISM-2024{i:04d}-AUTO",
     "title": f"Synthetic Demo Proposal {i} — {cat} (Demo)",
     "department": dept, "unit": unit, "region": region, "station": station,
     "category": cat, "priority": priority, "estimated_cost": cost, "currency": "INR",
     "quantity": quantity, "purpose": purpose, "problem_statement": problem,
     "expected_outcome": outcome, "technology": tech, "specification": spec,
     "expected_completion_date": "2025-03-31", "status": status, "analysis_status": "ANALYSIS_COMPLETE"}
    for i, (cat, dept, unit, region, station, priority, cost, quantity, purpose, problem, outcome, tech, spec, status) in enumerate([
        ("technology", "IT Wing", "Network", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 750000, "Network upgrade", "Improve network reliability", "Network outages affect operations", "99% uptime", "Cat6, switches", "Managed switches, Cat6", "DRAFT"),
        ("training", "Training", "Training Wing", "Karaikal", "Karaikal Station (Demo)", "LOW", 90000, "1 batch 15 officers", "Traffic law training", "Officers need refresher on new traffic regulations", "Updated knowledge", "Training materials", "Instructor-led training", "SUBMITTED_FOR_REVIEW"),
        ("communication", "Operations", "Wireless", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 320000, "20 radios", "Replace failing radios", "Radio failures during critical operations", "Reliable communications", "VHF/UHF radios", "Digital encrypted radios", "UNDER_REVIEW"),
        ("procurement", "Stores", "Stores", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 210000, "100 uniforms", "Annual uniform procurement", "Officers need new uniforms", "Standardized uniforms", "Textile", "BIS certified fabric, standard police cut", "APPROVED"),
        ("infrastructure", "Infrastructure", "Works", "Yanam", "Yanam Station (Demo)", "NORMAL", 450000, "1 boundary wall", "Security wall for station compound", "Station compound security inadequate", "Secured perimeter", "Civil construction", "RCC boundary wall, barbed wire", "COMPLETED"),
        ("technology", "IT Wing", "Cyber", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 1200000, "1 cybercrime software suite", "Cybercrime investigation tools", "Cyber cases increasing without tools", "Improved cyber investigation", "OSINT, forensic tools", "Licensed forensic software", "SUBMITTED_FOR_REVIEW"),
        ("vehicles", "Operations", "Patrol", "Karaikal", "Karaikal Station (Demo)", "HIGH", 1800000, "2 patrol vehicles", "Replace broken patrol vehicles", "2 patrol vehicles non-functional", "Operational patrol fleet", "SUV patrol vehicle", "SUV 2000cc, 4WD", "UNDER_REVIEW"),
        ("welfare", "Welfare", "Welfare", "Puducherry", "Puducherry Central Station (Demo)", "LOW", 350000, "Canteen upgrade", "Improve staff canteen", "Canteen facility inadequate", "Better welfare facilities", "Kitchen equipment", "Commercial kitchen, seating", "DRAFT"),
        ("operational", "Operations", "Special Branch", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 680000, "Surveillance equipment set", "Covert surveillance capability", "Lack of portable surveillance tools", "Mobile surveillance capability", "Surveillance camera, recorder", "Portable covert camera system", "APPROVED"),
        ("administrative", "Administration", "Administration", "Mahe", "Mahe Station (Demo)", "NORMAL", 120000, "1 document scanner setup", "Digitise old records", "Physical records degrading", "Digital archive", "Scanner, storage", "A3 flatbed scanner, NAS storage", "COMPLETED"),
        ("technology", "Traffic", "Traffic Wing", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 890000, "5 speed radar units", "Speed enforcement equipment", "Speed violation evidence quality poor", "Reliable speed enforcement", "Speed radar", "Certified speed radar, ANPR", "SUBMITTED_FOR_REVIEW"),
        ("training", "Training", "Training Wing", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 160000, "2 batches women officers", "Women officer safety training", "Need for women officer specialisation", "Specialised skill development", "Training services", "Specialised self-defence, investigation", "COMPLETED"),
        ("infrastructure", "Infrastructure", "Works", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 780000, "Station toilet renovation", "Upgrade station sanitation", "Station toilets fail health standards", "Clean sanitation facilities", "Sanitation fixtures", "Tiled, ventilated, PwD accessible toilets", "APPROVED"),
        ("communication", "Operations", "Control Room", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 550000, "Control room display upgrade", "Upgrade control room displays", "Outdated displays for situational awareness", "Modern situational awareness", "LED video wall", "2x2 LED video wall 55-inch", "UNDER_REVIEW"),
        ("procurement", "Stores", "Stores", "Karaikal", "Karaikal Station (Demo)", "NORMAL", 85000, "Office furniture", "Replace broken furniture", "Station furniture deteriorated", "Functional work environment", "Furniture", "Standard office furniture", "DRAFT"),
        ("technology", "IT Wing", "CCTNS", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 420000, "Server upgrade", "Upgrade CCTNS server", "CCTNS server showing hardware failures", "Reliable CCTNS operation", "Server hardware", "Rack server 16-core, 64GB RAM", "SUBMITTED_FOR_REVIEW"),
        ("operational", "Traffic", "Traffic Wing", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 280000, "Portable VMS units", "Portable variable message signs for events", "No portable traffic guidance for events", "Better traffic management at events", "Variable message sign", "LED VMS, portable, solar powered", "APPROVED"),
        ("vehicles", "Operations", "Patrol", "Mahe", "Mahe Station (Demo)", "HIGH", 900000, "1 mobile command vehicle", "Mobile command post vehicle", "No mobile command capability for major incidents", "Incident command capability", "Converted van/bus", "Command vehicle with comms suite", "DRAFT"),
        ("welfare", "Welfare", "Welfare", "Karaikal", "Karaikal Station (Demo)", "LOW", 220000, "Rest room construction", "Build rest room at station", "No overnight rest facility for constables", "Adequate rest facilities", "Civil construction", "Dormitory-style rest room, 20 beds", "COMPLETED"),
        ("training", "Training", "Training Wing", "Yanam", "Yanam Station (Demo)", "NORMAL", 75000, "1 batch, community policing", "Community policing training", "Improve community relations skills", "Better community engagement", "Training services", "Community policing best practices", "SUBMITTED_FOR_REVIEW"),
        ("procurement", "Forensic", "Forensic", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 350000, "Forensic consumables annual", "Annual forensic consumable stock", "Forensic consumables running low", "Adequate forensic stock", "Consumables", "Approved forensic grade consumables", "APPROVED"),
        ("infrastructure", "Infrastructure", "Works", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 1100000, "Generator replacement", "Replace main generator", "Main backup generator failed", "Reliable backup power", "Diesel generator", "100 kVA DG set, ATS panel", "UNDER_REVIEW"),
        ("technology", "IT Wing", "Cyber", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 2200000, "Mobile forensics lab vehicle", "Mobile cyber forensics van", "Need rapid response cyber forensics", "On-site forensics capability", "Mobile lab van", "Converted van with forensic workstation", "DRAFT"),
        ("communication", "Operations", "Wireless", "Karaikal", "Karaikal Station (Demo)", "NORMAL", 180000, "Repeater station Karaikal", "Radio repeater for Karaikal coverage", "Radio dead zones in Karaikal district", "Full coverage across district", "VHF/UHF repeater", "Duplexer, antenna, repeater unit", "COMPLETED"),
        ("operational", "Operations", "Special Branch", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 750000, "Portable detector equipment", "Metal and explosive detectors", "Need portable detectors for VIP events", "Portable detection capability", "Walk-through gate, handheld detector", "ANPR/BIS approved detection equipment", "SUBMITTED_FOR_REVIEW"),
        ("administrative", "Administration", "Administration", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 95000, "Legal software subscription", "Annual legal software renewal", "Legal research software subscription due", "Current legal database access", "Legal database software", "Manupatra / SCC Online annual", "APPROVED"),
        ("training", "Training", "Training Wing", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 420000, "1 batch, leadership training", "Senior officer leadership programme", "Leadership skills gap identified in assessment", "Improved leadership capability", "Training services", "External leadership training institution", "UNDER_REVIEW"),
        ("vehicles", "Traffic", "Traffic Wing", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 1400000, "2 tow trucks", "Traffic enforcement tow trucks", "No tow truck for illegal parking enforcement", "Effective parking enforcement", "Tow truck", "Flatbed tow truck, 3.5 tonne capacity", "DRAFT"),
        ("welfare", "Welfare", "Welfare", "Puducherry", "Puducherry Central Station (Demo)", "LOW", 180000, "Psychological support services", "Officer mental health programme", "Mental health concerns among officers post-pandemic", "Improved officer mental health", "Counselling services", "Certified psychologist sessions, helpline", "COMPLETED"),
        ("technology", "IT Wing", "IT Wing", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 680000, "Biometric attendance system", "Biometric attendance for all stations", "Manual attendance prone to error and manipulation", "Accurate attendance tracking", "Biometric device, software", "Fingerprint + face; cloud server; real-time reports", "APPROVED"),
        ("infrastructure", "Infrastructure", "Works", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 2800000, "Police training ground renovation", "Renovate police training ground", "Training ground facilities outdated and unsafe", "Modern training facility", "Civil and sports infrastructure", "Track, firing range refurbishment, obstacle course", "SUBMITTED_FOR_REVIEW"),
        ("procurement", "Stores", "Stores", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 450000, "First aid kits annual", "Annual first aid kit procurement", "First aid stock depleted", "Adequate medical supplies at all stations", "Medical supplies", "BIS certified first aid kits per station", "COMPLETED"),
        ("communication", "Operations", "IT Wing", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 1600000, "Video conferencing system", "Secure video conferencing for HQ", "No secure VC for inter-district coordination", "Secure remote coordination", "VC system, encryption", "End-to-end encrypted VC; NIC approved platform", "UNDER_REVIEW"),
        ("operational", "Traffic", "Traffic Wing", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 320000, "Traffic signals upgrade", "LED traffic signals replacement", "Incandescent traffic signals at 5 junctions failing", "Reliable LED traffic signals", "LED traffic signal, controller", "LED signals with adaptive controller", "APPROVED"),
        ("technology", "Forensic", "Forensic", "Puducherry", "Puducherry Central Station (Demo)", "HIGH", 380000, "DNA extraction kit procurement", "Forensic DNA extraction kits", "DNA kit stock exhausted; cases pending", "No forensic backlog from stock shortage", "DNA extraction kits", "Certified forensic grade kits", "SUBMITTED_FOR_REVIEW"),
        ("vehicles", "Operations", "Patrol", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 1200000, "2 motorcycles patrol", "2-wheel patrol motorcycles", "Narrow lane patrol requires motorcycles", "Effective narrow lane patrol", "Motorcycle, 150-250cc", "Police spec motorcycles with fitted accessories", "COMPLETED"),
        ("training", "Training", "Training Wing", "Puducherry", "Puducherry Central Station (Demo)", "NORMAL", 240000, "1 batch, POCSO training", "POCSO investigation training", "Specialist skills needed for POCSO cases", "POCSO investigation competence", "Training services", "Specialised POCSO investigation training", "APPROVED"),
        ("administrative", "Administration", "Administration", "Karaikal", "Karaikal Station (Demo)", "LOW", 65000, "Printer replacement", "Replace main printer at Karaikal", "Main printer failed; replacement needed", "Functional printing facility", "Laser printer, A3", "High-volume laser printer, A3, network", "COMPLETED"),
        ("welfare", "Welfare", "Welfare", "Yanam", "Yanam Station (Demo)", "LOW", 130000, "Children scholarship fund", "Police welfare scholarship fund", "Officers' children need educational support", "Educational welfare for officers' families", "Scholarship funds", "Annual scholarship to 10 officers' children", "UNDER_REVIEW"),
        ("infrastructure", "Infrastructure", "Works", "Mahe", "Mahe Station (Demo)", "NORMAL", 650000, "Station compound improvement", "Mahe station compound improvement", "Station compound waterlogged during monsoon", "Safe station compound", "Drainage, paving", "Storm drain, interlocking paver", "DRAFT"),
    ], start=21)
]


def _make_proposal(d: dict, user_id: str = "user-si-001") -> Proposal:
    return Proposal(
        id=d["id"],
        proposal_number=d["proposal_number"],
        title=d["title"],
        description=d.get("description", d.get("purpose", "")),
        department=d.get("department"),
        unit=d.get("unit"),
        region=d.get("region"),
        station=d.get("station"),
        category=d.get("category"),
        priority=d.get("priority", "NORMAL"),
        estimated_cost=d.get("estimated_cost"),
        currency=d.get("currency", "INR"),
        quantity=d.get("quantity"),
        purpose=d.get("purpose"),
        problem_statement=d.get("problem_statement"),
        expected_outcome=d.get("expected_outcome"),
        technology=d.get("technology"),
        specification=d.get("specification"),
        expected_completion_date=d.get("expected_completion_date"),
        created_by=user_id,
        current_owner=user_id,
        status=d.get("status", "DRAFT"),
        analysis_status=d.get("analysis_status", "NOT_ANALYZED"),
        classification="SYNTHETIC_DEMO",
        synthetic=True,
    )


def _add_decisions(db: Session, proposal: Proposal) -> None:
    """Add realistic decision history for non-draft proposals."""
    status = proposal.status
    base_actions: list[tuple[str, str, str, str]] = []

    if status in ("SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "APPROVED", "REJECTED",
                  "RETURNED_FOR_MODIFICATION", "COMPLETED", "IMPLEMENTATION"):
        base_actions.append(("SUBMITTED", "DRAFT", "SUBMITTED_FOR_REVIEW", "user-si-001"))

    if status in ("UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"):
        base_actions.append(("REVIEWED", "SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "user-dsp-001"))

    if status == "APPROVED":
        base_actions.append(("APPROVED", "UNDER_REVIEW", "APPROVED", "user-sp-001"))
    elif status == "REJECTED":
        base_actions.append(("REJECTED", "UNDER_REVIEW", "REJECTED", "user-sp-001"))
    elif status == "RETURNED_FOR_MODIFICATION":
        base_actions.append(("RETURNED", "SUBMITTED_FOR_REVIEW", "RETURNED_FOR_MODIFICATION", "user-dsp-001"))
    elif status == "COMPLETED":
        base_actions.append(("APPROVED", "UNDER_REVIEW", "APPROVED", "user-sp-001"))

    names = {
        "user-si-001": "SI Central Station (Demo)",
        "user-dsp-001": "DSP North (Demo)",
        "user-sp-001": "SP Puducherry (Demo)",
    }
    for action, prev, new, officer_id in base_actions:
        db.add(DecisionAction(
            id=str(uuid.uuid4()),
            proposal_id=proposal.id,
            action=action,
            previous_status=prev,
            new_status=new,
            officer_id=officer_id,
            officer_name=names.get(officer_id, officer_id),
            comment=f"Demo: {action} (synthetic record)",
        ))


def _add_implementation(db: Session, proposal: Proposal) -> None:
    rec = ImplementationRecord(
        id=str(uuid.uuid4()),
        proposal_id=proposal.id,
        status="COMPLETED" if proposal.status == "COMPLETED" else "IN_PROGRESS",
        planned_start="2024-07-01",
        planned_end=proposal.expected_completion_date or "2024-12-31",
        actual_start="2024-07-15" if proposal.status == "COMPLETED" else None,
        actual_end="2024-11-30" if proposal.status == "COMPLETED" else None,
        planned_cost=proposal.estimated_cost,
        actual_cost=(proposal.estimated_cost or 0) * 0.95 if proposal.status == "COMPLETED" else None,
        planned_quantity=proposal.quantity,
        delivered_quantity=proposal.quantity if proposal.status == "COMPLETED" else None,
        responsible_unit=proposal.unit or proposal.department,
        observations="Demo: successfully implemented per specifications." if proposal.status == "COMPLETED" else "Demo: implementation in progress.",
        synthetic=True,
    )
    db.add(rec)


def _add_outcome(db: Session, proposal: Proposal) -> None:
    oc = OutcomeRecord(
        id=str(uuid.uuid4()),
        proposal_id=proposal.id,
        outcome_status="SUCCESS",
        actual_cost=(proposal.estimated_cost or 0) * 0.95,
        actual_duration="5 months",
        success_metrics="All performance indicators met per demo scenario.",
        observations=f"Demo outcome for {proposal.title}. {SYNTHETIC}",
        benefits="Operational improvement achieved as per demo scenario.",
        recorded_by="user-si-001",
        verified=True,
        synthetic=True,
    )
    db.add(oc)
    db.flush()

    lesson = LessonRecord(
        id=str(uuid.uuid4()),
        outcome_id=oc.id,
        proposal_id=proposal.id,
        title=f"Lesson from {proposal.proposal_number}: Specification clarity improves procurement",
        lesson_text=(
            f"For {proposal.category} proposals: Detailed upfront specification reduced procurement disputes "
            f"and delivery delays. Early stakeholder consultation recommended. {SYNTHETIC}"
        ),
        category=proposal.category,
        keywords=[proposal.category or "", proposal.technology or "", "implementation", "procurement"],
        confirmed_by="user-sp-001",
        indexed=True,
        synthetic=True,
    )
    db.add(lesson)


def seed_proposals_v1(db: Session) -> None:
    """Idempotent seed of 60 synthetic proposals with lifecycle data."""
    existing = db.scalar(select(Proposal.id).limit(1))
    if existing:
        return

    # Seed stations
    station_existing = db.scalar(select(PoliceStation.id).limit(1))
    if not station_existing:
        for s in STATIONS:
            db.add(PoliceStation(**s, station_type="police_station", synthetic=True))
        db.flush()

    all_proposals = DEMO_PROPOSALS + ADDITIONAL_PROPOSALS
    for pdata in all_proposals:
        proposal = _make_proposal(pdata)
        db.add(proposal)
        db.flush()

        _add_decisions(db, proposal)

        if proposal.status in ("APPROVED", "COMPLETED"):
            _add_implementation(db, proposal)

        if proposal.status == "COMPLETED":
            _add_outcome(db, proposal)

    db.flush()
