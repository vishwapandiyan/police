# PRISM-PY Synthetic Dataset Generation and FAISS Indexing Prompt

You are working inside the existing PRISM-PY repository, an AI/RAG system for proposal precedent retrieval and decision intelligence. Your task is to create a reproducible synthetic dataset, ingest it through the existing pipeline, generate embeddings, store them in the existing FAISS vector index, and verify retrieval end-to-end.

## Non-negotiable constraints
1. Inspect the repository before coding. Identify the current ingestion pipeline, chunk schema, embedding code, FAISS index implementation, metadata persistence format, and CLI/API entry points.
2. Reuse the existing architecture and dependencies. Do not create a parallel vector database, replace FAISS, or duplicate ingestion logic.
3. Do not overwrite, delete, rename, or re-index the user's existing real Puducherry proposal files unless explicitly asked.
4. Store synthetic records in a clearly separate demo dataset/index namespace or collection if the current architecture supports it. If there is only one index, add a safe, reversible separation mechanism and document exactly how it works. Do not silently mix synthetic data with official documents.
5. Every generated document and metadata record must contain `synthetic: true`, a `data_classification` value of `SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD`, and a stable synthetic ID.
6. Never fabricate real Government Orders, policy numbers, sanctions, officials, quotations, vendor names, or real outcomes. Synthetic scenarios must be explicitly fictional.
7. Keep NVIDIA API credentials on the backend. Do not use an LLM to invent facts that should be stored as source records. Dataset generation should be deterministic where possible.
8. Preserve the existing embedding model configuration, especially `intfloat/e5-base-v2`, unless repository inspection proves the project has deliberately changed it. Apply the correct E5 query/document prefixes used by the current code. Normalize vectors when required by the existing FAISS similarity metric.
9. Use the current metadata persistence strategy. Do not introduce Redis as a required dependency.
10. Make indexing idempotent. Running the command twice must not duplicate chunks or embeddings.

## Phase A: inspect and report
Before implementation, inspect the repository and report:
- Existing ingestion entry point(s).
- Supported file types.
- Chunking defaults and source-location metadata.
- Embedding model, prefixes, batching, device handling, and normalization.
- FAISS index type, similarity semantics, persistence files, and metadata mapping.
- Current dataset/index paths and whether multiple namespaces are supported.
- Existing tests and the safest way to run an indexing job.

Then implement the smallest compatible changes needed.

## Phase B: synthetic dataset generation
Create a dataset generator that produces a configurable number of realistic fictional proposal records. Default target: at least 30 proposal records, with 4-6 documents per record where appropriate, including:
- Initial proposals.
- Review observations.
- Modified resubmissions.
- Illustrative decisions.
- Implementation updates.
- Outcome reports.
- Maintenance records.
- Training proposals.
- Procurement comparison notes with fictional, explicitly illustrative amounts.
- Policy-like reference notes clearly labelled as synthetic training examples, never as real legal authority.

Create coherent cross-document relationships so retrieval can answer questions about:
- Similar proposals.
- Approved, rejected, modified, deferred, and unknown statuses.
- Implementation outcomes.
- Equipment and maintenance.
- Training.
- Scope overlap.
- Budget comparison with caveats.
- Missing information and unresolved risks.
- Links between proposals and their synthetic follow-up records.

Use stable IDs such as `SYN-PDY-OPS-001`. Include structured metadata fields where relevant:
`document_id`, `proposal_id`, `document_type`, `domain`, `objective`, `location`, `station_or_site`, `jurisdiction`, `budget_amount`, `currency`, `technology`, `quantity`, `timeline`, `procurement_type`, `decision_status`, `implementation_status`, `outcome_summary`, `date`, `source_file`, `synthetic`, `data_classification`, `keywords`.

Do not invent a real police station hierarchy. Use fictional site names or clearly mark any provided geography as a demo attribute. Do not add real personal information.

## Phase C: formats and source provenance
Generate source files that exercise the existing document pipeline. At minimum, generate clean DOCX or PDF proposal documents. If the existing pipeline supports them, also create a small number of XLSX tables, PPTX summaries, HTML records, and image/scanned samples. Do not add format-specific complexity if it would destabilize the current system.

Every document should prominently display:
`SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD`

