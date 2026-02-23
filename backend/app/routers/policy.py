from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import logging

from app.core.database import get_database
from app.models.policy import (
    Policy, PolicyCreate, PolicyUpdate, PolicyStatus,
    PolicySeverity, Violation, EvaluationResult
)
from app.core.security import get_current_active_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/policies", tags=["Policies"])

def generate_policy_id():
    return f"policy_{uuid.uuid4().hex[:12]}"

@router.get("/", response_model=List[Policy])
async def get_policies(
    enabled_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    try:
        policies_col = db.dhcaas.policies
        query = {"$or": [{"is_global": True}, {"owner_id": current_user.id}]}
        if enabled_only:
            query["enabled"] = True
        cursor = policies_col.find(query, {"_id": 0}).sort("created_at", -1)
        policies = await cursor.to_list(length=None)
        return policies
    except Exception as e:
        logger.error(f"Error fetching policies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Policy, status_code=201)
async def create_policy(
    policy_data: PolicyCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    try:
        policies_col = db.dhcaas.policies
        policy_id = generate_policy_id()
        policy_doc = {
            "id": policy_id,
            "owner_id": current_user.id,
            "is_global": False,
            "name": policy_data.name,
            "description": policy_data.description,
            "rule_type": policy_data.rule_type,
            "threshold": policy_data.threshold,
            "enabled": policy_data.enabled,
            "severity": policy_data.severity,
            "status": "enabled" if policy_data.enabled else "disabled",
            "tags": policy_data.tags or [],
            "target_tables": policy_data.target_tables or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user.email,
            "violation_count": 0
        }
        await policies_col.insert_one(policy_doc)
        policy_doc.pop("_id", None)
        return Policy(**policy_doc)
    except Exception as e:
        logger.error(f"Error creating policy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
