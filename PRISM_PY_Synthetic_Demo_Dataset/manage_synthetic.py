"""
PRISM-PY Synthetic Dataset Management CLI

Manage synthetic dataset: build, test, clean, summarize.

Usage:
    python manage_synthetic.py build [--rebuild]
    python manage_synthetic.py test
    python manage_synthetic.py clean [--force]
    python manage_synthetic.py summary
    python manage_synthetic.py help
"""

import sys
import os
import json
import pickle
import subprocess
from pathlib import Path
import shutil

from paths import (
    DOCUMENTS_DIR,
    PRODUCTION_INDEX_DIR,
    SYNTHETIC_INDEX_DIR,
    SYNTHETIC_INDEX_PATH,
    SYNTHETIC_MANIFEST_PATH,
    SYNTHETIC_METADATA_PATH,
)

DATASET_DIR = DOCUMENTS_DIR


def print_header(title: str):
    """Print formatted header"""
    print()
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)
    print()


def cmd_build(rebuild: bool = False):
    """Build synthetic dataset and index"""
    print_header("BUILD SYNTHETIC DATASET")
    
    print("Step 1: Generate Dataset")
    print("-" * 60)
    result = subprocess.run([sys.executable, "generate_dataset.py"], cwd=".")
    if result.returncode != 0:
        print("❌ Dataset generation failed")
        return False
    
    print()
    print("Step 2: Ingest & Index")
    print("-" * 60)
    
    cmd = [sys.executable, "ingest_synthetic.py"]
    if rebuild:
        cmd.append("--rebuild")
    
    result = subprocess.run(cmd, cwd=".")
    if result.returncode != 0:
        print("❌ Ingestion failed")
        return False
    
    print()
    print("✅ Build complete!")
    return True


def cmd_test():
    """Run verification tests"""
    print_header("TEST SYNTHETIC RETRIEVAL")
    
    result = subprocess.run([sys.executable, "test_synthetic_retrieval.py"], cwd=".")
    
    if result.returncode == 0:
        print()
        print("✅ All tests passed!")
        return True
    else:
        print()
        print("❌ Some tests failed")
        return False


def cmd_clean(force: bool = False):
    """Clean synthetic index and data"""
    print_header("CLEAN SYNTHETIC DATA")
    
    if not force:
        print("⚠️  This will DELETE:")
        print(f"   - {SYNTHETIC_INDEX_DIR} (index and metadata)")
        print(f"   - {DATASET_DIR} (generated documents)")
        print()
        response = input("Are you sure? Type 'yes' to confirm: ")
        if response.lower() != 'yes':
            print("❌ Aborted")
            return False
    
    # Remove index directory
    if SYNTHETIC_INDEX_DIR.exists():
        shutil.rmtree(SYNTHETIC_INDEX_DIR)
        print(f"✅ Removed {SYNTHETIC_INDEX_DIR}")
    
    # Remove dataset directory
    if DATASET_DIR.exists():
        shutil.rmtree(DATASET_DIR)
        print(f"✅ Removed {DATASET_DIR}")
    
    print()
    print("✅ Clean complete")
    print()
    print("To rebuild:")
    print("   python manage_synthetic.py build")
    
    return True


def cmd_summary():
    """Display summary of synthetic dataset"""
    print_header("SYNTHETIC DATASET SUMMARY")
    
    # Check if index exists
    if not SYNTHETIC_INDEX_PATH.exists():
        print("❌ Synthetic index not found")
        print("   Run: python manage_synthetic.py build")
        return False
    
    # Load manifest
    if SYNTHETIC_MANIFEST_PATH.exists():
        with open(SYNTHETIC_MANIFEST_PATH, 'r') as f:
            manifest = json.load(f)
        
        print("📊 Dataset Statistics:")
        print(f"   Version: {manifest.get('dataset_version')}")
        print(f"   Generated: {manifest.get('generated_date')}")
        print()
        print(f"   Proposals: {manifest.get('total_proposals')}")
        print(f"   Documents: {manifest.get('total_documents')}")
        print(f"   Chunks: {manifest.get('total_chunks')}")
        print(f"   Vectors: {manifest.get('total_vectors')}")
        print(f"   Dimension: {manifest.get('vector_dimension')}")
        print()
        print(f"   Model: {manifest.get('embedding_model')}")
        print(f"   Index Type: {manifest.get('index_type')}")
        print(f"   Metric: {manifest.get('similarity_metric')}")
        print()
        print(f"   ⚠️  {manifest.get('synthetic_label')}")
    else:
        print("⚠️ Manifest not found")
    
    # Load metadata for detailed stats
    if SYNTHETIC_METADATA_PATH.exists():
        with open(SYNTHETIC_METADATA_PATH, 'rb') as f:
            metadata = pickle.load(f)
        
        print()
        print("📋 Document Types:")
        doc_types = {}
        for chunk in metadata['chunks']:
            dtype = chunk.get('document_type', 'Unknown')
            doc_types[dtype] = doc_types.get(dtype, 0) + 1
        
        for dtype, count in sorted(doc_types.items()):
            print(f"   {dtype}: {count} chunks")
        
        print()
        print("📍 Proposal IDs:")
        proposal_ids = set(chunk.get('proposal_id') for chunk in metadata['chunks'])
        for pid in sorted(proposal_ids):
            print(f"   {pid}")
    
    print()
    print("📁 File Locations:")
    print(f"   Index: {SYNTHETIC_INDEX_PATH}")
    print(f"   Metadata: {SYNTHETIC_METADATA_PATH}")
    print(f"   Manifest: {SYNTHETIC_MANIFEST_PATH}")
    print(f"   Documents: {DATASET_DIR}")
    
    return True


def cmd_help():
    """Display help"""
    print_header("SYNTHETIC DATASET MANAGEMENT")
    
    print("Commands:")
    print()
    print("  build [--rebuild]")
    print("     Generate dataset and create FAISS index")
    print("     --rebuild: Rebuild existing index")
    print()
    print("  test")
    print("     Run end-to-end retrieval verification tests")
    print()
    print("  clean [--force]")
    print("     Remove synthetic index and generated documents")
    print("     --force: Skip confirmation prompt")
    print()
    print("  summary")
    print("     Display dataset statistics and file locations")
    print()
    print("  help")
    print("     Show this help message")
    print()
    print("Examples:")
    print("   python manage_synthetic.py build")
    print("   python manage_synthetic.py test")
    print("   python manage_synthetic.py summary")
    print("   python manage_synthetic.py clean")
    print()


def main():
    if len(sys.argv) < 2:
        cmd_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "build":
        rebuild = "--rebuild" in sys.argv
        success = cmd_build(rebuild)
        sys.exit(0 if success else 1)
    
    elif command == "test":
        success = cmd_test()
        sys.exit(0 if success else 1)
    
    elif command == "clean":
        force = "--force" in sys.argv
        success = cmd_clean(force)
        sys.exit(0 if success else 1)
    
    elif command == "summary":
        success = cmd_summary()
        sys.exit(0 if success else 1)
    
    elif command == "help" or command == "--help" or command == "-h":
        cmd_help()
        sys.exit(0)
    
    else:
        print(f"❌ Unknown command: {command}")
        print()
        cmd_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
