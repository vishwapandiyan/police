"""
Tests for PRISM Validation (Citation Validator)
"""

import pytest
from prism.validation import CitationValidator, CitationError


class TestCitationValidator:
    """Test Citation Validator"""
    
    def test_create_validator(self):
        """Test creating validator"""
        validator = CitationValidator()
        assert validator.strict_mode == True
    
    def test_build_source_registry(self):
        """Test building source registry"""
        validator = CitationValidator()
        
        chunks = [
            {"chunk_id": "doc-1-chunk-1", "content": "Sample content 1"},
            {"chunk_id": "doc-1-chunk-2", "content": "Sample content 2"},
            {"id": "doc-2", "text": "Different format"}
        ]
        
        registry = validator.build_source_registry(chunks)
        
        assert len(registry) == 3
        assert "doc-1-chunk-1" in registry
        assert "doc-2" in registry
    
    def test_extract_citations(self):
        """Test extracting citations from text"""
        validator = CitationValidator()
        
        text = "This is a fact [1]. Another fact [source-123]. Final point [doc-001]."
        citations = validator.extract_citations(text)
        
        assert len(citations) >= 3
        citation_ids = [cid for cid, _ in citations]
        assert "1" in citation_ids
        assert "source-123" in citation_ids
    
    def test_validate_valid_citations(self):
        """Test validating correct citations"""
        validator = CitationValidator(strict_mode=False)
        
        registry = {
            "source-1": {"content": "Content 1"},
            "source-2": {"content": "Content 2"}
        }
        
        text = "Fact from [source-1] and [source-2]"
        result = validator.validate_citations(text, registry)
        
        assert result["valid"] == True
        assert result["total_citations"] == 2
        assert result["valid_citations"] == 2
    
    def test_validate_invalid_citations(self):
        """Test detecting invalid citations"""
        validator = CitationValidator(strict_mode=False)
        
        registry = {
            "source-1": {"content": "Content 1"}
        }
        
        text = "Fact from [source-1] and [source-999]"
        result = validator.validate_citations(text, registry)
        
        assert result["valid"] == False
        assert len(result["invalid_citations"]) == 1
        assert result["invalid_citations"][0]["citation_id"] == "source-999"
    
    def test_strict_mode_raises_error(self):
        """Test that strict mode raises error"""
        validator = CitationValidator(strict_mode=True)
        
        registry = {"source-1": {"content": "Content"}}
        text = "Invalid [source-999]"
        
        with pytest.raises(CitationError):
            validator.validate_citations(text, registry)
    
    def test_excerpt_validation(self):
        """Test validating excerpts"""
        validator = CitationValidator()
        
        source_content = "This is the full source content with multiple sentences."
        excerpt = "full source content"
        
        is_valid = validator.validate_excerpt_match(excerpt, source_content)
        assert is_valid == True
    
    def test_remove_invalid_citations(self):
        """Test removing invalid citations"""
        validator = CitationValidator()
        
        registry = {"source-1": {"content": "Valid"}}
        text = "Valid [source-1] and invalid [source-999]"
        
        cleaned, removed = validator.remove_invalid_citations(text, registry)
        
        assert "[source-999]" not in cleaned
        assert "[source-1]" in cleaned
        assert "source-999" in removed
    
    def test_citation_report(self):
        """Test generating citation report"""
        validator = CitationValidator(strict_mode=False)
        
        results = [
            {"valid": True, "total_citations": 3, "invalid_citations": []},
            {"valid": False, "total_citations": 2, "invalid_citations": [{"citation_id": "bad"}]}
        ]
        
        report = validator.generate_citation_report(results)
        
        assert report["total_citations"] == 5
        assert report["total_invalid"] == 1
        assert report["all_valid"] == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
