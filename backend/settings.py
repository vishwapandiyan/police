"""Runtime settings loaded from environment / .env."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
SQLITE_PATH = Path(os.getenv("PRISM_SQLITE_PATH", str(DATA_DIR / "prism.sqlite")))
DEMO_INDEX_DIR = PROJECT_ROOT / "vectorstore" / "synthetic_demo"

SYNTHETIC_LABEL = "SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD"
VENDOR_NOTICE = (
    "PRISM-PY does not select or recommend a vendor for award. "
    "Historical bidders and prices are shown for officer review only. "
    "Award remains with the official tender / government procurement process."
)


class Settings:
    api_bearer_token: str = os.getenv(
        "API_BEARER_TOKEN",
        "9f40f077e610d431226b59eec99652153ccad94769da6779cc01725731999634",
    )
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "5001"))
    flask_rag_url: str = os.getenv("FLASK_RAG_URL", "http://localhost:5002")
    sqlite_url: str = os.getenv("PRISM_DATABASE_URL", f"sqlite:///{SQLITE_PATH.as_posix()}")
    nvidia_api_key: str = os.getenv("NVIDIA_API_KEY", "")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))


@lru_cache
def get_settings() -> Settings:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return Settings()
