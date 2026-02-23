"""
DHCaaS Smart Score Calculator Service
Production-grade data quality scoring engine with advanced heuristics
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import Counter
import logging

logger = logging.getLogger(__name__)


class ScoreCalculatorConfig:
    """
    Configuration for scoring algorithm
    Allows tuning without code changes
    """
    
    # Base score (maximum possible)
    BASE_SCORE: float = 100.0
    
    # Severity penalties (deducted per incident)
    SEVERITY_PENALTIES = {
        'critical': 5.0,
        'high': 2.5,
        'medium': 1.0,
        'low': 0.5
    }
    
    # Status multipliers (reduce penalty if handled)
    STATUS_MULTIPLIERS = {
        'open': 1.0,          # Full penalty
        'acknowledged': 0.5,  # 50% penalty reduction
        'resolved': 0.2,      # 80% penalty reduction
        'closed': 0.1         # 90% penalty reduction
    }
    
    # Data volume thresholds and multipliers
    VOLUME_THRESHOLDS = [
        (1_000_000, 1.5),   # > 1M records: 1.5x penalty
        (100_000, 1.2),     # > 100K records: 1.2x penalty
        (0, 1.0)            # < 100K records: 1.0x penalty (default)
    ]
    
    # Time aging thresholds (days since creation)
    TIME_THRESHOLDS = [
        (90, 1.5),   # > 90 days open: 1.5x penalty
        (30, 1.2),   # > 30 days open: 1.2x penalty
        (7, 1.1),    # > 7 days open: 1.1x penalty
        (0, 1.0)     # < 7 days open: 1.0x penalty
    ]
    
    # Score boundaries
    MIN_SCORE: float = 0.0
    MAX_SCORE: float = 100.0


class SmartScoreCalculator:
    """
    Advanced data quality score calculator
    
    Calculates overall data quality score based on:
    - Incident severity (Critical hurts more than Low)
    - Incident status (Open vs Resolved)
    - Data volume (Large datasets have higher impact)
    - Time factor (Old unresolved incidents are worse)
    
    Usage:
        calculator = SmartScoreCalculator(incidents, total_records=500_000)
        score = calculator.calculate_score()
        breakdown = calculator.get_score_breakdown()
    """
    
    def __init__(
        self,
        incidents: List[Dict[str, Any]],
        total_records: int = 10_000,
        config: Optional[ScoreCalculatorConfig] = None
    ):
        """
        Initialize score calculator
        
        Args:
            incidents: List of incident dictionaries from IncidentStore
            total_records: Total number of records in data source
            config: Optional custom configuration
        """
        self.incidents = incidents or []
        self.total_records = max(1, total_records)  # Avoid division by zero
        self.config = config or ScoreCalculatorConfig()
        
        # Calculation results (cached)
        self._score: Optional[float] = None
        self._breakdown: Optional[Dict[str, Any]] = None
        
        logger.info(
            f"SmartScoreCalculator initialized: "
            f"{len(self.incidents)} incidents, {self.total_records:,} records"
        )
    
    def calculate_score(self) -> float:
        """
        Calculate overall data quality score
        
        Returns:
            Score between 0.0 and 100.0
        """
        if self._score is not None:
            return self._score
        
        try:
            score = self.config.BASE_SCORE
            total_penalty = 0.0
            
            for incident in self.incidents:
                penalty = self._calculate_incident_penalty(incident)
                total_penalty += penalty
            
            score -= total_penalty
            
            # Clamp to valid range
            score = max(self.config.MIN_SCORE, min(self.config.MAX_SCORE, score))
            
            self._score = round(score, 1)
            
            logger.info(
                f"Score calculated: {self._score}% "
                f"(total penalty: {total_penalty:.1f})"
            )
            
            return self._score
            
        except Exception as e:
            logger.error(f"Error calculating score: {e}", exc_info=True)
            # Return conservative score on error
            return 50.0
    
    def _calculate_incident_penalty(self, incident: Dict[str, Any]) -> float:
        """
        Calculate penalty for a single incident
        
        Formula:
        penalty = base_penalty * status_multiplier * volume_multiplier * time_multiplier
        
        Args:
            incident: Incident dictionary
            
        Returns:
            Calculated penalty value
        """
        try:
            # Step 1: Get base penalty from severity
            severity = self._normalize_severity(incident.get('severity', 'low'))
            base_penalty = self.config.SEVERITY_PENALTIES.get(severity, 0.5)
            
            # Step 2: Apply status multiplier
            status = self._normalize_status(incident.get('status', 'open'))
            status_multiplier = self.config.STATUS_MULTIPLIERS.get(status, 1.0)
            
            # Step 3: Apply volume multiplier
            volume_multiplier = self._get_volume_multiplier()
            
            # Step 4: Apply time aging multiplier
            time_multiplier = self._get_time_multiplier(incident)
            
            # Calculate final penalty
            penalty = (
                base_penalty
                * status_multiplier
                * volume_multiplier
                * time_multiplier
            )
            
            logger.debug(
                f"Incident penalty: {penalty:.2f} "
                f"(base={base_penalty}, status={status_multiplier}, "
                f"volume={volume_multiplier}, time={time_multiplier})"
            )
            
            return penalty
            
        except Exception as e:
            logger.warning(f"Error calculating incident penalty: {e}")
            # Return conservative penalty on error
            return 1.0
    
    def _normalize_severity(self, severity: Any) -> str:
        """Normalize severity to lowercase string"""
        if not severity:
            return 'low'
        return str(severity).lower().strip()
    
    def _normalize_status(self, status: Any) -> str:
        """Normalize status to lowercase string"""
        if not status:
            return 'open'
        return str(status).lower().strip()
    
    def _get_volume_multiplier(self) -> float:
        """
        Calculate volume multiplier based on total records
        
        Large datasets have higher impact when quality issues occur
        """
        for threshold, multiplier in self.config.VOLUME_THRESHOLDS:
            if self.total_records > threshold:
                return multiplier
        
        return 1.0
    
    def _get_time_multiplier(self, incident: Dict[str, Any]) -> float:
        """
        Calculate time aging multiplier
        
        Old unresolved incidents are penalized more heavily
        
        Args:
            incident: Incident dictionary with 'created_at' field
            
        Returns:
            Time multiplier (1.0 - 1.5)
        """
        try:
            # Only apply time penalty to non-resolved incidents
            status = self._normalize_status(incident.get('status', 'open'))
            if status in ['resolved', 'closed']:
                return 1.0
            
            # Get creation date
            created_at = incident.get('created_at')
            if not created_at:
                return 1.0
            
            # Parse date (handle both string and datetime)
            if isinstance(created_at, str):
                # Try common date formats
                for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S']:
                    try:
                        created_at = datetime.strptime(created_at, fmt)
                        break
                    except ValueError:
                        continue
                else:
                    # Could not parse date
                    logger.debug(f"Could not parse created_at: {created_at}")
                    return 1.0
            
            # Calculate days open
            days_open = (datetime.now() - created_at).days
            
            # Apply threshold-based multiplier
            for threshold, multiplier in self.config.TIME_THRESHOLDS:
                if days_open > threshold:
                    return multiplier
            
            return 1.0
            
        except Exception as e:
            logger.debug(f"Error calculating time multiplier: {e}")
            return 1.0
    
    def get_score_breakdown(self) -> Dict[str, Any]:
        """
        Get detailed breakdown of score calculation
        
        Returns:
            Dictionary with scoring details and statistics
        """
        if self._breakdown is not None:
            return self._breakdown
        
        try:
            # Ensure score is calculated
            score = self.calculate_score()
            
            # Count by severity
            severity_counts = Counter(
                self._normalize_severity(inc.get('severity'))
                for inc in self.incidents
            )
            
            # Count by status
            status_counts = Counter(
                self._normalize_status(inc.get('status'))
                for inc in self.incidents
            )
            
            # Calculate total penalties by category
            total_penalty = self.config.BASE_SCORE - score
            
            breakdown = {
                'overall_score': score,
                'base_score': self.config.BASE_SCORE,
                'total_penalty': round(total_penalty, 1),
                'total_incidents': len(self.incidents),
                'total_records': self.total_records,
                
                'severity_breakdown': {
                    'critical': severity_counts.get('critical', 0),
                    'high': severity_counts.get('high', 0),
                    'medium': severity_counts.get('medium', 0),
                    'low': severity_counts.get('low', 0)
                },
                
                'status_breakdown': {
                    'open': status_counts.get('open', 0),
                    'acknowledged': status_counts.get('acknowledged', 0),
                    'resolved': status_counts.get('resolved', 0),
                    'closed': status_counts.get('closed', 0)
                },
                
                'multipliers': {
                    'volume_multiplier': self._get_volume_multiplier(),
                    'avg_time_multiplier': self._calculate_avg_time_multiplier()
                },
                
                'score_grade': self._get_score_grade(score)
            }
            
            self._breakdown = breakdown
            return breakdown
            
        except Exception as e:
            logger.error(f"Error generating score breakdown: {e}", exc_info=True)
            return {
                'overall_score': 50.0,
                'error': str(e)
            }
    
    def _calculate_avg_time_multiplier(self) -> float:
        """Calculate average time multiplier across all open incidents"""
        try:
            open_incidents = [
                inc for inc in self.incidents
                if self._normalize_status(inc.get('status')) in ['open', 'acknowledged']
            ]
            
            if not open_incidents:
                return 1.0
            
            multipliers = [
                self._get_time_multiplier(inc)
                for inc in open_incidents
            ]
            
            return round(sum(multipliers) / len(multipliers), 2)
            
        except Exception:
            return 1.0
    
    def _get_score_grade(self, score: float) -> str:
        """Convert numeric score to letter grade"""
        if score >= 90:
            return 'A (Excellent)'
        elif score >= 80:
            return 'B (Good)'
        elif score >= 70:
            return 'C (Fair)'
        elif score >= 60:
            return 'D (Poor)'
        else:
            return 'F (Critical)'
    
    def get_key_metrics(self) -> Dict[str, Any]:
        """
        Get key metrics for report generation
        
        Returns:
            Dictionary with key metrics formatted for PDF reports
        """
        try:
            score = self.calculate_score()
            breakdown = self.get_score_breakdown()
            
            return {
                'overall_score': score,
                'total_records': self.total_records,
                'issues_count': len(self.incidents),
                'critical_issues': breakdown['severity_breakdown']['critical'],
                'high_issues': breakdown['severity_breakdown']['high'],
                'medium_issues': breakdown['severity_breakdown']['medium'],
                'low_issues': breakdown['severity_breakdown']['low'],
                'open_issues': breakdown['status_breakdown']['open'],
                'resolved_issues': breakdown['status_breakdown']['resolved']
            }
            
        except Exception as e:
            logger.error(f"Error getting key metrics: {e}", exc_info=True)
            return {
                'overall_score': 50.0,
                'total_records': self.total_records,
                'issues_count': len(self.incidents),
                'critical_issues': 0
            }


# Convenience function for quick score calculation
def calculate_data_quality_score(
    incidents: List[Dict[str, Any]],
    total_records: int = 10_000,
    config: Optional[ScoreCalculatorConfig] = None
) -> float:
    """
    Quick function to calculate data quality score
    
    Args:
        incidents: List of incident dictionaries
        total_records: Total records in data source
        config: Optional custom configuration
        
    Returns:
        Score between 0.0 and 100.0
    """
    calculator = SmartScoreCalculator(incidents, total_records, config)
    return calculator.calculate_score()
