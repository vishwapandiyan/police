# PRISM-PY UI/UX Specification
## Frontend Layout, Components, User Flows, RAG Results, and Integration Contract

**Project:** PRISM-PY  
**Purpose:** UI specification for the Intelligent Proposal Management & Precedent Retrieval System (IPMPRS)  
**Scope:** Frontend experience and its integration with the AI/RAG backend  
**Authentication:** Intentionally omitted for the current prototype. No login, user accounts, roles, or user-management screens.

---

## 1. Product experience and design goals

PRISM-PY helps a police department explore proposals and historical records, retrieve relevant precedents, understand previous decisions and outcomes, and prepare evidence-backed decision briefs.

The UI must make a complex AI pipeline understandable to a non-technical officer. It should clearly communicate:
- What document or question is being analyzed.
- What the AI is doing at each stage.
- Which historical records were retrieved.
- Why a precedent is considered relevant.
- Which claims are supported by source evidence.
- Which findings are estimates, alerts, or suggestions rather than established facts.
- When evidence is insufficient or processing fails.

The interface is a **decision-support workspace**, not an autonomous approval system and not merely a generic chatbot.

### Design principles
1. **Evidence first:** important claims must link to their source.
2. **Explainable results:** show why a precedent was retrieved.
3. **Clear workflow:** upload, process, ask/analyze, inspect evidence, generate brief.
4. **Visible uncertainty:** show missing data and low-confidence extraction clearly.
5. **Human decision remains external:** the UI may prepare a brief, but it must not automatically approve or reject proposals.
6. **Simple first version:** one accessible workspace without authentication.
7. **Responsive:** support desktop first, with a usable tablet and mobile layout.
8. **No fake functionality:** every displayed action must work or be visibly marked as a demo/disabled feature.

---

## 2. Application shell and visual structure

Build a single-page application with a persistent top bar and a clear main workspace. Avoid an overly crowded enterprise dashboard.

### Top bar
Include:
- PRISM-PY logo/wordmark.
- Subtitle: **Proposal Intelligence & Precedent Retrieval**.
- Environment badge: **Demo Workspace** when using synthetic/sample data.
- A compact status indicator for AI service availability.
- A settings/help menu only if its actions are implemented.

Do not show a user avatar, login button, account menu, or user-management controls.

### Main navigation
Use a left navigation rail on desktop, collapsing into a drawer or compact menu on smaller screens.

Suggested navigation:
1. **Workspace**
2. **Documents**
3. **Precedent Explorer**
4. **Decision Briefs**
5. **Knowledge Graph**
6. **Processing History**

These sections can be implemented as routes or views within a single-page application. Keep the navigation shallow and avoid making the user jump between too many pages.

### Main workspace layout
On desktop, use three clear areas:
- **Left or top area:** upload and active document/session selection.
- **Center area:** proposal analysis and question/answer workspace.
- **Right panel:** evidence/source inspector, selected precedent details, and processing status.

The right panel should be collapsible. On narrow screens, panels should stack vertically or open as drawers. Do not require horizontal scrolling for ordinary forms or results.

---

## 3. Primary screen: Workspace

The Workspace is the default landing page and the most important screen. A user should be able to upload a document, ask a question, run proposal analysis, and inspect results without navigating away.

