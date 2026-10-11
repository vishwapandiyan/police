"""
Ingest synthetic documents through the existing PRISM pipeline.

Uses TextExtractor, ChunkSplitter, EmbeddingGenerator, and VectorStore.
Writes only to vectorstore/synthetic_demo/. Never opens the production index.
"""

import argparse
import json
import logging
import os
import pickle
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import faiss
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from document_processing.chunks.chunk_splitter import ChunkSplitter
from document_processing.embedding.embed_generator import EmbeddingGenerator
from text_extraction.extractor import TextExtractor
from vectorstore.vector_store import VectorStore

from paths import (
    DATASET_JSON,
    DATASET_VERSION,
    PRODUCTION_INDEX_DIR,
    SOURCE_DIR,
    SOURCE_MANIFEST,
    SYNTHETIC_INDEX_DIR,
    SYNTHETIC_INDEX_PATH,
    SYNTHETIC_LABEL,
    SYNTHETIC_MANIFEST_PATH,
    SYNTHETIC_METADATA_PATH,
    TEXT_DIR,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class SyntheticDataIngester:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.extractor = TextExtractor()
        self.chunker = ChunkSplitter(chunk_size=1000, chunk_overlap=300)
        self.embedding_generator = EmbeddingGenerator(model_name="intfloat/e5-base-v2")
        self.document_registry: Dict[str, Any] = {}
        logger.info("Initialized SyntheticDataIngester (dry_run=%s)", dry_run)

    def verify_production_index_safe(self) -> bool:
        if SYNTHETIC_INDEX_DIR.resolve() == PRODUCTION_INDEX_DIR.resolve():
            logger.error("Synthetic index path overlaps production index")
            return False
        if SYNTHETIC_INDEX_DIR.resolve().is_relative_to(PRODUCTION_INDEX_DIR.resolve()) if hasattr(Path, "is_relative_to") else False:
            logger.error("Synthetic index sits inside the production directory")
            return False
        logger.info("Production index: %s (UNTOUCHED)", PRODUCTION_INDEX_DIR)
        logger.info("Synthetic index:  %s (TARGET)", SYNTHETIC_INDEX_DIR)
        return True

    def load_existing_registry(self) -> None:
        if SYNTHETIC_METADATA_PATH.exists():
            with open(SYNTHETIC_METADATA_PATH, "rb") as handle:
                metadata = pickle.load(handle)
            self.document_registry = metadata.get("document_registry", {})
            logger.info("Loaded existing document registry: %s documents", len(self.document_registry))

    def load_source_manifest(self) -> List[Dict[str, Any]]:
        if SOURCE_MANIFEST.exists():
            return json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
        if not DATASET_JSON.exists():
            logger.error("Dataset not found. Run generate_dataset.py first.")
            return []
        proposals = json.loads(DATASET_JSON.read_text(encoding="utf-8"))
        fallback = []
        for proposal in proposals:
            for document in proposal.get("documents", []):
                fallback.append(
                    {
                        "document_id": document["document_id"],
                        "proposal_id": document.get("proposal_id"),
                        "document_type": document.get("document_type"),
                        "synthetic": True,
                        "data_classification": SYNTHETIC_LABEL,
                        "metadata": document,
                        "files": [
                            {
                                "path": str(TEXT_DIR / f"{document['document_id']}.txt"),
                                "format": "txt",
                                "location_hint": "full text file",
                            }
                        ],
                    }
                )
        return fallback

    def extract_file(self, file_info: Dict[str, Any]) -> tuple[str, str, str]:
        path = Path(file_info["path"])
        if not path.exists():
            logger.warning("Missing source file: %s", path)
            return "", file_info.get("format", "unknown"), file_info.get("location_hint", "")
        text, detected = self.extractor.extract_from_file(str(path))
        return text, detected, file_info.get("location_hint", "")

    def chunk_extracted_text(
        self,
        text: str,
        document: Dict[str, Any],
        source_filename: str,
        file_format: str,
        location_hint: str,
    ) -> List[Dict[str, Any]]:
        if file_format == "excel":
            pieces = self.chunker.intelligent_chunk_excel_text(text)
        elif file_format == "pptx":
            pieces = self.chunker.intelligent_chunk_pptx_text(text)
        else:
            pieces = self.chunker.chunk_text(text)

        chunks = []
        metadata = document.get("metadata", document)
        for idx, piece in enumerate(pieces):
            if not piece or not str(piece).strip():
                continue
            chunks.append(
                {
                    "chunk_id": f"{document['document_id']}-{Path(source_filename).stem}-chunk-{idx:03d}",
                    "chunk_sequence": idx,
                    "text": piece,
                    "document_id": document["document_id"],
                    "proposal_id": metadata.get("proposal_id") or document.get("proposal_id"),
                    "source_filename": Path(source_filename).name,
                    "source_file": Path(source_filename).name,
                    "document_type": metadata.get("document_type") or document.get("document_type"),
                    "domain": metadata.get("domain"),
                    "objective": metadata.get("objective"),
                    "location": metadata.get("location"),
                    "station_or_site": metadata.get("station_or_site"),
                    "jurisdiction": metadata.get("jurisdiction"),
                    "budget_amount": metadata.get("budget_amount"),
                    "currency": metadata.get("currency"),
                    "technology": metadata.get("technology"),
                    "quantity": metadata.get("quantity"),
                    "timeline": metadata.get("timeline"),
                    "procurement_type": metadata.get("procurement_type"),
                    "decision_status": metadata.get("decision_status"),
                    "implementation_status": metadata.get("implementation_status"),
                    "outcome_summary": metadata.get("outcome_summary"),
                    "date": metadata.get("date"),
                    "keywords": metadata.get("keywords", []),
                    "synthetic": True,
                    "data_classification": SYNTHETIC_LABEL,
                    "file_format": file_format,
                    "source_location": location_hint,
                    "heading_or_section": location_hint if file_format in {"docx", "html"} else None,
                    "sheet_and_row": location_hint if file_format == "xlsx" else None,
                    "slide_number": location_hint if file_format == "pptx" else None,
                }
            )
        return chunks

    def ingest(self, rebuild: bool) -> List[Dict[str, Any]]:
        sources = self.load_source_manifest()
        if not sources:
            return []

        if not rebuild:
            self.load_existing_registry()

        all_chunks: List[Dict[str, Any]] = []
        if not rebuild and SYNTHETIC_METADATA_PATH.exists():
            with open(SYNTHETIC_METADATA_PATH, "rb") as handle:
                existing = pickle.load(handle)
            all_chunks.extend(existing.get("chunks", []))

        for document in sources:
            document_id = document["document_id"]
            if document_id in self.document_registry and not rebuild:
                logger.info("Skipping already indexed document %s", document_id)
                continue

            created = []
            for file_info in document.get("files", []):
                # Prefer structured formats over TXT duplicates of the same document
                if file_info.get("format") == "txt" and len(document.get("files", [])) > 1:
                    continue
                text, detected, hint = self.extract_file(file_info)
                if not text:
                    continue
                created.extend(
                    self.chunk_extracted_text(
                        text,
                        document,
                        file_info["path"],
                        detected or file_info.get("format", "unknown"),
                        hint,
                    )
                )

            if created:
                all_chunks.extend(created)
                self.document_registry[document_id] = {
                    "chunk_count": len(created),
                    "indexed_at": datetime.now().isoformat(),
                    "source_files": [f["path"] for f in document.get("files", [])],
                }
                logger.info("Indexed %s (%s chunks)", document_id, len(created))

        # Deduplicate by chunk_id to keep a second run idempotent
        unique = {}
        for chunk in all_chunks:
            unique[chunk["chunk_id"]] = chunk
        return list(unique.values())

    def embed_and_save(self, chunks: List[Dict[str, Any]]) -> bool:
        if not chunks:
            logger.error("No chunks to index")
            return False

        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embedding_generator.generate_embeddings(texts, batch_size=8, prefix_type="passage")
        if embeddings is None or len(embeddings) == 0:
            logger.error("Embedding generation failed")
            return False
        embeddings = np.asarray(embeddings, dtype="float32")

        if self.dry_run:
            logger.info("[DRY RUN] Would index %s vectors", len(embeddings))
            return True

        SYNTHETIC_INDEX_DIR.mkdir(parents=True, exist_ok=True)
        store = VectorStore(str(SYNTHETIC_INDEX_PATH))
        if not store.create_index(embeddings, index_type="flat"):
            logger.error("VectorStore.create_index failed")
            return False
        store.update_chunks([c["text"] for c in chunks])
        if not store.save_index(str(SYNTHETIC_INDEX_PATH)):
            logger.error("VectorStore.save_index failed")
            return False

        metadata = {
            "chunks": chunks,
            "chunk_count": len(chunks),
            "embeddings_shape": list(embeddings.shape),
            "index_type": type(store.index).__name__,
            "model_name": "intfloat/e5-base-v2",
            "e5_prefix_applied": True,
            "synthetic_only": True,
            "created_at": datetime.now().isoformat(),
            "document_registry": self.document_registry,
        }
        # Atomic-ish replace: write temp then replace
        tmp_meta = SYNTHETIC_METADATA_PATH.with_suffix(".pkl.tmp")
        with open(tmp_meta, "wb") as handle:
            pickle.dump(metadata, handle)
        tmp_meta.replace(SYNTHETIC_METADATA_PATH)

        manifest = {
            "dataset_version": DATASET_VERSION,
            "generated_date": datetime.now().isoformat(),
            "total_proposals": len({c.get("proposal_id") for c in chunks}),
            "total_documents": len(self.document_registry),
            "total_chunks": len(chunks),
            "total_vectors": store.index.ntotal,
            "vector_dimension": store.index.d,
            "embedding_model": "intfloat/e5-base-v2",
            "e5_prefixes_used": True,
            "index_type": "IndexFlatIP",
            "similarity_metric": "Cosine Similarity (via normalized inner product)",
            "synthetic_label": SYNTHETIC_LABEL,
            "synthetic_only": True,
            "production_index_untouched": True,
            "index_path": str(SYNTHETIC_INDEX_PATH),
            "metadata_path": str(SYNTHETIC_METADATA_PATH),
            "source_dir": str(SOURCE_DIR),
        }
        tmp_manifest = SYNTHETIC_MANIFEST_PATH.with_suffix(".json.tmp")
        tmp_manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        tmp_manifest.replace(SYNTHETIC_MANIFEST_PATH)

        logger.info("Saved %s vectors to %s", store.index.ntotal, SYNTHETIC_INDEX_PATH)
        return True

    def run(self, rebuild: bool = False) -> bool:
        logger.info("PRISM-PY synthetic ingestion")
        if not self.verify_production_index_safe():
            return False
        if rebuild:
            self.document_registry = {}
        chunks = self.ingest(rebuild=rebuild)
        if not chunks:
            return False
        return self.embed_and_save(chunks)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest only the synthetic demo dataset")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild the demo index from scratch")
    args = parser.parse_args()
    ok = SyntheticDataIngester(dry_run=args.dry_run).run(rebuild=args.rebuild)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
