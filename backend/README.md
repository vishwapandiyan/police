# PRISM-PY FastAPI backend

FastAPI + SQLite replacement for the Flask demo (`main_complete.py`). Same routes and JSON
shapes, so `streamlit_app_enhanced.py` works unchanged, plus the requirement-driven
intelligence modules. A future React client can call the same API.

```bash
pip install fastapi "uvicorn[standard]" sqlalchemy python-multipart python-dotenv
python run_api.py                      # http://localhost:5001 (PORT / HOST / PRISM_SQLITE_PATH override)
streamlit run streamlit_app_enhanced.py
```

Auth: every route except `/health`, `/api/status`, `/api/demo/status` needs
`Authorization: Bearer $API_BEARER_TOKEN` (read from `.env`).

## Persistence

SQLite at `data/prism.sqlite` (created on first start). Tables: `documents`, `requirements`,
`proposal_analyses`, `decision_briefs`, `processing_status`, plus labelled reference data seeded
from `backend/seed.py`: `equipment_categories`, `equipment_models`, `spec_checklist_items`,
`historical_tenders`, `tender_bidders`, `policy_records`. Every seeded row is `synthetic=True`;
a future institutional ingest can add rows with `official=True`.

Retrieval reads the isolated synthetic FAISS metadata (`vectorstore/synthetic_demo/`) with keyword
scoring, so no PyTorch is loaded in the API process.

## Routes

| Route | Purpose |
| --- | --- |
| `POST /api/upload` | Store a file, extract text (PyMuPDF/python-docx if present, dependency-free fallback otherwise) |
| `POST /prism/analyze-proposal` | Proposal DNA, persisted as `proposal_analyses` |
| `POST /prism/decision-brief` | Decision brief, persisted as `decision_briefs` |
| `POST /api/query`, `/api/demo/search` | Grounded answer from the synthetic index |
| `POST /api/precedents/search`, `/compare` | Precedent search; compare returns the retrieved chunks, never invented figures |
| `GET /api/documents[/{id}[/status]]`, `/api/briefs` | Library |
| `POST /api/requirements`, `GET /api/requirements` | Save / list officer requirements |
| `POST /api/intelligence/specification` | Fixed per-class spec checklist vs. this request, previous specs on file |
| `POST /api/intelligence/justification` | Editable justification draft with citations only from retrieved text |
| `POST /api/intelligence/procurement` | Tender history, historical participants, indicative price range |
| `POST /api/intelligence/equipment` | Labelled catalogue classes on a fixed comparison matrix |
| `POST /api/intelligence/policy` | Policy / SOP references with validity warnings |
| `POST /api/intelligence/outcomes` | Previous outcomes and what the officer should verify |
| `POST /api/intelligence/pack` | All of the above for one requirement (`persist: true` saves the requirement) |
| `GET /api/catalogue` | Seeded reference data |

Intelligence requests accept `what_is_needed`, `quantity`, `location`, `purpose`,
`equipment_class` (auto-detected if omitted), `document_id` or `document_text`, or a saved
`requirement_id`.

## Hard rules

- No endpoint ranks, shortlists, or recommends a vendor. `recommended_vendor` and
  `recommended_model` are always `null`; bidders are shown as historical participants.
- Figures, outcomes and policies come from retrieved files or seeded labelled rows. Missing
  values stay "not in file"; the justification draft tells the officer not to invent statistics.
- Everything carries `data_classification: SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD`.
