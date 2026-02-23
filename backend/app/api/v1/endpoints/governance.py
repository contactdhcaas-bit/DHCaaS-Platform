# app/api/v1/endpoints/governance.py
"""
Data Governance Management Endpoints
Manages governance policies and violations
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.database import get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class GovernancePolicyCreate(BaseModel):
    """Request model for creating a governance policy"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    rule_type: str = Field(..., description="Type of governance rule")
    threshold: float = Field(..., description="Threshold value for the policy")
    severity: str = Field(default="medium", description="Severity level")
    enabled: bool = Field(default=True, description="Whether the policy is enabled")
    tags: List[str] = Field(default_factory=list, description="Policy tags")
    target_tables: List[str] = Field(default_factory=list, description="Target tables for the policy")


class GovernancePolicyUpdate(BaseModel):
    """Request model for updating a governance policy"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    rule_type: Optional[str] = None
    threshold: Optional[float] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None
    tags: Optional[List[str]] = None
    target_tables: Optional[List[str]] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/policies")
async def get_governance_policies():
    """
    Get all governance policies.
    
    Returns:
        List of governance policies (empty array if none exist)
    """
    try:
        db = get_database()
        
        # Fetch governance policies from MongoDB
        policies_cursor = db.governance_policies.find().sort("created_at", -1)
        policies = await policies_cursor.to_list(length=None)
        
        # Format response
        formatted_policies = []
        for policy in policies:
            formatted_policies.append({
                "id": str(policy.get("_id")),
                "name": policy.get("name", "Unnamed Policy"),
                "description": policy.get("description", ""),
                "rule_type": policy.get("rule_type", ""),
                "threshold": policy.get("threshold", 0),
                "enabled": policy.get("enabled", True),
                "severity": policy.get("severity", "medium"),
                "status": policy.get("status", "active"),
                "tags": policy.get("tags", []),
                "target_tables": policy.get("target_tables", []),
                "created_at": policy.get("created_at").isoformat() if policy.get("created_at") else None,
                "updated_at": policy.get("updated_at").isoformat() if policy.get("updated_at") else None,
                "violation_count": policy.get("violation_count", 0),
                "last_violation": policy.get("last_violation").isoformat() if policy.get("last_violation") else None,
            })
        
        # CRITICAL: Always return an array, never null
        return formatted_policies
        
    except Exception as e:
        # Even on error, return empty array to prevent frontend crash
        print(f"Error fetching governance policies: {str(e)}")
        return []


@router.get("/violations")
async def get_governance_violations(resolved: bool = Query(default=False)):
    """
    Get governance violations.
    
    Args:
        resolved: Filter by resolution status (default: False = unresolved only)
    
    Returns:
        List of violations (empty array if none exist)
    """
    try:
        db = get_database()
        
        # Build query filter
        query_filter = {"resolved": resolved}
        
        # Fetch violations from MongoDB
        violations_cursor = db.governance_violations.find(query_filter).sort("detected_at", -1)
        violations = await violations_cursor.to_list(length=None)
        
        # Format response
        formatted_violations = []
        for violation in violations:
            formatted_violations.append({
                "id": str(violation.get("_id")),
                "policy_id": violation.get("policy_id", ""),
                "policy_name": violation.get("policy_name", "Unknown Policy"),
                "scan_id": violation.get("scan_id", ""),
                "table_name": violation.get("table_name"),
                "message": violation.get("message", "Policy violation detected"),
                "severity": violation.get("severity", "medium"),
                "rule_type": violation.get("rule_type", ""),
                "threshold": violation.get("threshold", 0),
                "actual_value": violation.get("actual_value", 0),
                "violation_percentage": violation.get("violation_percentage", 0),
                "detected_at": violation.get("detected_at").isoformat() if violation.get("detected_at") else None,
                "resolved": violation.get("resolved", False),
            })
        
        # CRITICAL: Always return an array, never null
        return formatted_violations
        
    except Exception as e:
        # Even on error, return empty array to prevent frontend crash
        print(f"Error fetching governance violations: {str(e)}")
        return []


@router.post("/policies")
async def create_governance_policy(policy: GovernancePolicyCreate):
    """
    Create a new governance policy.
    
    Args:
        policy: Policy data from request body
    
    Returns:
        Created policy object
    """
    try:
        db = get_database()
        
        # Create policy document
        policy_doc = {
            "name": policy.name,
            "description": policy.description or "",
            "rule_type": policy.rule_type,
            "threshold": policy.threshold,
            "severity": policy.severity.lower(),
            "enabled": policy.enabled,
            "status": "active",
            "tags": policy.tags,
            "target_tables": policy.target_tables,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "violation_count": 0,
            "last_violation": None,
        }
        
        # Insert into MongoDB
        result = await db.governance_policies.insert_one(policy_doc)
        
        # Return created policy
        policy_doc["id"] = str(result.inserted_id)
        policy_doc["created_at"] = policy_doc["created_at"].isoformat()
        policy_doc["updated_at"] = policy_doc["updated_at"].isoformat()
        
        return policy_doc
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create governance policy: {str(e)}"
        )


@router.put("/policies/{policy_id}")
async def update_governance_policy(policy_id: str, policy: GovernancePolicyUpdate):
    """
    Update an existing governance policy.
    
    Args:
        policy_id: Policy ID
        policy: Updated policy data from request body
    
    Returns:
        Updated policy object
    """
    try:
        db = get_database()
        
        # Build update document (only include non-None fields)
        update_doc = {"updated_at": datetime.utcnow()}
        
        if policy.name is not None:
            update_doc["name"] = policy.name
        if policy.description is not None:
            update_doc["description"] = policy.description
        if policy.rule_type is not None:
            update_doc["rule_type"] = policy.rule_type
        if policy.threshold is not None:
            update_doc["threshold"] = policy.threshold
        if policy.severity is not None:
            update_doc["severity"] = policy.severity.lower()
        if policy.enabled is not None:
            update_doc["enabled"] = policy.enabled
        if policy.tags is not None:
            update_doc["tags"] = policy.tags
        if policy.target_tables is not None:
            update_doc["target_tables"] = policy.target_tables
        
        # Try to update by _id
        if ObjectId.is_valid(policy_id):
            result = await db.governance_policies.update_one(
                {"_id": ObjectId(policy_id)},
                {"$set": update_doc}
            )
        else:
            result = await db.governance_policies.update_one(
                {"id": policy_id},
                {"$set": update_doc}
            )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Fetch and return updated policy
        if ObjectId.is_valid(policy_id):
            updated_policy = await db.governance_policies.find_one({"_id": ObjectId(policy_id)})
        else:
            updated_policy = await db.governance_policies.find_one({"id": policy_id})
        
        if updated_policy:
            updated_policy["id"] = str(updated_policy.get("_id"))
            updated_policy["created_at"] = updated_policy.get("created_at").isoformat() if updated_policy.get("created_at") else None
            updated_policy["updated_at"] = updated_policy.get("updated_at").isoformat() if updated_policy.get("updated_at") else None
            if updated_policy.get("last_violation"):
                updated_policy["last_violation"] = updated_policy["last_violation"].isoformat()
            return updated_policy
        
        raise HTTPException(status_code=404, detail="Policy not found after update")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update governance policy: {str(e)}"
        )


@router.delete("/policies/{policy_id}")
async def delete_governance_policy(policy_id: str):
    """
    Delete a governance policy by ID.
    
    Args:
        policy_id: Policy ID
    
    Returns:
        Success message
    """
    try:
        db = get_database()
        
        # Try to delete by _id
        if ObjectId.is_valid(policy_id):
            result = await db.governance_policies.delete_one({"_id": ObjectId(policy_id)})
        else:
            result = await db.governance_policies.delete_one({"id": policy_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        return {
            "success": True,
            "message": "Policy deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete governance policy: {str(e)}"
        )
