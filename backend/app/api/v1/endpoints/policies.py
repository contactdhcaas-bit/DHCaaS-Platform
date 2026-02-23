# app/api/v1/endpoints/policies.py
"""
Policies Management Endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.database import get_database
from datetime import datetime

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class PolicyCreate(BaseModel):
    """Request model for creating a policy"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    rule_type: str = Field(..., description="Type of rule (e.g., completeness, accuracy, custom)")
    threshold: Optional[float] = Field(None, description="Threshold value for the policy")
    severity: str = Field(default="MEDIUM", description="Severity level (LOW, MEDIUM, HIGH, CRITICAL)")
    enabled: bool = Field(default=True, description="Whether the policy is enabled")


class PolicyUpdate(BaseModel):
    """Request model for updating a policy"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    rule_type: Optional[str] = None
    threshold: Optional[float] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
async def get_policies(enabled_only: bool = Query(default=False)):
    """
    Get all policies from the database.
    
    Args:
        enabled_only: If True, return only enabled policies
    
    Returns:
        List of policies
    """
    try:
        db = get_database()
        
        # Build query filter
        query_filter = {}
        if enabled_only:
            query_filter["enabled"] = True
        
        # Fetch policies from MongoDB
        policies_cursor = db.policies.find(query_filter).sort("name", 1)
        policies = await policies_cursor.to_list(length=None)
        
        # Format response
        formatted_policies = []
        for policy in policies:
            formatted_policies.append({
                "id": str(policy.get("_id")),
                "policy_id": policy.get("policy_id", str(policy.get("_id"))),
                "name": policy.get("name", "Unnamed Policy"),
                "description": policy.get("description", ""),
                "rule_type": policy.get("rule_type", ""),
                "threshold": policy.get("threshold"),
                "severity": policy.get("severity", "MEDIUM"),
                "status": policy.get("status", "active"),
                "enabled": policy.get("enabled", True),
                "violations_count": policy.get("violations_count", 0),
                "created_at": policy.get("created_at"),
                "updated_at": policy.get("updated_at"),
            })
        
        return {
            "success": True,
            "count": len(formatted_policies),
            "policies": formatted_policies
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch policies: {str(e)}"
        )


@router.post("/")
async def create_policy(policy: PolicyCreate):
    """
    Create a new policy.
    
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
            "severity": policy.severity.upper(),
            "status": "active",
            "enabled": policy.enabled,
            "violations_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Insert into MongoDB
        result = await db.policies.insert_one(policy_doc)
        
        # Return created policy
        policy_doc["id"] = str(result.inserted_id)
        policy_doc["policy_id"] = str(result.inserted_id)
        policy_doc["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Policy created successfully",
            "policy": policy_doc
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create policy: {str(e)}"
        )


@router.get("/{policy_id}")
async def get_policy(policy_id: str):
    """
    Get a single policy by ID.
    
    Args:
        policy_id: Policy ID
    
    Returns:
        Policy object
    """
    try:
        db = get_database()
        
        # Try to find by policy_id field first, then by _id
        policy = await db.policies.find_one({"policy_id": policy_id})
        
        if not policy:
            from bson import ObjectId
            if ObjectId.is_valid(policy_id):
                policy = await db.policies.find_one({"_id": ObjectId(policy_id)})
        
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Format response
        return {
            "success": True,
            "policy": {
                "id": str(policy.get("_id")),
                "policy_id": policy.get("policy_id", str(policy.get("_id"))),
                "name": policy.get("name", "Unnamed Policy"),
                "description": policy.get("description", ""),
                "rule_type": policy.get("rule_type", ""),
                "threshold": policy.get("threshold"),
                "severity": policy.get("severity", "MEDIUM"),
                "status": policy.get("status", "active"),
                "enabled": policy.get("enabled", True),
                "violations_count": policy.get("violations_count", 0),
                "created_at": policy.get("created_at"),
                "updated_at": policy.get("updated_at"),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch policy: {str(e)}"
        )


@router.put("/{policy_id}")
async def update_policy(policy_id: str, policy: PolicyUpdate):
    """
    Update an existing policy.
    
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
            update_doc["severity"] = policy.severity.upper()
        if policy.enabled is not None:
            update_doc["enabled"] = policy.enabled
        
        # Try to update by policy_id first, then by _id
        result = await db.policies.update_one(
            {"policy_id": policy_id},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            from bson import ObjectId
            if ObjectId.is_valid(policy_id):
                result = await db.policies.update_one(
                    {"_id": ObjectId(policy_id)},
                    {"$set": update_doc}
                )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Fetch and return updated policy
        updated_policy = await db.policies.find_one({"policy_id": policy_id})
        if not updated_policy:
            from bson import ObjectId
            if ObjectId.is_valid(policy_id):
                updated_policy = await db.policies.find_one({"_id": ObjectId(policy_id)})
        
        return {
            "success": True,
            "message": "Policy updated successfully",
            "policy": {
                "id": str(updated_policy.get("_id")),
                "policy_id": updated_policy.get("policy_id", str(updated_policy.get("_id"))),
                "name": updated_policy.get("name"),
                "description": updated_policy.get("description"),
                "rule_type": updated_policy.get("rule_type"),
                "threshold": updated_policy.get("threshold"),
                "severity": updated_policy.get("severity"),
                "status": updated_policy.get("status"),
                "enabled": updated_policy.get("enabled"),
                "violations_count": updated_policy.get("violations_count", 0),
                "created_at": updated_policy.get("created_at"),
                "updated_at": updated_policy.get("updated_at"),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update policy: {str(e)}"
        )


@router.delete("/{policy_id}")
async def delete_policy(policy_id: str):
    """
    Delete a policy by ID.
    
    Args:
        policy_id: Policy ID
    
    Returns:
        Success message
    """
    try:
        db = get_database()
        
        # Try to delete by policy_id first, then by _id
        result = await db.policies.delete_one({"policy_id": policy_id})
        
        if result.deleted_count == 0:
            from bson import ObjectId
            if ObjectId.is_valid(policy_id):
                result = await db.policies.delete_one({"_id": ObjectId(policy_id)})
        
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
            detail=f"Failed to delete policy: {str(e)}"
        )
