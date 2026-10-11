"""Write synthetic source files that exercise the existing extractors.

Formats: TXT (all), DOCX (all), plus a small XLSX and PPTX sample set.
Every file starts with the synthetic classification banner.
"""

from pathlib import Path
from typing import Any, Dict, List

from paths import SOURCE_DIR, SOURCE_MANIFEST, SYNTHETIC_LABEL, TEXT_DIR


def write_all_source_files(proposals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Write TXT/DOCX for every document and a few XLSX/PPTX samples."""
    TEXT_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    manifest: List[Dict[str, Any]] = []
    xlsx_written = 0
    pptx_written = 0

    for proposal in proposals:
        for document in proposal.get("documents", []):
            doc_id = document["document_id"]
            content = document.get("content", "")

            txt_path = TEXT_DIR / f"{doc_id}.txt"
            txt_path.write_text(content, encoding="utf-8")

            docx_path = SOURCE_DIR / f"{doc_id}.docx"
            _write_docx(docx_path, document)

            files = [
                {"path": str(txt_path), "format": "txt", "location_hint": "full text file"},
                {"path": str(docx_path), "format": "docx", "location_hint": "heading/section"},
            ]

            if (
                document.get("document_type") in {"PROPOSAL", "COMPARISON"}
                and document.get("budget_amount")
                and xlsx_written < 3
            ):
                xlsx_path = SOURCE_DIR / f"{doc_id}.xlsx"
                _write_xlsx(xlsx_path, document)
                files.append({"path": str(xlsx_path), "format": "xlsx", "location_hint": "sheet/row"})
                xlsx_written += 1

            if document.get("document_type") == "PROPOSAL" and pptx_written < 2:
                pptx_path = SOURCE_DIR / f"{doc_id}.pptx"
                _write_pptx(pptx_path, document)
                files.append({"path": str(pptx_path), "format": "pptx", "location_hint": "slide"})
                pptx_written += 1

            entry = {
                "document_id": doc_id,
                "proposal_id": document.get("proposal_id"),
                "document_type": document.get("document_type"),
                "synthetic": True,
                "data_classification": SYNTHETIC_LABEL,
                "metadata": {k: v for k, v in document.items() if k != "content"},
                "files": files,
            }
            manifest.append(entry)

    import json

    SOURCE_MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest


def _write_docx(path: Path, document: Dict[str, Any]) -> None:
    from docx import Document

    doc = Document()
    doc.add_heading(SYNTHETIC_LABEL, level=1)
    doc.add_paragraph("This file is a fictional training example. Not an official record.")
    doc.add_heading(document.get("title", "Synthetic document"), level=2)
    doc.add_paragraph(f"Document ID: {document.get('document_id')}")
    doc.add_paragraph(f"Proposal ID: {document.get('proposal_id')}")
    for line in document.get("content", "").splitlines():
        doc.add_paragraph(line)
    doc.save(str(path))


def _write_xlsx(path: Path, document: Dict[str, Any]) -> None:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Illustrative Budget"
    ws.append([SYNTHETIC_LABEL])
    ws.append(["All amounts are fictional and not official quotations."])
    ws.append([])
    ws.append(["Field", "Value"])
    ws.append(["document_id", document.get("document_id")])
    ws.append(["proposal_id", document.get("proposal_id")])
    ws.append(["title", document.get("title")])
    ws.append(["illustrative_budget_inr", document.get("budget_amount")])
    ws.append(["currency", document.get("currency", "INR")])
    ws.append(["quantity", document.get("quantity")])
    ws.append(["caveat", "Do not compare budgets until scope and warranty match."])
    wb.save(str(path))


def _write_pptx(path: Path, document: Dict[str, Any]) -> None:
    from pptx import Presentation
    from pptx.util import Pt

    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = document.get("title", "Synthetic summary")
    body = slide.placeholders[1].text_frame
    body.text = SYNTHETIC_LABEL
    for line in [
        f"Proposal: {document.get('proposal_id')}",
        f"Objective: {document.get('objective')}",
        f"Illustrative budget: INR {document.get('budget_amount')}",
        "Fictional training slide. Not an official briefing.",
    ]:
        p = body.add_paragraph()
        p.text = line
        p.font.size = Pt(16)
    prs.save(str(path))
