# PRISM-PY — FINAL FULL-STACK + AGENTIC AUTOMATION MASTER SPECIFICATION

**Product:** PRISM-PY — Police Proposal Retrieval, Intelligence & Strategy Matrix — Puducherry  
**Hackathon:** Puducherry Police Hackathon 2026  
**Problem Statement:** PS01 — Intelligent Proposal Management & Precedent Retrieval System (IPMPRS)  
**Primary Goal:** Automate the complete departmental proposal lifecycle from requirement creation through decision, procurement intelligence, implementation, outcome, lessons learned and institutional memory.

---

# 0. EXECUTIVE DIRECTIVE

PRISM-PY must be built as a **real, end-to-end, production-grade departmental application**, not as a chatbot, static dashboard, PDF prototype, or collection of mock screens.

The system must:

1. Create and manage proposals.
2. Understand proposal requirements.
3. Extract structured Proposal DNA.
4. Validate proposal completeness.
5. Search historical/similar proposals.
6. Explain why each precedent is relevant.
7. Understand jurisdiction and organizational context.
8. Retrieve relevant policies, Government Orders, Standing Orders and SOPs.
9. Build technical specifications.
10. Provide procurement intelligence.
11. Integrate GeM/public procurement information where technically and legally supported.
12. Compare historical/observed cost information.
13. Detect possible duplicate/overlapping proposals.
14. Generate an evidence-backed Decision Brief.
15. Route proposals to authorized officers.
16. Support approve / return / reject workflows.
17. Track procurement and implementation.
18. Record actual outcomes.
19. Capture lessons learned.
20. Feed verified lessons back into institutional memory.
21. Maintain complete audit history.
22. Provide secure RBAC and document access.
23. Provide a professional government/police departmental UI.
24. Work end-to-end from a clean installation.
25. Allow an authorized coding/development agent to inspect, implement, test, repair and verify the system autonomously.

## Core principle

> **E-Office digitizes the proposal. PRISM-PY makes the proposal intelligent.**

The system is decision support. Final authority remains with the authorized human officer.

---

# 1. PROBLEM STATEMENT INTERPRETATION

The system must solve the core PS01 problem:

Police departments process administrative, technical, procurement, infrastructure, training and operational proposals. Previous proposals, decisions, sanctions, observations and implementation outcomes may exist across different files and departments. It can therefore be difficult to quickly determine whether a similar proposal was previously initiated, approved, rejected, modified or implemented.

PRISM-PY must provide an intelligent end-to-end system that:

```text
NEW REQUIREMENT
      ↓
PROPOSAL
      ↓
PROPOSAL DNA
      ↓
COMPLETENESS
      ↓
PRECEDENT RETRIEVAL
      ↓
JURISDICTION CONTEXT
      ↓
POLICY / SOP INTELLIGENCE
      ↓
TECHNICAL SPECIFICATION
      ↓
PROCUREMENT INTELLIGENCE
      ↓
COST INTELLIGENCE
      ↓
OVERLAP / RISK REVIEW
      ↓
DECISION BRIEF
      ↓
AUTHORIZED OFFICER
      ↓
APPROVE / RETURN / REJECT
      ↓
PROCUREMENT
      ↓
IMPLEMENTATION
      ↓
OUTCOME
      ↓
LESSON
      ↓
INSTITUTIONAL MEMORY
      ↓
FUTURE PROPOSAL RETRIEVAL
```

---

# 2. WHAT PRISM-PY IS NOT

PRISM-PY is not:

- an autonomous police decision-maker;
- a surveillance system;
- a citizen-tracking system;
- a SIM/mobile-location tracker;
- a through-wall sensing system;
- an unauthorized cyber investigation platform;
- an autonomous procurement vendor selector;
- an autonomous tender evaluator;
- a replacement for CCTNS;
- a replacement for e-Office;
- a replacement for GeM;
- a legal decision-maker;
- an autonomous proposal approver.

PRISM-PY is an **institutional intelligence and decision-support layer**.

---

# 3. CORE DIFFERENTIATION

## Normal RAG

```text
Question
  ↓
PDF Search
  ↓
Answer
```

## PRISM-PY

```text
Proposal
  ↓
Proposal DNA
  ↓
Historical Precedents
  ↓
Jurisdiction
  ↓
Policy / SOP
  ↓
Procurement
  ↓
Cost
  ↓
Historical Decisions
  ↓
Implementation
  ↓
Outcomes
  ↓
Lessons
  ↓
Risk / Overlap
  ↓
Evidence
  ↓
Decision Brief
  ↓
Officer Decision
```

The system must demonstrate **institutional memory**, not merely document retrieval.

---

# 4. FULL SYSTEM MODULES

Implement all modules:

```text
01. Authentication
02. RBAC / Permissions
03. Dashboard
04. Proposal Management
05. Proposal Lifecycle
06. Document Management
07. OCR / Extraction
08. Proposal DNA
09. Proposal Completeness
10. Precedent Intelligence
11. Why-Match Explanation
12. Jurisdiction Intelligence
13. Policy / SOP Intelligence
14. Technical Specification Builder
15. Procurement Intelligence
16. GeM Intelligence / Integration Layer
17. Cost Intelligence
18. Duplicate / Overlap Detection
19. Risk / Compliance Signals
20. Knowledge Graph
21. Decision Brief
22. Officer Review / Decision
23. Procurement Tracking
24. Implementation Tracking
25. Outcome Management
26. Lessons Learned
27. Institutional Memory
28. Knowledge Base
29. Search / Filters
30. Reports
31. Analytics
32. Audit Trail
33. Administration
34. Background Jobs
35. Notifications / Task Queue
36. Monitoring / Observability
37. Security
38. Demo Mode
39. Data Ingestion
40. Evaluation Framework
```

---

# 5. CURRENT REPOSITORY REALITY

The existing repository currently contains:

```text
Streamlit UI
Flask API
intfloat/e5-base-v2
FAISS IndexFlatIP
PyMuPDF
python-docx
openpyxl
python-pptx
pytesseract
Pydantic
optional NVIDIA NIM
synthetic dataset
document extraction
DNA extraction
retrieval helpers
decision brief
cost analysis
overlap helpers
citation validation
```

Known important files/modules:

```text
main_complete.py
streamlit_app_enhanced.py
run_backend.sh
run_ui.sh
prism/
document_processing/
text_extraction/
retriever/
vectorstore/
PRISM_PY_Synthetic_Demo_Dataset/
```

## Critical implementation instruction

Do not assume the architecture described in this document already exists.

The coding agent must inspect the repository and determine:

```text
WHAT EXISTS
WHAT WORKS
WHAT IS PARTIAL
WHAT IS MOCKED
WHAT IS UNUSED
WHAT IS BROKEN
WHAT IS MISSING
```

Then implement the missing pieces.

---

# 6. AGENTIC DEVELOPMENT MODE

The development process itself must be automation-friendly.

The coding agent must operate as an **implementation agent**, not as a documentation generator.

## Agent objective

Given the repository and this specification:

```text
Inspect
→ Plan
→ Implement
→ Run
→ Test
→ Diagnose
→ Repair
→ Retest
→ Integrate
→ Verify
→ Document
```

The agent must not stop after generating code.

---

# 7. AUTONOMOUS CODING AGENT LOOP

```text
PHASE 1
Repository discovery

PHASE 2
Runtime verification

PHASE 3
Architecture gap analysis

PHASE 4
Backend implementation

PHASE 5
Database implementation

PHASE 6
AI/RAG implementation

PHASE 7
GeM/procurement implementation

PHASE 8
Frontend implementation

PHASE 9
API integration

PHASE 10
Security hardening

PHASE 11
Unit testing

PHASE 12
Integration testing

PHASE 13
End-to-end testing

PHASE 14
Clean-start verification

PHASE 15
UI/UX verification

PHASE 16
Final defect repair

PHASE 17
Demo verification
```

The agent must repeat repair cycles until the acceptance criteria are satisfied.

---

# 8. AGENT RULES

The coding agent must:

- inspect before editing;
- preserve working functionality;
- avoid unnecessary rewrites;
- avoid deleting useful modules;
- use existing dependencies where appropriate;
- add dependencies only when justified;
- avoid fake API responses;
- avoid hardcoded dashboard statistics;
- avoid placeholder buttons that do nothing;
- avoid dead navigation;
- avoid mock procurement results presented as live;
- avoid hardcoded AI answers;
- avoid storing secrets in source code;
- run tests after major changes;
- verify frontend against the actual backend;
- verify every route;
- verify every workflow transition;
- verify authorization;
- verify error states;
- verify clean startup.

