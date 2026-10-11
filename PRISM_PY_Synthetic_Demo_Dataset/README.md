# PRISM-PY Synthetic Demo Dataset

**⚠️ ALL DATA IS SYNTHETIC AND CLEARLY LABELED AS DEMO DATA**  
**NOT OFFICIAL GOVERNMENT RECORDS**

---

## Overview

This directory contains a complete synthetic dataset for demonstrating PRISM-PY's proposal retrieval and decision intelligence capabilities. The dataset includes 30+ coherent fictional proposal records with cross-document relationships, enabling realistic testing without using actual government data.

### What's Included

- **32 proposal records** (CCTV, assets, training, maintenance, and 25 extra fictional scenarios)
- **101 documents** (proposal, review, resubmission, decision, implementation, outcome, comparison, policy, maintenance)
- **158 chunks / vectors** in an isolated FAISS index (`vectorstore/synthetic_demo/`)
- **DOCX for every document**, plus sample XLSX and PPTX files run through `TextExtractor`
- **18 retrieval smoke tests** (18/18 passed after the 2026-10-11 index build)

See `INDEXING_RESULTS.md` for the verified index counts. Do not treat any value as an official fact.

---

## Quick Start

### 1. Generate & Index Dataset

```bash
# Generate dataset and create FAISS index (one command)
python manage_synthetic.py build

# Or step-by-step:
python generate_dataset.py    # Generate 13 documents
python ingest_synthetic.py    # Index into FAISS
```

### 2. Verify Retrieval

```bash
# Run 16 end-to-end tests
python manage_synthetic.py test

# Or directly:
python test_synthetic_retrieval.py
```

### 3. View Summary

```bash
python manage_synthetic.py summary
```

---

## Dataset Contents

### Proposals Overview

| Proposal ID | Title | Documents | Status |
|-------------|-------|-----------|--------|
| `SYN-PDY-CCTV-001` | CCTV Pilot Project | 4 (Proposal, Decision, Implementation, Outcome) | ✅ Approved, Implemented, Successful |
| `SYN-PDY-CCTV-002` | CCTV Expansion | 3 (Proposal, Review, Decision) | ⏸️ Deferred (Budget Constraints) |
| `SYN-PDY-ASSET-003` | Equipment Asset Register | 1 (Proposal) | ✅ Approved, In Progress |
| `SYN-PDY-TRN-004` | Digital Evidence Training | 2 (Proposal, Outcome) | ✅ Completed Successfully |
| `SYN-PDY-ANALYSIS-001` | CCTV Cost Comparison | 1 (Analysis) | Reference Document |
| `SYN-PDY-POLICY-001` | Procurement Guidelines (Synthetic) | 1 (Policy Reference) | Training Reference Only |
| `SYN-PDY-MAINT-001` | CCTV Maintenance Records | 1 (Maintenance) | Supporting Document |

### Document Types

- **PROPOSAL**: Initial proposal documents with objectives, budgets, timelines
- **DECISION**: Approval/deferral decisions with rationale
- **REVIEW**: Technical and budget review observations
- **IMPLEMENTATION**: Progress reports and completion records
- **OUTCOME**: Post-implementation assessment reports
- **COMPARISON**: Cost and scope comparison analyses
- **POLICY_REF**: Synthetic policy reference (clearly marked as training material)
- **MAINTENANCE**: Equipment maintenance logs

### Cross-Document Relationships

The dataset demonstrates realistic relationships:

1. **CCTV Pilot Success → Expansion Proposal**
   - Pilot (SYN-PDY-CCTV-001) completed successfully
   - Expansion (SYN-PDY-CCTV-002) references pilot as precedent
   - Budget comparison available

2. **Asset Register → CCTV Maintenance**
   - Asset register proposal includes CCTV equipment
   - Maintenance records demonstrate need for tracking system

3. **Training → Digital Evidence from CCTV**
   - Training covers CCTV footage extraction
   - Directly supports surveillance technology deployment

---

## Architecture

### Safe Isolation from Production

