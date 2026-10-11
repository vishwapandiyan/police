# PRISM-PY: Police Proposal Retrieval, Intelligence & Strategy Matrix

**AI/RAG Subsystem for Puducherry Police Hackathon 2026**  
**Problem Statement 1: Intelligent Proposal Management & Precedent Retrieval System (IPMPRS)**

## Overview

PRISM-PY extends the existing `multiModel_rag` system with police-specific capabilities for analyzing proposals, retrieving precedents, and generating decision intelligence briefs.

### Key Features

- **Proposal DNA Extraction**: Structured extraction of proposal characteristics
- **Precedent Retrieval**: Find relevant historical proposals and decisions
- **Jurisdiction-Aware Ranking**: Prioritize precedents from relevant jurisdictions
- **Cost Analysis**: Compare proposal costs with historical data
- **Decision Intelligence Briefs**: Evidence-grounded analysis for human reviewers
- **NVIDIA LLM Integration**: Uses NVIDIA API Catalog for language understanding

## Architecture

PRISM-PY integrates with existing components rather than replacing them:

```
multiModel_rag/                  # Existing RAG infrastructure
├── text_extraction/             # REUSED: Multi-format document extraction
├── document_processing/         # REUSED: Chunking, embeddings, metadata
├── vectorstore/                 # REUSED: FAISS vector indices
├── retriever/                   # EXTENDED: Added jurisdiction ranking
├── agent/                       # EXTENDED: Added PRISM workflow
│
└── prism/                       # NEW: Police-specific modules
    ├── schemas/                 # Proposal DNA, Decision Brief models
    ├── llm/                     # NVIDIA provider + mock for testing
    ├── prompts/                 # Police domain prompts
    ├── extractors/              # Proposal DNA extraction
    ├── analyzers/               # Cost, overlap, jurisdiction analysis
    └── generators/              # Decision brief generation
```

## Installation

### Prerequisites

