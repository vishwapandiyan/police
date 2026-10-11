"""
Proposal Overlap Detector

Detects potential duplicate or overlapping proposals based on
location, timeframe, objective, and technology characteristics.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class OverlapDetector:
    """
    Detects duplicate or overlapping proposals.
    
    Analyzes proposals across multiple dimensions:
    - Location overlap (same station/jurisdiction)
    - Temporal overlap (similar timeframes)
    - Objective similarity (text similarity)
    - Technology overlap (same equipment/systems)
    - Budget similarity
    """
    
    def __init__(
        self,
        location_weight: float = 0.3,
        temporal_weight: float = 0.2,
        objective_weight: float = 0.3,
        technology_weight: float = 0.2,
        overlap_threshold: float = 0.7
    ):
        """
        Initialize detector.
        
        Args:
            location_weight: Weight for location similarity
            temporal_weight: Weight for temporal overlap
            objective_weight: Weight for objective similarity
            technology_weight: Weight for technology overlap
            overlap_threshold: Threshold for flagging potential overlap (0.0 to 1.0)
        """
        self.location_weight = location_weight
        self.temporal_weight = temporal_weight
        self.objective_weight = objective_weight
        self.technology_weight = technology_weight
        self.overlap_threshold = overlap_threshold
        
        # Normalize weights
        total_weight = (
            location_weight + temporal_weight + 
            objective_weight + technology_weight
        )
        if total_weight != 1.0:
            self.location_weight /= total_weight
            self.temporal_weight /= total_weight
            self.objective_weight /= total_weight
            self.technology_weight /= total_weight
    
    def detect_overlaps(
        self,
        current_proposal: Dict[str, Any],
        historical_proposals: List[Dict[str, Any]],
        max_overlaps: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Detect overlapping proposals.
        
        Args:
            current_proposal: Current proposal to check
            historical_proposals: List of historical proposals
            max_overlaps: Maximum number of overlaps to return
        
        Returns:
            List of overlap dictionaries with scores and explanations
        """
        logger.info(f"Checking {len(historical_proposals)} proposals for overlaps")
        
        overlaps = []
        
        for hist_proposal in historical_proposals:
            # Calculate overlap score
            overlap_score, details = self._calculate_overlap_score(
                current_proposal,
                hist_proposal
            )
            
            # Check if above threshold
            if overlap_score >= self.overlap_threshold:
                overlap = {
                    "proposal_id": hist_proposal.get("proposal_id", "unknown"),
                    "document_id": hist_proposal.get("document_id", "unknown"),
                    "overlap_score": overlap_score,
                    "overlap_type": self._classify_overlap_type(overlap_score, details),
                    "details": details,
                    "explanation": self._generate_explanation(details),
                    "recommendation": self._generate_recommendation(overlap_score, details)
                }
                overlaps.append(overlap)
        
        # Sort by overlap score (descending)
        overlaps.sort(key=lambda x: x["overlap_score"], reverse=True)
        
        logger.info(f"Found {len(overlaps)} potential overlaps")
        
        return overlaps[:max_overlaps]
    
    def _calculate_overlap_score(
        self,
        proposal1: Dict[str, Any],
        proposal2: Dict[str, Any]
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculate overlap score between two proposals.
        
        Returns:
            (overlap_score, details_dict)
        """
        # Location similarity
        location_score = self._compare_locations(
            proposal1.get("location"),
            proposal2.get("location"),
            proposal1.get("police_station"),
            proposal2.get("police_station"),
            proposal1.get("jurisdiction"),
            proposal2.get("jurisdiction")
        )
        
        # Temporal overlap
        temporal_score = self._compare_timelines(
            proposal1.get("start_date"),
            proposal1.get("end_date"),
            proposal2.get("start_date"),
            proposal2.get("end_date"),
            proposal1.get("timeline"),
            proposal2.get("timeline")
        )
        
        # Objective similarity
        objective_score = self._compare_objectives(
            proposal1.get("objective"),
            proposal2.get("objective")
        )
        
        # Technology overlap
        technology_score = self._compare_technology(
            proposal1.get("technology"),
            proposal2.get("technology")
        )
        
        # Combined weighted score
        combined_score = (
            self.location_weight * location_score +
            self.temporal_weight * temporal_score +
            self.objective_weight * objective_score +
            self.technology_weight * technology_score
        )
        
        details = {
            "location_similarity": location_score,
            "temporal_overlap": temporal_score,
            "objective_similarity": objective_score,
            "technology_overlap": technology_score,
            "combined_score": combined_score
        }
        
        return combined_score, details
    
    def _compare_locations(
        self,
        loc1: Optional[str],
        loc2: Optional[str],
        station1: Optional[str],
        station2: Optional[str],
        juris1: Optional[str],
        juris2: Optional[str]
    ) -> float:
        """Compare location similarity"""
        if not any([loc1, station1, juris1]) or not any([loc2, station2, juris2]):
            return 0.0
        
        # Check exact matches
        if station1 and station2:
            if station1.lower().strip() == station2.lower().strip():
                return 1.0
        
        if juris1 and juris2:
            if juris1.lower().strip() == juris2.lower().strip():
                return 0.9
        
        if loc1 and loc2:
            similarity = self._text_similarity(loc1, loc2)
            if similarity > 0.8:
                return similarity
        
        return 0.0
    
    def _compare_timelines(
        self,
        start1: Optional[str],
        end1: Optional[str],
        start2: Optional[str],
        end2: Optional[str],
        timeline1: Optional[str],
        timeline2: Optional[str]
    ) -> float:
        """Compare temporal overlap"""
        try:
            # Parse dates if available
            if start1 and start2:
                date1 = self._parse_date(start1)
                date2 = self._parse_date(start2)
                
                if date1 and date2:
                    # Check if dates are within 6 months
                    diff = abs((date1 - date2).days)
                    if diff < 30:  # Within 1 month
                        return 1.0
                    elif diff < 90:  # Within 3 months
                        return 0.7
                    elif diff < 180:  # Within 6 months
                        return 0.4
        except Exception as e:
            logger.debug(f"Error parsing dates: {e}")
        
        # Fallback to timeline text similarity
        if timeline1 and timeline2:
            return self._text_similarity(timeline1, timeline2) * 0.5
        
        return 0.0
    
    def _compare_objectives(
        self,
        obj1: Optional[str],
        obj2: Optional[str]
    ) -> float:
        """Compare objective similarity"""
        if not obj1 or not obj2:
            return 0.0
        
        return self._text_similarity(obj1, obj2)
    
    def _compare_technology(
        self,
        tech1: Optional[str],
        tech2: Optional[str]
    ) -> float:
        """Compare technology/equipment overlap"""
        if not tech1 or not tech2:
            return 0.0
        
        # Extract key technology terms
        tech1_terms = set(self._extract_tech_terms(tech1))
        tech2_terms = set(self._extract_tech_terms(tech2))
        
        if not tech1_terms or not tech2_terms:
            return self._text_similarity(tech1, tech2)
        
        # Jaccard similarity for technology terms
        intersection = len(tech1_terms & tech2_terms)
        union = len(tech1_terms | tech2_terms)
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity using SequenceMatcher"""
        if not text1 or not text2:
            return 0.0
        
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    def _extract_tech_terms(self, tech_text: str) -> List[str]:
        """Extract key technology terms"""
        if not tech_text:
            return []
        
        # Common technology keywords
        tech_keywords = [
            'cctv', 'camera', 'surveillance', 'dvr', 'nvr',
            'computer', 'laptop', 'desktop', 'server',
            'vehicle', 'car', 'bike', 'jeep',
            'radio', 'communication', 'walkie', 'talkie',
            'software', 'system', 'network', 'internet',
            'weapon', 'firearm', 'equipment', 'device'
        ]
        
        text_lower = tech_text.lower()
        found_terms = [kw for kw in tech_keywords if kw in text_lower]
        
        return found_terms
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string"""
        if not date_str:
            return None
        
        formats = [
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
            "%Y%m%d"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except:
                continue
        
        return None
    
    def _classify_overlap_type(
        self,
        score: float,
        details: Dict[str, float]
    ) -> str:
        """Classify the type of overlap"""
        if score >= 0.9:
            return "potential_duplicate"
        elif score >= 0.75:
            return "high_overlap"
        elif score >= 0.7:
            return "moderate_overlap"
        else:
            return "low_overlap"
    
    def _generate_explanation(self, details: Dict[str, float]) -> str:
        """Generate human-readable explanation"""
        high_factors = []
        
        if details["location_similarity"] > 0.7:
            high_factors.append("same location")
        if details["temporal_overlap"] > 0.7:
            high_factors.append("overlapping timeframe")
        if details["objective_similarity"] > 0.7:
            high_factors.append("similar objectives")
        if details["technology_overlap"] > 0.7:
            high_factors.append("same technology/equipment")
        
        if not high_factors:
            return "Moderate overlap detected across multiple factors"
        
        return f"Overlap detected: {', '.join(high_factors)}"
    
    def _generate_recommendation(
        self,
        score: float,
        details: Dict[str, float]
    ) -> str:
        """Generate recommendation for reviewing officer"""
        if score >= 0.9:
            return (
                "High likelihood of duplication. "
                "Verify if this is a duplicate submission or update of existing proposal. "
                "Check with proposing unit before processing."
            )
        elif score >= 0.75:
            return (
                "Significant overlap detected. "
                "Review for potential consolidation with existing proposal. "
                "Consult with both units to avoid redundancy."
            )
        else:
            return (
                "Moderate overlap detected. "
                "Review for coordination opportunities. "
                "May benefit from combined procurement or implementation."
            )
    
    def summarize_overlaps(
        self,
        overlaps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate summary statistics for detected overlaps.
        
        Args:
            overlaps: List of detected overlaps
        
        Returns:
            Summary dictionary
        """
        if not overlaps:
            return {
                "total_overlaps": 0,
                "potential_duplicates": 0,
                "high_overlaps": 0,
                "moderate_overlaps": 0,
                "recommendation": "No overlaps detected"
            }
        
        summary = {
            "total_overlaps": len(overlaps),
            "potential_duplicates": sum(
                1 for o in overlaps if o["overlap_type"] == "potential_duplicate"
            ),
            "high_overlaps": sum(
                1 for o in overlaps if o["overlap_type"] == "high_overlap"
            ),
            "moderate_overlaps": sum(
                1 for o in overlaps if o["overlap_type"] == "moderate_overlap"
            ),
            "highest_score": max(o["overlap_score"] for o in overlaps),
            "average_score": sum(o["overlap_score"] for o in overlaps) / len(overlaps),
        }
        
        # Generate recommendation
        if summary["potential_duplicates"] > 0:
            summary["recommendation"] = (
                f"URGENT: {summary['potential_duplicates']} potential duplicate(s) found. "
                "Immediate review required."
            )
        elif summary["high_overlaps"] > 0:
            summary["recommendation"] = (
                f"{summary['high_overlaps']} high overlap(s) detected. "
                "Review for consolidation opportunities."
            )
        else:
            summary["recommendation"] = (
                "Moderate overlaps detected. Review for coordination."
            )
        
        return summary
