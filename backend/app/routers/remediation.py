"""
DHCaaS Remediation API Endpoints
Generate AI-powered remediation recommendations
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient
import os

from app.services.remediation_engine import SmartRemediationEngine, generate_remediation_report

router = APIRouter()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", 
    "mongodb+srv://contactdhcaas_db_user:AfeaV2zNa3zKogsA@dhcaas-core.kekruf0.mongodb.net/dhcaas?retryWrites=true&w=majority&appName=dhcaas-core")
client = AsyncIOMotorClient(MONGODB_URL)
db = client["dhcaas"]


@router.get("/generate", response_model=Dict[str, Any])
async def generate_remediation_plan_for_all():
    """
    Generate remediation plan for all open incidents
    
    Returns comprehensive remediation report with SQL fixes
    """
    
    # Fetch all open incidents from MongoDB
    incidents_cursor = db.incidents.find({"status": {"$in": ["open", "in_progress"]}})
    incidents = await incidents_cursor.to_list(length=1000)
    
    if not incidents:
        return {
            "success": True,
            "message": "No open incidents found",
            "total_incidents": 0,
            "remediation_plan": {}
        }
    
    # Generate remediation report
    report = generate_remediation_report(incidents)
    
    return {
        "success": True,
        "message": f"Generated remediation plan for {len(incidents)} incidents",
        **report
    }


@router.get("/incident/{incident_id}", response_model=Dict[str, Any])
async def get_incident_remediation(incident_id: str):
    """
    Get detailed remediation recommendation for specific incident
    
    Args:
        incident_id: Incident ID (e.g., INC-2026-001)
    
    Returns:
        Detailed remediation with SQL fixes and manual steps
    """
    
    # Find incident in MongoDB
    incident = await db.incidents.find_one({"incident_id": incident_id})
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found"
        )
    
    # Generate remediation
    engine = SmartRemediationEngine()
    remediation = engine._generate_single_remediation(incident)
    
    if not remediation:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate remediation recommendation"
        )
    
    return {
        "success": True,
        "incident_id": incident_id,
        "remediation": remediation
    }


@router.post("/execute-preview", response_model=Dict[str, Any])
async def preview_remediation_execution(incident_ids: List[str]):
    """
    Preview what would happen if remediation is executed
    (Dry-run mode - does not execute SQL)
    
    Args:
        incident_ids: List of incident IDs to preview
    
    Returns:
        Preview of SQL fixes and estimated impact
    """
    
    if not incident_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No incident IDs provided"
        )
    
    # Fetch incidents
    incidents_cursor = db.incidents.find({"incident_id": {"$in": incident_ids}})
    incidents = await incidents_cursor.to_list(length=len(incident_ids))
    
    if not incidents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No incidents found for provided IDs"
        )
    
    # Generate remediation plan
    engine = SmartRemediationEngine()
    remediation_plan = engine.generate_remediation_plan(incidents)
    
    # Build preview
    preview = {
        "total_incidents": len(incidents),
        "remediations": [],
        "estimated_total_effort": "0 hours",
        "warning": "THIS IS A PREVIEW - No SQL will be executed"
    }
    
    total_effort_hours = 0
    
    for incident_id, remediation in remediation_plan.items():
        effort_str = remediation.get('estimated_effort', '0 hours')
        
        # Extract hours from effort string
        if 'hour' in effort_str:
            try:
                hours = int(effort_str.split()[0].replace('<', '').replace('>', ''))
                total_effort_hours += hours
            except:
                pass
        
        preview["remediations"].append({
            "incident_id": incident_id,
            "priority": remediation.get('priority', 'unknown'),
            "action": remediation.get('suggested_action', 'N/A'),
            "database_type": remediation.get('database_type', 'unknown'),
            "sql_preview": remediation.get('sql_fix', '')[:300] + "...",
            "affected_rows": remediation.get('estimated_effort', 'Unknown'),
            "impact": remediation.get('impact_analysis', 'N/A')
        })
    
    preview["estimated_total_effort"] = f"{total_effort_hours} hours"
    
    return {
        "success": True,
        **preview
    }


@router.get("/statistics", response_model=Dict[str, Any])
async def get_remediation_statistics():
    """
    Get statistics about remediations needed across all incidents
    
    Returns:
        Summary statistics by priority, database type, and category
    """
    
    # Fetch all open incidents
    incidents_cursor = db.incidents.find({"status": {"$in": ["open", "in_progress"]}})
    incidents = await incidents_cursor.to_list(length=1000)
    
    if not incidents:
        return {
            "success": True,
            "total_incidents": 0,
            "statistics": {}
        }
    
    # Generate remediation report
    report = generate_remediation_report(incidents)
    
    return {
        "success": True,
        "total_incidents": report['total_incidents'],
        "statistics": {
            "priority_breakdown": report['priority_breakdown'],
            "type_breakdown": report['type_breakdown'],
            "immediate_actions": report['summary']['immediate_actions'],
            "high_priority_actions": report['summary']['high_priority_actions'],
            "estimated_total_effort": report['summary']['estimated_total_effort']
        }
    }
