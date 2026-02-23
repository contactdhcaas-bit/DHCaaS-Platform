"""
Data Quality Rules API Endpoints
REST API for managing rules, executing validations, and viewing violations
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.models.rule import (
    DataQualityRuleCreate,
    DataQualityRuleUpdate,
    DataQualityRuleResponse,
    DataQualityRuleInDB,
    RuleViolationResponse,
    RuleType,
    Severity,
    RuleStatus
)
from app.core.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Data Quality Rules"])


# ============================================================================
# RULE CRUD ENDPOINTS
# ============================================================================

@router.post("/", response_model=DataQualityRuleResponse, status_code=201)
async def create_new_rule(rule: DataQualityRuleCreate):
    """
    Create a new data quality rule.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        rule_data = DataQualityRuleInDB(**rule.dict()).dict()
        result = await db.data_quality_rules.insert_one(rule_data)
        
        created_rule = await db.data_quality_rules.find_one({"_id": result.inserted_id})
        
        logger.info(f"✅ Rule created: {rule.rule_name} ({rule.rule_type})")
        
        return DataQualityRuleResponse(**created_rule)
        
    except Exception as e:
        logger.error(f"❌ Error creating rule: {e}")
        raise HTTPException(status_code=500, detail="Failed to create rule")


@router.get("/", response_model=List[DataQualityRuleResponse])
async def list_all_rules(
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    status: Optional[RuleStatus] = None
):
    """
    List all data quality rules with pagination.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        query = {}
        if status:
            query["status"] = status.value
        
        cursor = db.data_quality_rules.find(query).skip(skip).limit(limit)
        rules = await cursor.to_list(length=limit)
        
        return [DataQualityRuleResponse(**rule) for rule in rules]
        
    except Exception as e:
        logger.error(f"❌ Error listing rules: {e}")
        raise HTTPException(status_code=500, detail="Failed to list rules")


@router.get("/{rule_id}", response_model=DataQualityRuleResponse)
async def get_rule_details(rule_id: str):
    """
    Get details of a specific rule.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        rule = await db.data_quality_rules.find_one({"rule_id": rule_id})
        
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule not found: {rule_id}")
        
        return DataQualityRuleResponse(**rule)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch rule")


@router.put("/{rule_id}", response_model=DataQualityRuleResponse)
async def update_existing_rule(rule_id: str, update_data: DataQualityRuleUpdate):
    """
    Update an existing rule.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.data_quality_rules.update_one(
            {"rule_id": rule_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Rule not found: {rule_id}")
        
        updated_rule = await db.data_quality_rules.find_one({"rule_id": rule_id})
        
        logger.info(f"✅ Rule updated: {rule_id}")
        
        return DataQualityRuleResponse(**updated_rule)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update rule")


@router.delete("/{rule_id}", status_code=200)
async def delete_existing_rule(
    rule_id: str,
    soft_delete: bool = Query(True, description="Soft delete (archive) or hard delete")
):
    """
    Delete a rule (soft or hard delete).
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        if soft_delete:
            result = await db.data_quality_rules.update_one(
                {"rule_id": rule_id},
                {"$set": {"status": "ARCHIVED", "updated_at": datetime.utcnow()}}
            )
            action = "archived"
        else:
            result = await db.data_quality_rules.delete_one({"rule_id": rule_id})
            action = "deleted"
        
        if result.matched_count == 0 if soft_delete else result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Rule not found: {rule_id}")
        
        logger.info(f"✅ Rule {action}: {rule_id}")
        
        return {
            "message": f"Rule {action} successfully",
            "rule_id": rule_id,
            "action": action
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete rule")


# ============================================================================
# DATASET-SPECIFIC RULE ENDPOINTS
# ============================================================================

@router.get("/dataset/{job_id}", response_model=List[DataQualityRuleResponse])
async def get_rules_for_dataset(
    job_id: str,
    active_only: bool = Query(False, description="Return only active rules"),
    rule_type: Optional[RuleType] = None
):
    """
    Get all rules for a specific dataset/scan job.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        query = {"job_id": job_id}
        
        if active_only:
            query["status"] = "ACTIVE"
        
        if rule_type:
            query["rule_type"] = rule_type.value
        
        cursor = db.data_quality_rules.find(query)
        rules = await cursor.to_list(length=1000)
        
        return [DataQualityRuleResponse(**rule) for rule in rules]
        
    except Exception as e:
        logger.error(f"❌ Error fetching rules for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch rules")


# ============================================================================
# VIOLATIONS ENDPOINTS
# ============================================================================

@router.get("/{rule_id}/violations", response_model=List[RuleViolationResponse])
async def get_rule_violations(
    rule_id: str,
    limit: int = Query(100, ge=1, le=500),
    unresolved_only: bool = Query(False)
):
    """
    Get all violations for a specific rule.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        query = {"rule_id": rule_id}
        
        if unresolved_only:
            query["resolved"] = False
        
        cursor = db.violations.find(query).limit(limit)
        violations = await cursor.to_list(length=limit)
        
        return [RuleViolationResponse(**v) for v in violations]
        
    except Exception as e:
        logger.error(f"❌ Error fetching violations for rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch violations")


@router.get("/dataset/{job_id}/violations", response_model=List[RuleViolationResponse])
async def get_dataset_violations(
    job_id: str,
    severity: Optional[Severity] = None,
    unresolved_only: bool = Query(False),
    limit: int = Query(1000, ge=1, le=5000)
):
    """
    Get all violations for a dataset/scan job.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        query = {"job_id": job_id}
        
        if severity:
            query["severity"] = severity.value
        
        if unresolved_only:
            query["resolved"] = False
        
        cursor = db.violations.find(query).limit(limit)
        violations = await cursor.to_list(length=limit)
        
        return [RuleViolationResponse(**v) for v in violations]
        
    except Exception as e:
        logger.error(f"❌ Error fetching violations for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch violations")


# ============================================================================
# STATISTICS & ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/stats/overview")
async def get_rules_statistics():
    """
    Get overall rules engine statistics.
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        total_rules = await db.data_quality_rules.count_documents({})
        active_rules = await db.data_quality_rules.count_documents({"status": "ACTIVE"})
        inactive_rules = await db.data_quality_rules.count_documents({"status": "INACTIVE"})
        archived_rules = await db.data_quality_rules.count_documents({"status": "ARCHIVED"})
        
        total_violations = await db.violations.count_documents({})
        unresolved_violations = await db.violations.count_documents({"resolved": False})
        
        return {
            "total_rules": total_rules,
            "active_rules": active_rules,
            "inactive_rules": inactive_rules,
            "archived_rules": archived_rules,
            "total_violations": total_violations,
            "unresolved_violations": unresolved_violations,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching rules statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")



# ============================================================================
# VALIDATION ENDPOINT
# ============================================================================

@router.post("/validate/{job_id}")
async def validate_dataset(job_id: str):
    """
    Execute all active rules for a dataset and return violations.
    """
    try:
        from app.services.rule_validator import RuleValidator
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Get all active rules for this job
        rules = await db.data_quality_rules.find({
            "job_id": job_id,
            "is_active": True
        }).to_list(length=None)
        
        if not rules:
            return {
                "success": True,
                "job_id": job_id,
                "rules_executed": 0,
                "violations_found": 0,
                "violations": [],
                "message": "No active rules found for this dataset"
            }
        
        # Use RuleValidator to execute rules
        logger.info(f"Starting validation for job {job_id} with {len(rules)} rules")
        
        validator = RuleValidator(job_id)
        report = await validator.validate_all_rules()
        
        violations_found = report.total_violations
        rules_executed = report.total_rules_executed
        
        logger.info(f"Validation complete: {rules_executed} rules, {violations_found} violations")
        
        return {
            "success": True,
            "job_id": job_id,
            "rules_executed": rules_executed,
            "violations_found": violations_found,
            "message": f"Executed {rules_executed} rules successfully"
        }
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
