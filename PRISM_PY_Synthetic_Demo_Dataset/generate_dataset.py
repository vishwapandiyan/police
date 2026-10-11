"""
PRISM-PY Synthetic Dataset Generator

Generates realistic fictional proposal records for Puducherry Police.
All data is SYNTHETIC and clearly labeled as demo data.

Creates 30+ coherent proposal records with cross-document relationships.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from pathlib import Path

from catalog_proposals import build_catalog_proposals
from paths import DOCUMENTS_DIR, SYNTHETIC_LABEL
from write_source_files import write_all_source_files

class SyntheticProposalGenerator:
    """Generates synthetic proposal records with metadata"""
    
    def __init__(self, output_dir: str = "./synthetic_documents"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Synthetic ID counter
        self.proposal_counter = 1
        self.document_counter = 1
        
        # Fictional locations (clearly marked as demo)
        self.demo_stations = [
            "Demo Central Station", 
            "Demo North Station",
            "Demo South Station",
            "Demo East Station",
            "Demo West Station"
        ]
        
        self.demo_regions = ["Demo North Region", "Demo South Region", "Demo Central Region"]
        self.demo_district = "Demo Puducherry District"
        
    def generate_proposal_id(self, prefix: str = "OPS") -> str:
        """Generate stable synthetic proposal ID"""
        proposal_id = f"SYN-PDY-{prefix}-{self.proposal_counter:03d}"
        self.proposal_counter += 1
        return proposal_id
    
    def generate_document_id(self, proposal_id: str, doc_type: str) -> str:
        """Generate stable synthetic document ID"""
        doc_id = f"{proposal_id}-{doc_type}-{self.document_counter:03d}"
        self.document_counter += 1
        return doc_id
    
    def generate_base_metadata(self, proposal_id: str, doc_type: str) -> Dict[str, Any]:
        """Generate base metadata for all documents"""
        return {
            "proposal_id": proposal_id,
            "document_type": doc_type,
            "synthetic": True,
            "data_classification": SYNTHETIC_LABEL,
            "generated_date": datetime.now().isoformat(),
            "version": "1.0"
        }
    
    def generate_cctv_pilot_proposal(self) -> Dict[str, Any]:
        """Generate CCTV pilot proposal (Approved, Implemented, Success)"""
        proposal_id = self.generate_proposal_id("CCTV")
        
        proposal = {
            "proposal_id": proposal_id,
            "title": "CCTV Surveillance Pilot Project",
            "documents": []
        }
        
        # Document 1: Initial Proposal
        doc1 = {
            **self.generate_base_metadata(proposal_id, "PROPOSAL"),
            "document_id": self.generate_document_id(proposal_id, "PROPOSAL"),
            "title": "Initial CCTV Pilot Proposal",
            "domain": "Technology",
            "objective": "Install CCTV surveillance system for enhanced security monitoring",
            "location": "Demo Central Station premises",
            "station_or_site": self.demo_stations[0],
            "jurisdiction": self.demo_regions[2],
            "district": self.demo_district,
            "budget_amount": 450000,
            "currency": "INR",
            "technology": "IP-based CCTV with 8 cameras, NVR, and 30-day storage",
            "quantity": "8 cameras",
            "timeline": "3 months installation + 3 months warranty",
            "procurement_type": "Limited Tender",
            "expected_outcome": "24/7 surveillance coverage of critical areas",
            "decision_status": "Approved",
            "implementation_status": "Completed",
            "outcome_summary": "Successfully implemented with positive results",
            "date": "2024-01-15",
            "keywords": ["CCTV", "surveillance", "security", "technology", "pilot"],
            "content": f"""{SYNTHETIC_LABEL}

PROPOSAL FOR CCTV SURVEILLANCE PILOT PROJECT
Proposal ID: {proposal_id}
Station: {self.demo_stations[0]}
Date: 2024-01-15

OBJECTIVE:
Install a pilot CCTV surveillance system at Demo Central Station to enhance security monitoring and improve incident response capabilities.

SCOPE:
- 8 IP-based cameras covering entry, exit, and critical areas
- Network Video Recorder (NVR) with 2TB storage (30-day retention)
- Centralized monitoring station
- 24/7 recording capability

TECHNICAL SPECIFICATIONS:
- Camera Resolution: 1080p minimum
- Night Vision: IR range 30 meters
- Network: PoE-enabled for simplified cabling
- Storage: H.265 compression for efficient space utilization

BUDGET:
Total Estimated Cost: INR 4,50,000 (Four Lakh Fifty Thousand)

Breakdown:
- Cameras (8 units @ INR 15,000): INR 1,20,000
- NVR System: INR 80,000
- Installation & Cabling: INR 1,20,000
- UPS & Power Backup: INR 40,000
- Maintenance Contract (1 year): INR 50,000
- Contingency (10%): INR 40,000

TIMELINE:
- Procurement: 1 month
- Installation: 2 months
- Testing & Training: 2 weeks
- Warranty Period: 3 months post-installation

EXPECTED OUTCOMES:
- Comprehensive visual coverage of station premises
- Improved incident documentation
- Enhanced deterrent effect
- Training ground for future CCTV expansion

PROCUREMENT METHOD:
Limited Tender (3 vendors)

