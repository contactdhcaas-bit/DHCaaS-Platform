# backend/services/compliance_service.py
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from bson import ObjectId


class ComplianceService:
    """
    Service for calculating compliance scores and generating audit reports.
    Implements GDPR/CNDP compliance rules and scoring logic.
    """

    # Compliance thresholds
    COMPLIANT_THRESHOLD = 80
    AT_RISK_THRESHOLD = 60
    
    # Severity weights for incidents
    SEVERITY_WEIGHTS = {
        "critical": 10,
        "high": 5,
        "medium": 2,
        "low": 1
    }
    
    # Category weights
    CATEGORY_WEIGHTS = {
        "pii": 0.40,  # 40% weight
        "financial": 0.30,  # 30% weight
        "security": 0.30  # 30% weight
    }

    def __init__(self, scans_col, incidents_col):
        """
        Initialize the compliance service with database collections.
        
        Args:
            scans_col: MongoDB collection for scans
            incidents_col: MongoDB collection for incidents
        """
        self.scans_col = scans_col
        self.incidents_col = incidents_col

    async def calculate_compliance_score(
        self, 
        days: int = 30,
        owner: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate overall compliance score based on scans and incidents.
        
        Args:
            days: Number of days to look back (default 30)
            owner: Optional filter by owner email
            
        Returns:
            Dictionary with compliance score and breakdown
        """
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Build query filters
        date_filter = {
            "created_at": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }
        
        if owner:
            date_filter["owner"] = owner
        
        # Get scans and incidents
        scans = await self.scans_col.find(date_filter).to_list(length=1000)
        incidents = await self.incidents_col.find(date_filter).to_list(length=1000)
        
        # Calculate category scores
        pii_score = await self._calculate_pii_score(scans, incidents)
        financial_score = await self._calculate_financial_score(scans, incidents)
        security_score = await self._calculate_security_score(incidents)
        
        # Calculate weighted overall score
        overall_score = (
            pii_score * self.CATEGORY_WEIGHTS["pii"] +
            financial_score * self.CATEGORY_WEIGHTS["financial"] +
            security_score * self.CATEGORY_WEIGHTS["security"]
        )
        
        # Round to 1 decimal place
        overall_score = round(overall_score, 1)
        
        # Determine compliance status
        compliance_status = self._determine_status(overall_score)
        
        # Get incident statistics
        incident_stats = self._calculate_incident_stats(incidents)
        
        return {
            "overall_score": overall_score,
            "compliance_status": compliance_status,
            "breakdown": {
                "pii": {
                    "score": round(pii_score, 1),
                    "weight": self.CATEGORY_WEIGHTS["pii"] * 100,
                    "description": "Personal Identifiable Information protection"
                },
                "financial": {
                    "score": round(financial_score, 1),
                    "weight": self.CATEGORY_WEIGHTS["financial"] * 100,
                    "description": "Financial data security"
                },
                "security": {
                    "score": round(security_score, 1),
                    "weight": self.CATEGORY_WEIGHTS["security"] * 100,
                    "description": "Overall security posture"
                }
            },
            "incident_stats": incident_stats,
            "total_scans": len(scans),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days
            },
            "last_updated": datetime.utcnow().isoformat()
        }

    async def _calculate_pii_score(
        self, 
        scans: List[Dict], 
        incidents: List[Dict]
    ) -> float:
        """Calculate PII protection score."""
        if not scans:
            return 100.0  # No data = perfect score by default
        
        # Count PII incidents
        pii_incidents = [
            inc for inc in incidents 
            if inc.get("type", "").lower() in ["pii exposure", "data leak", "gdpr violation"]
        ]
        
        # Calculate PII exposure rate
        total_scans = len(scans)
        pii_violations = len(pii_incidents)
        
        # Base score starts at 100
        base_score = 100.0
        
        # Deduct points for violations
        if pii_violations > 0:
            # Deduct more points for higher severity
            for incident in pii_incidents:
                severity = incident.get("severity", "low")
                weight = self.SEVERITY_WEIGHTS.get(severity, 1)
                base_score -= weight
        
        # Ensure score doesn't go below 0
        return max(0.0, base_score)

    async def _calculate_financial_score(
        self, 
        scans: List[Dict], 
        incidents: List[Dict]
    ) -> float:
        """Calculate financial data security score."""
        if not scans:
            return 100.0
        
        # Count financial incidents
        financial_incidents = [
            inc for inc in incidents 
            if inc.get("type", "").lower() in ["financial data exposure", "payment data leak"]
        ]
        
        base_score = 100.0
        
        for incident in financial_incidents:
            severity = incident.get("severity", "low")
            weight = self.SEVERITY_WEIGHTS.get(severity, 1)
            base_score -= weight * 1.5  # Financial is more critical
        
        return max(0.0, base_score)

    async def _calculate_security_score(self, incidents: List[Dict]) -> float:
        """Calculate overall security posture score."""
        if not incidents:
            return 100.0
        
        # Count open incidents by severity
        open_incidents = [inc for inc in incidents if inc.get("status") == "open"]
        
        base_score = 100.0
        
        # Heavy penalty for open critical/high incidents
        for incident in open_incidents:
            severity = incident.get("severity", "low")
            weight = self.SEVERITY_WEIGHTS.get(severity, 1)
            
            # Double penalty for unresolved issues
            base_score -= weight * 2
        
        # Light penalty for resolved incidents (they happened)
        resolved_incidents = [inc for inc in incidents if inc.get("status") == "resolved"]
        for incident in resolved_incidents:
            severity = incident.get("severity", "low")
            weight = self.SEVERITY_WEIGHTS.get(severity, 1)
            base_score -= weight * 0.5
        
        return max(0.0, base_score)

    def _determine_status(self, score: float) -> str:
        """Determine compliance status based on score."""
        if score >= self.COMPLIANT_THRESHOLD:
            return "Compliant"
        elif score >= self.AT_RISK_THRESHOLD:
            return "At Risk"
        else:
            return "Critical"

    def _calculate_incident_stats(self, incidents: List[Dict]) -> Dict[str, Any]:
        """Calculate incident statistics."""
        total = len(incidents)
        
        by_severity = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        by_status = {
            "open": 0,
            "investigating": 0,
            "resolved": 0
        }
        
        for incident in incidents:
            severity = incident.get("severity", "low")
            status = incident.get("status", "open")
            
            if severity in by_severity:
                by_severity[severity] += 1
            
            if status in by_status:
                by_status[status] += 1
        
        return {
            "total": total,
            "by_severity": by_severity,
            "by_status": by_status,
            "open_critical": by_severity["critical"] if by_status.get("open", 0) > 0 else 0
        }

    async def get_compliance_trend(
        self, 
        days: int = 90,
        owner: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get compliance score trend over time.
        
        Args:
            days: Number of days to look back
            owner: Optional filter by owner
            
        Returns:
            List of score data points over time
        """
        # Generate weekly data points
        end_date = datetime.utcnow()
        trend_data = []
        
        # Calculate score for each week
        weeks = min(days // 7, 12)  # Max 12 weeks
        
        for i in range(weeks, 0, -1):
            week_end = end_date - timedelta(days=i * 7)
            week_start = week_end - timedelta(days=7)
            
            # Get data for this week
            date_filter = {
                "created_at": {
                    "$gte": week_start.isoformat(),
                    "$lte": week_end.isoformat()
                }
            }
            
            if owner:
                date_filter["owner"] = owner
            
            scans = await self.scans_col.find(date_filter).to_list(length=1000)
            incidents = await self.incidents_col.find(date_filter).to_list(length=1000)
            
            # Calculate scores
            pii_score = await self._calculate_pii_score(scans, incidents)
            financial_score = await self._calculate_financial_score(scans, incidents)
            security_score = await self._calculate_security_score(incidents)
            
            overall_score = (
                pii_score * self.CATEGORY_WEIGHTS["pii"] +
                financial_score * self.CATEGORY_WEIGHTS["financial"] +
                security_score * self.CATEGORY_WEIGHTS["security"]
            )
            
            trend_data.append({
                "date": week_end.strftime("%Y-%m-%d"),
                "score": round(overall_score, 1),
                "scans": len(scans),
                "incidents": len(incidents)
            })
        
        return trend_data

    async def generate_audit_report(
        self,
        owner: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive audit report.
        
        Args:
            owner: Optional filter by owner
            
        Returns:
            Complete audit report data
        """
        # Get compliance score
        compliance_data = await self.calculate_compliance_score(days=30, owner=owner)
        
        # Get trend data
        trend_data = await self.get_compliance_trend(days=90, owner=owner)
        
        # Get recent incidents
        incident_filter = {}
        if owner:
            incident_filter["owner"] = owner
        
        recent_incidents = await self.incidents_col.find(incident_filter)\
            .sort("created_at", -1)\
            .limit(20)\
            .to_list(length=20)
        
        # Format incidents
        formatted_incidents = []
        for inc in recent_incidents:
            if "_id" in inc:
                inc["id"] = str(inc["_id"])
                del inc["_id"]
            formatted_incidents.append(inc)
        
        return {
            "report_id": f"RPT-{int(datetime.utcnow().timestamp())}",
            "generated_at": datetime.utcnow().isoformat(),
            "compliance": compliance_data,
            "trend": trend_data,
            "recent_incidents": formatted_incidents,
            "recommendations": self._generate_recommendations(compliance_data)
        }

    def _generate_recommendations(self, compliance_data: Dict) -> List[str]:
        """Generate recommendations based on compliance score."""
        recommendations = []
        
        score = compliance_data["overall_score"]
        incident_stats = compliance_data["incident_stats"]
        
        if score < 60:
            recommendations.append("🚨 URGENT: Immediate action required to address critical compliance gaps")
        
        if incident_stats["by_status"]["open"] > 5:
            recommendations.append("⚠️ Multiple open incidents detected - prioritize incident resolution")
        
        if incident_stats["by_severity"]["critical"] > 0:
            recommendations.append("🔴 Critical severity incidents require immediate attention")
        
        if compliance_data["breakdown"]["pii"]["score"] < 70:
            recommendations.append("📋 Review PII handling procedures and implement data encryption")
        
        if compliance_data["breakdown"]["security"]["score"] < 70:
            recommendations.append("🔒 Strengthen security controls and access management")
        
        if not recommendations:
            recommendations.append("✅ Continue monitoring and maintaining current compliance practices")
        
        return recommendations
