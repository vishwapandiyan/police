"""
Proposal DNA Schema

Structured representation of a police proposal with extracted fields,
evidence, and confidence indicators.
"""

from typing import Optional, List, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class ExtractionStatus(str, Enum):
    """Status of field extraction"""
    EXTRACTED = "extracted"
    MISSING = "missing"
    UNCERTAIN = "uncertain"
    INVALID = "invalid"


class ProposalField(BaseModel):
    """A single extracted field with evidence and confidence"""
    value: Optional[Any] = None
    raw_value: Optional[str] = None
    status: ExtractionStatus = ExtractionStatus.MISSING
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    evidence: Optional[str] = None  # Source text excerpt
    source_reference: Optional[str] = None  # Page/chunk reference
    
    class Config:
        use_enum_values = True


class ProposalDNA(BaseModel):
    """
    Structured DNA representation of a police proposal.
    
    This captures the essential characteristics of a proposal in a
    normalized format for comparison, retrieval, and analysis.
    """
    
    # Identifiers
    proposal_id: Optional[str] = Field(None, description="System-assigned proposal ID")
    document_id: str = Field(..., description="Source document ID")
    extraction_timestamp: datetime = Field(default_factory=datetime.now)
    
    # Core Fields
    domain: ProposalField = Field(
        default_factory=ProposalField,
        description="Proposal domain (e.g., infrastructure, procurement, training)"
    )
    objective: ProposalField = Field(
        default_factory=ProposalField,
        description="Main objective or purpose of the proposal"
    )
    location: ProposalField = Field(
        default_factory=ProposalField,
        description="Primary location or area of implementation"
    )
    police_station: ProposalField = Field(
        default_factory=ProposalField,
        description="Police station or unit requesting the proposal"
    )
    jurisdiction: ProposalField = Field(
        default_factory=ProposalField,
        description="Administrative jurisdiction or region"
    )
    
    # Financial Fields
    budget: ProposalField = Field(
        default_factory=ProposalField,
        description="Total budget or estimated cost"
    )
    currency: ProposalField = Field(
        default_factory=ProposalField,
        description="Currency code (e.g., INR, USD)"
    )
    
    # Technical Fields
    technology: ProposalField = Field(
        default_factory=ProposalField,
        description="Technology, equipment, or systems involved"
    )
    scale: ProposalField = Field(
        default_factory=ProposalField,
        description="Scale, quantity, or scope of deployment"
    )
    
    # Timeline Fields
    timeline: ProposalField = Field(
        default_factory=ProposalField,
        description="Expected timeline or implementation period"
    )
    start_date: ProposalField = Field(
        default_factory=ProposalField,
        description="Proposed start date"
    )
    end_date: ProposalField = Field(
        default_factory=ProposalField,
        description="Proposed completion date"
    )
    
    # Procurement Fields
    procurement_type: ProposalField = Field(
        default_factory=ProposalField,
        description="Type of procurement (e.g., tender, quotation, emergency)"
    )
    
    # Outcomes and Dependencies
    expected_outcomes: ProposalField = Field(
        default_factory=ProposalField,
        description="Expected outcomes or benefits"
    )
    risks: ProposalField = Field(
        default_factory=ProposalField,
        description="Identified risks or concerns"
    )
    dependencies: ProposalField = Field(
        default_factory=ProposalField,
        description="Dependencies or prerequisites"
    )
    
    # Metadata
    extraction_method: str = Field(default="llm_extraction", description="Method used for extraction")
    overall_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Overall extraction confidence")
    missing_fields: List[str] = Field(default_factory=list, description="List of missing critical fields")
    uncertain_fields: List[str] = Field(default_factory=list, description="List of uncertain fields")
    
    @field_validator("extraction_timestamp", mode="before")
    @classmethod
    def parse_timestamp(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v
    
    def get_filled_fields(self) -> List[str]:
        """Get list of successfully extracted fields"""
        filled = []
        for field_name, field_obj in self.__dict__.items():
            if isinstance(field_obj, ProposalField) and field_obj.status == ExtractionStatus.EXTRACTED:
                filled.append(field_name)
        return filled
    
    def get_completeness_score(self) -> float:
        """Calculate proposal completeness (0.0 to 1.0)"""
        total_fields = sum(1 for v in self.__dict__.values() if isinstance(v, ProposalField))
        if total_fields == 0:
            return 0.0
        extracted_fields = len(self.get_filled_fields())
        return extracted_fields / total_fields
    
    def to_search_text(self) -> str:
        """
        Convert proposal DNA to searchable text representation.
        Useful for keyword matching and comparison.
        """
        parts = []
        
        if self.objective.value:
            parts.append(f"Objective: {self.objective.value}")
        if self.domain.value:
            parts.append(f"Domain: {self.domain.value}")
        if self.technology.value:
            parts.append(f"Technology: {self.technology.value}")
        if self.location.value:
            parts.append(f"Location: {self.location.value}")
        if self.police_station.value:
            parts.append(f"Station: {self.police_station.value}")
        if self.jurisdiction.value:
            parts.append(f"Jurisdiction: {self.jurisdiction.value}")
        
        return " | ".join(parts)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        use_enum_values = True