This is a SYNTHETIC proposal for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc1)
        
        # Document 2: Approval Decision
        doc2 = {
            **self.generate_base_metadata(proposal_id, "DECISION"),
            "document_id": self.generate_document_id(proposal_id, "DECISION"),
            "title": "CCTV Pilot Approval Decision",
            "date": "2024-02-01",
            "decision_status": "Approved",
            "content": f"""{SYNTHETIC_LABEL}

APPROVAL DECISION
Proposal ID: {proposal_id}
Decision Date: 2024-02-01

DECISION: APPROVED

REVIEW SUMMARY:
The CCTV pilot proposal has been thoroughly reviewed and is approved for implementation at Demo Central Station.

RATIONALE:
1. Addresses identified security monitoring gaps
2. Cost estimate is within approved budget range for pilot projects
3. Technology selection is appropriate for the use case
4. Timeline is realistic and achievable
5. Procurement method complies with guidelines

CONDITIONS:
- Vendor must provide demonstration before final selection
- Installation plan must be coordinated with station operations
- Staff training must be completed before final acceptance
- Quarterly progress reports required

BUDGET APPROVED: INR 4,50,000

NEXT STEPS:
1. Issue tender documents (by Feb 10, 2024)
2. Vendor evaluation (by Feb 28, 2024)
3. Award contract (by Mar 10, 2024)
4. Begin installation (by Mar 20, 2024)

This is a SYNTHETIC decision record for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc2)
        
        # Document 3: Implementation Update
        doc3 = {
            **self.generate_base_metadata(proposal_id, "IMPLEMENTATION"),
            "document_id": self.generate_document_id(proposal_id, "IMPLEMENTATION"),
            "title": "CCTV Pilot Implementation Report",
            "date": "2024-06-15",
            "implementation_status": "Completed",
            "content": f"""{SYNTHETIC_LABEL}

IMPLEMENTATION REPORT
Proposal ID: {proposal_id}
Report Date: 2024-06-15

STATUS: COMPLETED

IMPLEMENTATION TIMELINE:
- Tender Issued: Feb 12, 2024
- Vendor Selected: Mar 05, 2024 (fictional vendor for demo)
- Installation Started: Mar 22, 2024
- Installation Completed: May 10, 2024
- Testing & Training: May 11-25, 2024
- Final Acceptance: June 01, 2024

ACTUAL COST: INR 4,45,000 (under budget by INR 5,000)

DEVIATIONS FROM PLAN:
- Installation completed 10 days ahead of schedule
- Minor layout adjustment required for camera placement
- Additional training session conducted at team request

CHALLENGES FACED:
1. Network connectivity issues resolved by IT team
2. Power backup capacity verified and upgraded
3. Camera angle adjustments for optimal coverage

TRAINING COMPLETED:
- 12 personnel trained on system operation
- User manual provided in English and local language
- Emergency procedures documented

HANDOVER STATUS:
- System operational since June 01, 2024
- Vendor support available for warranty period
- Maintenance schedule established

This is a SYNTHETIC implementation report for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc3)
        
        # Document 4: Outcome Report
        doc4 = {
            **self.generate_base_metadata(proposal_id, "OUTCOME"),
            "document_id": self.generate_document_id(proposal_id, "OUTCOME"),
            "title": "CCTV Pilot Outcome Assessment",
            "date": "2024-09-15",
            "outcome_summary": "Successful - System fully operational with positive feedback",
            "content": f"""{SYNTHETIC_LABEL}

OUTCOME ASSESSMENT REPORT
Proposal ID: {proposal_id}
Assessment Date: 2024-09-15
Assessment Period: June 01 - Sept 15, 2024 (3.5 months)

OUTCOME: SUCCESSFUL

PERFORMANCE METRICS:
- System Uptime: 99.2%
- Incidents Documented: 45 (all successfully recorded)
- Storage Utilization: Optimal (28-day retention maintained)
- Staff Satisfaction: 4.2/5 (based on feedback survey)

BENEFITS REALIZED:
1. Enhanced Security Monitoring
   - Comprehensive coverage of entry/exit points
   - Successful documentation of all incidents
   - Improved response time to security events

2. Operational Improvements
   - Visual verification of activities
   - Evidence for incident investigations
   - Deterrent effect observed

3. Training Value
   - Team gained expertise in CCTV operations
   - Best practices identified for future expansion
   - Maintenance procedures established

LESSONS LEARNED:
1. Adequate network bandwidth is critical
2. Proper lighting improves night vision effectiveness
3. Regular maintenance prevents minor issues
4. User training is essential for optimal utilization

ISSUES ENCOUNTERED:
- Minor technical issue (camera 5 adjustment) resolved within warranty
- One instance of network downtime (resolved in 2 hours)
- Storage management procedures refined

RECOMMENDATIONS FOR EXPANSION:
1. Similar systems suitable for Demo North and Demo South stations
2. Budget estimate: INR 4,50,000 to 5,00,000 per station
3. Consider centralized monitoring for multiple locations
4. Include redundancy for critical camera positions

MAINTENANCE STATUS:
- Regular cleaning schedule established
- Vendor support responsive during warranty period
- Maintenance contract renewal under consideration

This is a SYNTHETIC outcome report for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc4)
        
        return proposal
    
    def generate_cctv_expansion_proposal(self) -> Dict[str, Any]:
        """Generate CCTV expansion proposal (Deferred due to budget constraints)"""
        proposal_id = self.generate_proposal_id("CCTV")
        
        proposal = {
            "proposal_id": proposal_id,
            "title": "CCTV Expansion to Additional Stations",
            "documents": []
        }
        
        # Document 1: Expansion Proposal
        doc1 = {
            **self.generate_base_metadata(proposal_id, "PROPOSAL"),
            "document_id": self.generate_document_id(proposal_id, "PROPOSAL"),
            "title": "CCTV Expansion Proposal",
            "domain": "Technology",
            "objective": "Expand CCTV coverage to Demo North and Demo South stations",
            "location": "Demo North Station and Demo South Station",
            "station_or_site": f"{self.demo_stations[1]}, {self.demo_stations[2]}",
            "jurisdiction": f"{self.demo_regions[0]}, {self.demo_regions[1]}",
            "district": self.demo_district,
            "budget_amount": 1100000,
            "currency": "INR",
            "technology": "IP-based CCTV matching pilot specifications",
            "quantity": "20 cameras (10 per station)",
            "timeline": "6 months for both stations",
            "procurement_type": "Open Tender",
            "expected_outcome": "Extended surveillance coverage across multiple stations",
            "decision_status": "Deferred",
            "implementation_status": "Not Started",
            "outcome_summary": "Pending budget availability",
            "date": "2024-10-01",
            "keywords": ["CCTV", "expansion", "surveillance", "multiple stations"],
            "content": f"""{SYNTHETIC_LABEL}

PROPOSAL FOR CCTV EXPANSION PROJECT
Proposal ID: {proposal_id}
Stations: {self.demo_stations[1]}, {self.demo_stations[2]}
Date: 2024-10-01

BACKGROUND:
Following the successful pilot at Demo Central Station, this proposal seeks to expand CCTV surveillance to two additional stations.

OBJECTIVE:
Install CCTV surveillance systems at Demo North and Demo South stations using proven specifications from the pilot project.

SCOPE:
Station 1 - Demo North Station:
- 10 IP-based cameras
- Network Video Recorder with 2TB storage
- Centralized monitoring
- 24/7 recording

Station 2 - Demo South Station:
- 10 IP-based cameras
- Network Video Recorder with 2TB storage
- Centralized monitoring
- 24/7 recording

TECHNICAL SPECIFICATIONS:
(Matching pilot project specifications for consistency)
- Camera Resolution: 1080p
- Night Vision: IR range 30 meters
- Network: PoE-enabled
- Storage: H.265 compression, 30-day retention

BUDGET ESTIMATE:
Total: INR 11,00,000 (Eleven Lakh)

Breakdown:
Demo North Station: INR 5,50,000
- Cameras (10 units): INR 1,50,000
- NVR System: INR 90,000
- Installation & Cabling: INR 1,60,000
- Power Backup: INR 50,000
- Maintenance (1 year): INR 60,000
- Contingency (10%): INR 40,000

Demo South Station: INR 5,50,000
(Same breakdown as Demo North)

JUSTIFICATION:
1. Proven success of pilot at Demo Central
2. Security monitoring needs at both locations
3. Consistent technology for easier maintenance
4. Economies of scale in procurement
5. Centralized monitoring potential

TIMELINE:
- Procurement: 2 months
- Station 1 Installation: 2 months
- Station 2 Installation: 2 months (can overlap)
- Testing & Training: 1 month
- Total Duration: 6 months

PROCUREMENT METHOD:
Open Tender (anticipating 5+ vendors)

DEPENDENCIES:
- Budget approval for FY 2024-25
- Network infrastructure readiness at both stations
- Coordination with station operations
- Vendor capacity for multi-site deployment

RISKS:
- Budget constraints may require phased implementation
- Simultaneous deployment may strain vendor resources
- Network upgrades may be needed at both stations

RECOMMENDATIONS:
1. Approve both stations if budget permits
2. Consider phased deployment if budget is limited
3. Leverage pilot project learnings
4. Include centralized monitoring capability

This is a SYNTHETIC proposal for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc1)
        
        # Document 2: Review Observations
        doc2 = {
            **self.generate_base_metadata(proposal_id, "REVIEW"),
            "document_id": self.generate_document_id(proposal_id, "REVIEW"),
            "title": "CCTV Expansion Review Observations",
            "date": "2024-10-20",
            "decision_status": "Under Review",
            "content": f"""{SYNTHETIC_LABEL}

REVIEW OBSERVATIONS
Proposal ID: {proposal_id}
Review Date: 2024-10-20

REVIEW STATUS: COMPREHENSIVE REVIEW COMPLETED

TECHNICAL REVIEW:
✓ Specifications match proven pilot system
✓ Vendor market has capacity for multi-site deployment
✓ Timeline is realistic
✓ Quantity estimate appears appropriate

BUDGET REVIEW:
⚠ CONCERN: Total cost (INR 11,00,000) exceeds available budget
✓ Per-station estimate is reasonable (matches pilot adjusted for scale)
⚠ Current fiscal year allocation: INR 6,00,000 remaining
⚠ Next fiscal year budget not yet approved

OPERATIONAL REVIEW:
✓ Both stations have expressed need for CCTV coverage
✓ Network infrastructure being assessed at both locations
⚠ Demo South Station may need network upgrades (estimated INR 50,000)
✓ Staff training can leverage pilot project experience

PROCUREMENT REVIEW:
✓ Open tender is appropriate for this scale
✓ Market competition expected to be good
✓ Pilot vendor performance can be considered
✓ No procurement obstacles identified

RISK ASSESSMENT:
1. Budget Constraint (High Risk)
   - Mitigation: Consider phased approach

2. Network Infrastructure (Medium Risk)
   - Mitigation: Include network assessment in tender

3. Multi-site Coordination (Medium Risk)
   - Mitigation: Staggered deployment schedule

REVIEWER QUESTIONS:
1. Can deployment be phased? (One station now, one later)
2. What is priority ranking between the two stations?
3. Can network upgrade cost be sourced separately?
4. Is centralized monitoring essential or optional?

RECOMMENDATION:
DEFER pending budget availability.

Alternative Options:
A. Implement Demo North Station only (INR 5,50,000) in current FY
B. Defer both stations to next FY when full budget may be available
C. Scale down to pilot-size systems (8 cameras each) to reduce cost

NEXT STEPS REQUIRED:
- Budget allocation confirmation
- Station priority determination
- Network infrastructure assessment results
- Revised proposal if phased approach is selected

This is a SYNTHETIC review document for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc2)
        
        # Document 3: Decision (Deferred)
        doc3 = {
            **self.generate_base_metadata(proposal_id, "DECISION"),
            "document_id": self.generate_document_id(proposal_id, "DECISION"),
            "title": "CCTV Expansion Decision - Deferred",
            "date": "2024-11-01",
            "decision_status": "Deferred",
            "content": f"""{SYNTHETIC_LABEL}

DECISION NOTICE
Proposal ID: {proposal_id}
Decision Date: 2024-11-01

DECISION: DEFERRED

DECISION RATIONALE:
After comprehensive review, the CCTV expansion proposal for Demo North and Demo South stations is deferred pending budget availability in the next fiscal year.

CONSIDERATIONS:
1. Technical Merit: The proposal is technically sound
2. Operational Need: Both stations have legitimate surveillance needs
3. Budget Reality: Insufficient funds in current fiscal year
4. Pilot Success: Proven technology and approach

BUDGET ANALYSIS:
- Proposal Request: INR 11,00,000
- Available Budget (Current FY): INR 6,00,000
- Shortfall: INR 5,00,000

DEFERRAL TERMS:
1. Proposal to be reconsidered in next fiscal year budget cycle
2. Preliminary budget allocation requested for FY 2025-26
3. Phased implementation to be explored if full budget unavailable
4. Station priority ranking to be submitted

INTERIM MEASURES:
1. Continue monitoring pilot system performance
2. Complete network infrastructure assessment at both target stations
3. Maintain vendor market awareness
4. Prepare detailed phased implementation plan

REVISED TIMELINE (Provisional):
- Budget Approval Target: April 2025
- Procurement Start (if approved): May 2025
- Implementation: June - November 2025

REQUIRED ACTIONS:
1. Submit budget request for FY 2025-26
2. Provide station priority justification
3. Update cost estimates for next FY
4. Complete network readiness assessment

REVIEW SCHEDULE:
This proposal will be automatically reviewed upon:
- FY 2025-26 budget approval
- Identification of alternative funding sources
- Availability of grants or special allocations

CONTACT FOR UPDATES:
Proposal owner should monitor budget allocation announcements.

This is a SYNTHETIC decision notice for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc3)
        
        return proposal
    
    def generate_asset_register_proposal(self) -> Dict[str, Any]:
        """Generate equipment asset register proposal"""
        proposal_id = self.generate_proposal_id("ASSET")
        
        proposal = {
            "proposal_id": proposal_id,
            "title": "Digital Equipment Asset Register System",
            "documents": []
        }
        
        doc1 = {
            **self.generate_base_metadata(proposal_id, "PROPOSAL"),
            "document_id": self.generate_document_id(proposal_id, "PROPOSAL"),
            "title": "Equipment Asset Register Proposal",
            "domain": "Information Systems",
            "objective": "Implement digital system for tracking equipment assets and maintenance",
            "location": "All Demo District stations",
            "station_or_site": "District-wide",
            "jurisdiction": "Demo Puducherry District",
            "district": self.demo_district,
            "budget_amount": 280000,
            "currency": "INR",
            "technology": "Web-based asset management software with barcode tracking",
            "quantity": "1 system with 100 asset tags",
            "timeline": "4 months implementation",
            "procurement_type": "Software Licensing",
            "expected_outcome": "Centralized tracking of all equipment assets",
            "decision_status": "Approved",
            "implementation_status": "In Progress",
            "outcome_summary": "Implementation ongoing, pilot phase successful",
            "date": "2024-08-01",
            "keywords": ["asset management", "equipment", "tracking", "maintenance", "software"],
            "content": f"""{SYNTHETIC_LABEL}

PROPOSAL FOR DIGITAL EQUIPMENT ASSET REGISTER SYSTEM
Proposal ID: {proposal_id}
Scope: District-wide
Date: 2024-08-01

PROBLEM STATEMENT:
Current manual tracking of equipment assets across stations is inefficient and prone to errors. Equipment maintenance history, warranty information, and asset location are difficult to track.

OBJECTIVE:
Implement a centralized digital asset register system to track all equipment assets, maintenance schedules, warranty status, and depreciation across all stations in Demo Puducherry District.

SCOPE:
1. Asset Registration
   - Barcode/QR code tagging for all equipment
   - Digital photo documentation
   - Warranty and purchase information tracking
   - Current location and custodian assignment

2. Maintenance Tracking
   - Scheduled maintenance reminders
   - Repair history logging
   - Service provider management
   - Cost tracking for each asset

3. Reporting
   - Asset inventory reports
   - Maintenance due reports
   - Cost analysis reports
   - Depreciation calculations

TECHNOLOGY SOLUTION:
- Web-based asset management software (SaaS model)
- Mobile app for field updates
- Barcode scanner integration
- Cloud data storage with backup
- User access controls

INITIAL ASSET COVERAGE:
- CCTV Systems (cameras, NVRs)
- Computers and IT equipment
- Communication devices
- Vehicles
- Office equipment
- Training equipment

BUDGET ESTIMATE:
Total: INR 2,80,000 (Two Lakh Eighty Thousand)

Breakdown:
- Software Licensing (3 years): INR 1,80,000
- Barcode Printer & Scanners: INR 40,000
- Asset Tags (100 units): INR 10,000
- Training: INR 20,000
- Implementation Support: INR 30,000

EXPECTED BENEFITS:
1. Real-time asset visibility
2. Proactive maintenance scheduling
3. Reduced equipment downtime
4. Better warranty utilization
5. Accurate asset valuation
6. Simplified audit processes

TIMELINE:
- Software Selection: 1 month
- System Setup: 1 month
- Asset Tagging Pilot: 1 month
- District-wide Rollout: 1 month
- Total: 4 months

IMPLEMENTATION APPROACH:
Phase 1: Pilot at Demo Central Station (CCTV assets from pilot project)
Phase 2: Expand to other stations
Phase 3: Include all asset categories

MAINTENANCE COST:
Annual software license renewal: INR 60,000 (after initial 3-year period)

This is a SYNTHETIC proposal for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc1)
        
        return proposal
    
    def generate_training_proposal(self) -> Dict[str, Any]:
        """Generate digital evidence training proposal"""
        proposal_id = self.generate_proposal_id("TRN")
        
        proposal = {
            "proposal_id": proposal_id,
            "title": "Digital Evidence Handling Training Program",
            "documents": []
        }
        
        doc1 = {
            **self.generate_base_metadata(proposal_id, "PROPOSAL"),
            "document_id": self.generate_document_id(proposal_id, "PROPOSAL"),
            "title": "Digital Evidence Training Proposal",
            "domain": "Training & Capacity Building",
            "objective": "Train personnel on digital evidence collection, preservation, and chain of custody",
            "location": "Training Center, Demo District",
            "station_or_site": "District Training Center",
            "jurisdiction": "Demo Puducherry District",
            "district": self.demo_district,
            "budget_amount": 180000,
            "currency": "INR",
            "technology": "Digital forensics training with hands-on exercises",
            "quantity": "40 personnel (2 batches of 20)",
            "timeline": "2 months (2 sessions)",
            "procurement_type": "Training Services",
            "expected_outcome": "Certified personnel in digital evidence handling",
            "decision_status": "Approved",
            "implementation_status": "Completed",
            "outcome_summary": "Successfully trained 38 personnel, 2 participants absent",
            "date": "2024-07-01",
            "keywords": ["training", "digital evidence", "forensics", "capacity building"],
            "content": f"""{SYNTHETIC_LABEL}

PROPOSAL FOR DIGITAL EVIDENCE HANDLING TRAINING PROGRAM
Proposal ID: {proposal_id}
Location: Demo District Training Center
Date: 2024-07-01

RATIONALE:
With increasing deployment of surveillance technology (CCTV, body cameras) and digital systems, personnel need proper training in digital evidence handling to ensure evidence admissibility.

TRAINING OBJECTIVES:
1. Understand digital evidence types and sources
2. Learn proper collection techniques
3. Master evidence preservation methods
4. Maintain chain of custody
5. Prepare evidence for legal proceedings

TRAINING CURRICULUM:
Module 1: Introduction to Digital Evidence (4 hours)
- Types of digital evidence
- Legal framework
- Admissibility requirements
- Common challenges

Module 2: Evidence Collection (8 hours)
- CCTV footage extraction
- Mobile device evidence
- Computer forensics basics
- Photography and documentation

Module 3: Preservation & Storage (6 hours)
- Hash verification
- Write-blockers and forensic copies
- Storage media handling
- Long-term preservation

Module 4: Chain of Custody (4 hours)
- Documentation requirements
- Custody logs
- Evidence transfer procedures
- Courtroom presentation

Module 5: Practical Exercises (8 hours)
- Hands-on CCTV footage extraction
- Evidence documentation practice
- Chain of custody simulation
- Case study analysis

Total Training Duration: 30 hours per batch

TARGET PARTICIPANTS:
- Station investigating officers
- Technical personnel
- Evidence custodians
- Supervisory staff
Total: 40 participants (2 batches of 20)

TRAINER QUALIFICATIONS:
- Certified digital forensics expert
- Law enforcement experience
- Legal testimony experience

TRAINING MATERIALS:
- Printed manual for each participant
- USB drives with practice materials
- Evidence handling kits
- Certificate of completion

BUDGET:
Total: INR 1,80,000 (One Lakh Eighty Thousand)

Breakdown:
- Trainer Fees (2 sessions): INR 1,00,000
- Training Materials: INR 30,000
- Venue & Logistics: INR 20,000
- Refreshments: INR 15,000
- Certificates & Documentation: INR 10,000
- Contingency: INR 5,000

EXPECTED OUTCOMES:
- 40 certified personnel
- Improved evidence handling practices
- Better coordination with legal teams
- Reduced evidence admissibility challenges

TIMELINE:
- Batch 1: September 2024
- Batch 2: October 2024
- Duration: 5 days per batch

This is a SYNTHETIC training proposal for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc1)
        
        # Training outcome report
        doc2 = {
            **self.generate_base_metadata(proposal_id, "OUTCOME"),
            "document_id": self.generate_document_id(proposal_id, "OUTCOME"),
            "title": "Digital Evidence Training - Outcome Report",
            "date": "2024-11-05",
            "outcome_summary": "Successfully completed with 38 participants certified",
            "content": f"""{SYNTHETIC_LABEL}

TRAINING OUTCOME REPORT
Proposal ID: {proposal_id}
Report Date: 2024-11-05

TRAINING COMPLETION: SUCCESSFUL

PARTICIPATION:
- Batch 1 (Sept 2024): 19 participants (1 absent due to emergency duty)
- Batch 2 (Oct 2024): 19 participants (1 absent due to medical leave)
- Total Trained: 38 out of 40 planned
- Completion Rate: 95%

ASSESSMENT RESULTS:
- Pre-training Average Score: 58%
- Post-training Average Score: 87%
- Improvement: +29 percentage points
- Pass Rate: 100% (all participants passed final assessment)

PARTICIPANT FEEDBACK:
Overall Training Quality: 4.6/5
- Curriculum Relevance: 4.8/5
- Trainer Effectiveness: 4.7/5
- Practical Exercises: 4.5/5
- Training Materials: 4.4/5
- Venue & Logistics: 4.3/5

QUALITATIVE FEEDBACK HIGHLIGHTS:
Positive:
- "Hands-on exercises were extremely valuable"
- "Trainer had excellent real-world examples"
- "Training manual is a great reference resource"
- "Finally understand proper CCTV evidence extraction"

Areas for Improvement:
- "More time needed for practical exercises"
- "Would benefit from advanced follow-up training"
- "Need refresher training in 6 months"

KNOWLEDGE AREAS - IMPROVEMENT BY MODULE:
Module 1 (Digital Evidence Intro): +25%
Module 2 (Evidence Collection): +32%
Module 3 (Preservation & Storage): +28%
Module 4 (Chain of Custody): +35%
Module 5 (Practical Exercises): +30%

IMPACT ASSESSMENT:
Short-term (Immediate):
✓ All participants received certification
✓ Improved awareness of proper procedures
✓ Enhanced confidence in handling digital evidence

Medium-term (3-6 months, expected):
- Better quality of evidence submissions
- Reduced evidence handling errors
- Improved coordination with legal teams

RECOMMENDATIONS:
1. Schedule refresher training in 6 months
2. Develop advanced training for interested participants
3. Create digital evidence SOP based on training content
4. Train the two absent participants in next session
5. Consider making this training mandatory for all investigating officers

BUDGET UTILIZATION:
Approved Budget: INR 1,80,000
Actual Spent: INR 1,76,500
Savings: INR 3,500 (2 absent participants)

CERTIFICATES ISSUED:
38 certificates of completion issued to participants.
Digital copies stored in training records.

TRAINING MATERIALS DISTRIBUTION:
- Printed manuals: 38 copies
- Practice USB drives: 38 units
- Evidence handling quick reference cards: 38 cards

NEXT STEPS:
1. Distribute training certificates
2. Upload training records to HR system
3. Monitor participant performance (3-month review)
4. Plan refresher training schedule
5. Update digital evidence SOPs based on training

This is a SYNTHETIC outcome report for demonstration purposes only.
"""
        }
        proposal["documents"].append(doc2)
        
        return proposal
    
    def generate_comparison_note(self) -> Dict[str, Any]:
        """Generate CCTV cost comparison analysis"""
        doc_id = self.generate_document_id("SYN-PDY-ANALYSIS-001", "COMPARISON")
        
        document = {
            **self.generate_base_metadata("SYN-PDY-ANALYSIS-001", "COMPARISON"),
            "document_id": doc_id,
            "title": "CCTV Proposals - Cost Comparison Analysis",
            "date": "2024-11-10",
            "keywords": ["comparison", "cost analysis", "CCTV", "budget"],
            "content": f"""{SYNTHETIC_LABEL}

COST COMPARISON ANALYSIS
Document ID: {doc_id}
Date: 2024-11-10
Subject: CCTV Proposals Cost Comparison

PURPOSE:
Illustrative comparison of CCTV proposals for training purposes.
All figures are SYNTHETIC and for demonstration only.

PROPOSALS COMPARED:
1. SYN-PDY-CCTV-001: Pilot Project (Demo Central Station)
2. SYN-PDY-CCTV-002: Expansion (Demo North & South Stations)

COST COMPARISON:
                                    Pilot       Expansion
                                  (1 station)   (2 stations)
-----------------------------------------------------------
Total Cost:                       INR 4,50,000  INR 11,00,000
Cost Per Station:                 INR 4,50,000  INR 5,50,000
Number of Cameras:                8             20
Cost Per Camera (incl. install):  INR 56,250    INR 55,000

VARIANCE ANALYSIS:
- Per-station cost increased by INR 1,00,000 (22%)
- Increase due to: Higher camera count (8 → 10 per station)
- Per-camera cost decreased slightly (economies of scale)

IMPORTANT CAVEATS:
⚠ Station layouts differ - direct cost comparison has limitations
⚠ Network infrastructure costs not included in expansion
⚠ Pilot included learning curve costs
⚠ Market conditions may have changed between proposals
⚠ Expansion assumes bulk procurement discount

FACTORS TO CONSIDER BEFORE COMPARING BUDGETS:
1. Scope Differences:
   - Pilot: 8 cameras, proven concept
   - Expansion: 10 cameras per station, larger coverage

2. Timing:
   - Pilot: 2024 Q1
   - Expansion: 2024 Q4 (market prices may differ)

3. Infrastructure:
   - Pilot: Existing network adequate
   - Expansion: May need network upgrades

4. Procurement:
   - Pilot: Limited tender (3 vendors)
   - Expansion: Open tender (5+ vendors, potential better rates)

5. Maintenance:
   - Pilot: Single site maintenance easier
   - Expansion: Multi-site maintenance may have efficiencies

RECOMMENDATION:
Do not rely solely on per-station cost comparison. Consider:
- Total scope of work
- Site-specific requirements
- Market conditions at time of procurement
- Economies of scale in multi-site deployment
- Network and infrastructure readiness

BENCHMARK GUIDANCE:
For proper comparison, analysts should:
✓ Verify site requirements match
✓ Adjust for market price changes
✓ Include all infrastructure costs
✓ Consider maintenance implications
✓ Review actual vendor quotes

This is a SYNTHETIC analysis for demonstration purposes only.
All cost figures are illustrative and NOT actual government data.
"""
        }
        
        return {"proposal_id": "SYN-PDY-ANALYSIS-001", "title": "Cost Comparison Analysis", "documents": [document]}
    
    def generate_policy_reference(self) -> Dict[str, Any]:
        """Generate synthetic policy reference document"""
        doc_id = self.generate_document_id("SYN-PDY-POLICY-001", "POLICY")
        
        document = {
            **self.generate_base_metadata("SYN-PDY-POLICY-001", "POLICY_REF"),
            "document_id": doc_id,
            "title": "SYNTHETIC Equipment Procurement Guidelines (Training Reference)",
            "date": "2024-01-01",
            "keywords": ["policy", "procurement", "guidelines", "training"],
            "content": f"""{SYNTHETIC_LABEL}

SYNTHETIC EQUIPMENT PROCUREMENT GUIDELINES
(TRAINING REFERENCE ONLY - NOT A REAL POLICY)

Document ID: {doc_id}
Effective Date: 2024-01-01 (FICTIONAL)

⚠⚠⚠ WARNING ⚠⚠⚠
THIS IS A SYNTHETIC TRAINING DOCUMENT
NOT AN OFFICIAL GOVERNMENT POLICY OR GUIDELINE
FOR DEMONSTRATION AND TRAINING PURPOSES ONLY
DO NOT USE FOR ACTUAL PROCUREMENT DECISIONS
⚠⚠⚠ WARNING ⚠⚠⚠

PURPOSE:
This synthetic guideline demonstrates how policy references might appear in a proposal system. It is entirely FICTIONAL and should never be cited as actual authority.

ILLUSTRATIVE GUIDELINE STRUCTURE:

1. PROCUREMENT THRESHOLDS (FICTIONAL):
   - Below INR 1,00,000: Direct purchase
   - INR 1,00,000 - 5,00,000: Limited tender (min 3 vendors)
   - Above INR 5,00,000: Open tender (public advertisement)
   
2. TECHNICAL EVALUATION CRITERIA (ILLUSTRATIVE):
   - Technical specifications compliance: 40 points
   - Vendor experience: 20 points
   - After-sales support: 15 points
   - Price competitiveness: 25 points
   Minimum qualifying score: 70/100

3. WARRANTY REQUIREMENTS (EXAMPLE):
   - Minimum warranty period: 1 year
   - On-site support response time: 48 hours
   - Replacement parts availability: 5 years

4. DOCUMENTATION REQUIREMENTS (SAMPLE):
   - Detailed technical specifications
   - Budget breakdown
   - Vendor quotations (minimum 3)
   - Compliance certificates
   - Installation plan

REMINDER:
- Real procurement must follow ACTUAL official guidelines
- This document has NO legal authority
- Created solely for training AI systems to recognize policy references
- Anyone using this for real decisions will be acting incorrectly

This is a SYNTHETIC policy reference for demonstration purposes only.
NEVER cite this document as an authority for actual procurement.
"""
        }
        
        return {"proposal_id": "SYN-PDY-POLICY-001", "title": "Synthetic Policy Reference", "documents": [document]}
    
    def generate_maintenance_record(self) -> Dict[str, Any]:
        """Generate CCTV maintenance record"""
        doc_id = self.generate_document_id("SYN-PDY-MAINT-001", "MAINTENANCE")
        
        document = {
            **self.generate_base_metadata("SYN-PDY-CCTV-001", "MAINTENANCE"),
            "document_id": doc_id,
            "title": "CCTV Pilot - Maintenance Records",
            "date": "2024-09-30",
            "keywords": ["maintenance", "CCTV", "service", "warranty"],
            "content": f"""{SYNTHETIC_LABEL}

MAINTENANCE RECORD
Related Proposal: SYN-PDY-CCTV-001
System: CCTV Pilot at Demo Central Station
Record Date: 2024-09-30

MAINTENANCE SCHEDULE:
Monthly: Camera cleaning, cable inspection
Quarterly: System health check, storage verification
Annual: Comprehensive system audit

MAINTENANCE LOG:

[2024-07-15] Monthly Maintenance
- Action: Routine camera cleaning
- Cameras cleaned: All 8 units
- Issues found: None
- Time: 2 hours
- Technician: Vendor support team

[2024-08-02] Incident Repair
- Issue: Camera 5 image quality degraded
- Cause: Lens moisture accumulation
- Action: Lens cleaned, housing seal checked
- Resolution: Image quality restored
- Warranty: Covered (no cost)
- Time: 1 hour

[2024-08-15] Monthly Maintenance
- Action: Routine camera cleaning
- Cameras cleaned: All 8 units
- Issues found: None
- Storage check: 65% utilization (normal)
- Time: 2 hours

[2024-09-15] Quarterly Health Check
- System uptime: 99.2%
- Storage: 70% utilization
- Network connectivity: Stable
- All cameras operational
- NVR performance: Normal
- Issues: None identified
- Time: 3 hours

[2024-09-20] Monthly Maintenance
- Action: Routine camera cleaning
- Cameras cleaned: All 8 units
- Cable inspection: All secure
- Power backup test: Passed
- Time: 2 hours

SPARE PARTS INVENTORY:
- Spare camera: 1 unit (ready for quick replacement)
- Power adapters: 2 units
- Network cables (various lengths): In stock
- Mounting brackets: 3 sets

WARRANTY STATUS:
- Warranty period: 3 months post-installation
- Warranty start: June 01, 2024
- Warranty end: August 31, 2024
- Status: EXPIRED (considering maintenance contract renewal)

MAINTENANCE COST (Post-Warranty):
Estimated annual cost: INR 50,000
- Quarterly service: INR 40,000
- Emergency repairs: INR 10,000 (reserve)

LESSONS LEARNED:
1. Regular cleaning prevents most issues
2. Monsoon season requires extra attention to housing seals
3. Vendor response time acceptable during warranty period
4. Storage capacity adequate for 30-day retention

RECOMMENDATIONS:
1. Renew maintenance contract before next monsoon
2. Consider extended warranty for year 2
3. Stock additional power adapters (most common failure point)
4. Train station staff on basic troubleshooting

This is a SYNTHETIC maintenance record for demonstration purposes only.
"""
        }
        
        return {"proposal_id": "SYN-PDY-MAINT-001", "title": "CCTV Maintenance Records", "documents": [document]}
    
    def generate_all_proposals(self) -> List[Dict[str, Any]]:
        """Generate all synthetic proposals (30+ records by default)."""
        proposals = []
        
        # Core proposals used by the retrieval smoke-test questions
        proposals.append(self.generate_cctv_pilot_proposal())
        proposals.append(self.generate_cctv_expansion_proposal())
        proposals.append(self.generate_asset_register_proposal())
        proposals.append(self.generate_training_proposal())
        
        # Supporting documents
        proposals.append(self.generate_comparison_note())
        proposals.append(self.generate_policy_reference())
        proposals.append(self.generate_maintenance_record())
        
        extra = build_catalog_proposals(self.proposal_counter, self.document_counter)
        # Keep local counters in sync if more records are added later
        self.proposal_counter += len(extra)
        self.document_counter += sum(len(p.get("documents", [])) for p in extra)
        proposals.extend(extra)
        
        return proposals
    
    def save_proposals_as_json(self, proposals: List[Dict[str, Any]], filename: str = "synthetic_proposals.json"):
        """Save proposals to JSON file"""
        output_path = self.output_dir / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(proposals, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved {len(proposals)} proposals to {output_path}")
        
        # Generate summary
        total_documents = sum(len(p.get('documents', [])) for p in proposals)
        print(f"📊 Total documents: {total_documents}")
        
        return output_path
    
    def save_proposals_as_text_files(self, proposals: List[Dict[str, Any]]):
        """Save each document as a separate text file"""
        text_dir = self.output_dir / "text_files"
        text_dir.mkdir(exist_ok=True)
        
        file_count = 0
        for proposal in proposals:
            for document in proposal.get('documents', []):
                doc_id = document.get('document_id', f'doc_{file_count}')
                filename = f"{doc_id}.txt"
                filepath = text_dir / filename
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(document.get('content', ''))
                
                file_count += 1
        
        print(f"✅ Saved {file_count} text files to {text_dir}")
        return text_dir


def main():
    """Generate synthetic dataset"""
    print("🚀 PRISM-PY Synthetic Dataset Generator")
    print("=" * 60)
    print(f"⚠️  All generated data is: {SYNTHETIC_LABEL}")
    print("=" * 60)
    print()
    
    generator = SyntheticProposalGenerator(output_dir=str(DOCUMENTS_DIR))
    
    print("📝 Generating proposals...")
    proposals = generator.generate_all_proposals()
    
    print(f"✅ Generated {len(proposals)} proposals")
    for proposal in proposals:
        doc_count = len(proposal.get('documents', []))
        print(f"   - {proposal['proposal_id']}: {proposal['title']} ({doc_count} documents)")
    
    print()
    print("💾 Saving to files...")
    
    # Save as JSON
    json_path = generator.save_proposals_as_json(proposals)
    
    # Save as individual text files plus DOCX/XLSX/PPTX for the extractor
    text_dir = generator.save_proposals_as_text_files(proposals)
    source_manifest = write_all_source_files(proposals)
    
    print()
    print("✅ Dataset Generation Complete!")
    print(f"📁 JSON: {json_path}")
    print(f"📁 Text files: {text_dir}")
    print(f"📁 Source files: {len(source_manifest)} documents (DOCX + samples)")
    print()
    print("Next steps:")
    print("1. Review generated files")
    print("2. Run: python ingest_synthetic.py (to index into FAISS)")
    print("3. Run: python test_synthetic_retrieval.py (to verify)")


if __name__ == "__main__":
    main()
