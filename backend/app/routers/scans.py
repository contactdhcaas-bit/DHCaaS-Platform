# app/routers/scans.py
"""
Scan Jobs API Router with Multi-Tenancy Support
Handles data quality scan job creation, execution, and management.
Now includes JWT authentication and data isolation per user.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import pandas as pd
import numpy as np
import os

from app.core.database import get_database
from app.services.scan_engine import ScanEngine
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.policy_service import get_policy_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/scan-jobs", tags=["Scan Jobs"])


# ===== ENUMS =====
class ScanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SourceType(str, Enum):
    CSV = "csv"
    EXCEL = "excel"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"


# ===== PYDANTIC MODELS =====
class SourceConfig(BaseModel):
    filepath: Optional[str] = None
    delimiter: Optional[str] = ","
    sheet_name: Optional[str] = None
    # Database connection fields
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    table: Optional[str] = None


class ScanOptions(BaseModel):
    include_quality: bool = True
    include_pii: bool = True
    sample_size: Optional[int] = None


class ScanJobRequest(BaseModel):
    source_type: SourceType
    source_config: SourceConfig
    scan_options: ScanOptions
    datasource_name: Optional[str] = None


class ScanJobResponse(BaseModel):
    job_id: str
    owner_id: str
    status: ScanStatus
    source_type: str
    datasource_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    source_config: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


# ===== HELPER FUNCTIONS =====

def convert_numpy_types(obj):
    """
    Recursively convert NumPy types to native Python types for MongoDB serialization.
    
    Args:
        obj: Object that may contain NumPy types
        
    Returns:
        Object with NumPy types converted to Python types
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj


def generate_job_id() -> str:
    """Generate a unique job ID."""
    return str(uuid.uuid4())