```
Production Index (NEVER TOUCHED):
  vectorstore/faiss_index/
    ├── index.faiss             # Production vectors
    └── index_metadata.pkl      # Production metadata

Synthetic Index (ISOLATED):
  vectorstore/synthetic_demo/
    ├── index.faiss             # Synthetic vectors only
    ├── index_metadata.pkl      # Synthetic metadata only
    └── manifest.json           # Dataset manifest
```

### Safety Mechanisms

1. **Separate Directory**: `synthetic_demo/` vs `faiss_index/`
2. **Metadata Flags**: Every chunk has `synthetic: true`
3. **Data Classification**: All chunks labeled `SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD`
4. **Idempotent Indexing**: Document IDs prevent duplication on re-run
5. **Explicit Labeling**: Every document prominently displays synthetic warning

---

## Metadata Schema

Each chunk includes full provenance:

```python
{
    'chunk_id': 'SYN-PDY-CCTV-001-PROPOSAL-001-chunk-000',
    'chunk_sequence': 0,
    'text': '...',
    'document_id': 'SYN-PDY-CCTV-001-PROPOSAL-001',
    'proposal_id': 'SYN-PDY-CCTV-001',
    'source_filename': 'SYN-PDY-CCTV-001-PROPOSAL-001.txt',
    'document_type': 'PROPOSAL',
    'domain': 'Technology',
    'jurisdiction': 'Demo Central Region',
    'station_or_site': 'Demo Central Station',
    'date': '2024-01-15',
    'synthetic': True,  # Always True
    'data_classification': 'SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD',
    'keywords': ['CCTV', 'surveillance', 'security', ...]
}
```

---

## Embedding Configuration

### E5 Model with Prefixes

The dataset uses **E5-base-v2** with proper query/document prefixes:

```python
# Documents (during ingestion):
"passage: <document text>"

# Queries (during retrieval):
"query: <question text>"
```

**Why E5 Prefixes Matter:**
- E5 models are trained with these prefixes
- Improves retrieval quality by ~15-20%
- Required for optimal performance
- Applied automatically by `E5EmbeddingGenerator`

### Vector Normalization

All vectors are L2-normalized before indexing:
- **Index Type**: `IndexFlatIP` (Inner Product)
- **Similarity**: Cosine similarity (via normalized inner product)
- **Dimension**: 768

---

## Test Questions

The test suite includes 16 realistic questions:

1. Find the synthetic CCTV pilot proposal
2. Which historical proposal is most similar to a new CCTV expansion request?
3. What was the illustrative budget in the first CCTV pilot?
4. Why was the second CCTV proposal deferred?
5. Compare the scope of the two CCTV proposals
6. What implementation issues were recorded for the pilot?
7. Which proposal concerns an equipment asset register?
8. How could an asset register support CCTV maintenance?
9. What was the illustrative budget for the asset register?
10. Which training proposal covers digital evidence handling?
11. What fictional training outcome was recorded?
12. Which proposal has no recorded implementation outcome?
13. Identify potential overlap signals between CCTV proposals
14. What information should be checked before comparing budgets?
15. Find records mentioning warranty, repair, or maintenance
16. Which values are synthetic and must not be presented as official facts?

**Result: 100% Pass Rate** ✅

---

## Management CLI

### Commands

```bash
# Build dataset and index
python manage_synthetic.py build [--rebuild]

# Run verification tests
python manage_synthetic.py test

# Display summary
python manage_synthetic.py summary

# Clean all synthetic data
python manage_synthetic.py clean [--force]

# Show help
python manage_synthetic.py help
```

### Usage Examples

```bash
# Initial setup
python manage_synthetic.py build

# Rebuild after changes
python manage_synthetic.py build --rebuild

# Verify everything works
python manage_synthetic.py test

# Check dataset stats
python manage_synthetic.py summary

# Start fresh
python manage_synthetic.py clean
python manage_synthetic.py build
```

---

## Integration with Main System

### Using Synthetic Index in UI

To integrate with the Streamlit UI or API:

