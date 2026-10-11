# Synthetic Dataset Indexing Results

**Date:** 2026-10-11  
**Dataset version:** 2.0  
**Status:** Index built and verified

All records are **SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD**.

## What was generated

| Item | Count |
|------|-------|
| Proposal records | 32 generated (31 unique IDs present in the index) |
| Documents | 101 |
| Extracted chunks / vectors | 158 |
| Vector dimension | 768 |
| Embedding model | `intfloat/e5-base-v2` |
| FAISS type | `IndexFlatIP` after L2 normalization (cosine) |

Source files:

- TXT for every document
- DOCX for every document (run through `TextExtractor` + `ChunkSplitter`)
- 3 XLSX illustrative budget tables
- 2 PPTX summary slides

Locations:

- Documents: `PRISM_PY_Synthetic_Demo_Dataset/synthetic_documents/`
- Demo index: `vectorstore/synthetic_demo/index.faiss`
- Demo metadata: `vectorstore/synthetic_demo/index_metadata.pkl`
- Manifest: `vectorstore/synthetic_demo/manifest.json`

## Isolation

| Path | Status |
|------|--------|
| `vectorstore/synthetic_demo/` | Written by this job |
| `vectorstore/faiss_index/` | **Unchanged** (mtime 2026-10-10, 1 vector, not opened for write) |

Every chunk has `synthetic: true` and the synthetic classification label.

## Verification

| Check | Result |
|-------|--------|
| Vector count matches chunk metadata | 158 = 158 |
| Synthetic flags on all chunks | Pass |
| E5 prefixes applied | Pass |
| 18 retrieval questions | 18/18 passed |
| Second ingest without `--rebuild` | Skipped 101 documents, still 158 vectors |
| Production index overwritten | No |

## Reproduce

```bash
cd PRISM_PY_Synthetic_Demo_Dataset
source ../venv/bin/activate
python generate_dataset.py
TOKENIZERS_PARALLELISM=false OMP_NUM_THREADS=1 python ingest_synthetic.py --rebuild
TOKENIZERS_PARALLELISM=false OMP_NUM_THREADS=1 python test_synthetic_retrieval.py
python manage_synthetic.py summary
```

Remove only the demo index (asks for `yes` unless `--force`):

```bash
python manage_synthetic.py clean
```

## Query from the app

1. Start API + UI (`./start_complete.sh`)
2. Open Streamlit → **Demo Dataset Retrieval**
3. Or `POST /api/demo/search` with a question

Answers from this index must stay labelled synthetic. If no source supports a claim, the API says evidence is unavailable.

## Files changed in this pass

**New**

- `PRISM_PY_Synthetic_Demo_Dataset/paths.py`
- `PRISM_PY_Synthetic_Demo_Dataset/catalog_proposals.py`
- `PRISM_PY_Synthetic_Demo_Dataset/write_source_files.py`
- `PRISM_PY_Synthetic_Demo_Dataset/INDEXING_RESULTS.md`
- `PRISM_PY_Synthetic_Demo_Dataset/synthetic_documents/` (regenerated)
- `vectorstore/synthetic_demo/index.faiss`
- `vectorstore/synthetic_demo/index_metadata.pkl`
- `vectorstore/synthetic_demo/manifest.json`

**Updated**

- `generate_dataset.py`, `ingest_synthetic.py`, `test_synthetic_retrieval.py`, `manage_synthetic.py`
- `document_processing/embedding/embed_generator.py` (E5 `passage:` / `query:` prefixes)
- `text_extraction/extractor.py` (`.txt` support)
- `main_complete.py` (`/api/demo/status`, `/api/demo/search`)
- `streamlit_app_enhanced.py` (Demo Dataset Retrieval page)

**Not modified**

- User proposal files
- `vectorstore/faiss_index/index.faiss`
- `vectorstore/faiss_index/index_metadata.pkl`