async def load_csv_file(filepath: str, delimiter: str = ",") -> pd.DataFrame:
    """Load CSV file into pandas DataFrame."""
    try:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        
        df = pd.read_csv(filepath, delimiter=delimiter)
        logger.info(f"✅ Loaded CSV: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        logger.error(f"❌ Failed to load CSV: {str(e)}")
        raise


async def load_excel_file(filepath: str, sheet_name: Optional[str] = None) -> pd.DataFrame:
    """Load Excel file into pandas DataFrame."""
    try:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        
        df = pd.read_excel(filepath, sheet_name=sheet_name or 0)
        logger.info(f"✅ Loaded Excel: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        logger.error(f"❌ Failed to load Excel: {str(e)}")
        raise


def build_database_url(source_type: str, config: SourceConfig) -> str:
    """Build SQLAlchemy database URL from configuration."""
    if source_type == "postgresql":
        return f"postgresql://{config.username}:{config.password}@{config.host}:{config.port or 5432}/{config.database}"
    elif source_type == "mysql":
        return f"mysql+pymysql://{config.username}:{config.password}@{config.host}:{config.port or 3306}/{config.database}"
    else:
        raise ValueError(f"Unsupported database type: {source_type}")


async def execute_scan_job(job_id: str, request: ScanJobRequest, user_id: str, db: AsyncIOMotorClient):
    """
    Background task to execute the actual scan job with ownership tracking.
    
    Args:
        job_id: Unique scan job identifier
        request: Scan job request parameters
        user_id: ID of the user who owns this scan
        db: MongoDB database connection
    """
    collection = db["dhcaas"]["scan_jobs"]
    
    try:
        # Update status to running
        await collection.update_one(
            {"job_id": job_id, "owner_id": user_id},
            {
                "$set": {
                    "status": ScanStatus.RUNNING,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"🔄 Starting scan job: {job_id} (user: {user_id})")
        
        # Execute scan based on source type
        if request.source_type == SourceType.CSV:
            # CSV scan
            if not request.source_config.filepath:
                raise ValueError("CSV filepath is required")
            
            df = pd.read_csv(
                request.source_config.filepath,
                delimiter=request.source_config.delimiter or ","
            )
            
            logger.info(f"✅ Loaded CSV: {len(df)} rows, {len(df.columns)} columns")
            
            # Use ScanEngine for CSV data
            scan_engine = ScanEngine(
                connection_string=None,
                source_type="dataframe",
                dataframe=df,
                table_name="data_table"
            )
            
            result = await scan_engine.scan()
            
            # Convert NumPy types to native Python types for MongoDB
            result = convert_numpy_types(result)
            
        elif request.source_type in [SourceType.MYSQL, SourceType.POSTGRESQL]:
            # Database scan
            if not all([
                request.source_config.host,
                request.source_config.database,
                request.source_config.table
            ]):
                raise ValueError("Database connection parameters are required")
            
            # Build connection string
            if request.source_type == SourceType.MYSQL:
                connection_string = (
                    f"mysql+pymysql://{request.source_config.username}:"
                    f"{request.source_config.password}@{request.source_config.host}:"
                    f"{request.source_config.port or 3306}/{request.source_config.database}"
                )
            else:  # PostgreSQL
                connection_string = (
                    f"postgresql+psycopg2://{request.source_config.username}:"
                    f"{request.source_config.password}@{request.source_config.host}:"
                    f"{request.source_config.port or 5432}/{request.source_config.database}"
                )
            
            scan_engine = ScanEngine(
                connection_string=connection_string,
                source_type="database",
                table_name=request.source_config.table
            )
            
            result = await scan_engine.scan()
            
            # Convert NumPy types to native Python types for MongoDB
            result = convert_numpy_types(result)
            
        else:
            raise ValueError(f"Unsupported source type: {request.source_type}")
        
        # Update job with results
        await collection.update_one(
            {"job_id": job_id, "owner_id": user_id},
            {
                "$set": {
                    "status": ScanStatus.COMPLETED,
                    "results": result,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"✅ Scan job completed: {job_id} (user: {user_id})")

        # ===== POLICY ENFORCEMENT =====
        # Check scan results against active policies
        try:
            policy_service = get_policy_service()
            
            # Prepare scan data for compliance check
            scan_data = {
                "id": job_id,
                "scan_id": job_id,
                "quality_score": result.get("quality_score", 0),
                "score": result.get("quality_score", 0),
                "pii_count": result.get("pii_detection", {}).get("total_pii_rows", 0),
                "duplicate_count": result.get("duplicates", {}).get("duplicate_count", 0),
                "missing_percent": result.get("completeness", {}).get("missing_percentage", 0)
            }
            
            # Check compliance
            violations = policy_service.check_scan_compliance(scan_data)
            
            if violations:
                logger.warning(f"?? {len(violations)} policy violations detected for scan {job_id}")
                
                # Save violations to database
                violations_collection = db["dhcaas"]["violations"]
                
                for violation in violations:
                    violation["owner_id"] = user_id  # Add user ownership
                    violation["created_at"] = datetime.utcnow()
                    
                await violations_collection.insert_many(violations)
                
                logger.info(f"?? Saved {len(violations)} violations to database")
            else:
                logger.info(f"? No policy violations detected for scan {job_id}")
                
        except Exception as policy_error:
            # Don't fail the scan if policy check fails
            logger.error(f"?? Policy enforcement error for scan {job_id}: {policy_error}")
        # ===== END POLICY ENFORCEMENT =====

        
    except Exception as e:
        error_message = str(e)
        logger.error(f"❌ Scan job failed: {job_id} (user: {user_id}) - {error_message}")
        
        # Update job with error
        await collection.update_one(
            {"job_id": job_id, "owner_id": user_id},
            {
                "$set": {
                    "status": ScanStatus.FAILED,
                    "error_message": error_message,
                    "updated_at": datetime.utcnow()
                }
            }
        )


# ===== API ENDPOINTS WITH MULTI-TENANCY =====

@router.post("/", response_model=ScanJobResponse, status_code=status.HTTP_201_CREATED)
async def create_scan_job(
    request: ScanJobRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Create a new data quality scan job (Multi-tenancy: Associated with current user).
    The scan will be executed asynchronously in the background.
    """
    try:
        job_id = generate_job_id()
        current_time = datetime.utcnow()
        
        # Create job document with owner_id
        job_document = {
            "job_id": job_id,
            "owner_id": current_user.id,
            "status": ScanStatus.PENDING,
            "source_type": request.source_type,
            "source_config": request.source_config.model_dump(exclude_none=True),
            "scan_options": request.scan_options.model_dump(),
            "datasource_name": request.datasource_name or f"scan_{job_id[:8]}",
            "created_at": current_time,
            "updated_at": current_time,
            "results": None,
            "error_message": None
        }
        
        # Insert into MongoDB
        collection = db["dhcaas"]["scan_jobs"]
        await collection.insert_one(job_document)
        
        # Schedule background scan execution
        background_tasks.add_task(execute_scan_job, job_id, request, current_user.id, db)
        
        logger.info(f"✅ Scan job created: {job_id} (owner: {current_user.email})")
        
        return ScanJobResponse(**job_document)
        
    except Exception as e:
        logger.error(f"❌ Failed to create scan job: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{job_id}", response_model=ScanJobResponse)
async def get_scan_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Get scan job details by ID (with ownership verification).
    Users can only access their own scan jobs.
    """
    try:
        collection = db["dhcaas"]["scan_jobs"]
        job = await collection.find_one({
            "job_id": job_id,
            "owner_id": current_user.id
        })
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan job not found or access denied: {job_id}"
            )
        
        # Remove MongoDB _id field
        job.pop("_id", None)
        
        return ScanJobResponse(**job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get scan job: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=List[ScanJobResponse])
async def list_scan_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[ScanStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    List all scan jobs for the current user (Data isolation).
    Optional filtering by status.
    """
    try:
        collection = db["dhcaas"]["scan_jobs"]
        
        # Build query with owner_id filter
        query = {"owner_id": current_user.id}
        if status_filter:
            query["status"] = status_filter
        
        # Execute query
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        # Remove MongoDB _id field
        for job in jobs:
            job.pop("_id", None)
        
        logger.info(f"📋 Retrieved {len(jobs)} scan jobs for user: {current_user.email}")
        
        return [ScanJobResponse(**job) for job in jobs]
        
    except Exception as e:
        logger.error(f"❌ Failed to list scan jobs: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Delete a scan job by ID (with ownership verification).
    Users can only delete their own scan jobs.
    """
    try:
        collection = db["dhcaas"]["scan_jobs"]
        result = await collection.delete_one({
            "job_id": job_id,
            "owner_id": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan job not found or access denied: {job_id}"
            )
        
        logger.info(f"✅ Scan job deleted: {job_id} (owner: {current_user.email})")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete scan job: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/stats/summary", response_model=Dict[str, Any])
async def get_scan_statistics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Get scan statistics for the current user.
    Returns total scans, completed, failed, etc.
    """
    try:
        collection = db["dhcaas"]["scan_jobs"]
        
        # Aggregate statistics
        pipeline = [
            {"$match": {"owner_id": current_user.id}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await collection.aggregate(pipeline).to_list(length=None)
        
        # Build statistics dictionary
        stats = {
            "total_scans": 0,
            "pending": 0,
            "running": 0,
            "completed": 0,
            "failed": 0
        }
        
        for result in results:
            status_key = result["_id"].lower()
            stats[status_key] = result["count"]
            stats["total_scans"] += result["count"]
        
        logger.info(f"📊 Statistics retrieved for user: {current_user.email}")
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Failed to get scan statistics: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/violations/{job_id}", response_model=List[Dict[str, Any]])
async def get_scan_violations(
    job_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all policy violations for a specific scan job.
    
    Args:
        job_id: Scan job identifier
        
    Returns:
        List of violations with policy details
    """
    try:
        violations_collection = db["dhcaas"]["violations"]
        
        # Query violations for this scan and user
        violations = await violations_collection.find({
            "scan_id": job_id,
            "owner_id": current_user.id
        }).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for violation in violations:
            if "_id" in violation:
                violation["_id"] = str(violation["_id"])
        
        logger.info(f"?? Retrieved {len(violations)} violations for scan {job_id}")
        return violations
        
    except Exception as e:
        logger.error(f"? Error fetching violations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch violations: {str(e)}"
        )


@router.get("/violations", response_model=List[Dict[str, Any]])
async def list_all_violations(
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all policy violations for the current user with optional filters.
    
    Args:
        resolved: Filter by resolution status
        severity: Filter by severity level
        limit: Maximum number of results
        
    Returns:
        List of violations
    """
    try:
        violations_collection = db["dhcaas"]["violations"]
        
        # Build query
        query = {"owner_id": current_user.id}
        
        if resolved is not None:
            query["resolved"] = resolved
            
        if severity:
            query["severity"] = severity.upper()
        
        # Fetch violations
        violations = await violations_collection.find(query).sort(
            "created_at", -1
        ).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string
        for violation in violations:
            if "_id" in violation:
                violation["_id"] = str(violation["_id"])
        
        logger.info(f"?? Retrieved {len(violations)} violations with filters: {query}")
        return violations
        
    except Exception as e:
        logger.error(f"? Error listing violations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list violations: {str(e)}"
        )


