"""Text extraction for uploads.

Tries the project's TextExtractor (PyMuPDF / python-docx / pptx) first and
falls back to dependency-free readers so the API still works in a minimal
environment.
"""

from __future__ import annotations

import logging
import re
import zipfile
from pathlib import Path

logger = logging.getLogger(__name__)

_TEXT_SUFFIXES = {".txt", ".md", ".csv", ".json", ".log", ".rst"}


def _docx_without_python_docx(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as zf:
            xml = zf.read("word/document.xml").decode("utf-8", errors="ignore")
    except (zipfile.BadZipFile, KeyError, OSError):
        return ""
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:tab/>", "\t", xml)
    text = re.sub(r"<[^>]+>", "", xml)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _pdf_without_extractor(path: Path) -> str:
    try:
        import fitz  # type: ignore
    except ImportError:
        return ""
    try:
        with fitz.open(path) as doc:
            return "\n".join(page.get_text() for page in doc).strip()
    except Exception as exc:  # pragma: no cover - depends on local PyMuPDF
        logger.warning("PyMuPDF failed on %s: %s", path.name, exc)
        return ""


def extract_text(path: Path, raw: bytes) -> tuple[str, str]:
    """Return (text, detected_type). Empty text means extraction failed."""
    suffix = path.suffix.lower()
    try:
        from text_extraction.extractor import TextExtractor  # heavy optional deps

        text, detected = TextExtractor().extract_from_file(str(path))
        if text:
            return text, detected or suffix.lstrip(".")
    except Exception as exc:
        logger.info("TextExtractor unavailable or failed (%s); using fallback readers", exc)

    if suffix in _TEXT_SUFFIXES or not suffix:
        return raw.decode("utf-8", errors="ignore"), "text"
    if suffix == ".docx":
        return _docx_without_python_docx(path), "docx"
    if suffix == ".pdf":
        return _pdf_without_extractor(path), "pdf"
    decoded = raw.decode("utf-8", errors="ignore")
    printable = sum(ch.isprintable() or ch.isspace() for ch in decoded[:2000])
    if decoded and printable / max(len(decoded[:2000]), 1) > 0.9:
        return decoded, "text"
    return "", suffix.lstrip(".") or "unknown"
