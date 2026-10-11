"""
Jurisdiction-Aware Precedent Ranker

Ranks precedents based on jurisdiction proximity and semantic similarity.
Prioritizes: same station > neighboring > same region > district > state-wide.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from ..schemas.police_domain import JurisdictionMatch

logger = logging.getLogger(__name__)


@dataclass
class JurisdictionConfig:
    """Configuration for jurisdiction relationships"""
    station_id: str
    station_name: str
    region: Optional[str] = None
    district: Optional[str] = None
    neighboring_stations: List[str] = None
    
    def __post_init__(self):
        if self.neighboring_stations is None:
            self.neighboring_stations = []


class JurisdictionRanker:
    """
    Ranks precedents by jurisdiction proximity combined with semantic similarity.
    
    Ranking order:
    1. Same police station (highest priority)
    2. Neighboring stations
    3. Same region
    4. Same district
    5. Puducherry-wide (lowest priority for local proposals)
    """
    
    def __init__(self, jurisdiction_config: Optional[JurisdictionConfig] = None):
        """
        Initialize ranker.
        
        Args:
            jurisdiction_config: Configuration for the requesting jurisdiction
        """
        self.config = jurisdiction_config
        
        # Jurisdiction match weights (0.0 to 1.0)
        self.weights = {
            "same_station": 1.0,
            "neighboring": 0.8,
            "same_region": 0.6,
            "district_wide": 0.4,
            "state_wide": 0.2,
            "unknown": 0.1
        }
    
    def rank_precedents(
        self,
        precedents: List[Dict[str, Any]],
        semantic_scores: Optional[List[float]] = None,
        jurisdiction_weight: float = 0.4
    ) -> List[Dict[str, Any]]:
        """
        Rank precedents by jurisdiction proximity and semantic similarity.
        
        Args:
            precedents: List of precedent dictionaries
            semantic_scores: Optional pre-computed semantic similarity scores
            jurisdiction_weight: Weight for jurisdiction (0.0 to 1.0), 
                                 remainder goes to semantic similarity
        
        Returns:
            Ranked list of precedents with added ranking metadata
        """
        if not precedents:
            return []
        
        if not self.config:
            logger.warning("No jurisdiction config provided, using semantic scores only")
            return self._rank_by_semantic_only(precedents, semantic_scores)
        
        ranked = []
        
        for i, precedent in enumerate(precedents):
            # Get jurisdiction match level
            match_level, proximity_score = self._get_jurisdiction_match(precedent)
            
            # Get semantic score
            semantic_score = (
                semantic_scores[i] if semantic_scores and i < len(semantic_scores)
                else precedent.get("similarity_score", 0.5)
            )
            
            # Combined score: weighted average
            combined_score = (
                jurisdiction_weight * proximity_score +
                (1 - jurisdiction_weight) * semantic_score
            )
            
            # Add ranking metadata
            ranked_precedent = precedent.copy()
            ranked_precedent.update({
                "jurisdiction_match_level": match_level,
                "jurisdiction_proximity_score": proximity_score,
                "semantic_similarity_score": semantic_score,
                "combined_rank_score": combined_score,
                "ranking_explanation": self._explain_ranking(
                    match_level, proximity_score, semantic_score, combined_score
                )
            })
            
            ranked.append(ranked_precedent)
        
        # Sort by combined score (descending)
        ranked.sort(key=lambda x: x["combined_rank_score"], reverse=True)
        
        logger.info(
            f"Ranked {len(ranked)} precedents. "
            f"Top match: {ranked[0]['jurisdiction_match_level']} "
            f"(score: {ranked[0]['combined_rank_score']:.3f})"
        )
        
        return ranked
    
    def _get_jurisdiction_match(
        self,
        precedent: Dict[str, Any]
    ) -> Tuple[str, float]:
        """
        Determine jurisdiction match level and proximity score.
        
        Returns:
            (match_level, proximity_score)
        """
        prec_station = precedent.get("police_station", "").lower()
        prec_region = precedent.get("region", "").lower()
        prec_district = precedent.get("district", "").lower()
        prec_jurisdiction = precedent.get("jurisdiction", "").lower()
        
        if not self.config:
            return "unknown", self.weights["unknown"]
        
        config_station = self.config.station_name.lower()
        config_region = (self.config.region or "").lower()
        config_district = (self.config.district or "").lower()
        
        # Same station (exact match)
        if prec_station and prec_station == config_station:
            return "same_station", self.weights["same_station"]
        
        if prec_jurisdiction and prec_jurisdiction == config_station:
            return "same_station", self.weights["same_station"]
        
        # Neighboring stations
        neighboring = [s.lower() for s in self.config.neighboring_stations]
        if prec_station and prec_station in neighboring:
            return "neighboring", self.weights["neighboring"]
        
        if prec_jurisdiction and prec_jurisdiction in neighboring:
            return "neighboring", self.weights["neighboring"]
        
        # Same region
        if prec_region and config_region and prec_region == config_region:
            return "same_region", self.weights["same_region"]
        
        # Same district
        if prec_district and config_district and prec_district == config_district:
            return "district_wide", self.weights["district_wide"]
        
        # State-wide (Puducherry)
        if any([prec_station, prec_region, prec_district, prec_jurisdiction]):
            return "state_wide", self.weights["state_wide"]
        
        # Unknown jurisdiction
        return "unknown", self.weights["unknown"]
    
    def _rank_by_semantic_only(
        self,
        precedents: List[Dict[str, Any]],
        semantic_scores: Optional[List[float]]
    ) -> List[Dict[str, Any]]:
        """Fallback ranking using semantic similarity only"""
        ranked = []
        
        for i, precedent in enumerate(precedents):
            score = (
                semantic_scores[i] if semantic_scores and i < len(semantic_scores)
                else precedent.get("similarity_score", 0.5)
            )
            
            ranked_precedent = precedent.copy()
            ranked_precedent.update({
                "jurisdiction_match_level": "unknown",
                "jurisdiction_proximity_score": 0.0,
                "semantic_similarity_score": score,
                "combined_rank_score": score,
                "ranking_explanation": f"Ranked by semantic similarity only (score: {score:.3f})"
            })
            
            ranked.append(ranked_precedent)
        
        ranked.sort(key=lambda x: x["combined_rank_score"], reverse=True)
        return ranked
    
    def _explain_ranking(
        self,
        match_level: str,
        proximity_score: float,
        semantic_score: float,
        combined_score: float
    ) -> str:
        """Generate human-readable ranking explanation"""
        match_descriptions = {
            "same_station": "Same police station",
            "neighboring": "Neighboring station",
            "same_region": "Same region",
            "district_wide": "Same district",
            "state_wide": "Puducherry-wide",
            "unknown": "Unknown jurisdiction"
        }
        
        match_desc = match_descriptions.get(match_level, "Unknown")
        
        return (
            f"{match_desc} (jurisdiction: {proximity_score:.2f}, "
            f"semantic: {semantic_score:.2f}, combined: {combined_score:.2f})"
        )
    
    def filter_by_jurisdiction(
        self,
        precedents: List[Dict[str, Any]],
        min_match_level: str = "district_wide"
    ) -> List[Dict[str, Any]]:
        """
        Filter precedents to only include those meeting minimum jurisdiction level.
        
        Args:
            precedents: List of precedents
            min_match_level: Minimum match level to include
                            (same_station, neighboring, same_region, district_wide, state_wide)
        
        Returns:
            Filtered list of precedents
        """
        if not self.config:
            logger.warning("No jurisdiction config, returning all precedents")
            return precedents
        
        # Define match level hierarchy
        level_hierarchy = [
            "same_station",
            "neighboring",
            "same_region",
            "district_wide",
            "state_wide",
            "unknown"
        ]
        
        if min_match_level not in level_hierarchy:
            logger.warning(f"Invalid match level '{min_match_level}', returning all")
            return precedents
        
        min_index = level_hierarchy.index(min_match_level)
        
        filtered = []
        for precedent in precedents:
            match_level, _ = self._get_jurisdiction_match(precedent)
            
            if match_level in level_hierarchy:
                match_index = level_hierarchy.index(match_level)
                if match_index <= min_index:
                    filtered.append(precedent)
        
        logger.info(
            f"Filtered {len(precedents)} precedents to {len(filtered)} "
            f"meeting minimum level '{min_match_level}'"
        )
        
        return filtered
    
    def get_jurisdiction_distribution(
        self,
        precedents: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        Get distribution of precedents across jurisdiction levels.
        
        Args:
            precedents: List of precedents
        
        Returns:
            Dictionary with counts per jurisdiction level
        """
        distribution = {
            "same_station": 0,
            "neighboring": 0,
            "same_region": 0,
            "district_wide": 0,
            "state_wide": 0,
            "unknown": 0
        }
        
        for precedent in precedents:
            match_level, _ = self._get_jurisdiction_match(precedent)
            distribution[match_level] = distribution.get(match_level, 0) + 1
        
        return distribution


def create_jurisdiction_config_from_proposal_dna(proposal_dna) -> Optional[JurisdictionConfig]:
    """
    Helper function to create JurisdictionConfig from ProposalDNA.
    
    Args:
        proposal_dna: ProposalDNA object
    
    Returns:
        JurisdictionConfig or None if insufficient data
    """
    station = proposal_dna.police_station.value
    jurisdiction = proposal_dna.jurisdiction.value
    
    if not station and not jurisdiction:
        logger.warning("No station or jurisdiction in proposal DNA")
        return None
    
    # Use whichever is available
    station_name = station or jurisdiction or "Unknown"
    
    config = JurisdictionConfig(
        station_id=f"station-{hash(station_name) % 10000}",
        station_name=station_name,
        region=None,  # TODO: Extract from jurisdiction field if structured
        district=None,  # TODO: Extract from jurisdiction field if structured
        neighboring_stations=[]  # TODO: Load from configuration/database
    )
    
    return config