Each extracted chunk must preserve source provenance:
- Stable document ID.
- Source filename.
- Page number for PDF where available.
- Heading/section for DOCX/HTML.
- Sheet and row context for XLSX.
- Slide number for PPTX.
- Chunk ID and chunk sequence.

## Phase D: ingestion, embeddings, and FAISS
Run the synthetic documents through the same production ingestion pipeline used by user-uploaded files:
1. Validate and detect file format.
2. Extract text.
3. Run OCR only for actual image/scanned content when supported.
4. Chunk with the existing configurable chunking strategy.
5. Attach metadata and source-location provenance.
6. Generate embeddings using the configured embedding model, in batches.
7. Apply the correct normalization and FAISS metric.
8. Add vectors to the correct synthetic/demo index.
9. Persist the FAISS index and metadata mapping atomically where feasible.
10. Write a manifest with counts, model configuration, timestamp, index path, dataset version, and synthetic-only designation.

Do not create a second embedding implementation just for demo data. Do not send every source document to NVIDIA solely to create embeddings if the repository uses local Sentence Transformers embeddings. Use the NVIDIA LLM only for supported query expansion, question decomposition, answer synthesis, or other configured generation tasks.

## Phase E: verification and evaluation
Add or run an end-to-end smoke test that:
- Loads the persisted demo index from disk.
- Confirms index vector count matches metadata/chunk records.
- Runs semantic and keyword/hybrid retrieval if supported.
- Tests at least 15 realistic demo questions.
- Confirms results include source IDs and section/page provenance.
- Checks that synthetic labels survive ingestion and retrieval.
- Checks that running indexing twice does not create duplicate chunks.
- Checks that the existing real-data index and its files remain unchanged.
- Reports failures instead of hiding them.

Suggested demo questions:
1. Find the synthetic CCTV pilot proposal.
2. Which historical proposal is most similar to a new CCTV expansion request?
3. What was the illustrative budget in the first CCTV pilot?
4. Why was the second CCTV proposal deferred in the synthetic scenario?
5. Compare the scope of the two CCTV proposals.
6. What implementation issues were recorded for the first CCTV pilot?
7. Which proposal concerns an equipment asset register?
8. How could an asset register support CCTV maintenance?
9. What was the illustrative budget for the asset register pilot?
10. Which training proposal covers digital evidence handling?
11. What fictional training outcome was recorded?
12. Which proposal has no recorded implementation outcome?
13. Identify potential overlap signals between the CCTV proposals.
14. What information should be checked before comparing the two CCTV budgets?
15. Find records mentioning warranty, repair history, or maintenance.
16. Which values are synthetic and must not be presented as official facts?
17. Which sources support the claim that the second proposal was deferred?
18. What evidence is missing for a reliable cost comparison?

Expected behavior: retrieval should return relevant synthetic source chunks with valid metadata. Answer generation must cite retrieved sources and state that all such records are synthetic. If no source supports a claim, the answer must say that evidence is unavailable.

## Phase F: scripts, docs, and safety
Provide a documented command or script to:
- Generate the dataset.
- Ingest/index only the synthetic dataset.
- Rebuild the demo index safely.
- Run retrieval smoke tests.
- View a summary/manifest.
- Remove the demo index without touching the real-data index.

Use dry-run or explicit confirmation for destructive index cleanup. Do not delete user files.

Add a dataset README explaining:
- All records are fictional.
- How to generate, ingest, and test.
- Where the demo index and metadata are stored.
- How to upload individual synthetic documents through the UI.
- How to switch between uploaded-document and indexed-dataset retrieval, if supported.
- Current limitations.

## Deliverables
1. Synthetic dataset generator.
2. At least 30 coherent synthetic proposal-related records by default.
3. Separate synthetic/demo index or safe isolation mechanism.
4. FAISS index and persistent metadata generated by the existing pipeline.
5. Manifest and README.
6. End-to-end retrieval smoke test and results report.
7. Exact commands to reproduce the process.
8. Clear report of files changed and confirmation that existing real proposal files/indexes were not overwritten.

Implement incrementally, run the tests, and report precisely what was generated and indexed. Never claim the VectorDB has been populated unless the indexing command actually ran successfully and the persisted index was verified.
