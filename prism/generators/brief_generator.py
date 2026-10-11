"""
Decision Brief Generator

Generates comprehensive Decision Intelligence Briefs from proposal analysis.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ..schemas.proposal_dna import ProposalDNA
from ..schemas.decision_brief import (
    DecisionBrief,
    Precedent,
    ReviewSignal,
    SignalType,
    SignalSeverity,
    CostAnalysis
)
from ..llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class DecisionBriefGenerator:
    """
    Generates Decision Intelligence Briefs.
    
    Combines proposal analysis, precedents, cost analysis, and policy references
    into a comprehensive brief for human reviewers.
    """
    
    def __init__(self, llm_provider: BaseLLMProvider):
        """
        Initialize generator.
        
        Args:
            llm_provider: LLM provider instance
        """
        self.llm = llm_provider
    
    def generate_brief(
        self,
        proposal_dna: ProposalDNA,
        precedents: Optional[List[Dict[str, Any]]] = None,
        cost_analysis: Optional[Dict[str, Any]] = None,
        policy_references: Optional[List[Dict[str, Any]]] = None,
        check_overlaps: bool = True
    ) -> DecisionBrief:
        """
        Generate a comprehensive Decision Intelligence Brief.
        
        Args:
            proposal_dna: Extracted Proposal DNA
            precedents: List of retrieved precedents
            cost_analysis: Optional cost analysis data
            policy_references: Optional policy/SOP references
            
        Returns:
            DecisionBrief object
        """
        logger.info(f"Generating Decision Brief for proposal: {proposal_dna.proposal_id}")
        
        start_time = datetime.now()
        
        # Generate brief ID
        brief_id = self._generate_brief_id(proposal_dna)
        
        # Create proposal summary
        proposal_summary = self._generate_proposal_summary(proposal_dna)
        
        # Process precedents
        processed_precedents = self._process_precedents(precedents or [])
        
        # Generate cost analysis if data provided
        cost_analysis_obj = self._generate_cost_analysis(
            proposal_dna,
            cost_analysis
        ) if cost_analysis else None
        
        # Identify review signals (now includes overlap detection)
        review_signals = self._identify_review_signals(
            proposal_dna,
            cost_analysis_obj,
            processed_precedents,
            check_overlaps
        )
        
        # Identify missing information
        missing_info = self._identify_missing_information(proposal_dna)
        
        # Generate questions for reviewer
        questions = self._generate_reviewer_questions(
            proposal_dna,
            review_signals,
            missing_info
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Create Decision Brief
        brief = DecisionBrief(
            brief_id=brief_id,
            proposal_id=proposal_dna.proposal_id,
            generation_timestamp=datetime.now(),
            proposal_summary=proposal_summary,
            proposal_dna=proposal_dna,
            top_precedents=processed_precedents,
            cost_analysis=cost_analysis_obj,
            review_signals=review_signals,
            missing_information=missing_info,
            questions_for_reviewer=questions,
            processing_time_seconds=processing_time,
            llm_model_used=self.llm.get_model_name(),
            overall_confidence=proposal_dna.overall_confidence
        )
        
        logger.info(
            f"Generated Decision Brief with {len(processed_precedents)} precedents, "
            f"{len(review_signals)} signals ({len(brief.get_high_priority_signals())} high priority)"
        )
        
        return brief
    
    def _generate_brief_id(self, proposal_dna: ProposalDNA) -> str:
        """Generate unique brief ID"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"brief-{timestamp}-{unique_id}"
    
    def _generate_proposal_summary(self, proposal_dna: ProposalDNA) -> str:
        """Generate concise proposal summary"""
        parts = []
        
        if proposal_dna.objective.value:
            parts.append(f"Objective: {proposal_dna.objective.value}")
        
        if proposal_dna.domain.value:
            parts.append(f"Domain: {proposal_dna.domain.value}")
        
        if proposal_dna.location.value:
            parts.append(f"Location: {proposal_dna.location.value}")
        
        if proposal_dna.budget.value:
            currency = proposal_dna.currency.value or "INR"
            parts.append(f"Budget: {currency} {proposal_dna.budget.value:,.0f}")
        
        if parts:
            return ". ".join(parts) + "."
        else:
            return "Proposal summary unavailable due to incomplete extraction."
    
    def _process_precedents(self, precedents: List[Dict[str, Any]]) -> List[Precedent]:
        """Process precedent data into Precedent objects"""
        processed = []
        
        for p in precedents[:10]:  # Limit to top 10
            try:
                precedent = Precedent(
                    document_id=p.get("document_id", "unknown"),
                    document_title=p.get("title", "Untitled"),
                    similarity_score=p.get("similarity_score", 0.0),
                    match_reason=p.get("match_reason", "Similar proposal characteristics"),
                    key_similarities=p.get("key_similarities", []),
                    jurisdiction=p.get("jurisdiction"),
                    decision_status=p.get("decision_status"),
                    budget=p.get("budget"),
                    currency=p.get("currency")
                )
                processed.append(precedent)
            except Exception as e:
                logger.warning(f"Failed to process precedent: {e}")
        
        return processed
    
    def _generate_cost_analysis(
        self,
        proposal_dna: ProposalDNA,
        cost_data: Dict[str, Any]
    ) -> Optional[CostAnalysis]:
        """Generate cost analysis from provided data"""
        try:
            proposed_cost = proposal_dna.budget.value
            if not proposed_cost or not isinstance(proposed_cost, (int, float)):
                return None
            
            analysis = CostAnalysis(
                proposed_cost=float(proposed_cost),
                currency=proposal_dna.currency.value or "INR",
                comparable_precedents_count=cost_data.get("comparable_count", 0),
                median_historical_cost=cost_data.get("median_cost"),
                min_historical_cost=cost_data.get("min_cost"),
                max_historical_cost=cost_data.get("max_cost")
            )
            
            # Calculate variance
            if analysis.median_historical_cost:
                variance = proposed_cost - analysis.median_historical_cost
                variance_pct = (variance / analysis.median_historical_cost) * 100
                
                analysis.variance_amount = variance
                analysis.variance_percentage = variance_pct
                analysis.is_significant_variance = abs(variance_pct) > 20  # 20% threshold
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error generating cost analysis: {e}")
            return None
    
    def _identify_review_signals(
        self,
        proposal_dna: ProposalDNA,
        cost_analysis: Optional[CostAnalysis],
        precedents: List[Precedent],
        check_overlaps: bool = True
    ) -> List[ReviewSignal]:
        """Identify items requiring human review"""
        signals = []
        
        # Cost variance signal
        if cost_analysis and cost_analysis.is_significant_variance:
            signals.append(ReviewSignal(
                signal_type=SignalType.COST_VARIANCE,
                severity=SignalSeverity.HIGH if abs(cost_analysis.variance_percentage) > 40 else SignalSeverity.MEDIUM,
                title="Significant cost variance detected",
                description=f"Proposed cost is {cost_analysis.variance_percentage:.1f}% {'above' if cost_analysis.variance_percentage > 0 else 'below'} the median of comparable proposals.",
                evidence=[f"Proposed: {cost_analysis.currency} {cost_analysis.proposed_cost:,.0f}", f"Median: {cost_analysis.currency} {cost_analysis.median_historical_cost:,.0f}"],
                recommended_action="Review cost justification and compare with current market rates."
            ))
        
        # Missing information signal
        if len(proposal_dna.missing_fields) > 5:
            signals.append(ReviewSignal(
                signal_type=SignalType.MISSING_INFORMATION,
                severity=SignalSeverity.MEDIUM,
                title="Substantial information missing",
                description=f"{len(proposal_dna.missing_fields)} critical fields are missing from the proposal.",
                evidence=proposal_dna.missing_fields[:5],
                recommended_action="Request additional information from the proposing unit."
            ))
        
        # Few precedents signal
        if len(precedents) < 2:
            signals.append(ReviewSignal(
                signal_type=SignalType.INFO,
                severity=SignalSeverity.LOW,
                title="Limited historical precedents",
                description="Few similar historical proposals found for comparison.",
                recommended_action="Consider consulting with other departments or regions for similar experiences."
            ))
        
        # Check for overlaps if requested
        if check_overlaps and len(precedents) > 0:
            try:
                from ..analyzers import OverlapDetector
                
                # Convert proposal DNA to comparable format
                current_proposal = {
                    "objective": proposal_dna.objective.value,
                    "location": proposal_dna.location.value,
                    "police_station": proposal_dna.police_station.value,
                    "jurisdiction": proposal_dna.jurisdiction.value,
                    "technology": proposal_dna.technology.value,
                    "start_date": proposal_dna.start_date.value,
                    "end_date": proposal_dna.end_date.value,
                    "timeline": proposal_dna.timeline.value
                }
                
                # Convert precedents to comparable format
                historical = []
                for prec in precedents:
                    historical.append({
                        "proposal_id": prec.document_id,
                        "document_id": prec.document_id,
                        "objective": prec.document_title,
                        "location": prec.jurisdiction,
                        "police_station": prec.police_station
                    })
                
                # Detect overlaps
                detector = OverlapDetector(overlap_threshold=0.7)
                overlaps = detector.detect_overlaps(current_proposal, historical, max_overlaps=3)
                
                for overlap in overlaps:
                    severity = (
                        SignalSeverity.HIGH if overlap["overlap_type"] == "potential_duplicate"
                        else SignalSeverity.MEDIUM
                    )
                    
                    signals.append(ReviewSignal(
                        signal_type=SignalType.POTENTIAL_DUPLICATE,
                        severity=severity,
                        title=f"Potential overlap detected with {overlap['proposal_id']}",
                        description=overlap["explanation"],
                        evidence=[f"Overlap score: {overlap['overlap_score']:.2f}"],
                        recommended_action=overlap["recommendation"]
                    ))
                    
            except Exception as e:
                logger.warning(f"Could not check overlaps: {e}")
        
        return signals
    
    def _identify_missing_information(self, proposal_dna: ProposalDNA) -> List[str]:
        """Identify missing critical information"""
        critical_fields = ["objective", "budget", "timeline", "police_station", "jurisdiction"]
        
        missing = []
        for field in critical_fields:
            field_obj = getattr(proposal_dna, field, None)
            if field_obj and not field_obj.value:
                # Format field name for display
                display_name = field.replace("_", " ").title()
                missing.append(display_name)
        
        return missing
    
    def _generate_reviewer_questions(
        self,
        proposal_dna: ProposalDNA,
        signals: List[ReviewSignal],
        missing_info: List[str]
    ) -> List[str]:
        """Generate suggested questions for the reviewing officer"""
        questions = []
        
        # Budget-related questions
        if proposal_dna.budget.value:
            questions.append("What is the detailed breakdown of the proposed budget?")
            questions.append("Are there any alternative, more cost-effective solutions available?")
        
        # Timeline questions
        if proposal_dna.timeline.value:
            questions.append("What are the key milestones and dependencies in the proposed timeline?")
        
        # Missing info questions
        for info in missing_info[:3]:
            questions.append(f"Can the proposing unit provide information about: {info}?")
        
        # Signal-based questions
        if any(s.severity == SignalSeverity.HIGH for s in signals):
            questions.append("How do the high-priority review signals impact the feasibility of this proposal?")
        
        return questions
