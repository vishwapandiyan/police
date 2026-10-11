"""
Proposal DNA Extractor

Extracts structured Proposal DNA from proposal documents using LLM.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime

from ..schemas.proposal_dna import ProposalDNA, ProposalField, ExtractionStatus
from ..llm.base import BaseLLMProvider, LLMError

logger = logging.getLogger(__name__)


class ProposalDNAExtractor:
    """
    Extracts Proposal DNA from proposal documents.
    
    Uses LLM to identify and extract key proposal characteristics
    into a structured format.
    """
    
    def __init__(self, llm_provider: BaseLLMProvider):
        """
        Initialize extractor.
        
        Args:
            llm_provider: LLM provider instance (NVIDIA or mock)
        """
        self.llm = llm_provider
    
    def extract_from_document(
        self,
        document_text: str,
        document_id: str,
        proposal_id: Optional[str] = None
    ) -> ProposalDNA:
        """
        Extract Proposal DNA from document text.
        
        Args:
            document_text: Full document text
            document_id: Document identifier
            proposal_id: Optional proposal identifier
            
        Returns:
            ProposalDNA object with extracted fields
        """
        logger.info(f"Extracting Proposal DNA from document: {document_id}")
        
        try:
            # Create extraction prompt
            prompt = self._create_extraction_prompt(document_text)
            
            # Call LLM for extraction
            extracted_data = self.llm.generate_json(
                prompt,
                temperature=0.1,
                max_tokens=2048
            )
            
            # Convert to ProposalDNA
            proposal_dna = self._parse_extraction_result(
                extracted_data,
                document_id,
                proposal_id
            )
            
            logger.info(
                f"Extracted Proposal DNA with {len(proposal_dna.get_filled_fields())} "
                f"fields, completeness: {proposal_dna.get_completeness_score():.2f}"
            )
            
            return proposal_dna
            
        except LLMError as e:
            logger.error(f"LLM error during extraction: {e}")
            # Return minimal DNA with error status
            return self._create_empty_dna(document_id, proposal_id, error=str(e))
        except Exception as e:
            logger.error(f"Unexpected error during extraction: {e}")
            return self._create_empty_dna(document_id, proposal_id, error=str(e))
    
    def _create_extraction_prompt(self, document_text: str) -> str:
        """Create LLM prompt for Proposal DNA extraction"""
        # Truncate document if too long
        max_length = 8000
        if len(document_text) > max_length:
            document_text = document_text[:max_length] + "\n...[truncated]"
        
        prompt = f"""You are analyzing a police proposal document. Extract the following information and return it as JSON.

Document:
{document_text}

Extract these fields (use null for missing/unavailable information):
{{
    "domain": "proposal domain (infrastructure/procurement/technology/training/equipment/etc.)",
    "objective": "main objective or purpose",
    "location": "primary location or area",
    "police_station": "police station or unit",
    "jurisdiction": "administrative jurisdiction or region",
    "budget": "total budget (numeric value only, no currency symbols)",
    "currency": "currency code (e.g., INR, USD)",
    "technology": "technology, equipment, or systems involved",
    "scale": "scale, quantity, or scope",
    "timeline": "expected timeline or period",
    "start_date": "proposed start date (YYYY-MM-DD format if available)",
    "end_date": "proposed end date (YYYY-MM-DD format if available)",
    "procurement_type": "procurement type (tender/quotation/direct_purchase/etc.)",
    "expected_outcomes": "expected outcomes or benefits",
    "risks": "identified risks or concerns",
    "dependencies": "dependencies or prerequisites"
}}

IMPORTANT:
- Return ONLY valid JSON, no explanations
- Use null for unavailable fields
- For budget, extract only the number (e.g., 500000 not "INR 5,00,000")
- Be precise and factual, extract only what's explicitly stated
- Do not invent or infer information not present in the document"""
        
        return prompt
    
    def _parse_extraction_result(
        self,
        extracted_data: Dict[str, Any],
        document_id: str,
        proposal_id: Optional[str]
    ) -> ProposalDNA:
        """Parse LLM extraction result into ProposalDNA"""
        
        dna = ProposalDNA(
            document_id=document_id,
            proposal_id=proposal_id,
            extraction_timestamp=datetime.now(),
            extraction_method="llm_extraction"
        )
        
        # Map extracted fields
        field_mapping = {
            "domain": "domain",
            "objective": "objective",
            "location": "location",
            "police_station": "police_station",
            "jurisdiction": "jurisdiction",
            "budget": "budget",
            "currency": "currency",
            "technology": "technology",
            "scale": "scale",
            "timeline": "timeline",
            "start_date": "start_date",
            "end_date": "end_date",
            "procurement_type": "procurement_type",
            "expected_outcomes": "expected_outcomes",
            "risks": "risks",
            "dependencies": "dependencies"
        }
        
        missing_fields = []
        uncertain_fields = []
        
        for llm_field, dna_field in field_mapping.items():
            value = extracted_data.get(llm_field)
            
            if value is None or value == "" or value == "null":
                # Missing field
                setattr(dna, dna_field, ProposalField(
                    value=None,
                    status=ExtractionStatus.MISSING
                ))
                missing_fields.append(dna_field)
            else:
                # Extracted field
                setattr(dna, dna_field, ProposalField(
                    value=value,
                    raw_value=str(value),
                    status=ExtractionStatus.EXTRACTED,
                    confidence=0.85  # Default confidence
                ))
        
        dna.missing_fields = missing_fields
        dna.uncertain_fields = uncertain_fields
        dna.overall_confidence = (
            len(dna.get_filled_fields()) / len(field_mapping)
        ) if field_mapping else 0.0
        
        return dna
    
    def _create_empty_dna(
        self,
        document_id: str,
        proposal_id: Optional[str],
        error: Optional[str] = None
    ) -> ProposalDNA:
        """Create empty Proposal DNA for error cases"""
        dna = ProposalDNA(
            document_id=document_id,
            proposal_id=proposal_id,
            extraction_method="llm_extraction_failed"
        )
        
        if error:
            logger.warning(f"Created empty DNA due to error: {error}")
        
        return dna
