"""
Decision Intelligence Brief Schema

Structured output for proposal analysis including precedents,
policy references, cost analysis, and review signals.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from .proposal_dna import ProposalDNA


class SignalType(str, Enum):
    """Type of review signal"""
    COST_VARIANCE = "cost_variance"
    POTENTIAL_DUPLICATE = "potential_duplicate"
    MISSING_INFORMATION = "missing_information"
    POLICY_CONCERN = "policy_concern"
    TIMELINE_CONCERN = "timeline_concern"
    INFO = "info"


class SignalSeverity(str, Enum):
    """Severity level of review signal"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ReviewSignal(BaseModel):
    """A review signal flagging something for human attention"""
    signal_type: SignalType
    severity: SignalSeverity
    title: str = Field(..., description="Brief title of the signal")
    description: str = Field(..., description="Detailed description")
    evidence: Optional[List[str]] = Field(default_factory=list, description="Supporting evidence")
    recommended_action: Optional[str] = None
    
    class Config:
        use_enum_values = True


class PolicyReference(BaseModel):
    """Reference to a policy, SOP, or Government Order"""
    title: str = Field(..., description="Policy title or identifier")
    reference_id: Optional[str] = None
    document_id: Optional[str] = None
    relevant_section: Optional[str] = None
    excerpt: Optional[str] = None
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class Precedent(BaseModel):
    """A historical precedent matching the current proposal"""
    document_id: str
    document_title: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    
    # Precedent details
    jurisdiction: Optional[str] = None
    police_station: Optional[str] = None
    date: Optional[datetime] = None
    
    # Decision information
    decision_status: Optional[str] = None  # approved, rejected, modified, pending
    implementation_status: Optional[str] = None  # completed, in_progress, delayed, unknown
    outcomes: Optional[str] = None
    
    # Financial information
    budget: Optional[float] = None
    currency: Optional[str] = None
    actual_cost: Optional[float] = None
    
    # Match explanation
    match_reason: str = Field(..., description="Why this precedent is relevant")
    key_similarities: List[str] = Field(default_factory=list)
    key_differences: List[str] = Field(default_factory=list)
    
    # Source information
    excerpt: Optional[str] = None
    source_reference: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CostAnalysis(BaseModel):
    """Cost comparison and variance analysis"""
    proposed_cost: Optional[float] = None
    currency: str = "INR"
    
    # Comparison data
    comparable_precedents_count: int = 0
    median_historical_cost: Optional[float] = None
    min_historical_cost: Optional[float] = None
    max_historical_cost: Optional[float] = None
    
    # Variance
    variance_percentage: Optional[float] = None
    variance_amount: Optional[float] = None
    is_significant_variance: bool = False
    
    # Context
    comparison_notes: Optional[str] = None
    limitations: List[str] = Field(
        default_factory=list,
        description="Limitations of the cost comparison"
    )


class DecisionBrief(BaseModel):
    """
    Complete Decision Intelligence Brief for a proposal.
    
    This is the primary output of the PRISM system, providing
    evidence-grounded analysis to support human decision-making.
    """
    
    # Identifiers
    brief_id: str = Field(..., description="Unique brief identifier")
    proposal_id: Optional[str] = None
    generation_timestamp: datetime = Field(default_factory=datetime.now)
    
    # Proposal Analysis
    proposal_summary: str = Field(..., description="Executive summary of the proposal")
    proposal_dna: ProposalDNA = Field(..., description="Extracted Proposal DNA")
    
    # Precedent Analysis
    top_precedents: List[Precedent] = Field(
        default_factory=list,
        description="Most relevant historical precedents"
    )
    precedent_summary: Optional[str] = None
    
    # Policy and Compliance
    relevant_policies: List[PolicyReference] = Field(
        default_factory=list,
        description="Relevant policies, SOPs, and Government Orders"
    )
    compliance_notes: Optional[str] = None
    
    # Cost Analysis
    cost_analysis: Optional[CostAnalysis] = None
    
    # Review Signals
    review_signals: List[ReviewSignal] = Field(
        default_factory=list,
        description="Items flagged for human review"
    )
    
    # Missing Information
    missing_information: List[str] = Field(
        default_factory=list,
        description="Critical information not available in the proposal"
    )
    
    # Questions for Review
    questions_for_reviewer: List[str] = Field(
        default_factory=list,
        description="Suggested questions for the reviewing officer"
    )
    
    # Evidence and Citations
    evidence_sources: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="All source documents and chunks used"
    )
    
    # Limitations and Confidence
    limitations: List[str] = Field(
        default_factory=list,
        description="Known limitations of this analysis"
    )
    overall_confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Overall confidence in the analysis"
    )
    
    # Processing Metadata
    processing_time_seconds: Optional[float] = None
    retrieval_strategy: Optional[str] = None
    llm_model_used: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def get_high_priority_signals(self) -> List[ReviewSignal]:
        """Get high-severity review signals"""
        return [s for s in self.review_signals if s.severity == SignalSeverity.HIGH]
    
    def has_significant_concerns(self) -> bool:
        """Check if there are any high-severity signals"""
        return len(self.get_high_priority_signals()) > 0
    
    def to_executive_summary(self) -> str:
        """Generate a concise executive summary"""
        parts = [
            f"# Decision Intelligence Brief",
            f"Generated: {self.generation_timestamp.strftime('%Y-%m-%d %H:%M')}",
            "",
            "## Proposal Summary",
            self.proposal_summary,
            "",
            f"## Precedent Analysis",
            f"Found {len(self.top_precedents)} relevant precedents",
            "",
            f"## Review Signals",
            f"Total: {len(self.review_signals)} signals ({len(self.get_high_priority_signals())} high priority)",
        ]
        
        if self.missing_information:
            parts.extend([
                "",
                "## Missing Information",
                "\n".join(f"- {item}" for item in self.missing_information)
            ])
        
        return "\n".join(parts)
