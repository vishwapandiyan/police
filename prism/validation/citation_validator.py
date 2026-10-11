"""
Citation Validator

Validates that all citations in LLM-generated responses point to
actual retrieved sources. Prevents hallucinated citations.
"""

import logging
import re
from typing import List, Dict, Any, Optional, Set, Tuple

logger = logging.getLogger(__name__)


class CitationError(Exception):
    """Exception raised when citation validation fails"""
    pass


class CitationValidator:
    """
    Validates citations in LLM-generated content.
    
    Ensures:
    1. Every citation ID exists in the retrieved source registry
    2. Citation format is consistent
    3. Source excerpts match the cited content
    4. No hallucinated citations are present
    """
    
    def __init__(
        self,
        strict_mode: bool = True,
        allow_partial_matches: bool = False
    ):
        """
        Initialize validator.
        
        Args:
            strict_mode: If True, raises errors on invalid citations
            allow_partial_matches: If True, allows partial excerpt matches
        """
        self.strict_mode = strict_mode
        self.allow_partial_matches = allow_partial_matches
    
    def build_source_registry(
        self,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Build a registry of valid source IDs from retrieved chunks.
        
        Args:
            retrieved_chunks: List of retrieved chunk dictionaries
        
        Returns:
            Dictionary mapping source IDs to source metadata
        """
        registry = {}
        
        for i, chunk in enumerate(retrieved_chunks):
            # Generate source ID if not present
            source_id = chunk.get("chunk_id") or chunk.get("id") or f"source-{i}"
            
            registry[source_id] = {
                "source_id": source_id,
                "document_id": chunk.get("document_id", "unknown"),
                "content": chunk.get("content") or chunk.get("text", ""),
                "page_number": chunk.get("page_number"),
                "chunk_index": i,
                "metadata": chunk.get("metadata", {})
            }
        
        logger.info(f"Built source registry with {len(registry)} valid sources")
        return registry
    
    def extract_citations(
        self,
        text: str
    ) -> List[Tuple[str, str]]:
        """
        Extract citations from text.
        
        Supports formats:
        - [1], [2], [3]
        - [source-123]
        - [doc-001-chunk-05]
        
        Args:
            text: Text containing citations
        
        Returns:
            List of (citation_id, citation_format) tuples
        """
        citations = []
        
        # Pattern 1: [numeric] or [source-id]
        pattern1 = r'\[([^\]]+)\]'
        matches = re.finditer(pattern1, text)
        
        for match in matches:
            citation_id = match.group(1)
            # Filter out common non-citation brackets
            if not self._is_likely_citation(citation_id):
                continue
            citations.append((citation_id, "bracket"))
        
        # Pattern 2: (Source: ID)
        pattern2 = r'\(Source:\s*([^\)]+)\)'
        matches = re.finditer(pattern2, text, re.IGNORECASE)
        for match in matches:
            citation_id = match.group(1).strip()
            citations.append((citation_id, "parenthetical"))
        
        logger.debug(f"Extracted {len(citations)} citations from text")
        return citations
    
    def validate_citations(
        self,
        text: str,
        source_registry: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate all citations in text against source registry.
        
        Args:
            text: Text containing citations
            source_registry: Registry of valid sources
        
        Returns:
            Validation result dictionary
        """
        citations = self.extract_citations(text)
        
        if not citations:
            return {
                "valid": True,
                "total_citations": 0,
                "valid_citations": 0,
                "invalid_citations": [],
                "warnings": []
            }
        
        valid_citations = []
        invalid_citations = []
        warnings = []
        
        for citation_id, citation_format in citations:
            if citation_id in source_registry:
                valid_citations.append(citation_id)
            else:
                # Try to find partial matches
                matched = False
                if self.allow_partial_matches:
                    for source_id in source_registry.keys():
                        if citation_id in source_id or source_id in citation_id:
                            valid_citations.append(citation_id)
                            warnings.append(
                                f"Partial match: '{citation_id}' matched to '{source_id}'"
                            )
                            matched = True
                            break
                
                if not matched:
                    invalid_citations.append({
                        "citation_id": citation_id,
                        "format": citation_format,
                        "error": "Citation ID not found in source registry"
                    })
        
        result = {
            "valid": len(invalid_citations) == 0,
            "total_citations": len(citations),
            "valid_citations": len(valid_citations),
            "invalid_citations": invalid_citations,
            "warnings": warnings,
            "citation_coverage": len(valid_citations) / len(citations) if citations else 0.0
        }
        
        if invalid_citations:
            logger.warning(
                f"Found {len(invalid_citations)} invalid citations out of {len(citations)}"
            )
            if self.strict_mode:
                error_msg = f"Invalid citations detected: {[c['citation_id'] for c in invalid_citations]}"
                raise CitationError(error_msg)
        
        return result
    
    def validate_excerpt_match(
        self,
        excerpt: str,
        source_content: str,
        min_overlap: float = 0.7
    ) -> bool:
        """
        Validate that an excerpt actually appears in the source.
        
        Args:
            excerpt: Claimed excerpt from source
            source_content: Full source content
            min_overlap: Minimum overlap ratio required
        
        Returns:
            True if excerpt matches, False otherwise
        """
        if not excerpt or not source_content:
            return False
        
        excerpt_clean = excerpt.strip().lower()
        source_clean = source_content.lower()
        
        # Check exact match
        if excerpt_clean in source_clean:
            return True
        
        # Check approximate match if allowed
        if self.allow_partial_matches:
            # Split into words and check overlap
            excerpt_words = set(excerpt_clean.split())
            source_words = set(source_clean.split())
            
            if not excerpt_words:
                return False
            
            overlap = len(excerpt_words & source_words) / len(excerpt_words)
            return overlap >= min_overlap
        
        return False
    
    def validate_claim_support(
        self,
        claim: str,
        cited_source_ids: List[str],
        source_registry: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate that cited sources actually support the claim.
        
        Args:
            claim: The claim being made
            cited_source_ids: List of source IDs cited for this claim
            source_registry: Registry of valid sources
        
        Returns:
            Validation result dictionary
        """
        if not cited_source_ids:
            return {
                "supported": False,
                "reason": "No sources cited for claim",
                "supporting_sources": []
            }
        
        supporting_sources = []
        
        for source_id in cited_source_ids:
            if source_id not in source_registry:
                continue
            
            source = source_registry[source_id]
            source_content = source.get("content", "")
            
            # Simple keyword overlap check
            claim_keywords = set(claim.lower().split())
            source_keywords = set(source_content.lower().split())
            
            overlap = len(claim_keywords & source_keywords)
            relevance = overlap / len(claim_keywords) if claim_keywords else 0
            
            if relevance > 0.3:  # At least 30% keyword overlap
                supporting_sources.append({
                    "source_id": source_id,
                    "relevance": relevance,
                    "document_id": source.get("document_id")
                })
        
        return {
            "supported": len(supporting_sources) > 0,
            "reason": f"{len(supporting_sources)} sources provide support" if supporting_sources else "No supporting evidence found",
            "supporting_sources": supporting_sources
        }
    
    def remove_invalid_citations(
        self,
        text: str,
        source_registry: Dict[str, Dict[str, Any]]
    ) -> Tuple[str, List[str]]:
        """
        Remove invalid citations from text.
        
        Args:
            text: Text with citations
            source_registry: Registry of valid sources
        
        Returns:
            (cleaned_text, removed_citations)
        """
        citations = self.extract_citations(text)
        removed = []
        cleaned_text = text
        
        for citation_id, citation_format in citations:
            if citation_id not in source_registry:
                # Remove this citation
                if citation_format == "bracket":
                    cleaned_text = cleaned_text.replace(f"[{citation_id}]", "")
                elif citation_format == "parenthetical":
                    cleaned_text = re.sub(
                        rf'\(Source:\s*{re.escape(citation_id)}\)',
                        '',
                        cleaned_text,
                        flags=re.IGNORECASE
                    )
                removed.append(citation_id)
        
        # Clean up extra whitespace
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        if removed:
            logger.info(f"Removed {len(removed)} invalid citations")
        
        return cleaned_text, removed
    
    def _is_likely_citation(self, text: str) -> bool:
        """Check if bracketed text is likely a citation"""
        # Filter out common non-citations
        non_citations = [
            'image', 'figure', 'table', 'note', 'see',
            'truncated', 'continued', 'example'
        ]
        
        text_lower = text.lower()
        
        # If it's purely numeric, likely a citation
        if text.isdigit():
            return True
        
        # If it matches source/doc/chunk patterns
        if any(pattern in text_lower for pattern in ['source', 'doc', 'chunk', 'ref']):
            return True
        
        # If it's in the non-citation list, not a citation
        if any(nc in text_lower for nc in non_citations):
            return False
        
        # If it's a single word and short, might not be citation
        if len(text.split()) == 1 and len(text) > 20:
            return False
        
        return True
    
    def generate_citation_report(
        self,
        validation_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate summary report for multiple validation results.
        
        Args:
            validation_results: List of validation result dictionaries
        
        Returns:
            Summary report
        """
        if not validation_results:
            return {
                "total_validations": 0,
                "all_valid": True,
                "total_citations": 0,
                "total_invalid": 0
            }
        
        total_citations = sum(r["total_citations"] for r in validation_results)
        total_invalid = sum(len(r["invalid_citations"]) for r in validation_results)
        all_valid = all(r["valid"] for r in validation_results)
        
        report = {
            "total_validations": len(validation_results),
            "all_valid": all_valid,
            "total_citations": total_citations,
            "total_invalid": total_invalid,
            "validation_rate": 1.0 - (total_invalid / total_citations) if total_citations > 0 else 1.0,
            "invalid_citation_details": [
                inv for r in validation_results for inv in r["invalid_citations"]
            ]
        }
        
        return report
