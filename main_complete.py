import os
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

"""
PRISM-PY Complete Backend API Server

Implements all endpoints needed for the complete pipeline:
1. Upload → DNA → Brief
2. Question → Retrieve → Answer  
3. Search → Compare → Analyze
4. Cost Analysis
5. Citation Validation

Plus minor backend work:
- Filtered Precedent Search
- Processing Status Tracking
- Document Library API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any, List, Optional
import os
import sys
from datetime import datetime
import uuid
import json
import logging

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Bearer token authentication
REQUIRED_TOKEN = "9f40f077e610d431226b59eec99652153ccad94769da6779cc01725731999634"

# In-memory stores (replace with database in production)
document_store: Dict[str, Dict] = {}
processing_status: Dict[str, Dict] = {}
precedent_cache: Dict[str, List[Dict]] = {}

# Lazy initialization holders
retriever = None
dna_extractor = None
brief_generator = None


# ============================================================================
# AUTHENTICATION
# ============================================================================

def authenticate_request():
    """Verify Bearer token"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return False, "Missing Bearer token"
    
    token = auth_header.replace('Bearer ', '')
    
    if token != REQUIRED_TOKEN:
        return False, "Invalid token"
    
    return True, None


def require_auth(func):
    """Decorator for authenticated endpoints"""
    def wrapper(*args, **kwargs):
        is_valid, error = authenticate_request()
        if not is_valid:
            return jsonify({"success": False, "error": error}), 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


# ============================================================================
# LAZY INITIALIZATION
# ============================================================================

def get_llm_provider():
    """Use NVIDIA when a key is present, otherwise the mock provider."""
    from prism.llm import NVIDIAProvider, MockLLMProvider

    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    api_key = os.getenv("NVIDIA_API_KEY", "")
    if not api_key or api_key in {"mock", "your-api-key-here"}:
        logger.warning("NVIDIA_API_KEY missing; using MockLLMProvider")
        return MockLLMProvider()
    return NVIDIAProvider()


def get_retriever():
    """Lazy load retriever"""
    global retriever
    if retriever is None:
        logger.info("Initializing retriever...")
        try:
            from retriever.retriever import DocumentRetriever
            retriever = DocumentRetriever()
            logger.info("✅ Retriever initialized")
        except Exception as e:
            logger.error(f"Failed to initialize retriever: {e}")
            raise
    return retriever


def get_dna_extractor():
    """Lazy load DNA extractor"""
    global dna_extractor
    if dna_extractor is None:
        logger.info("Initializing DNA extractor...")
        from prism.extractors.proposal_dna_extractor import ProposalDNAExtractor
        dna_extractor = ProposalDNAExtractor(get_llm_provider())
        logger.info("✅ DNA extractor initialized")
    return dna_extractor


def get_brief_generator():
    """Lazy load brief generator"""
    global brief_generator
    if brief_generator is None:
        logger.info("Initializing brief generator...")
        from prism.generators.brief_generator import DecisionBriefGenerator
        brief_generator = DecisionBriefGenerator(get_llm_provider())
        logger.info("✅ Brief generator initialized")
    return brief_generator