---

# 9. AUTOMATED REPAIR BEHAVIOR

When a test fails:

```text
Read error
↓
Locate root cause
↓
Inspect related code
↓
Patch minimum required scope
↓
Run focused test
↓
Run dependent tests
↓
Run full suite
```

Do not hide failures.

Do not mark a feature complete if it is only visually implemented.

---

# 10. TARGET ARCHITECTURE

```text
                    ┌──────────────────────────┐
                    │ Authorized Department    │
                    │ Users / Officers         │
                    └────────────┬─────────────┘
                                 │ HTTPS
                                 ↓
                    ┌──────────────────────────┐
                    │ WAF / Reverse Proxy      │
                    │ Rate Limit / Headers     │
                    └────────────┬─────────────┘
                                 ↓
                    ┌──────────────────────────┐
                    │ Next.js / React Frontend  │
                    └────────────┬─────────────┘
                                 │ REST / JSON
                                 ↓
                    ┌──────────────────────────┐
                    │ Flask API                 │
                    │ Auth / RBAC / Validation  │
                    └────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ↓                      ↓                      ↓
   Proposal Engine          AI/RAG Engine         Workflow Engine
          │                      │                      │
          ↓                      ↓                      ↓
   Document Engine        Retriever/Reranker     Decision Engine
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 ↓
                    ┌──────────────────────────┐
                    │ PostgreSQL + pgvector    │
                    │ Metadata + Relationships │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    ↓                          ↓
             Object Storage              Background Jobs
             Documents                   OCR / Embeddings
                                         Indexing / Analysis
```

---

# 11. TECHNOLOGY STACK

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui where appropriate
Lucide / Iconify / Material Symbols
TanStack Query
React Hook Form
Zod
Recharts
React Flow
MapLibre / Leaflet
```

## Backend

Initially preserve:

```text
Flask
Python
Pydantic
Flask-CORS
```

Optional future:

```text
FastAPI migration
```

Do not make migration a prerequisite for the hackathon.

## Data

Target production:

```text
PostgreSQL
pgvector
Object Storage
Redis
Background Workers
```

Current demo may use local storage/SQLite where required, but all storage must be abstracted so production storage can be substituted.

---

# 12. SUPABASE PRODUCTION ARCHITECTURE

If Supabase is selected for deployment:

```text
Supabase Auth
        +
PostgreSQL
        +
pgvector
        +
Private Storage
        +
RLS
```

## Rules

Frontend receives only the public/anon key.

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
database passwords
private storage credentials
NVIDIA API keys
GeM credentials
```

Backend is responsible for privileged operations.

## Storage

Buckets:

```text
proposal-documents
decision-attachments
procurement-documents
policy-documents
reports
```

All sensitive buckets must be private.

Documents are accessed through short-lived signed URLs.

---

# 13. AUTHENTICATION

Support:

```text
Login
Logout
Session
Password reset where configured
Session expiry
Unauthorized handling
```

Production should support MFA where approved.

---

# 14. RBAC

Roles:

```text
INITIATOR
REVIEWER
APPROVING_AUTHORITY
PROCUREMENT_OFFICER
IMPLEMENTATION_OFFICER
ADMIN
AUDITOR
```

Permissions:

```text
proposal:create
proposal:view
proposal:edit
proposal:submit
proposal:return
proposal:approve
proposal:reject
precedent:view
policy:view
procurement:view
procurement:create
decision:create
implementation:view
implementation:update
outcome:create
audit:view
admin:manage_users
admin:manage_roles
```

Backend must enforce permissions.

Frontend hiding is only a usability feature.

---

# 15. ORGANIZATIONAL MASTER DATA

Maintain versioned:

```text
Organization
Region
Subdivision
Circle
Police Station
Outpost
Specialized Unit
Department
Office
```

Relationships must be provenance-backed.

Do not hardcode permanent jurisdiction assumptions.

The official Puducherry Police website and station profiles are authoritative public references for the department's published structure and should be ingested as versioned source data where permitted.

---

# 16. PROPOSAL CREATION

Create a multi-step proposal wizard.

## Step 1 — Basic Information

```text
Proposal Title
Department
Unit
Category
Priority
Initiator
Location
Region
Police Station
Expected Completion Date
```

## Step 2 — Requirement

```text
Requirement
Quantity
Unit
Purpose
Problem Statement
Expected Outcome
Dependencies
```

## Step 3 — Budget

```text
Estimated Cost
Currency
Cost Basis
Recurring / Non-recurring
Funding Source
```

## Step 4 — Technical Requirement

```text
Technology
Specification
Minimum Requirements
Integration Requirements
Warranty
Maintenance
Installation
Training
```

## Step 5 — Supporting Documents

Support:

```text
PDF
DOCX
XLSX
PPTX
TXT
```

## Step 6 — Review

```text
Save Draft
Analyze
Submit
```

---

# 17. PROPOSAL LIFECYCLE

States:

```text
DRAFT
ANALYZING
ANALYSIS_COMPLETE
SUBMITTED_FOR_REVIEW
RETURNED_FOR_MODIFICATION
RESUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
PROCUREMENT
IMPLEMENTATION
COMPLETED
CLOSED
ARCHIVED
```

Every state transition must be:

- permission checked;
- timestamped;
- attributed to a user;
- audited;
- reversible only through an explicit authorized action.

---

# 18. DOCUMENT MANAGEMENT

Pipeline:

```text
Upload
↓
Extension validation
↓
MIME validation
↓
Size validation
↓
SHA-256
↓
Malware scan hook
↓
Text extraction
↓
OCR fallback
↓
Page metadata
↓
Section metadata
↓
Chunking
↓
Embedding
↓
Indexing
```

Metadata:

```text
document_id
filename
mime_type
size
sha256
classification
source
source_url
uploaded_by
created_at
processing_status
ocr_status
page_count
language
version
```

---

# 19. OCR

Use:

```text
PyMuPDF
pytesseract
OCRmyPDF where available
```

Optional production providers:

```text
Azure Document Intelligence
AWS Textract
Google Document AI
```

OCR is only used where extraction quality requires it.

The UI must indicate:

```text
Text Extracted
OCR Used
OCR Failed
Manual Review Required
```

---

# 20. PROPOSAL DNA

Extract structured data:

```json
{
  "domain": "",
  "category": "",
  "objective": "",
  "problem_statement": "",
  "technology": [],
  "location": "",
  "region": "",
  "station": "",
  "quantity": null,
  "budget": null,
  "timeline": "",
  "procurement_type": "",
  "dependencies": [],
  "expected_outcomes": [],
  "risk_factors": [],
  "stakeholders": [],
  "keywords": [],
  "entities": []
}
```

Extraction must use a schema.

The model must not return uncontrolled prose where structured data is expected.

Every AI-extracted field must be editable.

---

# 21. PROPOSAL DNA CONFIRMATION

After extraction:

```text
AI Extracted
↓
Officer Review
↓
Edit if needed
↓
Confirm
↓
Index
```

Confirmed officer edits must be stored separately from original AI extraction.

Example:

```text
original_ai_value
confirmed_value
edited_by
edited_at
```

---

# 22. COMPLETENESS ENGINE

Check:

```text
Requirement
Quantity
Purpose
Problem Statement
Location
Expected Outcome
Budget
Technical Specification
Supporting Evidence
Implementation Plan
```

Result:

```text
PASS
WARNING
FAIL
```

Each issue must explain:

```text
What is missing?
Why it matters?
How to fix it?
```

---

# 23. PRECEDENT INTELLIGENCE

This is a core PS01 feature.

The system must search:

```text
Historical Proposals
Historical Decisions
Implementation Records
Outcomes
Lessons
Related Documents
```

---

# 24. HYBRID RETRIEVAL

Implement:

```text
Proposal DNA
↓
Keyword Retrieval
+
Vector Retrieval
+
Metadata Retrieval
+
Jurisdiction Retrieval
+
Structured Filters
↓
Candidate Pool
↓
Reranking
↓
Evidence Validation
↓
Final Results
```

Existing FAISS must actually be queried.

Do not leave FAISS as an unused artifact.

---

# 25. RETRIEVAL SCORING

Initial weights:

```text
Semantic similarity       30%
Objective similarity      20%
Metadata                  10%
Technology                10%
Jurisdiction              10%
Budget / scale             5%
Decision similarity        5%
Outcome similarity        10%
```

