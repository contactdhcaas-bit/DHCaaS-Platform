"""
Data Quality Rules API Endpoints
Manages CRUD operations for data quality validation rules.
Sprint 6: Core rule management (not_null, regex_match, numeric_range, string_length, allowed_values)
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import logging

from app.core.database import get_database
from app.models.dq_rule import (
    DQRuleCreate,
    DQRuleUpdate,
    DQRuleResponse,
    DQRuleListResponse,
    DQRuleDeleteResponse,
    RuleType,
    Severity,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ===== HELPER FUNCTIONS =====

def validate_object_id(id: str, field_name: str = "ID") -> ObjectId:
    """Validate and convert string ID to ObjectId"""
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format: {id}"
        )
    return ObjectId(id)


def format_rule_response(rule_doc: dict) -> DQRuleResponse:
    """Format MongoDB document to DQRuleResponse model"""
    return DQRuleResponse(
        id=str(rule_doc['_id']),
        rule_name=rule_doc['rule_name'],
        description=rule_doc.get('description'),
        connector_id=str(rule_doc['connector_id']),
        connector_name=rule_doc.get('connector_name', 'Unknown'),
        table_name=rule_doc['table_name'],
        column_name=rule_doc['column_name'],
        data_type=rule_doc.get('data_type'),
        rule_type=rule_doc['rule_type'],
        rule_config=rule_doc.get('rule_config', {}),
        severity=rule_doc['severity'],
        enabled=rule_doc['enabled'],
        sample_size=rule_doc.get('sample_size'),
        created_at=rule_doc['created_at'],
        updated_at=rule_doc['updated_at'],
        last_executed_at=rule_doc.get('last_executed_at'),
        last_execution_status=rule_doc.get('last_execution_status'),
        last_pass_count=rule_doc.get('last_pass_count'),
        last_fail_count=rule_doc.get('last_fail_count'),
        last_pass_rate=rule_doc.get('last_pass_rate'),
    )


async def validate_connector_exists(connector_id: ObjectId) -> dict:
    """Validate that connector exists and return connector document"""
    db = get_database()
    connector = await db.data_sources.find_one({'_id': connector_id})
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector with ID '{connector_id}' not found"
        )
    return connector


async def validate_rule_uniqueness(
    connector_id: ObjectId,
    rule_name: str,
    exclude_rule_id: Optional[ObjectId] = None
) -> None:
    """Validate that rule name is unique within connector"""
    db = get_database()
    query = {
        'connector_id': connector_id,
        'rule_name': rule_name
    }
    
    if exclude_rule_id:
        query['_id'] = {'$ne': exclude_rule_id}
    
    existing = await db.dq_rules.find_one(query)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Rule with name '{rule_name}' already exists for this connector"
        )


# ===== API ENDPOINTS =====

@router.get("/", response_model=DQRuleListResponse)
async def list_rules(
    connector_id: Optional[str] = Query(None, description="Filter by connector ID"),
    table_name: Optional[str] = Query(None, description="Filter by table name"),
    rule_type: Optional[RuleType] = Query(None, description="Filter by rule type"),
    severity: Optional[Severity] = Query(None, description="Filter by severity"),
    enabled: Optional[bool] = Query(None, description="Filter by enabled status"),
):
    """
    List all data quality rules with optional filters.
    
    Query Parameters:
        connector_id: Filter rules by connector
        table_name: Filter rules by table name
        rule_type: Filter rules by type
        severity: Filter rules by severity level
        enabled: Filter by enabled/disabled status
    
    Returns:
        List of data quality rules
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Build query filter
        query_filter = {}
        
        if connector_id:
            connector_obj_id = validate_object_id(connector_id, "Connector ID")
            query_filter['connector_id'] = connector_obj_id
        
        if table_name:
            query_filter['table_name'] = table_name
        
        if rule_type:
            query_filter['rule_type'] = rule_type.value
        
        if severity:
            query_filter['severity'] = severity.value
        
        if enabled is not None:
            query_filter['enabled'] = enabled
        
        # Fetch rules
        rules_cursor = dq_rules_col.find(query_filter).sort('created_at', -1)
        rules_list = await rules_cursor.to_list(length=None)
        
        # Format response
        formatted_rules = [format_rule_response(rule) for rule in rules_list]
        
        logger.info(f"Listed {len(formatted_rules)} rules with filters: {query_filter}")
        
        return DQRuleListResponse(
            total=len(formatted_rules),
            rules=formatted_rules
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing rules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list rules: {str(e)}"
        )


