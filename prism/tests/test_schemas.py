"""
Tests for PRISM schemas (Proposal DNA, Decision Brief, etc.)
"""

import pytest
from datetime import datetime

from prism.schemas.proposal_dna import ProposalDNA, ProposalField, ExtractionStatus
from prism.schemas.decision_brief import (
    DecisionBrief,
    Precedent,
    ReviewSignal,
    SignalType,
    SignalSeverity
)
from prism.schemas.police_domain import ProposalDomain, ProcurementType


class TestProposalDNA:
    """Test Proposal DNA schema"""
    
    def test_create_empty_proposal_dna(self):
        """Test creating an empty Proposal DNA"""
        dna = ProposalDNA(document_id="test-doc-001")
        
        assert dna.document_id == "test-doc-001"
        assert dna.proposal_id is None
        assert isinstance(dna.extraction_timestamp, datetime)
    
    def test_proposal_field_with_value(self):
        """Test ProposalField with extracted value"""
        field = ProposalField(
            value="technology",
            raw_value="Technology Infrastructure",
            status=ExtractionStatus.EXTRACTED,
            confidence=0.95,
            evidence="The proposal requests technology infrastructure..."
        )
        
        assert field.value == "technology"
        assert field.status == ExtractionStatus.EXTRACTED
        assert field.confidence == 0.95
    
    def test_get_filled_fields(self):
        """Test counting filled fields"""
        dna = ProposalDNA(document_id="test-doc-001")
        
        # Set some fields
        dna.domain = ProposalField(value="technology", status=ExtractionStatus.EXTRACTED)
        dna.objective = ProposalField(value="Deploy CCTV", status=ExtractionStatus.EXTRACTED)
        dna.budget = ProposalField(value=500000, status=ExtractionStatus.EXTRACTED)
        
        filled = dna.get_filled_fields()
        assert len(filled) == 3
        assert "domain" in filled
        assert "objective" in filled
        assert "budget" in filled
    
    def test_completeness_score(self):
        """Test completeness score calculation"""
        dna = ProposalDNA(document_id="test-doc-001")
        
        # Initially 0% complete (no extracted fields)
        assert dna.get_completeness_score() == 0.0
        
        # Add one field
        dna.domain = ProposalField(value="technology", status=ExtractionStatus.EXTRACTED)
        
        completeness = dna.get_completeness_score()
        assert 0.0 < completeness <= 1.0
    
    def test_to_search_text(self):
        """Test converting Proposal DNA to searchable text"""
        dna = ProposalDNA(document_id="test-doc-001")
        dna.objective = ProposalField(value="Deploy CCTV system")
        dna.domain = ProposalField(value="technology")
        dna.location = ProposalField(value="Central Station")
        
        search_text = dna.to_search_text()
        
        assert "Deploy CCTV system" in search_text
        assert "technology" in search_text
        assert "Central Station" in search_text


class TestDecisionBrief:
    """Test Decision Brief schema"""
    
    def test_create_decision_brief(self):
        """Test creating a Decision Brief"""
        dna = ProposalDNA(document_id="test-doc-001")
        
        brief = DecisionBrief(
            brief_id="brief-001",
            proposal_summary="Proposal for CCTV deployment",
            proposal_dna=dna
        )
        
        assert brief.brief_id == "brief-001"
        assert brief.proposal_summary == "Proposal for CCTV deployment"
        assert isinstance(brief.generation_timestamp, datetime)
    
    def test_add_precedent(self):
        """Test adding precedents to brief"""
        dna = ProposalDNA(document_id="test-doc-001")
        brief = DecisionBrief(
            brief_id="brief-001",
            proposal_summary="Test",
            proposal_dna=dna
        )
        
        precedent = Precedent(
            document_id="precedent-001",
            document_title="Previous CCTV Proposal",
            similarity_score=0.85,
            match_reason="Similar technology and scope"
        )
        
        brief.top_precedents.append(precedent)
        assert len(brief.top_precedents) == 1
        assert brief.top_precedents[0].similarity_score == 0.85
    
    def test_review_signals(self):
        """Test adding review signals"""
        dna = ProposalDNA(document_id="test-doc-001")
        brief = DecisionBrief(
            brief_id="brief-001",
            proposal_summary="Test",
            proposal_dna=dna
        )
        
        signal = ReviewSignal(
            signal_type=SignalType.COST_VARIANCE,
            severity=SignalSeverity.HIGH,
            title="Significant cost variance detected",
            description="Proposed cost is 40% higher than median"
        )
        
        brief.review_signals.append(signal)
        assert len(brief.review_signals) == 1
        assert brief.has_significant_concerns()
    
    def test_get_high_priority_signals(self):
        """Test filtering high-priority signals"""
        dna = ProposalDNA(document_id="test-doc-001")
        brief = DecisionBrief(
            brief_id="brief-001",
            proposal_summary="Test",
            proposal_dna=dna
        )
        
        # Add signals of different severities
        brief.review_signals.append(
            ReviewSignal(
                signal_type=SignalType.INFO,
                severity=SignalSeverity.LOW,
                title="Low priority",
                description="Info only"
            )
        )
        
        brief.review_signals.append(
            ReviewSignal(
                signal_type=SignalType.COST_VARIANCE,
                severity=SignalSeverity.HIGH,
                title="High priority",
                description="Needs review"
            )
        )
        
        high_priority = brief.get_high_priority_signals()
        assert len(high_priority) == 1
        assert high_priority[0].severity == SignalSeverity.HIGH
    
    def test_executive_summary(self):
        """Test generating executive summary"""
        dna = ProposalDNA(document_id="test-doc-001")
        brief = DecisionBrief(
            brief_id="brief-001",
            proposal_summary="Test proposal for CCTV deployment",
            proposal_dna=dna
        )
        
        brief.missing_information.append("Budget details")
        brief.missing_information.append("Timeline")
        
        summary = brief.to_executive_summary()
        
        assert "Decision Intelligence Brief" in summary
        assert "Proposal Summary" in summary
        assert "Missing Information" in summary
        assert "Budget details" in summary


class TestPoliceDomain:
    """Test police domain enums"""
    
    def test_proposal_domains(self):
        """Test proposal domain enum"""
        assert ProposalDomain.INFRASTRUCTURE == "infrastructure"
        assert ProposalDomain.TECHNOLOGY == "technology"
        assert ProposalDomain.PROCUREMENT == "procurement"
    
    def test_procurement_types(self):
        """Test procurement type enum"""
        assert ProcurementType.TENDER == "tender"
        assert ProcurementType.DIRECT_PURCHASE == "direct_purchase"
        assert ProcurementType.GEM == "gem"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
