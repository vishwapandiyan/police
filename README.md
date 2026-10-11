# PRISM-PY

Police Proposal Retrieval, Intelligence & Strategy Matrix.

PRISM-PY is an AI/RAG workspace for reviewing police-style **proposal** files. You can upload a document, extract a structured **Proposal DNA**, ask questions over a synthetic demo index, compare related files, and generate a decision brief with citations.

This repository is the working demo for [github.com/vishwapandiyan/police](https://github.com/vishwapandiyan/police).

**All bundled proposal files are fictional.** They are labelled `SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD`. Do not treat names, amounts, or outcomes as real government facts.

---

## What you get

| Piece | What it does |
| --- | --- |
| Streamlit UI | Upload, DNA, Q&A, precedent search, cost view, citations, demo retrieval |
| Flask API (`main_complete.py`) | Auth-protected endpoints for upload, DNA, brief, query, documents |
| Local embeddings | `intfloat/e5-base-v2` via Sentence Transformers |
| Vector store | FAISS (`IndexFlatIP`, cosine after L2 normalize) |
| Demo dataset | 32 fictional proposal records, 101 documents, isolated index |
| Optional NVIDIA LLM | DNA/brief generation when `NVIDIA_API_KEY` is set |

---

## Requirements

- macOS or Linux
- **Python 3.12** (3.14 can crash on PyTorch / Sentence Transformers)
- About 4 GB disk for the embedding model the first time it downloads
- An [NVIDIA API key](https://build.nvidia.com/) only if you want live LLM extraction. The demo still runs without it (local parse + retrieved answers).

---

## Setup

```bash
git clone https://github.com/vishwapandiyan/police.git
cd police

python3.12 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Copy the example env file and add your key if you have one:

```bash
cp .env.prism.example .env
```

Edit `.env`:

```
NVIDIA_API_KEY=nvapi-your-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL_ID=meta/llama-3.1-70b-instruct
EMBEDDING_MODEL=intfloat/e5-base-v2
API_BEARER_TOKEN=change-this-token
```

Never commit `.env`.

The synthetic FAISS index is already in `vectorstore/synthetic_demo/`. Rebuild only if you change the dataset:

```bash
cd PRISM_PY_Synthetic_Demo_Dataset
python manage_synthetic.py build --rebuild
python manage_synthetic.py test
```

---

## Start the project

Open **two terminals**. Leave both running.

**Terminal 1 — API (port 5001)**

```bash
cd /path/to/police
./run_backend.sh
```

**Terminal 2 — UI (port 8501)**

```bash
cd /path/to/police
./run_ui.sh
```

Then open [http://localhost:8501](http://localhost:8501).

The API health check is [http://localhost:5001/health](http://localhost:5001/health).

If port 5001 is already taken, `run_backend.sh` stops the old process and binds again. UI clicks print in the backend terminal.

---

## How to use the UI

1. **Upload → DNA → Brief**  
   Upload a `.docx` / `.pdf` / `.xlsx` / `.pptx` / `.txt` file (try a file under `PRISM_PY_Synthetic_Demo_Dataset/synthetic_documents/source_files/`). Extract DNA, then generate a brief.

2. **Question → Retrieve → Answer**  
   Ask in plain language, for example:  
   *Find historical proposals similar to the CCTV expansion proposal. Explain why they are relevant.*  
   Answers come from the synthetic index and are written as a short PA-style brief.

3. **Search → Compare → Analyze**  
   Keyword search over indexed demo records.

4. **Cost Analysis / Citation Validation**  
   Uses the last extracted DNA / brief in the session.

5. **Demo Dataset Retrieval**  
   Direct search of the isolated demo FAISS metadata.

API calls from the UI send:

```
Authorization: Bearer <API_BEARER_TOKEN from .env>
```

---

## Project layout

```
main_complete.py              Flask API used by the UI
streamlit_app_enhanced.py     Streamlit workspace
run_backend.sh / run_ui.sh    Start scripts

prism/                        DNA, brief, cost, overlap, citations, NVIDIA/mock LLM
document_processing/          Chunking and e5 embeddings
text_extraction/              PDF, DOCX, XLSX, PPTX, TXT, OCR
retriever/                    Semantic retrieval helpers
vectorstore/                  FAISS helpers + indexes
  synthetic_demo/             Isolated demo index (safe to use)
  faiss_index/                Older/production slot (not overwritten by demo ingest)

PRISM_PY_Synthetic_Demo_Dataset/
  generate_dataset.py         Build fictional proposal files
  ingest_synthetic.py         Index only the demo namespace
  test_synthetic_retrieval.py Retrieval smoke tests
  manage_synthetic.py         build / test / clean / summary
  synthetic_documents/        Generated TXT + DOCX (+ sample XLSX/PPTX)
```

---

## Stack

| Layer | Choice |
| --- | --- |
| UI | Streamlit, Plotly |
| API | Flask, flask-cors |
| LLM | NVIDIA NIM (OpenAI-compatible client), mock fallback |
| Embeddings | `intfloat/e5-base-v2` (`passage:` / `query:` prefixes) |
| Search | FAISS IndexFlatIP |
| Documents | PyMuPDF, python-docx, openpyxl, python-pptx, pytesseract |
| Schemas | Pydantic |

---

## Useful API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness |
| POST | `/api/upload` | File upload |
| POST | `/prism/analyze-proposal` | Proposal DNA |
| POST | `/prism/decision-brief` | Decision brief |
| POST | `/api/query` | Question → retrieve → answer |
| POST | `/api/demo/search` | Demo-index search |
| GET | `/api/documents` | In-memory library |

---

## Safety

- Demo ingest writes only to `vectorstore/synthetic_demo/`.
- It does not open or rewrite `vectorstore/faiss_index/`.
- `python manage_synthetic.py clean` asks for confirmation before deleting demo files.

---

## Troubleshooting

**`Address already in use` on 5001**  
Run `./run_backend.sh` again. It frees the port first.

**Empty DNA boxes in the UI**  
Refresh the Streamlit page. Fields render as green/yellow rows.

**NVIDIA timeout / 410 Gone**  
The model in `.env` may be retired or slow. DNA for labelled synthetic files is filled locally. Q&A does not need NVIDIA.

**Python segfault while embedding**  
Use Python 3.12 and:

```bash
export TOKENIZERS_PARALLELISM=false
export OMP_NUM_THREADS=1
```

`run_backend.sh` already sets these.

---

## License / use

Demo and training use only. Not an official police or government system.