Weights must be configurable.

Store individual score components.

Do not present weights as scientifically validated until evaluated.

---

# 26. WHY-MATCH

Each precedent must explain:

```text
Objective
Technology
Location
Jurisdiction
Scale
Budget
Decision
Outcome
```

Example:

```text
Objective: Strong match
Technology: Strong match
Jurisdiction: Same station
Scale: Comparable
Budget: Comparable historical range
Outcome: Relevant implementation evidence
```

Never show only:

```text
Similarity: 94%
```

---

# 27. JURISDICTION INTELLIGENCE

Use verified relationships.

Ranking:

```text
Ring 0 — Same Station
Ring 1 — Neighboring Station
Ring 2 — Same Region
Ring 3 — Puducherry District
Ring 4 — UT-wide
```

Every relationship should have:

```text
source
source_document
confidence
verified_at
```

---

# 28. POLICY / SOP INTELLIGENCE

Index:

```text
Police Manual
Government Orders
Government Notifications
Standing Orders
SOPs
Acts
Rules
Administrative Instructions
Cybersecurity Guidelines
CCTNS-related documents
New Criminal Law notifications/SOPs
```

The official Puducherry Police Government Orders repository explicitly publishes categories including Police Manual, Acts, Government Orders, Standing Orders, CCTNS resources, notifications and SOPs. citeturn0search0

---

# 29. POLICY VERSIONING

Every policy source must support:

```text
document_id
title
document_type
issued_date
effective_from
effective_to
version
status
supersedes_document_id
authority
source_url
sha256
```

Status:

```text
CURRENT
SUPERSEDED
HISTORICAL
DRAFT
EXPIRED
```

Historical proposals must be matched against the policy version relevant to their decision date where possible.

Current proposals should prioritize currently effective sources.

---

# 30. POLICY OUTPUT

Use:

```text
Potentially Relevant Policy/SOP
Source
Date
Version
Relevant Section
Reason for Match
Evidence
```

Never say:

```text
This proposal is legally approved.
```

Instead:

```text
Potentially relevant policy/SOP identified. Officer review required.
```

---

# 31. TECHNICAL SPECIFICATION BUILDER

From the requirement, generate a draft specification.

For example:

```text
Requirement
↓
Functional Requirements
↓
Technical Requirements
↓
Minimum Specifications
↓
Compatibility
↓
Warranty
↓
Maintenance
↓
Installation
↓
Training
↓
Acceptance Criteria
```

The officer must be able to edit the generated specification.

The system must avoid manufacturer-specific bias unless the officer explicitly provides an approved requirement.

---

# 32. PROCUREMENT INTELLIGENCE

Procurement intelligence must combine:

```text
Historical departmental procurement
+
Puducherry Police tender records
+
GeM public/authorized information
+
Government procurement information
+
Official manufacturer specifications
+
Authorized internal records
```

Sources must retain provenance.

---

# 33. PROCUREMENT RULE

PRISM-PY must never implement:

```text
AI → Best Vendor → Vendor Selection
```

Instead:

```text
Requirement
↓
Specification
↓
Historical/Public Procurement Intelligence
↓
Comparison
↓
Evidence
↓
Officer Review
↓
Applicable Official Procurement Process
```

Historical suppliers/bidders may be displayed where legitimately available.

The system must not automatically select one.

---

# 34. GeM — END-TO-END INTELLIGENCE AND INTEGRATION

## Objective

Integrate GeM into PRISM-PY as a **procurement intelligence and workflow-assistance layer**.

Official GeM materials describe primary buying modes including Direct Purchase, Direct Purchase with L1 and e-bid/Reverse Auction, with applicable thresholds determined by current rules/platform guidance. GeM materials also state that decisions concerning available modes are made by the buyer with required approvals. citeturn0search26

GeM's official buyer learning portal includes courses for:

```text
Buyer Journey
Registration & Account Management
Procurement Modes — Products
Procurement Modes — Services
Order Processing & Payments
Ministry Specific Modules
Forward Auction
```

citeturn0search1

---

# 35. GeM WORKSPACE

Create a dedicated frontend module:

```text
Procurement
└── GeM Intelligence
```

Pages:

```text
GeM Overview
Requirement-to-GeM Search
Product/Service Comparison
Historical Price Observations
Specification Comparison
Procurement Mode Guidance
Saved Procurement Packages
GeM Handoff
Procurement Status
GeM Evidence
```

---

# 36. REQUIREMENT → GeM FLOW

```text
Proposal Requirement
↓
Proposal DNA
↓
Technical Specification
↓
GeM Search Parameters
↓
Category/Product Search
↓
Matching Products/Services
↓
Specification Comparison
↓
Price Observation
↓
Warranty / Delivery / Compliance
↓
Procurement Mode Context
↓
Officer Review
↓
GeM Handoff
```

---

# 37. GeM SEARCH PARAMETERS

Generate:

```text
category
product/service
keywords
technical parameters
quantity
delivery location
warranty
required delivery period
quality requirements
special requirements
```

The officer must be able to edit all parameters before search.

---

# 38. GeM PRODUCT COMPARISON

Where authorized data is available, compare:

```text
Product / Service
Manufacturer / OEM
Seller
Specification
Quantity
Observed Price
Warranty
Delivery
Country / applicable preference attributes
Compliance information
Source
Observed At
```

Do not rank a seller as “recommended” merely because it has the lowest displayed price.

---

# 39. GeM PRICE INTELLIGENCE

Store:

```text
product_id if available
category
description
specification_hash
observed_price
currency
quantity
seller_reference where legitimately available
manufacturer_reference where legitimately available
observed_at
source
source_type
```

Price analysis:

```text
Minimum observed
Median observed
Maximum observed
Distribution
Specification-adjusted comparison
```

Never represent an observation as an official sanctioned price unless the source explicitly establishes that fact.

---

# 40. GeM PROCUREMENT MODE

The system may display applicable platform/procurement information, but must not independently decide the legally applicable procurement route.

Display:

```text
Potential Procurement Mode
Reason / Threshold Context
Source
Current Guidance Date
Officer Verification Required
```

Official GeM documentation describes Direct Purchase, Direct Purchase with L1 and e-bid/Reverse Auction as supported buying modes. citeturn0search26

---

# 41. GeM OFFICIAL PORTAL HANDOFF

The system must provide:

```text
Open GeM
Open Relevant Search
Copy Search Parameters
Export Requirement Package
Export Specification
Export Comparison
```

Where an official GeM API or approved integration is available, implement API-based integration.

Where no approved API is available:

```text
PRISM-PY prepares the procurement package
↓
Officer opens official GeM portal
↓
Officer performs authorized transaction
↓
Officer returns status/reference
↓
PRISM-PY records the reference
```

Do not automate credential entry, CAPTCHA solving, OTP interception, or security-control bypass.

---

# 42. GeM AUTHORIZED API MODE

If an official GeM integration/API is provided to the department:

```text
PRISM-PY
↓
Secure Integration Gateway
↓
Official GeM API
↓
Search / Catalogue / Bid / Order status
↓
PRISM-PY
```

Requirements:

- official API documentation;
- approved credentials;
- secure token storage;
- least privilege;
- request logging;
- response provenance;
- rate limits;
- retries;
- error handling;
- API versioning.

Never reverse-engineer private endpoints.

---

# 43. GeM PROCUREMENT PACKAGE

Generate an exportable package:

```text
Proposal Number
Requirement
Quantity
Location
Justification
Technical Specification
Acceptance Criteria
Estimated Cost
Historical Cost Evidence
Relevant Policy/SOP
Relevant Procurement References
GeM Search Parameters
Officer Review Notes
```

Export formats:

```text
JSON
PDF
DOCX
XLSX
```

---

# 44. GeM BID / ORDER STATUS

If authorized integration exists:

```text
Search
→ Bid
→ Clarification
→ Evaluation status
→ Award status
→ Order
→ Delivery
→ Acceptance
→ Payment status where available
```

If no API exists, support manual reference capture:

```text
GeM Bid Number
GeM Order Number
Date
Status
Officer
Notes
Attachment
```

---

# 45. GeM PROCUREMENT AUDIT

Audit:

```text
Search initiated
Parameters changed
Comparison generated
Procurement package generated
GeM handoff opened
Reference recorded
Status updated
Attachment added
```

Never store GeM passwords.

---

# 46. COST INTELLIGENCE