@router.post("/", response_model=DQRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(request: DQRuleCreate):
    """
    Create a new data quality rule.
    
    Request Body:
        rule_name: Unique name for the rule within connector
        description: Optional description
        connector_id: Target connector ID
        table_name: Target table name
        column_name: Target column name
        rule_type: Type of rule (not_null, regex_match, numeric_range, string_length, allowed_values)
        rule_config: Configuration for the rule type
        severity: Rule severity (critical, high, medium, low)
        enabled: Enable rule immediately (default: true)
        sample_size: Optional row sampling limit
    
    Returns:
        Created rule with metadata
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Validate connector exists
        connector_obj_id = validate_object_id(request.connector_id, "Connector ID")
        connector = await validate_connector_exists(connector_obj_id)
        
        # Validate rule name uniqueness
        await validate_rule_uniqueness(connector_obj_id, request.rule_name)
        
        # TODO: Validate table/column exists in connector schema (Sprint 6 Phase 2)
        # This will use the schema introspection endpoint to verify target exists
        
        # Create rule document
        now = datetime.utcnow()
        rule_doc = {
            'rule_name': request.rule_name,
            'description': request.description,
            'connector_id': connector_obj_id,
            'connector_name': connector['name'],
            'table_name': request.table_name,
            'column_name': request.column_name,
            'data_type': None,  # TODO: Extract from schema in Phase 2
            'rule_type': request.rule_type.value,
            'rule_config': request.rule_config,
            'severity': request.severity.value,
            'enabled': request.enabled,
            'sample_size': request.sample_size,
            'created_at': now,
            'updated_at': now,
            'last_executed_at': None,
            'last_execution_status': None,
            'last_pass_count': None,
            'last_fail_count': None,
            'last_pass_rate': None,
        }
        
        # Insert into database
        result = await dq_rules_col.insert_one(rule_doc)
        rule_doc['_id'] = result.inserted_id
        
        logger.info(
            f"Created rule: {request.rule_name} for connector {connector['name']} "
            f"on {request.table_name}.{request.column_name}"
        )
        
        return format_rule_response(rule_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create rule: {str(e)}"
        )


@router.get("/{rule_id}", response_model=DQRuleResponse)
async def get_rule(rule_id: str):
    """
    Get details of a specific rule.
    
    Path Parameters:
        rule_id: MongoDB ObjectId of the rule
    
    Returns:
        Rule details with metadata
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Validate ObjectId format
        rule_obj_id = validate_object_id(rule_id, "Rule ID")
        
        # Fetch rule
        rule = await dq_rules_col.find_one({'_id': rule_obj_id})
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule with ID '{rule_id}' not found"
            )
        
        return format_rule_response(rule)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching rule {rule_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch rule: {str(e)}"
        )


@router.put("/{rule_id}", response_model=DQRuleResponse)
async def update_rule(rule_id: str, request: DQRuleUpdate):
    """
    Update an existing data quality rule.
    
    Path Parameters:
        rule_id: MongoDB ObjectId of the rule
    
    Request Body:
        Optional fields to update (rule_name, description, rule_config, severity, enabled, sample_size)
    
    Returns:
        Updated rule with metadata
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Validate ObjectId format
        rule_obj_id = validate_object_id(rule_id, "Rule ID")
        
        # Check if rule exists
        existing_rule = await dq_rules_col.find_one({'_id': rule_obj_id})
        if not existing_rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule with ID '{rule_id}' not found"
            )
        
        # Build update dict (only non-None fields)
        update_dict = {k: v for k, v in request.dict().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )
        
        # If rule_name is being updated, validate uniqueness
        if 'rule_name' in update_dict:
            await validate_rule_uniqueness(
                existing_rule['connector_id'],
                update_dict['rule_name'],
                exclude_rule_id=rule_obj_id
            )
        
        # Convert enums to values
        if 'severity' in update_dict:
            update_dict['severity'] = update_dict['severity'].value
        
        # Add updated timestamp
        update_dict['updated_at'] = datetime.utcnow()
        
        # Update rule
        await dq_rules_col.update_one(
            {'_id': rule_obj_id},
            {'$set': update_dict}
        )
        
        # Fetch updated rule
        updated_rule = await dq_rules_col.find_one({'_id': rule_obj_id})
        
        logger.info(f"Updated rule: {existing_rule['rule_name']} (ID: {rule_id})")
        
        return format_rule_response(updated_rule)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating rule {rule_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update rule: {str(e)}"
        )


@router.delete("/{rule_id}", response_model=DQRuleDeleteResponse)
async def delete_rule(rule_id: str):
    """
    Delete a data quality rule.
    
    Path Parameters:
        rule_id: MongoDB ObjectId of the rule
    
    Returns:
        Success message with deleted rule ID
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Validate ObjectId format
        rule_obj_id = validate_object_id(rule_id, "Rule ID")
        
        # Check if rule exists
        rule = await dq_rules_col.find_one({'_id': rule_obj_id})
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule with ID '{rule_id}' not found"
            )
        
        # Delete rule
        result = await dq_rules_col.delete_one({'_id': rule_obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete rule"
            )
        
        logger.info(f"Deleted rule: {rule['rule_name']} (ID: {rule_id})")
        
        return DQRuleDeleteResponse(
            message=f"Rule '{rule['rule_name']}' deleted successfully",
            id=rule_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete rule: {str(e)}"
        )


@router.post("/{rule_id}/enable")
async def enable_rule(rule_id: str):
    """
    Enable a data quality rule.
    
    Path Parameters:
        rule_id: MongoDB ObjectId of the rule
    
    Returns:
        Success message
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Validate ObjectId format
        rule_obj_id = validate_object_id(rule_id, "Rule ID")
        
        # Update rule
        result = await dq_rules_col.update_one(
            {'_id': rule_obj_id},
            {'$set': {'enabled': True, 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule with ID '{rule_id}' not found"
            )
        
        logger.info(f"Enabled rule: {rule_id}")
        
        return {"message": "Rule enabled successfully", "id": rule_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling rule {rule_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enable rule: {str(e)}"
        )


@router.post("/{rule_id}/disable")
async def disable_rule(rule_id: str):
    """
    Disable a data quality rule.
    
    Path Parameters:
        rule_id: MongoDB ObjectId of the rule
    
    Returns:
        Success message
    """
    try:
        db = get_database()
        dq_rules_col = db.dq_rules
        
        # Validate ObjectId format
        rule_obj_id = validate_object_id(rule_id, "Rule ID")
        
        # Update rule
        result = await dq_rules_col.update_one(
            {'_id': rule_obj_id},
            {'$set': {'enabled': False, 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule with ID '{rule_id}' not found"
            )
        
        logger.info(f"Disabled rule: {rule_id}")
        
        return {"message": "Rule disabled successfully", "id": rule_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disabling rule {rule_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disable rule: {str(e)}"
        )