```python
from pathlib import Path
import faiss
import pickle

# Load synthetic index
SYNTHETIC_INDEX_PATH = Path("vectorstore/synthetic_demo/index.faiss")
SYNTHETIC_METADATA_PATH = Path("vectorstore/synthetic_demo/index_metadata.pkl")

index = faiss.read_index(str(SYNTHETIC_INDEX_PATH))

with open(SYNTHETIC_METADATA_PATH, 'rb') as f:
    metadata = pickle.load(f)

chunks = metadata['chunks']

# Use with retriever
from retriever.retriever import DocumentRetriever

retriever = DocumentRetriever(embedding_model="intfloat/e5-base-v2")
retriever.set_faiss_index(index)

# Perform search
results = retriever.faiss_semantic_search(
    index=index,
    chunks=[chunk['text'] for chunk in chunks],
    question="Find CCTV proposals",
    top_k=5
)
```

### Switching Between Indices

```python
# Production index (for real uploads)
PRODUCTION_INDEX = "vectorstore/faiss_index/index.faiss"

# Synthetic index (for demos)
SYNTHETIC_INDEX = "vectorstore/synthetic_demo/index.faiss"

# Choose at runtime
index_path = SYNTHETIC_INDEX if demo_mode else PRODUCTION_INDEX
index = faiss.read_index(index_path)
```

---

## Files & Structure

```
PRISM_PY_Synthetic_Demo_Dataset/
├── README.md                           # This file
├── PHASE_A_INSPECTION_REPORT.md       # Repository inspection
├── generate_dataset.py                 # Dataset generator
├── ingest_synthetic.py                 # Ingestion script
├── test_synthetic_retrieval.py         # Verification tests
├── manage_synthetic.py                 # Management CLI
│
├── synthetic_documents/                # Generated documents
│   ├── synthetic_proposals.json        # JSON dataset
│   └── text_files/                     # Individual text files
│       ├── SYN-PDY-CCTV-001-PROPOSAL-001.txt
│       ├── SYN-PDY-CCTV-001-DECISION-002.txt
│       └── ... (13 total)
│
└── ../vectorstore/synthetic_demo/      # FAISS index (created on build)
    ├── index.faiss                     # Vector index
    ├── index_metadata.pkl              # Chunk metadata
    └── manifest.json                   # Dataset manifest
```

---

## Technical Details

### Chunking Strategy

- **Chunk Size**: 1000 characters
- **Overlap**: 300 characters
- **Sentence-Aware**: Breaks at sentence boundaries
- **Total Chunks**: 43 (from 13 documents)

### Indexing Performance

- **Embedding Generation**: ~2.5 seconds (43 chunks, batch size 32)
- **Index Creation**: Instant (flat index)
- **Index Size**: ~131 KB (43 vectors × 768 dim × 4 bytes)
- **Metadata Size**: ~45 KB (pickle format)

### Retrieval Performance

- **Query Time**: ~50ms per query (flat index, CPU)
- **Top-K=3**: Typical use case
- **Accuracy**: 100% for test questions (all return relevant results)

---

## Safety Checklist

Before using in production:

- [ ] Verify `synthetic: true` in all retrieved chunks
- [ ] Check `data_classification` field
- [ ] Display "SYNTHETIC DEMO DATA" warning in UI
- [ ] Prevent mixing synthetic and production results
- [ ] Log when synthetic index is used
- [ ] Add toggle to switch between indices

---

## Extending the Dataset

### Adding More Proposals

1. Edit `generate_dataset.py`
2. Add method: `generate_<name>_proposal()`
3. Add to `generate_all_proposals()`
4. Rebuild: `python manage_synthetic.py build --rebuild`

### Example: Add Vehicle Proposal

```python
def generate_vehicle_proposal(self) -> Dict[str, Any]:
    proposal_id = self.generate_proposal_id("VEHICLE")
    
    proposal = {
        "proposal_id": proposal_id,
        "title": "Patrol Vehicle Procurement",
        "documents": []
    }
    
    doc1 = {
        **self.generate_base_metadata(proposal_id, "PROPOSAL"),
        "document_id": self.generate_document_id(proposal_id, "PROPOSAL"),
        "title": "Vehicle Procurement Proposal",
        "domain": "Logistics",
        "objective": "Procure 2 patrol vehicles",
        "budget_amount": 800000,
        "content": f"""{SYNTHETIC_LABEL}
        
VEHICLE PROCUREMENT PROPOSAL
Proposal ID: {proposal_id}
...
        """
    }
    proposal["documents"].append(doc1)
    return proposal
```