Display:

```text
Current Estimate
Historical Minimum
Historical Median
Historical Maximum
Observed Range
Variance
```

Potential explanations:

```text
Quantity
Specification
Installation
Warranty
Maintenance
Infrastructure
Delivery
Procurement Mode
Time Difference
```

Never automatically label a difference as:

```text
Fraud
Corruption
Overpricing
Malpractice
```

Instead:

```text
Price variance detected. Verification recommended.
```

---

# 47. DUPLICATE / OVERLAP DETECTION

Compare:

```text
Objective
Technology
Location
Department
Budget
Quantity
Scope
Timeline
```

Output:

```text
Potential overlap detected
Existing Proposal
Similarity
Reasons
Evidence
```

This is a review signal, not an automatic rejection.

---

# 48. RISK / COMPLIANCE INTELLIGENCE

Signals may include:

```text
Missing justification
Missing quantity
Missing specification
Missing budget basis
Missing supporting evidence
Potential policy mismatch
Potential duplicate
Outdated policy reference
Large unexplained cost variance
Implementation dependency
Missing approval
```

All are advisory.

---

# 49. KNOWLEDGE GRAPH

Entities:

```text
PROPOSAL
STATION
REGION
POLICY
SOP
DECISION
SANCTION
PROCUREMENT
VENDOR
IMPLEMENTATION
OBSERVATION
OUTCOME
LESSON
TECHNOLOGY
LOCATION
```

Relationships:

```text
PROPOSAL → LOCATED_AT → STATION
PROPOSAL → GOVERNED_BY → SOP
PROPOSAL → SIMILAR_TO → PROPOSAL
PROPOSAL → RESULTED_IN → OUTCOME
PROPOSAL → IMPLEMENTED_AT → STATION
DECISION → APPROVED → PROPOSAL
PROPOSAL → DEPENDS_ON → TECHNOLOGY
OUTCOME → PRODUCED → LESSON
PROCUREMENT → SUPPORTS → PROPOSAL
```

PostgreSQL relationship tables are sufficient for the hackathon.

---

# 50. DECISION BRIEF

Generate:

1. Proposal Summary
2. Requirement
3. Proposal DNA
4. Completeness
5. Jurisdiction
6. Historical Precedents
7. Why-Match
8. Historical Decisions
9. Implementation Outcomes
10. Policy/SOP References
11. Technical Specification
12. Procurement Intelligence
13. GeM Intelligence
14. Cost Intelligence
15. Potential Overlaps
16. Risk Signals
17. Missing Information
18. Review Points
19. Evidence
20. Source Documents
21. AI Confidence
22. Final Officer Decision

---

# 51. EVIDENCE ARCHITECTURE

Every important generated statement should map to:

```text
Claim
↓
Evidence Chunk
↓
Document
↓
Page / Section
↓
Source
↓
Provenance
```

Example:

```text
Why this precedent matched
→ document chunk
→ page 4
→ proposal document
→ source metadata
```

If no evidence exists:

```text
Insufficient evidence in indexed records.
```

---

# 52. OFFICER DECISION WORKFLOW

Actions:

```text
Approve for Next Stage
Return for Modification
Reject
```

Return and rejection require a reason.

Approval records:

```text
officer
role
timestamp
comment
previous_state
new_state
```

---

# 53. IMPLEMENTATION TRACKING

States:

```text
NOT_STARTED
INITIATED
IN_PROGRESS
DELAYED
COMPLETED
VERIFIED
```

Fields:

```text
planned_start
planned_end
actual_start
actual_end
planned_cost
actual_cost
planned_quantity
delivered_quantity
responsible_unit
issues
observations
attachments
```

---

# 54. OUTCOMES

Capture:

```text
Outcome Status
Success Metrics
Actual Cost
Actual Duration
Implementation Issues
Observations
Benefits
Failures
Lessons
Future Recommendations
```

---

# 55. INSTITUTIONAL MEMORY

Lifecycle:

```text
Proposal
↓
Decision
↓
Procurement
↓
Implementation
↓
Outcome
↓
Lesson
↓
Institutional Memory
```

Lessons must be searchable by future proposals.

Original records must never be overwritten.

---

# 56. KNOWLEDGE BASE — SIX LAYERS

## Layer A — Authority / Organization

```text
Police Manual
Organization
Regions
Subdivisions
Circles
Stations
Outposts
Units
```

## Layer B — Rules

```text
GOs
Standing Orders
SOPs
Acts
Rules
Notifications
Administrative Instructions
```

## Layer C — Operational

```text
Station Profiles
CCTNS References
Control Room / ERSS
Wireless
Training
Infrastructure
```

## Layer D — Procurement

```text
Tenders
Procurement Records
Specifications
Awards where public
GeM information
Technical datasheets
```

## Layer E — Historical Proposals

Only authorized internal records in production.

Synthetic records for hackathon.

## Layer F — Outcomes

```text
Implementation
Observations
Results
Lessons
```

---

# 57. SOURCE AUTHORITY HIERARCHY

```text
Tier 1 — Official Puducherry Government / Police
Tier 2 — Government of India / MHA / Official Procurement
Tier 3 — Official Manufacturer / OEM
Tier 4 — Academic / Research
Tier 5 — Secondary Sources
```

Search ranking should prefer higher-authority sources where relevance is comparable.

---

# 58. PROVENANCE METADATA

Every source:

```text
document_id
title
document_type
source
source_url
authority
issuing_department
issued_date
effective_date
version
region
classification
language
page_count
sha256
ingested_at
verified_at
expiry_or_review_date
```

---

# 59. DATA INGESTION PIPELINE

```text
DISCOVERED
↓
CLASSIFIED
↓
SOURCE VALIDATED
↓
DUPLICATE CHECK
↓
SECURITY SCANNED
↓
EXTRACTED
↓
OCR
↓
CHUNKED
↓
EMBEDDED
↓
HUMAN REVIEW
↓
INDEXED
```

Failed jobs must be retryable.

---

# 60. KNOWLEDGE REFRESH

Recommended policies:

```text
Station master
→ periodic verification

Government Orders
→ on publication/change

SOPs
→ version-based

Tenders
→ scheduled refresh where technically permitted

GeM
→ official API/authorized feed where available

Market observations
→ timestamped observation

Internal records
→ controlled ingestion
```

Do not claim live data if the system has not refreshed it.

---

# 61. DATA CLASSIFICATION

```text
PUBLIC
INTERNAL
RESTRICTED
SENSITIVE
SYNTHETIC_DEMO
```

Hackathon demo:

```text
PUBLIC + SYNTHETIC_DEMO
```

No confidential police records should be placed into a public demo environment.

---

# 62. DATABASE SCHEMA

Minimum tables:

```text
organizations
users
roles
permissions
user_roles

regions
subdivisions
circles
police_stations
jurisdiction_relationships

proposals
proposal_versions
proposal_documents
proposal_dna

documents
document_chunks

precedents
precedent_scores

policies
policy_versions
policy_documents

procurement_records
procurement_observations
procurement_sources
procurement_packages

decisions
decision_actions

implementation_records
implementation_updates

outcomes
lessons

knowledge_entities
knowledge_relationships

audit_events
processing_jobs
model_runs
source_documents

notifications
saved_searches
```

---

# 63. PROPOSAL TABLE

Required fields:

```text
id
proposal_number
title
description
department_id
region_id
station_id
category
priority
status
estimated_cost
currency
requested_date
expected_completion_date
created_by
current_owner
classification
created_at
updated_at
```

---

# 64. PROPOSAL DNA TABLE

```text
proposal_id
domain
function
objective
problem_statement
technology
location
region
station
scale
quantity
budget
timeline
procurement_type
dependencies
expected_outcomes
risk_factors
stakeholders
keywords
entities
embedding
ai_extracted_json
confirmed_json
confirmed_by
confirmed_at
```

---

# 65. DOCUMENT CHUNKS

```text
id
document_id
page_number
section
chunk_index
content
token_count
embedding
metadata
created_at
```

---

# 66. PROCUREMENT RECORD

```text
id
proposal_id
source_type
source_url
category
product
manufacturer
seller_reference
specification
quantity
observed_price
currency
warranty
delivery
procurement_mode
observed_at
classification
provenance
```

---

# 67. AUDIT EVENT

```text
id
actor_id
action
object_type
object_id
old_value
new_value
result
request_id
ip_hash_or_approved_network_metadata
created_at
```