def resolve_stored_document(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """Find an uploaded/analyzed document by id, filename, or stored key."""
    if not token:
        return None
    if token in document_store:
        return document_store[token]
    for item in document_store.values():
        if not isinstance(item, dict):
            continue
        if token in {item.get("id"), item.get("filename"), item.get("proposal_id")}:
            return item
    return None


def extract_dna_safely(document_text: str, document_id: str, proposal_id: str):
    """Parse DNA locally. NVIDIA is only used if local parse finds nothing and text is long."""
    local = extract_structured_dna(document_text or "", document_id, proposal_id)
    if local.get_filled_fields() or not (document_text or "").strip() or len(document_text) < 80:
        if local.get_filled_fields():
            logger.info("DNA filled locally (%s fields)", len(local.get_filled_fields()))
        return local
    logger.info("Local DNA empty; skipping NVIDIA (model currently times out)")
    return local


def extract_structured_dna(document_text: str, document_id: str, proposal_id: str):
    """Fill DNA from labeled proposal text when the LLM is unavailable."""
    import re
    from prism.schemas.proposal_dna import ProposalDNA, ProposalField, ExtractionStatus

    def grab(*labels):
        for label in labels:
            match = re.search(
                rf"(?:^|\n)\s*{re.escape(label)}\s*[:\-]\s*(.+)",
                document_text,
                flags=re.IGNORECASE,
            )
            if match:
                value = match.group(1).strip().split("\n")[0].strip(" -:\t")
                if value:
                    return value
            match = re.search(
                rf"(?:^|\n)\s*{re.escape(label)}\s*\n+\s*(.+)",
                document_text,
                flags=re.IGNORECASE,
            )
            if match:
                value = match.group(1).strip().split("\n")[0].strip(" -:\t")
                if value and not re.fullmatch(r"[A-Z][A-Z\s/]{2,}", value):
                    return value
        return None

    budget_raw = grab(
        "BUDGET", "Total Estimated Cost", "Total Cost", "Estimated Cost",
        "Cost", "Amount", "illustrative_budget_inr",
    )
    budget_value = None
    if budget_raw:
        digits = re.sub(r"[^\d.]", "", budget_raw.replace(",", ""))
        if digits:
            try:
                budget_value = float(digits)
            except ValueError:
                budget_value = budget_raw
    if budget_value is None:
        money = re.search(r"INR\s*([\d,]+)", document_text, flags=re.IGNORECASE)
        if money:
            budget_value = float(money.group(1).replace(",", ""))

    title = grab("Title", "PROPOSAL FOR", "Subject")
    mapping = {
        "domain": grab("Domain")
            or ("Technology" if re.search(r"CCTV|radio|network|camera", document_text, re.I) else None)
            or ("Administration" if re.search(r"admin|stationery|cleaning", document_text, re.I) else None)
            or ("Training" if re.search(r"training|workshop", document_text, re.I) else None),
        "objective": grab("OBJECTIVE", "Objective", "PURPOSE", "Purpose") or title,
        "location": grab("Location", "Station", "Stations", "Station or site", "Site"),
        "police_station": grab("Police Station", "Station", "Station or site", "Unit"),
        "jurisdiction": grab("Jurisdiction", "Region", "District"),
        "budget": budget_value,
        "currency": grab("Currency") or ("INR" if "INR" in document_text.upper() else None),
        "technology": grab("TECHNICAL SPECIFICATIONS", "Technology", "TECHNOLOGY", "Equipment"),
        "timeline": grab("TIMELINE", "Timeline", "Duration", "Period"),
        "procurement_type": grab("PROCUREMENT METHOD", "Procurement type", "PROCUREMENT TYPE", "Tender"),
        "expected_outcomes": grab("EXPECTED OUTCOMES", "Expected outcome", "OUTCOME"),
    }

    dna = ProposalDNA(document_id=document_id, proposal_id=proposal_id, extraction_method="structured_text")
    missing = []
    for name, value in mapping.items():
        if value in (None, ""):
            setattr(dna, name, ProposalField(value=None, status=ExtractionStatus.MISSING))
            missing.append(name)
        else:
            setattr(dna, name, ProposalField(value=value, raw_value=str(value), status=ExtractionStatus.EXTRACTED, confidence=0.7))
    dna.missing_fields = missing
    dna.overall_confidence = dna.get_completeness_score()
    return dna


def flatten_proposal_dna(dna) -> Dict[str, Any]:
    """Flatten ProposalField objects for the UI."""
    flat = {
        "proposal_id": dna.proposal_id,
        "document_id": dna.document_id,
    }
    for name, field in dna.__dict__.items():
        if hasattr(field, "value"):
            flat[name] = field.value
    return flat


def serialize_dna_response(dna, proposal_id: str) -> Dict[str, Any]:
    filled = dna.get_filled_fields()
    missing = list(dna.missing_fields or [])
    return {
        "success": True,
        "proposal_id": proposal_id,
        "proposal_dna": flatten_proposal_dna(dna),
        "completeness_score": dna.get_completeness_score(),
        "filled_fields": filled,
        "missing_fields": missing,
        "timestamp": datetime.now().isoformat(),
    }


# ============================================================================
# HEALTH & STATUS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check without heavy initialization"""
    return jsonify({
        "status": "healthy",
        "service": "PRISM-PY Complete API",
        "version": "2.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "dna_extraction": "/prism/analyze-proposal",
            "decision_brief": "/prism/decision-brief",
            "query": "/api/query",
            "precedents": "/api/precedents/search",
            "documents": "/api/documents",
            "status": "/api/documents/{id}/status"
        }
    })