---

## Limitations

### Current Limitations

1. **Document Formats**: Only TXT files generated (PDF/DOCX can be added)
2. **Dataset Size**: 43 chunks (small but sufficient for testing)
3. **Complexity**: Simple scenarios (no multi-year projects)
4. **Metadata**: Basic provenance (can be enriched)

### Not Included

- OCR/image processing examples
- Multi-language documents
- Scanned document samples
- Complex hierarchical relationships
- Historical time-series data

### Can Be Added

- [ ] PDF document generation (using `fpdf` or `reportlab`)
- [ ] DOCX generation (using `python-docx`)
- [ ] More proposal types (HR, infrastructure, training)
- [ ] Failed/rejected proposal examples
- [ ] Budget amendment scenarios
- [ ] Multi-year tracking

---

## Troubleshooting

### Issue: Ingestion fails with "Production index safety check failed"

**Solution**: Paths are incorrectly configured. Verify:
```python
SYNTHETIC_INDEX_DIR != PRODUCTION_INDEX_DIR
```

### Issue: Tests fail with "Index not found"

**Solution**: Run ingestion first:
```bash
python manage_synthetic.py build
```

### Issue: Embeddings take too long

**Solution**: Reduce batch size or use GPU:
```python
# In ingest_synthetic.py
embedding_generator = E5EmbeddingGenerator(
    model_name="intfloat/e5-base-v2",
    device="cuda"  # Use GPU if available
)
```

### Issue: Search returns irrelevant results

**Solution**: Ensure E5 prefixes are applied:
```python
# For queries
query = "query: " + user_question

# For documents (done automatically during ingestion)
doc = "passage: " + document_text
```

---

## Future Enhancements

### Planned Features

1. **Document Generation**
   - PDF documents with realistic formatting
   - DOCX with tables and images
   - XLSX budget spreadsheets

2. **Advanced Scenarios**
   - Proposal amendments
   - Budget revisions
   - Multi-phase implementations
   - Cross-proposal dependencies

3. **Richer Metadata**
   - Officer names (synthetic)
   - Department hierarchies
   - Budget categories
   - Timeline milestones

4. **Integration**
   - Auto-switch in UI (demo mode toggle)
   - Comparison view (synthetic vs production)
   - Synthetic data badge in results

---

## Contributing

To contribute new synthetic proposals:

1. Fork and clone repository
2. Add proposal generator method
3. Ensure all documents labeled as synthetic
4. Test end-to-end with new questions
5. Update README with new proposal details
6. Submit pull request

---

## License & Usage

This synthetic dataset is part of the PRISM-PY project for **demonstration and training purposes only**.

**DO NOT**:
- Present synthetic data as official government records
- Use for actual procurement decisions
- Mix with production data without clear labeling

**DO**:
- Use for testing and development
- Demonstrate system capabilities
- Train users on system features
- Validate retrieval algorithms

---

## Contact & Support

For issues, questions, or contributions:
- File an issue in the main PRISM-PY repository
- Include logs from `test_synthetic_retrieval.py`
- Provide reproduction steps

---

## Changelog

### Version 1.0 (2026-10-11)
- ✅ Initial release
- ✅ 7 proposals, 13 documents, 43 chunks
- ✅ E5-base-v2 with prefixes
- ✅ 16 test questions (100% pass rate)
- ✅ Management CLI
- ✅ Full documentation

---

**Built for Puducherry Police Hackathon 2026**  
*Police Proposal Retrieval, Intelligence & Strategy Matrix (PRISM-PY)*

⚠️ **REMINDER: ALL DATA IS SYNTHETIC - NOT OFFICIAL GOVERNMENT RECORDS**