Do not store unnecessary personal data.

---

# 68. BACKGROUND JOBS

Implement:

```text
document.extract
document.ocr
document.chunk
document.embed
document.entity_extract
proposal.analyze
proposal.reindex
precedent.index
policy.index
procurement.refresh
knowledge.reindex
institutional_memory.index
report.generate
```

---

# 69. JOB STATES

```text
QUEUED
RUNNING
COMPLETED
FAILED
RETRYING
CANCELLED
```

UI must show progress.

---

# 70. API CONTRACT

## Proposals

```http
POST   /api/v1/proposals
GET    /api/v1/proposals
GET    /api/v1/proposals/{id}
PATCH  /api/v1/proposals/{id}
POST   /api/v1/proposals/{id}/submit
POST   /api/v1/proposals/{id}/return
POST   /api/v1/proposals/{id}/approve
POST   /api/v1/proposals/{id}/reject
```

## Documents

```http
POST   /api/v1/proposals/{id}/documents
GET    /api/v1/documents/{id}
POST   /api/v1/documents/{id}/process
GET    /api/v1/documents/{id}/status
```

## AI

```http
POST   /api/v1/proposals/{id}/analyze
GET    /api/v1/proposals/{id}/dna
PATCH  /api/v1/proposals/{id}/dna
POST   /api/v1/proposals/{id}/completeness
```

## Precedents

```http
POST   /api/v1/search/precedents
GET    /api/v1/proposals/{id}/precedents
```

## Policies

```http
POST   /api/v1/search/policies
GET    /api/v1/proposals/{id}/policies
```

## Procurement

```http
POST   /api/v1/search/procurement
GET    /api/v1/proposals/{id}/procurement
GET    /api/v1/procurement/{id}
GET    /api/v1/proposals/{id}/cost-analysis
POST   /api/v1/proposals/{id}/procurement-package
```

## GeM

```http
POST   /api/v1/gem/search
POST   /api/v1/gem/compare
GET    /api/v1/gem/guidance
POST   /api/v1/gem/package
POST   /api/v1/gem/handoff
POST   /api/v1/gem/reference
GET    /api/v1/proposals/{id}/gem
```

If official GeM API integration is available:

```http
POST   /api/v1/integrations/gem/search
GET    /api/v1/integrations/gem/bids/{id}
GET    /api/v1/integrations/gem/orders/{id}
```

## Decisions

```http
POST   /api/v1/proposals/{id}/decision-brief
GET    /api/v1/proposals/{id}/decision-brief
POST   /api/v1/proposals/{id}/decision
```

## Implementation

```http
POST   /api/v1/proposals/{id}/implementation
GET    /api/v1/proposals/{id}/implementation
PATCH  /api/v1/implementation/{id}
```

## Outcomes

```http
POST   /api/v1/proposals/{id}/outcome
GET    /api/v1/proposals/{id}/outcome
POST   /api/v1/proposals/{id}/lesson
```

## Audit

```http
GET    /api/v1/audit
GET    /api/v1/proposals/{id}/audit
```

---

# 71. API COMPATIBILITY

Existing routes must continue working where practical:

```http
GET  /health
POST /api/upload
POST /prism/analyze-proposal
POST /prism/decision-brief
POST /api/query
POST /api/demo/search
GET  /api/documents
```

Create compatibility adapters rather than breaking existing demo functionality.

---

# 72. FRONTEND STRUCTURE

```text
frontend/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── proposals/
│   │   ├── new/
│   │   └── [id]/
│   ├── precedents/
│   ├── policies/
│   ├── procurement/
│   │   ├── gem/
│   │   └── history/
│   ├── decisions/
│   ├── implementation/
│   ├── outcomes/
│   ├── knowledge/
│   ├── reports/
│   ├── audit/
│   └── administration/
├── components/
├── hooks/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── permissions/
│   └── validation/
├── types/
└── styles/
```

---

# 73. GOVERNMENT-GRADE UI

The UI must resemble a real government/police departmental application.

Use:

```text
Deep Navy
White
Light Gray
Restrained Blue
Dark Text
Subtle Borders
```

Avoid:

```text
Neon gradients
AI robot imagery
Rainbow cards
Emoji icons
Large decorative AI icons
Excessive glassmorphism
Generic SaaS dashboards
```

Use:

```text
Lucide
Iconify
Material Symbols
```

with restrained line icons.

---

# 74. HEADER

Include:

```text
Puducherry Police Crest / Identity
Puducherry Police
PRISM-PY
Police Proposal Retrieval, Intelligence & Strategy Matrix
Global Search
Accessibility / Text Size
User
Logout
```

---

# 75. TOP NAVIGATION

```text
Home
Proposals
Precedents
Procurement
Policies & SOP
Decisions
Implementation
Reports
Administration
```

---

# 76. SIDEBAR

```text
DASHBOARD

PROPOSALS
  New Proposal
  My Proposals
  All Proposals

INTELLIGENCE
  Precedent Search
  Policy & SOP
  Procurement
  GeM Intelligence
  Equipment Library

ANALYSIS
  Decision Briefs
  Cost Analysis
  Risk & Compliance

IMPLEMENTATION
  Implementation Tracking
  Outcomes & Lessons

KNOWLEDGE
  Knowledge Base
  Reports & Analytics

ADMINISTRATION
  Audit Logs
  User Management
  Settings
```

---

# 77. DASHBOARD

All metrics must come from API.

KPIs:

```text
Total Proposals
Pending Review
Approved
Rejected
In Implementation
Completed
```

Sections:

```text
Important Updates
Recent Proposals
Pending Reviews
Latest Activity
Quick Actions
Implementation Alerts
Procurement Intelligence
Institutional Memory
Public Procurement Links
Help & Support
```

---

# 78. PROPOSAL DETAIL PAGE

Tabs:

```text
Overview
Documents
Proposal DNA
Completeness
Precedents
Jurisdiction
Policies
Specification
Procurement
GeM
Cost
Risk
Decision Brief
Decision
Implementation
Outcomes
Institutional Memory
Audit
```

---

# 79. PRECEDENT SEARCH UI

Display:

```text
Search
Filters
Result Count
Relevance
Jurisdiction Ring
Why Match
Decision
Outcome
Cost
Evidence
Source
```

---

# 80. PROCUREMENT UI

Sections:

```text
Requirement
Specification
Historical Procurement
Government Tenders
GeM Intelligence
Cost
Comparison
Procurement Package
Handoff
Status
```

---

# 81. GEМ UI

Create a professional procurement workspace.

```text
GeM Intelligence
────────────────────────────────────

Requirement Summary

Search Parameters
[ Category ]
[ Product / Service ]
[ Quantity ]
[ Delivery Location ]
[ Technical Parameters ]

[ Search GeM / Authorized Source ]

Results

Product | Specification | Price | Warranty | Delivery | Source

[ Compare Selected ]

Procurement Guidance

[ Generate Procurement Package ]

[ Open Official GeM Portal ]

Reference / Bid / Order

[ Record Reference ]
```

---

# 82. RESPONSIVE DESIGN

Support:

```text
Desktop
Laptop
Tablet
```

The primary hackathon demo should be optimized for desktop.

No horizontal overflow.

No Streamlit side panel.

---

# 83. API CLIENT

Use:

```text
frontend/lib/api/client.ts
frontend/lib/api/auth.ts
frontend/lib/api/proposals.ts
frontend/lib/api/documents.ts
frontend/lib/api/precedents.ts
frontend/lib/api/policies.ts
frontend/lib/api/procurement.ts
frontend/lib/api/gem.ts
frontend/lib/api/decisions.ts
frontend/lib/api/implementation.ts
frontend/lib/api/outcomes.ts
frontend/lib/api/audit.ts
```

Do not scatter fetch calls throughout components.

---

# 84. FRONTEND STATE

Use TanStack Query for server state.

Use React Hook Form + Zod for forms.

All pages must implement:

```text
Loading
Empty
Error
Success
Unauthorized
Forbidden
Not Found
Validation Failed
Processing
```

---

# 85. ERROR CONTRACT

Backend:

```json
{
  "error": {
    "code": "PROPOSAL_VALIDATION_FAILED",
    "message": "Required field missing",
    "details": {}
  }
}
```

Never expose stack traces.

---

# 86. SEARCH FILTERS

Support:

```text
Keyword
Category
Technology
Station
Region
Status
Budget Range
Year
Document Type
Proposal State
Procurement Type
Decision
Outcome
```