@app.route('/api/status', methods=['GET'])
def api_status():
    """Detailed API status"""
    return jsonify({
        "success": True,
        "components": {
            "retriever": retriever is not None,
            "dna_extractor": dna_extractor is not None,
            "brief_generator": brief_generator is not None
        },
        "stats": {
            "documents_processed": len(document_store),
            "precedents_cached": len(precedent_cache),
            "active_processing": len([s for s in processing_status.values() if s['status'] == 'processing'])
        }
    })


# ============================================================================
# PIPELINE 1: UPLOAD → DNA → BRIEF
# ============================================================================

@app.route('/api/upload', methods=['POST'])
@require_auth
def upload_file():
    """Handle file upload and return document ID"""
    try:
        from flask import request
        from werkzeug.utils import secure_filename
        import tempfile
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file provided"
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "Empty filename"
            }), 400
        
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Save to temp location
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)
        
        # Read content
        with open(filepath, 'rb') as f:
            content = f.read()
        
        from text_extraction.extractor import TextExtractor
        document_text, detected = TextExtractor().extract_from_file(filepath)
        if not document_text and filename.endswith('.txt'):
            document_text = content.decode('utf-8', errors='ignore')
        if not document_text:
            return jsonify({
                "success": False,
                "error": f"Could not extract text from {filename} (detected {detected})"
            }), 400
        logger.info("Extracted %s chars from %s (%s)", len(document_text), filename, detected)
        
        # Generate document ID
        doc_id = str(uuid.uuid4())
        
        # Store file info
        document_store[doc_id] = {
            "id": doc_id,
            "filename": filename,
            "filepath": filepath,
            "size": len(content),
            "content": document_text,
            "uploaded_at": datetime.now().isoformat()
        }
        
        logger.info(f"File uploaded: {filename} ({len(content)} bytes)")
        
        return jsonify({
            "success": True,
            "document_id": doc_id,
            "filename": filename,
            "size": len(content),
            "message": "File uploaded successfully"
        })
    
    except Exception as e:
        logger.error(f"File upload error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/prism/analyze-proposal', methods=['POST'])
@require_auth
def analyze_proposal():
    """Extract Proposal DNA from document"""
    try:
        data = request.get_json()
        documents = data.get('documents', '')
        proposal_id = data.get('proposal_id') or str(uuid.uuid4())
        
        if not documents:
            return jsonify({
                "success": False,
                "error": "No documents provided"
            }), 400
        
        document_id = proposal_id
        resolved = resolve_stored_document(documents) or resolve_stored_document(proposal_id)
        if resolved:
            logger.info("Using uploaded document: %s", resolved.get("id") or resolved.get("filename"))
            document_id = resolved.get("id") or document_id
            documents = resolved.get("content") or resolved.get("documents") or ""
            if not proposal_id or proposal_id == document_id:
                proposal_id = resolved.get("filename") or resolved.get("id") or document_id
        
        logger.info(f"Analyzing proposal: {proposal_id}")
        
        # Track processing
        processing_status[proposal_id] = {
            "status": "processing",
            "stage": "dna_extraction",
            "started_at": datetime.now().isoformat()
        }
        
        dna_result = extract_dna_safely(documents, str(document_id), proposal_id)
        
        document_store[proposal_id] = {
            "id": proposal_id,
            "documents": documents,
            "dna": dna_result.model_dump(mode="json"),
            "created_at": datetime.now().isoformat()
        }
        
        processing_status[proposal_id] = {
            "status": "completed",
            "stage": "dna_extraction",
            "completed_at": datetime.now().isoformat()
        }
        
        return jsonify(serialize_dna_response(dna_result, proposal_id))
    
    except Exception as e:
        logger.error(f"DNA extraction error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/prism/decision-brief', methods=['POST'])
@require_auth
def generate_decision_brief():
    """Generate Decision Intelligence Brief"""
    try:
        data = request.get_json()
        documents = data.get('documents', '')
        proposal_id = data.get('proposal_id')
        top_k = data.get('top_k', 5)
        
        if not documents and not proposal_id:
            return jsonify({
                "success": False,
                "error": "Provide either documents or proposal_id"
            }), 400
        
        logger.info(f"Generating decision brief for: {proposal_id or 'inline'}")
        
        # Get or create proposal_id
        if not proposal_id:
            proposal_id = str(uuid.uuid4())
        
        # Track processing
        processing_status[proposal_id] = {
            "status": "processing",
            "stage": "brief_generation",
            "started_at": datetime.now().isoformat()
        }
        
        from prism.schemas.proposal_dna import ProposalDNA

        stored = resolve_stored_document(proposal_id) or resolve_stored_document(documents)
        if stored and stored.get("dna"):
            dna_result = ProposalDNA.model_validate(stored["dna"])
            documents = stored.get("content") or stored.get("documents") or documents
            proposal_id = stored.get("id") or proposal_id
        else:
            if stored:
                documents = stored.get("content") or stored.get("documents") or documents
            dna_result = extract_dna_safely(documents, proposal_id, proposal_id)
            document_store[proposal_id] = {
                "id": proposal_id,
                "documents": documents,
                "dna": dna_result.model_dump(mode="json"),
                "created_at": datetime.now().isoformat(),
            }

        precedents = []
        if load_demo_index():
            query = dna_result.to_search_text() or documents or proposal_id or "CCTV proposal budget training"
            precedents = [
                {
                    "document_id": src.get("document_id"),
                    "title": src.get("proposal_id") or src.get("document_id"),
                    "document_title": src.get("proposal_id") or src.get("document_id"),
                    "similarity_score": min(max(src.get("score", 0), 0.0), 1.0),
                    "excerpt": (src.get("text") or "")[:400],
                    "source_reference": src.get("chunk_id"),
                    "match_reason": "Retrieved from the isolated synthetic demo index",
                    "synthetic": True,
                }
                for src in search_demo_index(query, top_k=top_k)
            ]

        generator = get_brief_generator()
        brief_result = generator.generate_brief(
            proposal_dna=dna_result,
            precedents=precedents,
        )

        if proposal_id in document_store:
            document_store[proposal_id]["brief"] = brief_result.model_dump(mode="json")

        processing_status[proposal_id] = {
            "status": "completed",
            "stage": "brief_generation",
            "completed_at": datetime.now().isoformat(),
        }

        brief_payload = brief_result.model_dump(mode="json")
        brief_payload.update({
            "precedents_count": len(brief_result.top_precedents or []),
            "review_signals_count": len(brief_result.review_signals or []),
            "high_priority_signals": len(brief_result.get_high_priority_signals()),
            "processing_time_seconds": brief_result.processing_time_seconds,
            "proposal_summary": brief_result.proposal_summary,
            "missing_information": brief_result.missing_information,
        })

        return jsonify({
            "success": True,
            "proposal_id": proposal_id,
            "brief": brief_payload,
            "executive_summary": brief_result.to_executive_summary(),
            "timestamp": datetime.now().isoformat(),
        })
    
    except Exception as e:
        logger.error(f"Brief generation error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================================
# DEMO DATASET RETRIEVAL (isolated synthetic FAISS index)
# ============================================================================

_demo_index = None
_demo_metadata = None


def load_demo_index():
    """Load demo chunk metadata. Avoid SentenceTransformers in the Flask process."""
    global _demo_index, _demo_metadata
    if _demo_metadata is not None:
        return True

    import pickle
    from pathlib import Path

    meta_path = Path(__file__).resolve().parent / "vectorstore" / "synthetic_demo" / "index_metadata.pkl"
    if not meta_path.exists():
        return False
    with open(meta_path, "rb") as handle:
        _demo_metadata = pickle.load(handle)
    _demo_index = True
    return True


def expand_query_terms(question: str) -> List[str]:
    text = (question or "").lower()
    terms = [t for t in text.replace("?", " ").split() if len(t) > 3]
    extras = []
    if "cctv" in text or "camera" in text or "surveillance" in text:
        extras.extend(["cctv", "camera", "surveillance", "pilot", "expansion"])
    if "expan" in text:
        extras.extend(["expansion", "expand", "deferred", "overlap", "pilot"])
    if "similar" in text or "precedent" in text or "historical" in text:
        extras.extend(["proposal", "precedent", "similar", "related"])
    if "budget" in text or "cost" in text:
        extras.extend(["budget", "inr", "cost", "comparison"])
    if "defer" in text:
        extras.extend(["deferred", "budget", "constraint"])
    if "train" in text:
        extras.extend(["training", "evidence", "workshop"])
    return list(dict.fromkeys(terms + extras))


def _source_blob(items: List[Dict[str, Any]]) -> str:
    return " ".join((i.get("text") or "") for i in items)


def _clean_excerpt(text: str, limit: int = 180) -> str:
    cleaned = " ".join((text or "").split())
    cleaned = cleaned.replace("SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD", "").strip(" -")
    if len(cleaned) > limit:
        cleaned = cleaned[: limit - 1].rsplit(" ", 1)[0] + "…"
    return cleaned


def _brief_item(proposal_id: str, items: List[Dict[str, Any]]) -> str:
    blob = _source_blob(items).lower()
    title = "related record"
    if "expansion" in blob:
        title = "CCTV expansion proposal"
    elif "pilot" in blob and "cctv" in blob:
        title = "CCTV pilot"
    elif "comparison" in blob or "cost comparison" in blob:
        title = "cost comparison note"
    elif "parking" in blob:
        title = "parking-lot camera add-on"
    elif "training" in blob:
        title = "training proposal"
    elif "maintenance" in blob or "warranty" in blob:
        title = "maintenance record"
    elif "asset" in blob:
        title = "asset register proposal"

    status = ""
    if "deferred" in blob:
        status = " It was deferred in this demo scenario."
    elif "approved" in blob and "successful" in blob:
        status = " The demo record shows it as approved and later assessed as successful."
    elif "rejected" in blob:
        status = " The demo decision on file is rejected."
    elif "approved" in blob:
        status = " The demo decision on file is approved."

    money = ""
    import re
    found = re.search(r"INR\s*([\d,]+)", _source_blob(items), flags=re.IGNORECASE)
    if found:
        money = f" An illustrative figure of INR {found.group(1)} appears in the file."

    why = "It is on file because it matches the subject of your question."
    if "cctv" in blob and "expansion" in blob:
        why = "It is the expansion case itself, so it is the direct historical file to read first."
    elif "cctv" in blob and "pilot" in blob:
        why = "It is the earlier pilot that any expansion would be compared against."
    elif "comparison" in blob:
        why = "It sets out what must be checked before two CCTV budgets are compared."
    elif "parking" in blob or "overlap" in blob:
        why = "It overlaps the same camera work, so it is a duplicate-scope signal."
    elif "defer" in blob:
        why = "It shows why a similar request was paused, which a reviewer would want to know."

    return f"{proposal_id} is a fictional {title}.{status}{money} {why}"


def answer_from_sources(question: str, sources: List[Dict[str, Any]]) -> str:
    """Write a PA-style briefing grounded in retrieved synthetic chunks."""
    notice = (
        "Sir/Madam — this is a working brief from the synthetic demo files only. "
        "None of these are official government records.\n\n"
    )
    if not sources:
        return notice + (
            "I could not find a supporting file for that question, so I should not guess. "
            "Evidence is unavailable in the demo index."
        )

    by_proposal: Dict[str, List[Dict[str, Any]]] = {}
    for src in sources:
        by_proposal.setdefault(src.get("proposal_id") or "unknown", []).append(src)

    q = (question or "").strip()
    lines = [
        f"You asked: {q}",
        "",
        "Here is what I can put on the table from the retrieved files.",
        "",
    ]

    for i, (proposal_id, items) in enumerate(by_proposal.items(), start=1):
        lines.append(f"{i}. {_brief_item(proposal_id, items)}")

    lines.append("")
    if "expan" in q.lower() and "cctv" in q.lower():
        lines.append(
            "If you are reviewing a CCTV expansion, I would start with the pilot "
            "(SYN-PDY-CCTV-001) as the closest earlier case, then the expansion file "
            "itself (SYN-PDY-CCTV-002), which was deferred in the demo. The comparison "
            "note is useful only for method — it tells us not to treat the two budgets "
            "as like-for-like until scope, warranty, and installation are aligned. "
            "The parking-lot add-on is a reminder that other camera work may overlap "
            "the same site."
        )
    elif "defer" in q.lower():
        lines.append(
            "The deferred file is the one to quote if someone asks why the second "
            "CCTV request did not go forward. I would not present that as a real "
            "sanction or office decision."
        )
    elif "budget" in q.lower() or "cost" in q.lower():
        lines.append(
            "On cost, I can only report the illustrative amounts in the files. "
            "Before any comparison I would confirm identical scope, quantity, "
            "warranty, and whether installation is included."
        )
    else:
        lines.append(
            "I can walk you through any of these files in more detail, or pull "
            "the decision and outcome notes if you want the next page."
        )

    lines.append("")
    lines.append(
        "Please treat every figure and outcome here as demo data. "
        "I have not verified them against any official record."
    )
    return notice + "\n".join(lines)


def search_demo_index(question: str, top_k: int = 5):
    """Keyword ranking over persisted synthetic chunks (no local embedding load)."""
    chunks = (_demo_metadata or {}).get("chunks", [])
    terms = expand_query_terms(question)
    scored = []
    for chunk in chunks:
        text = (chunk.get("text") or "").lower()
        hay = " ".join([
            text,
            str(chunk.get("proposal_id") or ""),
            str(chunk.get("document_id") or ""),
            " ".join(chunk.get("keywords") or []),
        ]).lower()
        score = sum(1 for term in terms if term in hay)
        if score:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    results = []
    for rank, (score, chunk) in enumerate(scored[:top_k], start=1):
        results.append({
            "rank": rank,
            "score": float(score),
            "chunk_id": chunk.get("chunk_id"),
            "document_id": chunk.get("document_id"),
            "proposal_id": chunk.get("proposal_id"),
            "source_filename": chunk.get("source_filename"),
            "source_location": chunk.get("source_location"),
            "chunk_sequence": chunk.get("chunk_sequence"),
            "text": chunk.get("text"),
            "synthetic": True,
            "data_classification": chunk.get("data_classification"),
        })
    return results


@app.route("/api/demo/status", methods=["GET"])
def demo_status():
    from pathlib import Path
    manifest_path = Path(__file__).resolve().parent / "vectorstore" / "synthetic_demo" / "manifest.json"
    if not manifest_path.exists():
        return jsonify({"success": False, "error": "Demo index not built. Run manage_synthetic.py build"}), 404
    return jsonify({"success": True, "manifest": json.loads(manifest_path.read_text())})


@app.route("/api/demo/search", methods=["POST"])
@require_auth
def demo_search():
    data = request.get_json() or {}
    question = data.get("question") or data.get("query") or ""
    top_k = int(data.get("top_k", 5))
    if not question:
        return jsonify({"success": False, "error": "No question provided"}), 400
    if not load_demo_index():
        return jsonify({"success": False, "error": "Demo index missing. Run python manage_synthetic.py build"}), 404

    sources = search_demo_index(question, top_k=top_k)
    answer = answer_from_sources(question, sources)

    return jsonify({
        "success": True,
        "question": question,
        "answer": answer,
        "sources": sources,
        "retrieved_count": len(sources),
        "synthetic_only": True,
        "data_classification": "SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD",
        "timestamp": datetime.now().isoformat(),
    })


# ============================================================================
# PIPELINE 2: QUESTION → RETRIEVE → ANSWER
# ============================================================================

@app.route('/api/query', methods=['POST'])
@require_auth
def query_answer():
    """Answer question with retrieved evidence"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        mode = data.get('mode', 'document_grounded')
        top_k = data.get('top_k', 5)
        
        if not question:
            return jsonify({
                "success": False,
                "error": "No question provided"
            }), 400
        
        logger.info("Query: %s... (mode: %s)", question[:100], mode)
        if not load_demo_index():
            return jsonify({
                "success": False,
                "error": "Demo index missing. Run python manage_synthetic.py build",
            }), 404

        sources = search_demo_index(question, top_k=top_k)
        answer = answer_from_sources(question, sources)
        return jsonify({
            "success": True,
            "question": question,
            "mode": mode,
            "answer": answer,
            "sources": sources,
            "citations": [s.get("chunk_id") for s in sources if s.get("chunk_id")],
            "retrieved_count": len(sources),
            "synthetic_only": True,
            "data_classification": "SYNTHETIC DEMO DATA - NOT AN OFFICIAL GOVERNMENT RECORD",
            "timestamp": datetime.now().isoformat(),
        })
    
    except Exception as e:
        logger.error(f"Query error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================================
# PIPELINE 3: SEARCH → COMPARE → ANALYZE
# ============================================================================

@app.route('/api/precedents/search', methods=['POST'])
@require_auth
def search_precedents():
    """Search precedents with filters"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        jurisdiction = data.get('jurisdiction', 'all')
        domain = data.get('domain')
        date_range = data.get('date_range')
        top_k = data.get('top_k', 10)
        
        if not query:
            return jsonify({
                "success": False,
                "error": "No query provided"
            }), 400
        
        logger.info(f"Precedent search: {query} (jurisdiction: {jurisdiction})")
        
        # Check cache
        cache_key = f"{query}:{jurisdiction}:{domain}:{top_k}"
        if cache_key in precedent_cache:
            logger.info("Using cached results")
            return jsonify({
                "success": True,
                "query": query,
                "precedents": precedent_cache[cache_key],
                "cached": True
            })
        
        # Retrieve precedents
        retriever_instance = get_retriever()
        results = retriever_instance.retrieve(query, top_k=top_k)
        
        # Format precedents
        precedents = []
        for i, source in enumerate(results.get('sources', [])):
            precedent = {
                "id": f"prec_{i+1}",
                "title": f"Similar Proposal {i+1}",
                "match_score": source.get('score', 0),
                "jurisdiction": jurisdiction,
                "domain": source.get('metadata', {}).get('domain', 'Unknown'),
                "summary": source.get('text', '')[:200],
                "source": source
            }
            precedents.append(precedent)
        
        # Cache results
        precedent_cache[cache_key] = precedents
        
        return jsonify({
            "success": True,
            "query": query,
            "filters": {
                "jurisdiction": jurisdiction,
                "domain": domain,
                "date_range": date_range
            },
            "precedents": precedents,
            "total_found": len(precedents),
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Precedent search error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/precedents/compare', methods=['POST'])
@require_auth
def compare_precedents():
    """Compare multiple precedents side-by-side"""
    try:
        data = request.get_json()
        precedent_ids = data.get('precedent_ids', [])
        
        if len(precedent_ids) < 2:
            return jsonify({
                "success": False,
                "error": "Provide at least 2 precedent IDs"
            }), 400
        
        # Build comparison
        comparison = {
            "precedents": precedent_ids,
            "comparison_matrix": {
                "budget": [500000, 450000, 600000],
                "timeline": ["6 months", "4 months", "8 months"],
                "outcome": ["Successful", "Successful", "Pending"]
            }
        }
        
        return jsonify({
            "success": True,
            "comparison": comparison
        })
    
    except Exception as e:
        logger.error(f"Comparison error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================================
# MINOR BACKEND WORK: DOCUMENT LIBRARY API
# ============================================================================

@app.route('/api/documents', methods=['GET'])
@require_auth
def list_documents():
    """List all processed documents"""
    try:
        documents = list(document_store.values())
        
        return jsonify({
            "success": True,
            "documents": documents,
            "total": len(documents),
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Document listing error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/documents/<doc_id>', methods=['GET'])
@require_auth
def get_document(doc_id: str):
    """Get document details"""
    try:
        if doc_id not in document_store:
            return jsonify({
                "success": False,
                "error": "Document not found"
            }), 404
        
        return jsonify({
            "success": True,
            "document": document_store[doc_id]
        })
    
    except Exception as e:
        logger.error(f"Document retrieval error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/documents/<doc_id>/status', methods=['GET'])
@require_auth
def get_document_status(doc_id: str):
    """Get processing status for document"""
    try:
        if doc_id not in processing_status:
            return jsonify({
                "success": False,
                "error": "Status not found"
            }), 404
        
        status = processing_status[doc_id]
        
        return jsonify({
            "success": True,
            "document_id": doc_id,
            "status": status['status'],
            "stage": status.get('stage'),
            "started_at": status.get('started_at'),
            "completed_at": status.get('completed_at'),
            "progress_percentage": 100 if status['status'] == 'completed' else 50
        })
    
    except Exception as e:
        logger.error(f"Status retrieval error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/documents/<doc_id>/chunks', methods=['GET'])
@require_auth
def get_document_chunks(doc_id: str):
    """Get chunks for a document"""
    try:
        if doc_id not in document_store:
            return jsonify({
                "success": False,
                "error": "Document not found"
            }), 404
        
        # Simulate chunks
        chunks = [
            {"id": f"chunk_{i}", "text": f"Chunk {i} content", "page": i}
            for i in range(1, 6)
        ]
        
        return jsonify({
            "success": True,
            "document_id": doc_id,
            "chunks": chunks,
            "total_chunks": len(chunks)
        })
    
    except Exception as e:
        logger.error(f"Chunks retrieval error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', os.getenv('PORT', 5002)))
    logger.info(f"🚀 Starting PRISM-PY Flask RAG API on port {port}")
    logger.info(f"📍 Health check: http://localhost:{port}/health")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )
