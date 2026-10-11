"""Start the PRISM-PY FastAPI backend (SQLite + synthetic index).

    python run_api.py            # http://localhost:5001
    PORT=8000 python run_api.py
"""

from __future__ import annotations

import uvicorn

from backend.settings import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run("backend.app:app", host=settings.host, port=settings.port, reload=False)