---

# 87. KNOWLEDGE GRAPH UI

Use React Flow.

Display:

```text
Proposal
↓
Station
↓
Related Proposals
↓
Policy
↓
Decision
↓
Procurement
↓
Implementation
↓
Outcome
↓
Lesson
```

Clicking an entity opens its source record.

---

# 88. AUDIT UI

Filters:

```text
Date
User
Action
Object
Proposal
Result
```

Audit records are append-only.

Normal users cannot edit audit events.

---

# 89. SECURITY

Implement:

```text
HTTPS-ready
Secure CORS
Rate Limiting
Input Validation
File Validation
SHA-256
Malware Scan Hook
Secure Headers
CSP
HSTS
RBAC
RLS
Private Storage
Signed URLs
Secret Management
Audit Logs
Request IDs
Structured Logging
```

---

# 90. PROMPT INJECTION DEFENSE

Uploaded documents are untrusted data.

Never treat text inside a document as an instruction to the AI.

Use:

```text
Question
↓
Retriever
↓
Evidence
↓
Reranker
↓
Structured Context
↓
LLM
↓
Schema Validation
↓
Citation Validation
↓
Answer
```

If evidence is insufficient:

```text
Insufficient evidence in indexed records.
```

---

# 91. SECRET MANAGEMENT

Never commit:

```text
.env
API keys
NVIDIA keys
Supabase service key
Database password
GeM credentials
Tokens
```

Use:

```text
.env.example
```

---

# 92. DATA RETENTION

Maintain original versions.

Never overwrite:

```text
Original Proposal
Original Document
Original AI Extraction
Original Decision
Original Outcome
```

New versions create new records.

---

# 93. VERSION CONTROL

Documents:

```text
v1
v2
v3
```

Policies:

```text
Current
Superseded
Historical
```

Proposals:

```text
Draft Version
Submitted Version
Returned Version
Approved Version
```

---

# 94. NOTIFICATIONS / TASKS

Provide in-app task indicators:

```text
Proposal awaiting review
Proposal returned
Proposal approved
Implementation overdue
Outcome due
Document processing failed
GeM reference updated
```

Email/SMS integration should only be implemented through approved organizational channels.

---

# 95. AUTOMATED PROPOSAL AGENT

PRISM-PY may contain an internal **Proposal Intelligence Agent**.

The agent can orchestrate:

```text
Read proposal
→ Extract DNA
→ Check completeness
→ Retrieve precedents
→ Search policies
→ Build specification
→ Search procurement intelligence
→ Compare cost
→ Detect overlap
→ Build decision brief
```

The agent cannot:

```text
Approve
Reject
Select vendor
Issue purchase order
Change official records without authorization
```

---

# 96. AGENT TOOL PERMISSIONS

Separate tools:

```text
read_proposal
read_document
extract_dna
search_precedents
search_policies
search_procurement
search_gem
compare_products
calculate_cost
detect_overlap
generate_brief
create_task
update_implementation
record_outcome
```

Privileged actions:

```text
approve_proposal
reject_proposal
submit_procurement
place_order
```

must require explicit authorized human confirmation.

---

# 97. AGENT STATE MACHINE

```text
IDLE
↓
UNDERSTANDING
↓
RETRIEVING
↓
ANALYZING
↓
PREPARING_RECOMMENDATIONS
↓
WAITING_FOR_HUMAN_REVIEW
↓
ACTION_AUTHORIZED
↓
EXECUTING
↓
VERIFYING
↓
COMPLETED
```

---

# 98. AGENT MEMORY

The agent must not use hidden uncontrolled memory.

Use explicit records:

```text
Proposal Context
Evidence
Decision
Outcome
Lesson
```

Only verified institutional memory enters the long-term knowledge base.

---

# 99. AGENT AUDIT

Log:

```text
Agent Run ID
Proposal ID
Tools Used
Queries
Evidence
Model
Model Version
Start Time
End Time
Output
Human Confirmation
```

---

# 100. HUMAN-IN-THE-LOOP

Before consequential actions:

```text
AI prepares
↓
Human reviews
↓
Human confirms
↓
System executes
```

---

# 101. PROCUREMENT AGENT

The procurement agent may:

```text
Understand requirement
Extract specifications
Search historical procurement
Search authorized GeM data
Compare products/specifications
Prepare procurement package
Prepare GeM search parameters
Generate cost intelligence
```

It may not:

```text
select vendor
bypass tender
place order without authorization
alter procurement rules
```

---

# 102. GeM AGENT

The GeM agent operates in two modes.

## Mode A — Intelligence

```text
Search
Compare
Analyze
Prepare
```

## Mode B — Authorized Integration

Only if official API/integration exists:

```text
Search
Retrieve authorized data
Create permitted draft
Retrieve status
Update PRISM-PY
```

Any transaction requiring legal/organizational authorization requires human confirmation.

---

# 103. LIVE DATA HONESTY

Every external result must show:

```text
Source
Observed At
Data Freshness
```

If data is cached:

```text
Cached — Last Updated: ...
```

If synthetic:

```text
SYNTHETIC DEMO DATA
```

If unavailable:

```text
Live source unavailable.
Use official portal for current information.
```

---

# 104. OFFICIAL GEМ PORTAL

The official GeM portal must be linked as the authoritative transaction destination.

```text
https://gem.gov.in/
```

PRISM-PY should not impersonate GeM.

The application may provide:

```text
Open GeM
```

and generate structured search/procurement information for the authorized officer.

---

# 105. PUBLIC PROCUREMENT SOURCES

Use authoritative sources such as:

```text
Official Puducherry Police tender resources
Official Government procurement resources
GeM
Official manufacturer documentation
Authorized internal records
```

Puducherry Police's public website exposes Tenders and other departmental resources, while its Government Orders repository contains policy and SOP material relevant to knowledge ingestion. citeturn0search2turn0search0

---

# 106. GEМ DATA SAFETY

Do not:

- scrape authenticated/private GeM pages without authorization;
- bypass CAPTCHA;
- bypass OTP;
- bypass rate limits;
- use employee credentials;
- automate a purchase without approved authorization;
- reverse engineer protected APIs.

Use:

```text
Official APIs
Official exports
Publicly accessible authorized information
Manual officer handoff
```

---

# 107. SYNTHETIC DEMO DATA

Target:

```text
60 proposals
25 policies/SOPs
40 decisions
30 implementation records
30 outcomes
30 procurement records
50+ entities
100+ relationships
15 risk signals
10 overlap cases
```

All synthetic records must include:

```text
SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD
```

---

# 108. SYNTHETIC DEMO THEMES

Use:

```text
Infrastructure
Procurement
Technology
Cybersecurity
Communication
Traffic
Training
Emergency Response
Modernization
Equipment
```

---

# 109. FLAGSHIP DEMO

Proposal:

**AI-Enabled CCTV & Video Analytics Modernization**

Demo:

```text
00:00 Login
00:10 Dashboard
00:20 New Proposal
00:35 Enter Requirement
00:50 Upload Proposal
01:00 Proposal DNA
01:15 Completeness
01:25 Precedents
01:40 Why-Match
01:55 Jurisdiction
02:05 Policy/SOP
02:15 Procurement
02:25 GeM Intelligence
02:35 Cost
02:45 Decision Brief
02:55 Officer Decision
03:10 Implementation
03:20 Outcome
03:30 Institutional Memory
03:40 New Proposal Retrieval
```

The final demo may be longer than three minutes, but the core story must be explainable in approximately three minutes.

---

# 110. DEMO NARRATIVE

> “When a new proposal reaches the department, PRISM-PY does not merely store it. It understands the requirement, searches institutional memory, identifies similar proposals, explains why they are relevant, checks policies and SOPs, provides procurement intelligence including GeM context where authorized, highlights cost and overlap signals, and prepares an evidence-backed decision brief. The authorized officer remains the final decision-maker. Once implemented, the outcome and lessons become institutional memory for the next proposal.”

---

# 111. OFFICIAL SOURCE INGESTION

Initial public source targets:

```text
Puducherry Police Home Page
Government Orders
Standing Orders
Police Manual
SOPs
Police Station Profiles
CCTNS public/context documents
Puducherry Police Tenders
Official Government procurement resources
GeM official information
Official manufacturer technical documents
```

The public Police site explicitly states that access to some circulars, forms and administrative notifications is restricted to authorized police personnel. PRISM-PY must respect those access boundaries. citeturn0search2

---

