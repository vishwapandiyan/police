"""
Cost Variance Analyzer

Analyzes proposal costs against historical precedents.
Identifies significant cost variances for human review.
"""

import logging
from typing import List, Dict, Any, Optional
import statistics

from ..schemas.decision_brief import CostAnalysis

logger = logging.getLogger(__name__)


class CostAnalyzer:
    """
    Analyzes proposal costs and compares with historical data.
    
    Generates cost variance signals when proposals significantly deviate
    from historical norms.
    """
    
    def __init__(
        self,
        variance_threshold: float = 0.20,  # 20% variance threshold
        min_comparable_count: int = 3
    ):
        """
        Initialize analyzer.
        
        Args:
            variance_threshold: Percentage threshold for significant variance (0.0 to 1.0)
            min_comparable_count: Minimum precedents needed for reliable comparison
        """
        self.variance_threshold = variance_threshold
        self.min_comparable_count = min_comparable_count
    
    def analyze_cost(
        self,
        proposed_cost: float,
        currency: str,
        precedents: List[Dict[str, Any]],
        filter_by_similarity: bool = True,
        min_similarity: float = 0.5
    ) -> CostAnalysis:
        """
        Analyze proposal cost against precedents.
        
        Args:
            proposed_cost: Proposed budget amount
            currency: Currency code (e.g., INR, USD)
            precedents: List of precedent dictionaries with cost data
            filter_by_similarity: Whether to filter by semantic similarity
            min_similarity: Minimum similarity score for comparison
        
        Returns:
            CostAnalysis object with comparison results
        """
        logger.info(f"Analyzing proposed cost: {currency} {proposed_cost:,.0f}")
        
        # Extract comparable costs
        comparable_costs = self._extract_comparable_costs(
            precedents,
            currency,
            filter_by_similarity,
            min_similarity
        )
        
        if len(comparable_costs) < self.min_comparable_count:
            logger.warning(
                f"Only {len(comparable_costs)} comparable precedents found "
                f"(need {self.min_comparable_count} for reliable analysis)"
            )
            return self._create_insufficient_data_analysis(
                proposed_cost,
                currency,
                len(comparable_costs)
            )
        
        # Calculate statistics
        median_cost = statistics.median(comparable_costs)
        min_cost = min(comparable_costs)
        max_cost = max(comparable_costs)
        
        # Calculate variance
        variance_amount = proposed_cost - median_cost
        variance_percentage = (variance_amount / median_cost) * 100
        
        # Determine if variance is significant
        is_significant = abs(variance_percentage) > (self.variance_threshold * 100)
        
        # Build comparison notes
        comparison_notes = self._generate_comparison_notes(
            proposed_cost,
            median_cost,
            min_cost,
            max_cost,
            variance_percentage,
            len(comparable_costs)
        )
        
        # Identify limitations
        limitations = self._identify_limitations(
            precedents,
            comparable_costs,
            currency
        )
        
        analysis = CostAnalysis(
            proposed_cost=proposed_cost,
            currency=currency,
            comparable_precedents_count=len(comparable_costs),
            median_historical_cost=median_cost,
            min_historical_cost=min_cost,
            max_historical_cost=max_cost,
            variance_percentage=variance_percentage,
            variance_amount=variance_amount,
            is_significant_variance=is_significant,
            comparison_notes=comparison_notes,
            limitations=limitations
        )
        
        logger.info(
            f"Cost analysis complete: {variance_percentage:+.1f}% variance "
            f"({'SIGNIFICANT' if is_significant else 'within range'})"
        )
        
        return analysis
    
    def _extract_comparable_costs(
        self,
        precedents: List[Dict[str, Any]],
        target_currency: str,
        filter_by_similarity: bool,
        min_similarity: float
    ) -> List[float]:
        """Extract comparable cost values from precedents"""
        costs = []
        
        for precedent in precedents:
            # Check if precedent has cost data
            budget = precedent.get("budget")
            currency = precedent.get("currency", "INR")
            
            if budget is None:
                continue
            
            # Convert to float
            try:
                cost = float(budget)
            except (ValueError, TypeError):
                logger.debug(f"Invalid budget value: {budget}")
                continue
            
            # Filter by currency
            if currency.upper() != target_currency.upper():
                logger.debug(f"Currency mismatch: {currency} vs {target_currency}")
                continue
            
            # Filter by similarity if requested
            if filter_by_similarity:
                similarity = precedent.get("similarity_score", 0.0)
                if similarity < min_similarity:
                    logger.debug(f"Low similarity: {similarity:.2f} < {min_similarity}")
                    continue
            
            # Exclude zero or negative costs
            if cost <= 0:
                logger.debug(f"Invalid cost value: {cost}")
                continue
            
            costs.append(cost)
        
        logger.info(
            f"Extracted {len(costs)} comparable costs from {len(precedents)} precedents"
        )
        
        return costs
    
    def _create_insufficient_data_analysis(
        self,
        proposed_cost: float,
        currency: str,
        comparable_count: int
    ) -> CostAnalysis:
        """Create analysis object when insufficient data is available"""
        return CostAnalysis(
            proposed_cost=proposed_cost,
            currency=currency,
            comparable_precedents_count=comparable_count,
            median_historical_cost=None,
            min_historical_cost=None,
            max_historical_cost=None,
            variance_percentage=None,
            variance_amount=None,
            is_significant_variance=False,
            comparison_notes=(
                f"Insufficient comparable precedents ({comparable_count} found, "
                f"need {self.min_comparable_count}). Cannot reliably assess cost variance."
            ),
            limitations=[
                f"Only {comparable_count} comparable precedents available",
                "Cannot calculate reliable median or variance",
                "Manual market research recommended"
            ]
        )
    
    def _generate_comparison_notes(
        self,
        proposed: float,
        median: float,
        min_cost: float,
        max_cost: float,
        variance_pct: float,
        sample_size: int
    ) -> str:
        """Generate human-readable comparison notes"""
        direction = "above" if variance_pct > 0 else "below"
        
        notes = (
            f"Proposed cost of ₹{proposed:,.0f} is {abs(variance_pct):.1f}% "
            f"{direction} the median of ₹{median:,.0f} "
            f"(based on {sample_size} comparable proposals). "
            f"Historical range: ₹{min_cost:,.0f} to ₹{max_cost:,.0f}."
        )
        
        if variance_pct > 40:
            notes += " This is significantly higher than historical norms."
        elif variance_pct < -40:
            notes += " This is significantly lower than historical norms."
        elif abs(variance_pct) > 20:
            notes += " This shows moderate variance from historical norms."
        else:
            notes += " This is within the typical range."
        
        return notes
    
    def _identify_limitations(
        self,
        precedents: List[Dict[str, Any]],
        comparable_costs: List[float],
        currency: str
    ) -> List[str]:
        """Identify limitations of the cost analysis"""
        limitations = []
        
        total_precedents = len(precedents)
        comparable_count = len(comparable_costs)
        
        # Sample size limitation
        if comparable_count < 10:
            limitations.append(
                f"Small sample size ({comparable_count} precedents)"
            )
        
        # Filtered precedents
        if comparable_count < total_precedents:
            filtered_count = total_precedents - comparable_count
            limitations.append(
                f"{filtered_count} precedents excluded (currency mismatch, missing data, or low similarity)"
            )
        
        # Currency caveat
        if currency != "INR":
            limitations.append(
                f"Analysis in {currency} may not reflect current exchange rates or local market conditions"
            )
        
        # Time caveat
        limitations.append(
            "Historical costs may not reflect current market prices or inflation"
        )
        
        # Scope differences
        limitations.append(
            "Precedents may differ in project scope, quality requirements, or procurement method"
        )
        
        return limitations
    
    def categorize_variance(self, variance_percentage: float) -> str:
        """
        Categorize variance level.
        
        Args:
            variance_percentage: Variance as percentage
        
        Returns:
            Category string
        """
        abs_variance = abs(variance_percentage)
        
        if abs_variance > 50:
            return "extreme"
        elif abs_variance > 30:
            return "high"
        elif abs_variance > 15:
            return "moderate"
        else:
            return "low"
    
    def get_cost_percentile(
        self,
        proposed_cost: float,
        historical_costs: List[float]
    ) -> float:
        """
        Calculate which percentile the proposed cost falls in.
        
        Args:
            proposed_cost: Proposed amount
            historical_costs: List of historical costs
        
        Returns:
            Percentile (0.0 to 100.0)
        """
        if not historical_costs:
            return 50.0  # Unknown, assume median
        
        sorted_costs = sorted(historical_costs)
        
        # Count how many are below proposed cost
        below_count = sum(1 for cost in sorted_costs if cost < proposed_cost)
        
        percentile = (below_count / len(sorted_costs)) * 100
        
        return percentile
