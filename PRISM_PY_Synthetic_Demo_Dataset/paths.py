"""Shared paths for the synthetic demo dataset.

All paths are resolved from this file so scripts work regardless of CWD.
The demo index lives in a separate directory from any production index.
"""

from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent
REPO_ROOT = DATASET_DIR.parent

SYNTHETIC_INDEX_DIR = REPO_ROOT / "vectorstore" / "synthetic_demo"
SYNTHETIC_INDEX_PATH = SYNTHETIC_INDEX_DIR / "index.faiss"
SYNTHETIC_METADATA_PATH = SYNTHETIC_INDEX_DIR / "index_metadata.pkl"
SYNTHETIC_MANIFEST_PATH = SYNTHETIC_INDEX_DIR / "manifest.json"

PRODUCTION_INDEX_DIR = REPO_ROOT / "vectorstore" / "faiss_index"
PRODUCTION_INDEX_PATH = PRODUCTION_INDEX_DIR / "index.faiss"

DOCUMENTS_DIR = DATASET_DIR / "synthetic_documents"
DATASET_JSON = DOCUMENTS_DIR / "synthetic_proposals.json"
TEXT_DIR = DOCUMENTS_DIR / "text_files"
SOURCE_DIR = DOCUMENTS_DIR / "source_files"
SOURCE_MANIFEST = DOCUMENTS_DIR / "source_manifest.json"

SYNTHETIC_LABEL = "SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD"
DATASET_VERSION = "2.0"