# 112. CURRENT SOURCE EXAMPLES

Official Puducherry Police Government Orders:

```text
https://police.py.gov.in/GovOrders.htm
```

Official Puducherry Police:

```text
https://police.py.gov.in/
```

GeM:

```text
https://gem.gov.in/
```

GeM handbook:

```text
https://assets-bg.gem.gov.in/resources/pdf/GeM_handbook.pdf
```

GeM buyer learning:

```text
https://elearning.gem.gov.in/course/index.php?categoryid=1
```

---

# 113. EXTERNAL SOURCE REFRESH

External sources should be refreshed through scheduled jobs where access and terms permit.

Never silently replace historical data.

Store:

```text
retrieved_at
source_url
content_hash
version
status
```

---

# 114. REPORTS

Generate:

```text
Proposal Summary
Decision Brief
Precedent Report
Policy Report
Procurement Intelligence Report
GeM Comparison Report
Cost Analysis
Implementation Report
Outcome Report
Audit Report
Institutional Memory Report
```

---

# 115. EXPORT

Support:

```text
PDF
DOCX
XLSX
JSON
CSV where appropriate
```

Exports must include provenance.

---

# 116. ANALYTICS

Dashboard analytics:

```text
Proposals by Status
Proposals by Category
Proposals by Region
Approval Turnaround
Implementation Delay
Budget Variance
Precedent Reuse
Policy Usage
Procurement Intelligence Usage
Outcome Distribution
Recurring Requirements
```

---

# 117. OBSERVABILITY

Track:

```text
API latency
P50
P95
P99
Search latency
AI latency
Document processing failures
Queue depth
Database errors
Authentication failures
Frontend errors
GeM integration errors
```

Use structured logs.

Every request should have a request/correlation ID.

---

# 118. PERFORMANCE TARGETS

Demo targets:

```text
Dashboard API response < 2s where feasible
Search < 3s on demo corpus
Proposal DNA < 10s
Decision Brief < 15s
```

Long-running work must be asynchronous.

---

# 119. TESTING

## Backend

Test:

```text
Auth
RBAC
Proposal CRUD
State transitions
Document upload
Extraction
OCR
DNA
Completeness
FAISS
Hybrid retrieval
Reranking
Jurisdiction
Policy retrieval
Procurement
GeM adapter
Cost analysis
Overlap
Decision
Implementation
Outcome
Lesson
Institutional memory
Audit
```

## Frontend

Test:

```text
Login
Dashboard
Proposal creation
Upload
DNA
Precedents
Policy
Procurement
GeM
Decision
Implementation
Outcome
Audit
Permissions
Errors
```

---

# 120. RETRIEVAL EVALUATION

Create at least:

```text
100 human-labelled test queries
```

Measure:

```text
Recall@5
Precision@5
MRR
NDCG
```

Also evaluate:

```text
jurisdiction ranking
metadata filtering
duplicate detection
policy retrieval
procurement retrieval
```

---

# 121. GENERATION EVALUATION

Measure:

```text
Citation Correctness
Citation Completeness
Groundedness
Hallucination Rate
Structured Output Validity
```

---

# 122. BUSINESS METRICS

Measure:

```text
Time to find precedent
Time to prepare decision brief
Time to complete proposal
Number of missing fields detected
Precedent reuse
Policy retrieval usefulness
Procurement research time
Implementation closure rate
Lesson reuse
```

---

# 123. SECURITY TESTING

Run:

```text
Dependency scan
Secret scan
SAST where available
File upload tests
Authentication tests
Authorization tests
Prompt injection tests
XSS tests
CSRF strategy
Rate-limit tests
Path traversal tests
Malformed document tests
```

---

# 124. CLEAN START TEST

From a clean machine/environment:

```text
Clone
Install
Configure .env
Start backend
Start frontend
Login
Create proposal
Complete lifecycle
```

The demo must not depend on an engineer's local hidden state.

---

# 125. DOCKER

Provide:

```text
Dockerfile.frontend
Dockerfile.backend
docker-compose.yml
```

Services:

```text
frontend
backend
postgres
redis
worker
```

---

# 126. DEVELOPMENT COMMANDS

The final README must contain exact commands for:

```text
Install
Environment setup
Database setup
Seed synthetic data
Build FAISS
Run backend
Run frontend
Run worker
Run tests
Run lint
Run typecheck
Run E2E
Docker
```

---

# 127. ENVIRONMENT VARIABLES

Example:

```env
APP_ENV=development
DEMO_MODE=true

API_BASE_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

API_BEARER_TOKEN=change-me

DATABASE_URL=
REDIS_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NVIDIA_API_KEY=
NVIDIA_BASE_URL=
NVIDIA_MODEL_ID=

EMBEDDING_MODEL=intfloat/e5-base-v2

GEM_INTEGRATION_ENABLED=false
GEM_API_BASE_URL=
GEM_API_KEY=
```

Do not invent GeM credentials or undocumented endpoints.

---

# 128. CI/CD

Pipeline:

```text
Push
↓
Lint
↓
Type Check
↓
Unit Tests
↓
Integration Tests
↓
Security Scan
↓
Build
↓
E2E
↓
Deploy
```

---

# 129. DEPLOYMENT

Development:

```text
Next.js → localhost:3000
Flask → localhost:5001
```

Production:

```text
WAF / Reverse Proxy
↓
Next.js
↓
Flask
↓
PostgreSQL + pgvector
↓
Object Storage
↓
Redis / Worker
```

Use approved departmental infrastructure for real police data.

---

# 130. BACKUP / DISASTER RECOVERY

Implement/document:

```text
Database backup
Document backup
Vector index rebuild
Configuration backup
Audit preservation
Restore procedure
Recovery test
```

Never rely on FAISS as the authoritative data store.

FAISS is a derived index.

---

# 131. VECTOR INDEX RULE

Authoritative data:

```text
PostgreSQL / Source Documents
```

Derived data:

```text
Embeddings
FAISS
Caches
```

If FAISS is lost:

```text
Rebuild from authoritative records.
```

---

# 132. DATA CONSISTENCY

Whenever proposal data changes:

```text
Proposal update
↓
Version record
↓
Audit
↓
Re-analysis decision
↓
Re-embedding if necessary
↓
Re-index
```

---

# 133. INSTITUTIONAL MEMORY UPDATE

After outcome:

```text
Outcome verified
↓
Lesson created
↓
Officer confirms lesson
↓
Lesson indexed
↓
Future retrieval enabled
```

Do not index unverified assumptions as institutional truth.

---

# 134. ADMINISTRATION

Admin pages:

```text
Users
Roles
Permissions
Stations
Regions
Source Registry
Knowledge Sources
Processing Jobs
Model Configuration
AI Providers
GeM Integration
Audit
System Settings
```

---

# 135. SOURCE REGISTRY

Every source should be registered:

```text
Source ID
Name
Type
Authority
URL
Access Type
Refresh Frequency
Last Checked
Status
Classification
```

---

# 136. SOURCE ACCESS TYPES

```text
PUBLIC
AUTHORIZED
INTERNAL
API
MANUAL_UPLOAD
```

The ingestion engine must enforce source access policy.

---

# 137. AI MODEL REGISTRY

Store:

```text
provider
model
version
temperature if applicable
prompt_version
schema_version
run_id
timestamp
```

This enables reproducibility.

---

# 138. PROMPT VERSIONING

Every production prompt must have:

```text
prompt_name
version
created_at
updated_at
purpose
schema
```

Do not silently modify prompts without versioning.

---

# 139. AI CONFIDENCE

Confidence must be meaningful.

Use:

```text
HIGH
MEDIUM
LOW
```

with evidence.

Do not fabricate numerical confidence.

---

# 140. AI FAILURE MODE

If model fails:

```text
Use deterministic extraction where possible
↓
Show processing status
↓
Allow retry
```

The entire application must not become unusable because an LLM API is unavailable.

---

# 141. OFFLINE / DEMO MODE

When:

```env
DEMO_MODE=true
```

the system must:

- use synthetic data;
- use local embeddings;
- use deterministic seed records;
- avoid live external procurement calls;
- work without an NVIDIA key;
- clearly display synthetic status.

---

# 142. NO MOCK LIVE DATA

Never display:

```text
“Live GeM result”
```

unless actually retrieved.

Instead:

```text
Demo procurement observation
```

or:

```text
Official source observation — retrieved at ...
```

---

# 143. PROPOSAL AUTOMATION

When a proposal is submitted for analysis:

