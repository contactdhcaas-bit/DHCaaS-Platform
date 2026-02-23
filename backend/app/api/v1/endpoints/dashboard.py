# app/api/v1/endpoints/dashboard.py
"""
Dashboard Statistics Endpoints
"""


from fastapi import APIRouter, Header
from typing import Optional
from app.core.database import get_database


router = APIRouter()



@router.get("/stats")
async def get_dashboard_stats(authorization: Optional[str] = Header(None)):
    """Get dashboard statistics."""
    
    try:
        db = get_database()
        
        # Count totals
        total_scans = await db.scan_jobs.count_documents({})
        active_incidents = await db.violations.count_documents({})
        total_rules = await db.data_quality_rules.count_documents({})
        
        # Recent scans
        recent_scans = await db.scan_jobs.find().sort("created_at", -1).limit(5).to_list(5)
        
        # Recent incidents
        recent_incidents = await db.violations.find().sort("detected_at", -1).limit(5).to_list(5)
        
        return {
            "stats": {
                "total_scans": total_scans,
                "active_incidents": active_incidents,
                "total_sources": 0,
                "total_assets": total_rules,
            },
            "recent_scans": [
                {
                    "id": str(scan.get("job_id", scan["_id"])),
                    "name": scan.get("filename", "Unnamed"),
                    "status": scan.get("status", "unknown"),
                    "created_at": scan.get("created_at"),
                }
                for scan in recent_scans
            ],
            "recent_incidents": [
                {
                    "id": str(incident["_id"]),
                    "job_id": incident.get("job_id") or incident.get("scan_id") or incident.get("dataset_id") or "unknown",
                    "rule_id": incident.get("rule_id") or incident.get("rule_name") or "unknown",
                    "title": incident.get("rule_name", "Incident"),
                    "severity": incident.get("severity", "low"),
                    "status": "resolved" if incident.get("resolved", False) else "open",
                    "created_at": incident.get("detected_at"),
                }
                for incident in recent_incidents
            ],
        }
        
    except Exception as e:
        return {
            "stats": {
                "total_scans": 0,
                "active_incidents": 0,
                "total_sources": 0,
                "total_assets": 0,
            },
            "recent_scans": [],
            "recent_incidents": [],
        }
