"""
Cloud Connectors API Endpoints
Manages database connections (PostgreSQL, MySQL) with test functionality.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
import logging
from bson import ObjectId

from app.core.database import get_database
from app.services.connector_service import ConnectionTester

router = APIRouter()
logger = logging.getLogger(__name__)


# ===== ENUMS =====
class ConnectorType(str, Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"


# ===== REQUEST MODELS =====
class ConnectorConfig(BaseModel):
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(..., ge=1, le=65535)
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=255)
    database: str = Field(..., min_length=1, max_length=100)
    ssl: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "host": "localhost",
                "port": 5432,
                "username": "admin",
                "password": "SecureP@ss123",
                "database": "production_db",
                "ssl": True
            }
        }


class ConnectorCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: ConnectorType
    config: ConnectorConfig
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Production PostgreSQL",
                "type": "postgres",
                "config": {
                    "host": "db.example.com",
                    "port": 5432,
                    "username": "admin",
                    "password": "SecureP@ss123",
                    "database": "prod_db",
                    "ssl": True
                }
            }
        }


# ===== RESPONSE MODELS =====
class ConnectorResponse(BaseModel):
    id: str
    name: str
    type: str
    config: Dict[str, Any]
    status: str
    last_tested_at: Optional[datetime] = None
    last_test_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ConnectorListResponse(BaseModel):
    total: int
    connectors: List[ConnectorResponse]


class TestConnectionResponse(BaseModel):
    status: str
    message: str
    latency_ms: int
    details: Optional[Dict[str, Any]] = None


# ===== HELPER FUNCTIONS =====
def mask_password(config: Dict[str, Any]) -> Dict[str, Any]:
    """Mask password in config dictionary."""
    masked_config = config.copy()
    if 'password' in masked_config:
        masked_config['password'] = '********'
    return masked_config


def format_connector_response(connector_doc: Dict[str, Any]) -> ConnectorResponse:
    """Format MongoDB document to ConnectorResponse model."""
    return ConnectorResponse(
        id=str(connector_doc['_id']),
        name=connector_doc['name'],
        type=connector_doc['type'],
        config=mask_password(connector_doc['config']),
        status=connector_doc.get('status', 'active'),
        last_tested_at=connector_doc.get('last_tested_at'),
        last_test_status=connector_doc.get('last_test_status'),
        created_at=connector_doc['created_at'],
        updated_at=connector_doc['updated_at']
    )


# ===== API ENDPOINTS =====

@router.get("/", response_model=ConnectorListResponse)
async def list_connectors(
    connector_type: Optional[ConnectorType] = None
):
    """
    List all saved data source connectors.
    Passwords are always masked in the response.
    
    Query Parameters:
        connector_type: Optional filter by connector type (postgres, mysql)
    
    Returns:
        List of connectors with masked passwords
    """
    try:
        db = get_database()
        data_sources_col = db.data_sources
        
        # Build query filter
        query_filter = {}
        if connector_type:
            query_filter['type'] = connector_type.value
        
        # Fetch connectors - FIXED: Use await with to_list() for async Motor cursor
        connectors_cursor = data_sources_col.find(query_filter).sort('created_at', -1)
        connectors_list = await connectors_cursor.to_list(length=None)
        
        # Format response
        formatted_connectors = [
            format_connector_response(conn) for conn in connectors_list
        ]
        
        logger.info(f"Listed {len(formatted_connectors)} connectors")
        
        return ConnectorListResponse(
            total=len(formatted_connectors),
            connectors=formatted_connectors
        )
        
    except Exception as e:
        logger.error(f"Error listing connectors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list connectors: {str(e)}"
        )


@router.post("/", response_model=ConnectorResponse, status_code=status.HTTP_201_CREATED)
async def create_connector(request: ConnectorCreateRequest):
    """
    Create a new data source connector.
    
    Request Body:
        name: Unique connector name
        type: Connector type (postgres, mysql)
        config: Connection configuration with credentials
    
    Returns:
        Created connector with masked password
    """
    try:
        db = get_database()
        data_sources_col = db.data_sources
        
        # Check if name already exists
        existing = await data_sources_col.find_one({'name': request.name})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connector with name '{request.name}' already exists"
            )
        
        # Create connector document
        now = datetime.utcnow()
        connector_doc = {
            'name': request.name,
            'type': request.type.value,
            'config': request.config.dict(),
            'status': 'active',
            'last_tested_at': None,
            'last_test_status': None,
            'created_at': now,
            'updated_at': now
        }
        
        # Insert into database
        result = await data_sources_col.insert_one(connector_doc)
        connector_doc['_id'] = result.inserted_id
        
        logger.info(f"Created connector: {request.name} ({request.type.value})")
        
        return format_connector_response(connector_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating connector: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create connector: {str(e)}"
        )


@router.post("/{connector_id}/test", response_model=TestConnectionResponse)
async def test_connector(connector_id: str):
    """
    Test a data source connector connection (KILLER FEATURE).
    
    This endpoint:
    1. Retrieves the connector from database
    2. Attempts to connect to the database
    3. Executes a test query to verify access
    4. Updates last_tested_at and last_test_status in database
    5. Returns detailed connection results
    
    Path Parameters:
        connector_id: MongoDB ObjectId of the connector
    
    Returns:
        Connection test results with status, message, latency, and details
    """
    try:
        db = get_database()
        data_sources_col = db.data_sources
        
        # Validate ObjectId format
        if not ObjectId.is_valid(connector_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid connector ID format"
            )
        
        # Retrieve connector from database
        connector = await data_sources_col.find_one({'_id': ObjectId(connector_id)})
        if not connector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connector with ID '{connector_id}' not found"
            )
        
        connector_type = connector['type']
        config = connector['config']
        
        logger.info(f"Testing {connector_type} connector: {connector['name']}")
        
        # Test connection based on type
        if connector_type == 'postgres':
            test_result = ConnectionTester.test_postgres(config)
        elif connector_type == 'mysql':
            test_result = ConnectionTester.test_mysql(config)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported connector type: {connector_type}"
            )
        
        # Update last tested timestamp and status in database
        now = datetime.utcnow()
        await data_sources_col.update_one(
            {'_id': ObjectId(connector_id)},
            {
                '$set': {
                    'last_tested_at': now,
                    'last_test_status': test_result['status'],
                    'updated_at': now
                }
            }
        )
        
        logger.info(
            f"Connection test completed: {connector['name']} - "
            f"Status: {test_result['status']}, Latency: {test_result['latency_ms']}ms"
        )
        
        return TestConnectionResponse(**test_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing connector: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connector: {str(e)}"
        )


@router.delete("/{connector_id}", status_code=status.HTTP_200_OK)
async def delete_connector(connector_id: str):
    """
    Delete a data source connector.
    
    Path Parameters:
        connector_id: MongoDB ObjectId of the connector
    
    Returns:
        Success message
    """
    try:
        db = get_database()
        data_sources_col = db.data_sources
        
        # Validate ObjectId format
        if not ObjectId.is_valid(connector_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid connector ID format"
            )
        
        # Check if connector exists
        connector = await data_sources_col.find_one({'_id': ObjectId(connector_id)})
        if not connector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connector with ID '{connector_id}' not found"
            )
        
        # Delete connector
        result = await data_sources_col.delete_one({'_id': ObjectId(connector_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete connector"
            )
        
        logger.info(f"Deleted connector: {connector['name']} ({connector['type']})")
        
        return {
            'message': f"Connector '{connector['name']}' deleted successfully",
            'id': connector_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting connector: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete connector: {str(e)}"
        )