```text
1. Validate
2. Extract DNA
3. Check completeness
4. Search precedents
5. Search jurisdiction
6. Search policies
7. Build specification
8. Search procurement
9. Search GeM if authorized
10. Cost analysis
11. Overlap detection
12. Risk signals
13. Generate decision brief
14. Create review task
15. Audit all steps
```

---

# 144. AUTOMATED REVIEW TASK

Create:

```text
Review Task
Proposal
Priority
Assigned Officer
Due Date
AI Summary
Outstanding Issues
Evidence
```

The task remains pending until the officer acts.

---

# 145. APPROVAL AUTOMATION

No automatic approval.

System:

```text
AI Recommendation
↓
Human Review
↓
Explicit Action
↓
Authorization Check
↓
Audit
↓
State Transition
```

---

# 146. PROCUREMENT AUTOMATION

No automatic purchase.

System:

```text
Requirement
↓
Procurement Intelligence
↓
GeM Search Parameters
↓
Comparison
↓
Procurement Package
↓
Human Authorization
↓
Official Procurement Platform
```

---

# 147. IMPLEMENTATION AUTOMATION

When approved/procurement is complete:

```text
Create implementation record
↓
Assign responsible unit
↓
Set milestones
↓
Track progress
↓
Alert delays
↓
Complete
↓
Verify
↓
Collect outcome
```

---

# 148. OUTCOME AUTOMATION

After implementation:

```text
Request outcome
↓
Capture metrics
↓
Capture actual cost
↓
Capture issues
↓
Capture lessons
↓
Officer verification
↓
Institutional memory
```

---

# 149. SMART ALERTS

Generate alerts for:

```text
Missing proposal information
Review overdue
Implementation delayed
Cost variance
Outcome overdue
Document processing failure
Policy version conflict
Potential duplicate
```

Alerts must be explainable.

---

# 150. EMAIL / NOTIFICATION BOUNDARY

No notification should be sent externally without configured authorized infrastructure.

For demo:

```text
In-app notifications
```

are sufficient.

---

# 151. DATA PRIVACY

Minimize:

```text
PII
Personal contacts
Unnecessary employee data
Sensitive identifiers
```

Do not ingest restricted records into a public demo.

---

# 152. AUDIT MODEL

Every important action records:

```text
WHO
WHAT
WHEN
OBJECT
RESULT
```

Additional:

```text
REQUEST ID
MODEL RUN ID
SOURCE
```

---

# 153. AUDIT EVENTS

```text
LOGIN
LOGOUT
PROPOSAL_CREATED
PROPOSAL_UPDATED
DOCUMENT_UPLOADED
DOCUMENT_VIEWED
DOCUMENT_PROCESSED
AI_ANALYSIS_STARTED
AI_ANALYSIS_COMPLETED
PRECEDENT_SEARCHED
POLICY_SEARCHED
PROCUREMENT_SEARCHED
GEM_SEARCHED
DECISION_BRIEF_GENERATED
PROPOSAL_SUBMITTED
PROPOSAL_RETURNED
PROPOSAL_APPROVED
PROPOSAL_REJECTED
IMPLEMENTATION_UPDATED
OUTCOME_CREATED
LESSON_CREATED
PERMISSION_CHANGED
```

---

# 154. FILE STRUCTURE

Target:

```text
prism-py/
├── frontend/
├── backend/
├── prism/
├── document_processing/
├── text_extraction/
├── retriever/
├── vectorstore/
├── workers/
├── integrations/
│   └── gem/
├── database/
│   ├── migrations/
│   └── seeds/
├── PRISM_PY_Synthetic_Demo_Dataset/
├── tests/
│   ├── backend/
│   ├── frontend/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── CURRENT_STATE.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DATA_MODEL.md
│   ├── AI_PIPELINE.md
│   ├── PROCUREMENT.md
│   ├── GEM_INTEGRATION.md
│   └── DEMO.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
└── MASTER_DEVELOPMENT_SPEC.md
```

---

# 155. MIGRATION STRATEGY FROM STREAMLIT

Do not delete Streamlit first.

Phase:

```text
Existing Streamlit
+
New Next.js
↓
Both use backend
↓
Next.js reaches feature parity
↓
E2E verified
↓
Streamlit becomes legacy/demo fallback
```

Only remove Streamlit after verification.

---

# 156. CURRENT RETRIEVAL GAP FIX

If existing implementation does:

```text
Keyword scoring
```

replace/augment with:

```text
Keyword
+
FAISS semantic
+
Metadata
+
Jurisdiction
+
Reranking
+
Outcome
+
Decision
```

Do not claim hybrid retrieval until actual vector queries are executed.

---

# 157. CURRENT DNA GAP FIX

If existing parser only understands labelled headings:

Implement:

```text
Document extraction
↓
Heading-aware parser
+
LLM structured extraction
+
Fallback rules
↓
Schema validation
↓
Officer confirmation
```

---

# 158. CURRENT WORKFLOW GAP FIX

Implement missing:

```text
Approve
Return
Reject
Implementation
Outcome
Lesson
Institutional memory
```

---

# 159. CURRENT KNOWLEDGE GRAPH GAP FIX

If graph is currently absent:

Implement PostgreSQL relationship tables first.

React Flow visualization comes after relationships are stored.

---

# 160. CURRENT PROCUREMENT GAP FIX

Replace purely seeded/static intelligence with a provenance-backed architecture.

Support:

```text
historical internal records
official public tender sources
GeM authorized/public information
official technical sources
```

All observations timestamped.

---

# 161. CURRENT GEМ GAP FIX

Implement:

```text
GeM Search Parameters
GeM Intelligence Workspace
Comparison
Price Observation
Procurement Mode Context
Package Generation
Official Portal Handoff
Reference Capture
Optional Authorized API Adapter
```

Do not build unsupported private GeM scraping.

---

# 162. E2E ACCEPTANCE TEST

The following sequence must pass:

```text
1. Login
2. Dashboard
3. Create proposal
4. Save draft
5. Upload document
6. Process document
7. Generate DNA
8. Edit/confirm DNA
9. Run completeness
10. Search precedents
11. Open precedent
12. View why-match
13. View jurisdiction
14. Search policy/SOP
15. Build specification
16. Search procurement
17. Open GeM Intelligence
18. Generate GeM search parameters
19. Compare available authorized data
20. Generate procurement package
21. Open official GeM handoff
22. Record GeM reference if applicable
23. Run cost analysis
24. Detect overlap
25. Generate decision brief
26. Submit
27. Return for modification
28. Modify
29. Re-analyze
30. Resubmit
31. Approve
32. Start implementation
33. Update implementation
34. Mark completed
35. Record outcome
36. Record lesson
37. Index institutional memory
38. Create second proposal
39. Retrieve first proposal as precedent
40. Retrieve institutional lesson
41. Verify audit trail
```

---

# 163. ACCEPTANCE CRITERIA

The system is complete only when:

- [ ] Frontend runs
- [ ] Backend runs
- [ ] Authentication works
- [ ] RBAC works
- [ ] Dashboard uses real data
- [ ] Proposal creation works
- [ ] Proposal editing works
- [ ] Proposal lifecycle works
- [ ] Document upload works
- [ ] OCR fallback exists
- [ ] Proposal DNA works
- [ ] Officer confirmation works
- [ ] Completeness works
- [ ] FAISS is actually queried
- [ ] Hybrid retrieval works
- [ ] Why-Match works
- [ ] Jurisdiction intelligence works
- [ ] Policy/SOP retrieval works
- [ ] Specification builder works
- [ ] Procurement intelligence works
- [ ] GeM workspace works
- [ ] GeM handoff works
- [ ] Authorized API adapter architecture exists
- [ ] Cost intelligence works
- [ ] Overlap works
- [ ] Risk signals work
- [ ] Decision Brief works
- [ ] Approve works
- [ ] Return works
- [ ] Reject works
- [ ] Implementation works
- [ ] Outcomes work
- [ ] Lessons work
- [ ] Institutional memory works
- [ ] Audit works
- [ ] Reports work
- [ ] Synthetic records are labelled
- [ ] No fake live GeM data
- [ ] No vendor auto-selection
- [ ] No autonomous approval
- [ ] No unsafe surveillance
- [ ] Security checks pass
- [ ] E2E tests pass
- [ ] Clean-start demo passes
- [ ] README is complete
- [ ] Deployment instructions are complete
- [ ] Agent final verification report is generated
