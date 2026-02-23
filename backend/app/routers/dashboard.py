"""
Dashboard Router
Provides real-time statistics and analytics for the dashboard
"""

from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from app.core.database import get_database
from app.dependencies.auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def serialize_objectid(obj):
    """Convert ObjectId to string for JSON serialization"""
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Get real-time dashboard statistics with recent activity
    
    Returns:
        - stats: Dashboard statistics (total_scans, active_incidents, etc.)
        - recent_scans: Array of recent scan objects
        - recent_incidents: Array of recent incident objects with job_id and rule_id
        - user: Current user information
    """
    try:
        user_id = current_user["user_id"]
        
        # Collections
        scans_col = db.dhcaas.scans
        violations_col = db.dhcaas.violations
        api_keys_col = db.dhcaas.api_keys
        
        # ===== STATS SECTION =====
        
        # 1. Total Scans
        total_scans = await scans_col.count_documents({"owner_id": user_id})
        
        # 2. Active Incidents (violations with status != resolved)
        active_incidents = await violations_col.count_documents({
            "status": {"$ne": "resolved"}
        })
        
        # 3. Total Sources (mock for now - will be real when sources collection exists)
        total_sources = 0
        
        # 4. Total Assets (count distinct datasets from scans)
        pipeline = [
            {"$match": {"owner_id": user_id}},
            {"$group": {"_id": "$dataset_id"}},
            {"$count": "total"}
        ]
        assets_result = await scans_col.aggregate(pipeline).to_list(length=1)
        total_assets = assets_result[0]["total"] if assets_result else 0
        
        
        # ===== RECENT SCANS (Last 5) =====
        recent_scans_cursor = scans_col.find(
            {"owner_id": user_id}
        ).sort("created_at", -1).limit(5)
        
        recent_scans = []
        async for scan in recent_scans_cursor:
            recent_scans.append({
                "id": str(scan["_id"]),
                "name": scan.get("name", scan.get("dataset_id", "Unnamed Scan")),
                "status": scan.get("status", "unknown"),
                "created_at": scan.get("created_at", datetime.utcnow()).isoformat()
            })
        
        
        # ===== RECENT INCIDENTS (Last 5 with job_id and rule_id) =====
        recent_incidents_cursor = violations_col.find(
            {"status": {"$ne": "resolved"}}
        ).sort("created_at", -1).limit(5)
        
        recent_incidents = []
        async for incident in recent_incidents_cursor:
            # Extract job_id and rule_id
            job_id = incident.get("dataset_id") or incident.get("scan_id") or incident.get("job_id", "unknown")
            rule_id = incident.get("rule_id") or incident.get("policy_id") or str(incident["_id"])
            
            recent_incidents.append({
                "id": str(incident["_id"]),
                "title": incident.get("title", "Incident"),
                "severity": incident.get("severity", "medium"),
                "status": incident.get("status", "open"),
                "created_at": incident.get("created_at", datetime.utcnow()).isoformat(),
                "job_id": job_id,      # ← ADDED
                "rule_id": rule_id     # ← ADDED
            })
        
        
        # ===== USER INFO =====
        user_info = {
            "email": current_user.get("email", ""),
            "role": current_user.get("role", "user"),
            "full_name": current_user.get("full_name", current_user.get("email", "User"))
        }
        
        
        # ===== FINAL RESPONSE =====
        response = {
            "stats": {
                "total_scans": total_scans,
                "active_incidents": active_incidents,
                "total_sources": total_sources,
                "total_assets": total_assets
            },
            "recent_scans": recent_scans,
            "recent_incidents": recent_incidents,
            "user": user_info
        }
        
        logger.info(f"✅ Dashboard stats fetched for user: {current_user['email']}")
        logger.info(f"📊 Stats: {total_scans} scans, {active_incidents} incidents, {total_assets} assets")
        logger.info(f"📋 Recent: {len(recent_scans)} scans, {len(recent_incidents)} incidents")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )
