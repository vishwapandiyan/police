"""
PRISM-PY: Police Proposal Retrieval, Intelligence & Strategy Matrix
AI/RAG Subsystem for Puducherry Police Hackathon 2026

This module extends the existing multiModel_rag system with police-specific
proposal analysis, precedent retrieval, and decision intelligence capabilities.
"""

__version__ = "1.0.0"
__author__ = "PRISM-PY Team"

from .schemas.proposal_dna import ProposalDNA, ProposalField
from .schemas.decision_brief import DecisionBrief, Precedent, ReviewSignal
from .llm.nvidia_provider import NVIDIAProvider
from .extractors.proposal_dna_extractor import ProposalDNAExtractor
from .generators.brief_generator import DecisionBriefGenerator

__all__ = [
    "ProposalDNA",
    "ProposalField",
    "DecisionBrief",
    "Precedent",
    "ReviewSignal",
    "NVIDIAProvider",
    "ProposalDNAExtractor",
    "DecisionBriefGenerator",
]
