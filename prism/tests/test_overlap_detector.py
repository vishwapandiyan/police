"""
Tests for Overlap Detector
"""

import pytest
from prism.analyzers import OverlapDetector


class TestOverlapDetector:
    """Test Proposal Overlap Detector"""
    
    def test_create_detector(self):
        """Test creating detector"""
        detector = OverlapDetector()
        assert detector.overlap_threshold == 0.7
    
    def test_high_overlap_same_location(self):
        """Test detecting high overlap for same location"""
        detector = OverlapDetector(overlap_threshold=0.7)
        
        current = {
            "objective": "Deploy CCTV system",
            "location": "Central Police Station",
            "police_station": "Central Station",
            "technology": "CCTV cameras, DVR"
        }
        
        historical = [{
            "proposal_id": "P-2025-001",
            "objective": "Install CCTV surveillance",
            "location": "Central Police Station",
            "police_station": "Central Station",
            "technology": "CCTV, recording system"
        }]
        
        overlaps = detector.detect_overlaps(current, historical)
        
        assert len(overlaps) > 0
        assert overlaps[0]["overlap_score"] > 0.7
    
    def test_no_overlap_different_locations(self):
        """Test no overlap for different locations"""
        detector = OverlapDetector()
        
        current = {
            "objective": "Deploy CCTV",
            "location": "North Station",
            "technology": "CCTV"
        }
        
        historical = [{
            "objective": "Deploy CCTV",
            "location": "South Station",
            "technology": "CCTV"
        }]
        
        overlaps = detector.detect_overlaps(current, historical)
        
        # Should have low overlap due to different locations
        assert len(overlaps) == 0 or overlaps[0]["overlap_score"] < 0.7
    
    def test_overlap_classification(self):
        """Test overlap type classification"""
        detector = OverlapDetector()
        
        details = {
            "location_similarity": 0.9,
            "temporal_overlap": 0.8,
            "objective_similarity": 0.85,
            "technology_overlap": 0.9
        }
        
        # High score should be potential duplicate
        overlap_type = detector._classify_overlap_type(0.95, details)
        assert overlap_type == "potential_duplicate"
        
        # Lower score
        overlap_type = detector._classify_overlap_type(0.72, details)
        assert overlap_type == "moderate_overlap"
    
    def test_technology_comparison(self):
        """Test technology overlap detection"""
        detector = OverlapDetector()
        
        # Same technology
        score1 = detector._compare_technology("CCTV cameras and DVR", "CCTV, DVR system")
        assert score1 > 0.5
        
        # Different technology
        score2 = detector._compare_technology("CCTV cameras", "Radio equipment")
        assert score2 < 0.5
    
    def test_overlap_summary(self):
        """Test generating overlap summary"""
        detector = OverlapDetector()
        
        overlaps = [
            {"overlap_type": "potential_duplicate", "overlap_score": 0.92},
            {"overlap_type": "high_overlap", "overlap_score": 0.78},
            {"overlap_type": "moderate_overlap", "overlap_score": 0.72}
        ]
        
        summary = detector.summarize_overlaps(overlaps)
        
        assert summary["total_overlaps"] == 3
        assert summary["potential_duplicates"] == 1
        assert summary["high_overlaps"] == 1
        assert summary["highest_score"] == 0.92


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
