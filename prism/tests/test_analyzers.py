"""
Tests for PRISM Analyzers (Jurisdiction Ranker and Cost Analyzer)
"""

import pytest
from prism.analyzers import (
    JurisdictionRanker,
    JurisdictionConfig,
    CostAnalyzer
)


class TestJurisdictionRanker:
    """Test Jurisdiction-Aware Precedent Ranker"""
    
    def test_create_jurisdiction_config(self):
        """Test creating jurisdiction configuration"""
        config = JurisdictionConfig(
            station_id="PUD-001",
            station_name="Puducherry Central",
            region="Central Region",
            district="Puducherry",
            neighboring_stations=["Oulgaret", "Ozhukarai"]
        )
        
        assert config.station_name == "Puducherry Central"
        assert len(config.neighboring_stations) == 2
    
    def test_same_station_ranking(self):
        """Test that same station gets highest priority"""
        config = JurisdictionConfig(
            station_id="PUD-001",
            station_name="Central Station",
            neighboring_stations=["Station A"]
        )
        
        ranker = JurisdictionRanker(config)
        
        precedents = [
            {
                "id": "prec-1",
                "police_station": "Central Station",
                "similarity_score": 0.7
            },
            {
                "id": "prec-2",
                "police_station": "Other Station",
                "similarity_score": 0.9
            }
        ]
        
        ranked = ranker.rank_precedents(precedents)
        
        # Same station should rank first despite lower semantic score
        assert ranked[0]["id"] == "prec-1"
        assert ranked[0]["jurisdiction_match_level"] == "same_station"
    
    def test_neighboring_station_ranking(self):
        """Test neighboring station gets priority"""
        config = JurisdictionConfig(
            station_id="PUD-001",
            station_name="Central Station",
            neighboring_stations=["Station A", "Station B"]
        )
        
        ranker = JurisdictionRanker(config)
        
        precedents = [
            {"id": "prec-1", "police_station": "Station A", "similarity_score": 0.7},
            {"id": "prec-2", "police_station": "Far Station", "similarity_score": 0.9}
        ]
        
        ranked = ranker.rank_precedents(precedents)
        
        assert ranked[0]["jurisdiction_match_level"] == "neighboring"
    
    def test_jurisdiction_distribution(self):
        """Test getting jurisdiction distribution"""
        config = JurisdictionConfig(
            station_id="PUD-001",
            station_name="Central Station",
            region="Central",
            neighboring_stations=["Station A"]
        )
        
        ranker = JurisdictionRanker(config)
        
        precedents = [
            {"police_station": "Central Station"},
            {"police_station": "Station A"},
            {"police_station": "Unknown"},
            {"region": "Central"}
        ]
        
        dist = ranker.get_jurisdiction_distribution(precedents)
        
        assert dist["same_station"] == 1
        assert dist["neighboring"] == 1
        assert "unknown" in dist


class TestCostAnalyzer:
    """Test Cost Variance Analyzer"""
    
    def test_create_analyzer(self):
        """Test creating cost analyzer"""
        analyzer = CostAnalyzer(variance_threshold=0.20)
        assert analyzer.variance_threshold == 0.20
    
    def test_sufficient_comparable_costs(self):
        """Test analysis with sufficient data"""
        analyzer = CostAnalyzer(min_comparable_count=3)
        
        precedents = [
            {"budget": 500000, "currency": "INR", "similarity_score": 0.8},
            {"budget": 450000, "currency": "INR", "similarity_score": 0.7},
            {"budget": 550000, "currency": "INR", "similarity_score": 0.9},
            {"budget": 480000, "currency": "INR", "similarity_score": 0.75}
        ]
        
        analysis = analyzer.analyze_cost(
            proposed_cost=600000,
            currency="INR",
            precedents=precedents
        )
        
        assert analysis.comparable_precedents_count == 4
        assert analysis.median_historical_cost == 490000  # median of [450k, 480k, 500k, 550k]
        assert analysis.variance_percentage > 0  # Above median
    
    def test_insufficient_data(self):
        """Test handling of insufficient comparable data"""
        analyzer = CostAnalyzer(min_comparable_count=5)
        
        precedents = [
            {"budget": 500000, "currency": "INR", "similarity_score": 0.8},
            {"budget": 450000, "currency": "INR", "similarity_score": 0.7}
        ]
        
        analysis = analyzer.analyze_cost(
            proposed_cost=600000,
            currency="INR",
            precedents=precedents
        )
        
        assert analysis.comparable_precedents_count < analyzer.min_comparable_count
        assert analysis.median_historical_cost is None
        assert not analysis.is_significant_variance
        assert "Insufficient" in analysis.comparison_notes
    
    def test_currency_filtering(self):
        """Test that different currencies are excluded"""
        analyzer = CostAnalyzer()
        
        precedents = [
            {"budget": 500000, "currency": "INR", "similarity_score": 0.8},
            {"budget": 10000, "currency": "USD", "similarity_score": 0.9},  # Should be excluded
            {"budget": 450000, "currency": "INR", "similarity_score": 0.7}
        ]
        
        analysis = analyzer.analyze_cost(
            proposed_cost=600000,
            currency="INR",
            precedents=precedents
        )
        
        # Should only count INR precedents
        assert analysis.comparable_precedents_count == 2
    
    def test_significant_variance_detection(self):
        """Test detection of significant cost variance"""
        analyzer = CostAnalyzer(variance_threshold=0.20)  # 20%
        
        precedents = [
            {"budget": 500000, "currency": "INR", "similarity_score": 0.8},
            {"budget": 500000, "currency": "INR", "similarity_score": 0.7},
            {"budget": 500000, "currency": "INR", "similarity_score": 0.9}
        ]
        
        # Test high variance (40% above)
        analysis_high = analyzer.analyze_cost(
            proposed_cost=700000,  # 40% above median
            currency="INR",
            precedents=precedents
        )
        
        assert analysis_high.is_significant_variance
        assert analysis_high.variance_percentage > 20
        
        # Test low variance (within threshold)
        analysis_low = analyzer.analyze_cost(
            proposed_cost=510000,  # Only 2% above
            currency="INR",
            precedents=precedents
        )
        
        assert not analysis_low.is_significant_variance
    
    def test_variance_categorization(self):
        """Test variance categorization"""
        analyzer = CostAnalyzer()
        
        assert analyzer.categorize_variance(5) == "low"
        assert analyzer.categorize_variance(20) == "moderate"
        assert analyzer.categorize_variance(35) == "high"
        assert analyzer.categorize_variance(60) == "extreme"
    
    def test_cost_percentile(self):
        """Test cost percentile calculation"""
        analyzer = CostAnalyzer()
        
        historical = [100000, 200000, 300000, 400000, 500000]
        
        # Cost at 50th percentile
        percentile_50 = analyzer.get_cost_percentile(300000, historical)
        assert 40 <= percentile_50 <= 60
        
        # Cost at 80th percentile
        percentile_80 = analyzer.get_cost_percentile(450000, historical)
        assert percentile_80 > 60


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