### Suggested layout

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ PRISM-PY | Proposal Intelligence & Precedent Retrieval     Demo Workspace │
├─────────────────┬──────────────────────────────────────┬──────────────────┤
│ NAVIGATION      │ MAIN WORKSPACE                       │ EVIDENCE PANEL   │
│                 │                                      │                  │
│ Workspace       │ Proposal / Document Workspace        │ Selected Source  │
│ Documents       │                                      │                  │
│ Precedents      │ [Upload documents]                   │ Source metadata  │
│ Decision Briefs │ [Current proposal summary]           │ Page / chunk     │
│ Knowledge Graph │ [Ask a question...]                  │ Highlighted text │
│ History         │ [Analyze proposal]                   │ Open document    │
│                 │                                      │                  │
│                 │ [Analysis timeline and results]       │                  │
└─────────────────┴──────────────────────────────────────┴──────────────────┘
```

The exact proportions can adapt to screen width. The central workspace must remain the visual priority.

### Workspace sections
1. Introductory title and short explanation.
2. Document upload area.
3. Uploaded document queue.
4. Selected document/proposal summary.
5. Proposal DNA extraction panel.
6. Question composer.
7. Analysis actions.
8. Processing progress/timeline.
9. Results tabs.
10. Evidence/source inspector.

Avoid filling the initial screen with invented metrics. If no data has been uploaded, show a concise empty state and an optional clearly labelled synthetic sample to try.

---

## 4. Document upload experience

### Upload component

Provide a large drag-and-drop zone with:
- Label: **Upload proposal or reference documents**
- Supporting text listing supported formats: PDF, DOCX, XLSX, PPTX, images, HTML, and ZIP archives.
- A **Browse files** button.
- A file size limit from backend configuration.
- A note that scanned PDFs/images may require OCR.
- A note that ZIP contents are inspected and unsupported or unsafe files may be rejected.

Allow multiple files if the backend supports batch ingestion. If the backend supports only one file at a time, make the UI reflect that limit.

### File queue

After selection, show one row/card per file with:
- Filename.
- File type and size.
- Upload status.
- Processing status.
- Extracted page/slide/sheet count, if available.
- OCR status when relevant.
- Warnings, such as extension/content mismatch or incomplete extraction.
- Retry/remove action when supported.

Suggested statuses:
- Ready to upload
- Uploading
- Queued
- Detecting format
- Extracting text
- OCR in progress
- Chunking
- Creating embeddings
- Indexing
- Ready
- Completed with warnings
- Failed

Use a progress indicator only when real progress is available. Otherwise show stage-based progress and do not invent a precise percentage.

### Upload validation
The UI should display backend errors in plain language:
- Unsupported file type.
- File too large.
- Corrupt or encrypted document.
- ZIP contains too many files or unsafe paths.
- OCR failed or returned little text.
- Duplicate content detected.
- Processing failed and can be retried.

Do not rely only on frontend validation. The backend is authoritative.

### Document details drawer
Clicking a file opens a drawer/panel with:
- Metadata.
- Extraction preview.
- Page/slide/sheet list when available.
- Content hash or shortened identifier if useful for debugging.
- Warnings and processing history.
- A preview of extracted text.
- The option to inspect chunks.

Do not expose raw filesystem paths or internal secrets.

### Synthetic sample option
Offer a button such as **Try sample proposal** only if a bundled synthetic example is actually available. Label all sample records visibly as **Synthetic demo data**. Never imply that sample police records are real.

---

## 5. Proposal DNA extraction UI

After a proposal document is processed, show a structured panel titled **Proposal DNA**.

### Fields
Display the fields returned by the AI subsystem:
- Domain.
- Objective.
- Location.
- Police station.
- Jurisdiction/region.
- Budget and currency.
- Technology/equipment.
- Quantity or scale.
- Timeline.
- Procurement type.
- Expected outcomes.
- Risks and dependencies.

### Field presentation
Each field should display:
- Extracted value.
- Evidence link when available.
- Extraction confidence/status if returned by the backend.
- A status such as **Found**, **Needs review**, or **Not found in document**.

Use explicit unknown states. Do not fill missing values with guessed defaults.

### Interaction
- Allow the user to expand the supporting excerpt/source location.
- If manual correction is in scope, provide an **Edit extracted details** mode and send corrections through a dedicated backend contract.
- If editing is not supported yet, make the fields read-only and do not show a non-functional save button.
- Provide **Run precedent search** and **Analyze proposal** actions when the required fields are available.

### Important wording
Use “AI-extracted” or “Needs review” for model-generated fields. Do not imply the extraction is an official police record until validated.

---

## 6. Question and query experience

The user must be able to ask questions about uploaded documents and historical proposal records.

### Question composer
Include:
- A multiline text box with placeholder: **Ask about this proposal, similar past cases, decisions, outcomes, or applicable policies…**
- A clear **Ask** button.
- Optional prompt suggestions that can be clicked to populate the composer.
- An optional scope selector, if the backend supports it:
  - Current document
  - Current proposal and related documents
  - All indexed demo records
- An answer mode selector, if the backend supports routing modes:
  - **Document-grounded answer**
  - **Complex question analysis**
  - **General knowledge** (explicitly labelled as not necessarily supported by source documents)

Default to document-grounded answers. Do not enable general-knowledge mode silently.

### Suggested example questions
Use questions relevant to PRISM-PY:
- “Find proposals similar to this one.”
- “What happened after the closest matching proposal was approved?”
- “Which documents support the previous decision?”
- “What information is missing from this proposal?”
- “Compare the proposed budget with comparable historical projects.”
- “Which policies or SOPs may apply?”
- “Is there a possible overlap with another proposal?”
- “Why did the system rank this precedent first?”

Only display suggestion chips that the backend can support.

### Question submission behavior
When the user submits:
1. Preserve the original question.
2. Show the selected answer mode and retrieval scope.
3. Start the backend request.
4. Show a processing timeline.
5. Render the answer and evidence when complete.
6. Allow the user to inspect retrieved chunks and relevance explanations.
7. Provide a retry action for transient failures.

Do not clear the question if the request fails.

---

## 7. RAG processing and analysis progress UI

Make the AI workflow visible without overwhelming the user with internal implementation details.

### Suggested progress timeline
Show the following stages as they happen when the backend reports them:

1. **Understanding the question**
2. **Extracting proposal details** (if required)
3. **Expanding or decomposing the query** (if used)
4. **Searching document text**
5. **Searching semantic embeddings**
6. **Applying metadata and jurisdiction filters**
7. **Combining and reranking results**
8. **Checking relevance**
9. **Preparing source evidence**
10. **Generating the response**
11. **Validating citations**
12. **Ready for review**

Do not claim a stage was executed if the backend did not execute it. For example, if query decomposition was not needed, show “Not needed” or omit it rather than suggesting it ran.

### Progress component
Each stage can show:
- Pending.
- In progress.
- Completed.
- Skipped.
- Warning.
- Failed.

If backend progress events are unavailable, show a spinner and concise status text rather than fake per-stage progress.

### Technical details
A collapsible **Retrieval details** section can show:
- Search strategies used: lexical, semantic, or both.
- Number of candidates retrieved.
- Number remaining after filters.
- Whether query expansion/decomposition ran.
- Reranking status.
- Relevance threshold configuration.
- Processing duration.
- Any partial failures.

Keep implementation jargon hidden by default. Offer a “Details” expansion for technical judges and developers.

---

## 8. Answer and evidence presentation

The response view should prioritize the answer and then let the user verify it.

### Answer card
Include:
- The answer.
- Answer mode.
- A clear **Evidence-backed** or **General knowledge** label based on actual route metadata.
- Confidence/evidence status if the backend provides a defensible measure.
- Generation time, optionally.
- Citation markers linked to source records.
- An explicit insufficient-evidence message when appropriate.

Do not display a model's uncalibrated confidence as a probability. If no validated confidence measure exists, show an evidence status rather than a numeric percentage.

### Citation behavior
Every citation marker should be clickable. Clicking it should:
1. Select the source in the evidence panel.
2. Show filename/title.
3. Show page, slide, sheet/row, section, or chunk location as applicable.
4. Highlight the supporting excerpt when available.
5. Show the retrieval method and score components if available.
6. Provide **Open source** or **View extracted text** if supported.

Citations must refer to actual retrieved source IDs. If citation validation fails, show a warning and do not present the unsupported claim as verified.

### Evidence panel
The evidence panel should list the sources used for the answer:
- Source title and document type.
- Location within the source.
- Short supporting excerpt.
- Why it was retrieved.
- Similarity/relevance indicator only when the score semantics are clear.
- Link to inspect the full source or extracted content.

Distinguish:
- **Direct source evidence**
- **System-generated inference**
- **General knowledge**, only when explicitly enabled

### Empty evidence state
If no relevant sources are found, show:
> “No sufficiently relevant evidence was found in the indexed documents. Try a broader question or upload additional records.”

Do not let the model invent a confident answer to cover missing evidence.

---

## 9. Precedent Explorer

This view focuses on historical proposal retrieval.

### Search controls
Include:
- Text query.
- Domain/category filter.
- Police station/location filter.
- Jurisdiction radius selector.
- Date range filter if dates are available.
- Decision status filter.
- Technology/equipment filter.
- Budget range if values are normalized and comparable.
- Minimum relevance control only if exposed intentionally for demo/debugging.

### Jurisdiction radius
If supported by the backend, show a clear selector such as:
- Same police station
- Neighboring stations
- Same region
- Wider jurisdiction
- All available records

Only show levels backed by configured jurisdiction data. If the data has no verified hierarchy, disclose that and avoid inventing relationships.

### Precedent result card
Each result should include:
- Proposal title/ID.
- Clearly labelled synthetic/demo tag where relevant.
- Location and date, if known.
- Previous decision.
- Implementation status.
- Outcome summary.
- Relevance explanation.
- Match dimensions, such as objective, technology, scope, or location.
- Source/citation links.
- A **Compare** action.

Do not show only a single opaque similarity percentage. Use an explanation such as “Same objective and technology; same station; project scale differs” when those facts are supported.

### Sorting
Support:
- Most relevant.
- Most recent, if dates exist.
- Same jurisdiction first, if enabled.

Keep the ranking method consistent with the backend's actual result order.

---

## 10. Proposal comparison view

Allow users to compare the current proposal with one or more historical precedents.

### Comparison fields
- Objective.
- Location/jurisdiction.
- Technology.
- Scale/quantity.
- Proposed budget versus historical cost.
- Timeline.
- Procurement type.
- Previous decision.
- Implementation status.
- Recorded outcome.
- Relevant policy references.

### Visual design
Use a side-by-side table on desktop and stacked comparison cards on mobile.

Highlight differences without implying that a difference is automatically a problem.

For example:
- **Similar:** same objective and technology.
- **Different:** higher equipment count.
- **Needs review:** budget differs from comparable records.
- **Unknown:** historical implementation cost not recorded.

Include the source for each historical value.

---

## 11. Cost variance and overlap alerts

These are review signals, not findings of misconduct.

### Cost analysis component
Show:
- Current proposal budget.
- Historical comparison value or median, if calculated from valid comparable records.
- Number of comparison records.
- Formula used.
- Currency and date/context where available.
- Difference in absolute and percentage terms.
- Source links to comparison records.
- Limitations and comparability warnings.

Use wording such as:
> “Review recommended: the proposed budget is above the historical comparison value. Check project scope, equipment specifications, quantity, and date before drawing conclusions.”

If no reliable comparable data exists, show:
> “Cost comparison unavailable: insufficient comparable records.”

Do not generate a made-up median or price.

### Potential overlap component
Show:
- Potentially overlapping proposal.
- Shared location, scope, technology, or time period.
- Supporting evidence.
- Reason for the flag.
- Suggested review question.

Use “Potential overlap for review.” Never label a proposal as fraudulent or automatically reject it.

---

## 12. Policy, SOP, Government Order, and procurement evidence

Provide a dedicated results tab or panel titled **Policies & Procurement**.

Each record should show:
- Title.
- Record type.
- Issuing authority, if available.
- Date/version/effective status, if available.
- Relevant excerpt.
- Why it may apply.
- Source location and citation.
- Any warning that current validity has not been verified.

The interface must distinguish:
- A policy actually retrieved from the knowledge base.
- A policy potentially relevant based on semantic matching.
- A general recommendation that is not a verified policy citation.

Never display a generated policy title or order number as real unless it exists in the source data.

---

## 13. Decision Intelligence Brief

Provide a **Generate Decision Brief** action after a proposal has been analyzed.

### Brief structure
1. Proposal summary.
2. Extracted Proposal DNA.
3. Executive findings.
4. Top relevant precedents.
5. Previous decisions and implementation outcomes.
6. Policy/SOP/Government Order references.
7. Procurement evidence.
8. Cost comparison and limitations.
9. Potential duplicate/overlap review signals.
10. Missing information.
11. Risks and dependencies requiring review.
12. Questions for the reviewing officer.
13. Source citations.
14. Evidence limitations.

### Brief UI controls
- Generate brief.
- Regenerate, if supported.
- Expand/collapse sections.
- Open citation/source.
- Copy text, if implemented.
- Export to Markdown/PDF only if actually implemented.
- Show generation timestamp and data snapshot/reference where available.

The brief must clearly say it is AI-generated decision support. Do not provide an “Approve proposal” or “Reject proposal” action unless a separately authorized official workflow is intentionally implemented. For this prototype, do not implement official decision recording.

---

## 14. Knowledge Graph view

Use React Flow or an equivalent graph visualization if this feature is implemented.

### Node types
- Proposal.
- Police station/location.
- Technology/equipment.
- Policy/SOP/Government Order.
- Decision.
- Implementation.
- Outcome.
- Procurement record.

### Relationship types
- Similar to.
- Located at.
- Uses technology.
- Governed by/references.
- Has decision.
- Implemented through.
- Produced outcome.
- Related procurement record.

### Interactions
- Click a node to open its detail panel.
- Click an edge to explain the relationship and show its evidence.
- Filter node types.
- Search for a proposal or policy.
- Reset/fit graph to view.
- Display source links for evidence-backed edges.

Only draw relationships supported by data or clearly mark algorithmically inferred links as inferred. Do not display a visually convincing graph of invented relationships.

If the graph is not implemented, show a clear “Graph view is not available yet” state rather than fake data.

---

## 15. Documents and processing history

### Documents page
List documents currently available in the prototype's workspace:
- Filename.
- Type.
- Upload time.
- Processing status.
- Number of chunks.
- OCR status.
- Indexed status.
- Warnings.
- Actions: inspect, retry, remove from index if supported.

### Processing History
Show recent processing jobs and question-analysis runs:
- Job/request ID.
- Document or question.
- Start time and duration.
- Stages completed.
- Status.
- Error or warning summary.
- Link to results when available.

Because authentication is intentionally omitted, describe this as local/demo workspace history, not per-user history. Do not imply secure personal separation that does not exist.

If session tracking uses `X-Session-ID`, treat it as a correlation/session identifier, not authentication.

---

## 16. Empty, loading, warning, and error states

Design these states explicitly.

### First visit
- Explain what PRISM-PY does in one or two sentences.
- Show upload area.
- Show sample question suggestions.
- Optionally offer synthetic sample data.

### No documents
- “Upload a proposal or reference document to begin.”
- Disable actions that require indexed documents.
- Explain what is needed to enable them.

### Processing
- Show active stage and elapsed time where available.
- Keep the document visible in the queue.
- Allow safe navigation away from the screen.

### No relevant results
- State that no sufficiently relevant evidence was found.
- Offer broader search or additional-document upload.
- Do not present unsupported conclusions.

### Partial results
- Explain which stage failed or was skipped.
- Show usable results with a partial-results warning.
- Do not hide failures that materially affect the answer.

### NVIDIA API unavailable
- Show that AI generation is temporarily unavailable.
- Preserve the user's question and uploaded-document state.
- Offer retry.
- If retrieval results are still available, let the user inspect them without generating a new answer.

### Citation validation failure
- Warn that one or more claims could not be verified.
- Suppress or qualify unsupported claims.
- Provide only validated sources as verified evidence.

### OCR warning
- Show that the document was processed with OCR and text may contain recognition errors.
- Let the user inspect extracted text.
- Do not present OCR output as error-free.

### Index persistence/reload error
- Show that search may be incomplete or unavailable.
- Do not silently create an empty index and report “no results” as though the knowledge base were empty.

---

## 17. Frontend-to-backend integration contract

Use the existing backend's actual endpoint names and schemas if they already exist. The following are proposed contracts, not claims that these endpoints currently exist.

### Upload a document
`POST /api/ai/documents`

- Multipart upload.
- Response: document ID, detected type, initial status, metadata, warnings.

### Check processing status
`GET /api/ai/documents/{document_id}/status`

- Response: current stage, state, progress if available, warnings/errors.

### Retrieve extracted metadata and chunks
`GET /api/ai/documents/{document_id}`

- Response: metadata, extraction summary, source locations, chunk summary.

### Extract Proposal DNA
`POST /api/ai/proposals/analyze`

- Input: document IDs and optional instructions.
- Response: structured Proposal DNA, evidence references, missing fields, warnings.

### Search precedents
`POST /api/ai/precedents/search`

- Input: proposal DNA or question, retrieval scope, jurisdiction radius, filters, top-k.
- Response: ranked precedents, score components, match explanations, source IDs.

### Ask a question
`POST /api/ai/query`

- Input: question, document IDs/scope, answer mode, optional proposal ID.
- Response: request ID, route, status, answer when complete, citations, evidence list, retrieval details.

### Check a query job
`GET /api/ai/query/{request_id}`

- Response: status, progress events/stages where supported, result, warnings/errors.

### Generate decision brief
`POST /api/ai/decision-brief`

- Input: proposal ID or Proposal DNA, precedent IDs, selected evidence, requested sections.
- Response: structured brief sections, citations, limitations, generation metadata.

### Inspect source evidence
`GET /api/ai/sources/{source_id}`

- Response: source metadata, page/slide/sheet/section location, excerpt, document reference.

### Search policies
`POST /api/ai/policies/search`

- Input: question/proposal DNA and filters.
- Response: policy records, relevant excerpts, citations, effective-date metadata when known.

### Knowledge graph
`GET /api/ai/graph`

- Input: proposal/document scope and optional filters.
- Response: nodes, edges, relationship evidence, provenance.

### Integration rules
- Use the existing API's naming and response format if already established.
- Validate all response data before rendering.
- Handle timeouts and non-2xx responses.
- Keep NVIDIA credentials on the backend.
- Do not send secrets to the browser.
- Do not expose internal filesystem paths.
- Preserve request IDs for debugging.
- If long-running jobs use polling, poll at a bounded interval and stop after completion/failure.
- Use Server-Sent Events or WebSockets only if the backend actually supports them.
- Do not fabricate progress percentages or API results.

---

## 18. Suggested frontend component inventory

Use reusable components. Adapt the names to the repository.

```text
AppShell
TopBar
DemoEnvironmentBadge
MainNavigation
WorkspacePage
DocumentUploadDropzone
UploadFileQueue
DocumentStatusBadge
DocumentDetailsDrawer
ExtractedTextViewer
ChunkInspector
ProposalDNAForm
ProposalDNAField
QuestionComposer
SuggestedQuestionChip
AnswerModeSelector
AnalysisProgressTimeline
RetrievalDetailsAccordion
AnswerPanel
CitationMarker
EvidencePanel
SourceExcerptCard
PrecedentExplorer
PrecedentResultCard
JurisdictionRadiusSelector
PrecedentFilters
ProposalComparisonTable
CostVariancePanel
OverlapAlertCard
PolicyResultCard
DecisionBriefViewer
KnowledgeGraph
ProcessingHistoryTable
EmptyState
ErrorBanner
PartialResultsNotice
ConfirmDialog
ToastNotifications
```

Do not build every component as a separate abstraction if it adds no value. Keep reusable components focused and accessible.

---

## 19. Visual design and accessibility

### Visual style
Use a restrained, professional, public-sector-friendly interface:
- Neutral background and readable text.
- One primary accent color.
- Consistent spacing and typography.
- Clear borders and grouping.
- Limited use of warning colors, reserved for genuine warnings.
- Avoid excessive gradients, glassmorphism, and decorative animations.
- Avoid presenting every metric in a separate card.

### Typography and content
- Use concise labels.
- Explain technical terms on demand.
- Keep important evidence readable.
- Use tables for comparisons and lists for retrieved records.
- Use expandable panels for technical retrieval details.
- Do not rely on color alone to indicate status.

### Accessibility
- Keyboard-operable controls.
- Visible focus indicators.
- Accessible labels for file inputs and icon buttons.
- Sufficient contrast.
- Semantic headings and landmarks.
- Announce processing status changes to screen readers.
- Support reduced motion.
- Make citation links and source-panel interactions keyboard accessible.
- Ensure forms and tables work on mobile.

### Responsive behavior
- Desktop: navigation rail, central workspace, collapsible evidence panel.
- Tablet: collapsible navigation and evidence drawer.
- Mobile: stacked sections, full-width upload area, source details in a drawer/modal, comparison cards instead of wide tables.
- Avoid page-level horizontal scrolling.

---

## 20. No-authentication prototype requirements

For this iteration:
- Do not create login, signup, password reset, user profile, user administration, or role-management screens.
- Do not add frontend auth guards.
- Do not display user avatars or account menus.
- Open directly to the Workspace.
- Keep all actions accessible in the demo workspace, subject to backend functionality.
- Keep API credentials and internal configuration server-side.
- Clearly label synthetic demo data.
- If using temporary in-memory session state, document that it may reset when the service restarts.

**Security warning:** An unauthenticated interface must not be deployed publicly with confidential police documents or sensitive records. Until authentication and authorization are implemented, use synthetic/public demo documents only and restrict deployment exposure appropriately. Omitting login from the UI does not make private data safe.

---

## 21. MVP build order

Implement the UI in this order so that each stage becomes demonstrable.

### MVP 1: Upload and extraction
- App shell.
- Upload zone and file queue.
- Processing status.
- Extracted text and metadata viewer.
- Proposal DNA panel.

### MVP 2: Ask and retrieve
- Question composer.
- Suggested questions.
- Answer mode selector.
- Processing timeline.
- Answer panel.
- Citation markers and evidence panel.

### MVP 3: Precedents
- Precedent Explorer.
- Filters and jurisdiction radius.
- Result cards and match explanations.
- Comparison view.
- Historical decisions and outcomes.

### MVP 4: Decision brief
- Generate brief.
- Structured report sections.
- Source citations.
- Cost/overlap review signals.
- Policy and procurement evidence.

### MVP 5: Additional visualization and reliability
- Knowledge Graph.
- Processing History.
- Advanced retrieval details.
- Complete loading, error, and partial-result states.
- Responsive and accessibility review.

---

## 22. Definition of done

The UI specification is implemented successfully when:
- A visitor can open the app without logging in.
- A user can upload a supported document and see its real processing status.
- The user can inspect extracted text and Proposal DNA.
- The user can ask a question about indexed records.
- The UI displays the actual answer mode and retrieval stages reported by the backend.
- Precedents are shown with understandable relevance explanations.
- Citations open the correct source and location.
- The user can inspect previous decisions and outcomes where records exist.
- Cost and overlap signals include evidence and cautious wording.
- A decision brief contains validated source references and limitations.
- The UI clearly handles missing evidence, partial results, API errors, and OCR warnings.
- No fake data is presented as real police data.
- No authentication UI or user-management flow is present.
- The app works at desktop, tablet, and mobile widths.
- Every visible action works or is clearly marked unavailable.

---

## 23. Instructions to the frontend coding agent

When using this specification with an AI coding agent:

1. Inspect the existing frontend and API before changing anything.
2. Reuse the current framework, design system, routing, and API conventions where reasonable.
3. Do not replace working components without a reason.
4. Confirm which backend endpoints and response schemas already exist.
5. Implement the user journey incrementally, beginning with upload, processing status, Proposal DNA, question submission, answer display, and citations.
6. Use realistic synthetic examples only when clearly labelled.
7. Do not hardcode fake AI responses as if they came from the backend.
8. Do not invent citation sources, policy numbers, precedent IDs, or progress states.
9. Build loading, empty, error, and partial-result states alongside the happy path.
10. Keep all API keys and NVIDIA credentials out of frontend code.
11. Do not implement authentication or user-management screens in this iteration.
12. Run available tests, inspect the final diff, and report what works, what is mocked, and what remains incomplete.

**Primary design goal:** A visitor should be able to upload a proposal, understand what the system extracted, ask a question, see relevant precedents, verify the supporting evidence, and inspect a decision brief in one coherent workspace.