- Python 3.9+
- Existing `multiModel_rag` dependencies (see main requirements.txt)
- NVIDIA API key (get from [build.nvidia.com](https://build.nvidia.com))

### Setup

1. **Install additional dependencies**:
```bash
pip install pydantic requests
```

2. **Configure environment**:
```bash
# Copy the PRISM example config
cp .env.prism.example .env

# Edit .env and add your NVIDIA API key
nano .env
```

3. **Verify installation**:
```bash
python -c "from prism import NVIDIAProvider; print('PRISM installed successfully')"
```

## Configuration

### NVIDIA API Setup

1. Visit [https://build.nvidia.com](https://build.nvidia.com)
2. Sign up / Log in
3. Generate an API key
4. Add to `.env`:
```bash
NVIDIA_API_KEY=nvapi-YOUR_ACTUAL_KEY_HERE
```

### Recommended Models

- **meta/llama-3.1-70b-instruct** (recommended): 128K context, excellent reasoning
- **meta/llama-3.1-8b-instruct**: Faster, 128K context, good for testing
- **mistralai/mixtral-8x7b-instruct-v0.1**: 32K context, good balance

## Usage

### Basic Example: Analyze a Proposal

```python
from prism import ProposalDNAExtractor, DecisionBriefGenerator
from prism.llm import NVIDIAProvider
from document_processing.embedding.embed_generator import EmbeddingGenerator
from retriever.retriever import DocumentRetriever
from vectorstore.vector_store import VectorStore

# Initialize components
llm = NVIDIAProvider()
extractor = ProposalDNAExtractor(llm)
generator = DecisionBriefGenerator(llm)

# Extract Proposal DNA from document
proposal_dna = extractor.extract_from_document(
    document_text="...",
    document_id="proposal-001"
)

# Find precedents using existing retrieval system
retriever = DocumentRetriever()
precedents = retriever.jurisdiction_aware_search(
    query=proposal_dna.to_search_text(),
    jurisdiction_config={...}
)

# Generate Decision Intelligence Brief
brief = generator.generate_brief(
    proposal_dna=proposal_dna,
    precedents=precedents
)

print(brief.to_executive_summary())
```

### Using Mock Provider for Testing

```python
from prism.llm import MockLLMProvider

# No API key required
llm = MockLLMProvider()
response = llm.generate("Analyze this proposal...")
print(response.content)
```

## API Integration

### New Endpoints (to be added to main.py)

```python
@app.route('/prism/analyze-proposal', methods=['POST'])
def analyze_proposal():
    """
    Analyze a proposal and extract Proposal DNA
    
    Request:
    {
        "document_url": "https://...",
        "document_id": "proposal-001"
    }
    
    Response:
    {
        "success": true,
        "proposal_dna": {...},
        "completeness_score": 0.85
    }
    """
    pass

@app.route('/prism/find-precedents', methods=['POST'])
def find_precedents():
    """
    Find precedents for a proposal
    
    Request:
    {
        "proposal_dna": {...},
        "jurisdiction": "Puducherry Central",
        "top_k": 5
    }
    
    Response:
    {
        "success": true,
        "precedents": [...]
    }
    """
    pass

@app.route('/prism/decision-brief', methods=['POST'])
def generate_decision_brief():
    """
    Generate comprehensive Decision Intelligence Brief
    
    Request:
    {
        "document_url": "https://...",
        "jurisdiction": "Puducherry Central"
    }
    
    Response:
    {
        "success": true,
        "brief": {...},
        "executive_summary": "..."
    }
    """
    pass
```

## Testing

```bash
# Run PRISM-specific tests
python -m pytest prism/tests/

# Run with mock provider (no API key needed)
NVIDIA_API_KEY=mock python -m pytest prism/tests/
```

## Key Concepts

### Proposal DNA

A structured representation of a proposal capturing:
- Domain (infrastructure, procurement, technology, etc.)
- Objective
- Location and jurisdiction
- Budget and financial details
- Technology/equipment
- Timeline
- Procurement type

Each field includes:
- Extracted value
- Evidence/source reference
- Confidence score
- Extraction status

### Decision Intelligence Brief

Comprehensive analysis including:
- Extracted Proposal DNA
- Relevant precedents with match explanations
- Policy/SOP references
- Cost analysis and variance
- Review signals (potential concerns)
- Missing information
- Questions for human reviewer
- Full source citations

### Jurisdiction-Aware Ranking

Precedents are ranked by:
1. Same police station (highest priority)
2. Neighboring stations
3. Same region
4. District-wide
5. Puducherry-wide

Combined with semantic similarity for optimal results.

## Security & Privacy

- API keys stored only in environment variables
- No credentials in code or logs
- Document text treated as untrusted data
- Prompt injection detection
- Bearer token authentication for API endpoints
- Citation validation to prevent hallucinations

## Limitations

- Requires NVIDIA API key (free tier available)
- Context length limited by model (128K for Llama 3.1)
- Jurisdiction data must be configured/provided
- Cost analysis requires comparable historical data
- Cannot make official approval/rejection decisions (human authorization required)

## Troubleshooting

### "NVIDIA_API_KEY is required"
Add your API key to `.env` file or environment variables.

### "Failed to connect to NVIDIA API"
Check internet connection and verify `NVIDIA_BASE_URL` is correct.

### Mock provider returns generic responses
This is expected. Mock provider is for testing structure, not accuracy.

### Jurisdiction ranking not working
Ensure jurisdiction configuration is loaded and relationships are defined.

## Contributing

1. Keep PRISM modules separate from base RAG infrastructure
2. Use mock provider for all tests
3. Never commit API keys
4. Add type hints to all functions
5. Update this README with new features

## License

Part of Puducherry Police Hackathon 2026 submission.

## Support

For issues specific to PRISM-PY integration, check:
- PRISM configuration in `.env`
- NVIDIA API status at [status.nvidia.com](https://status.nvidia.com)
- Logs in `document_processing/logs/app.log`
