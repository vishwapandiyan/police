"""Detect equipment class from free text (deterministic, no LLM)."""

from __future__ import annotations

import re

CLASS_PATTERNS: list[tuple[str, list[str]]] = [
    ("cctv", [r"cctv", r"camera", r"surveillance", r"nvr", r"ip camera"]),
    ("radio", [r"radio", r"handset", r"wireless", r"walkie"]),
    ("vehicle", [r"vehicle", r"patrol van", r"gypsy", r"suv", r"motorcycle"]),
    ("training", [r"training", r"workshop", r"course", r"capacity building"]),
]


def detect_equipment_class(text: str, hinted: str | None = None) -> str:
    if hinted and hinted.lower() not in {"", "auto", "other"}:
        return hinted.lower()
    blob = (text or "").lower()
    for class_id, patterns in CLASS_PATTERNS:
        if any(re.search(p, blob) for p in patterns):
            return class_id
    return "other"
