# app/api/v1/endpoints/scans.py
"""
Scan Jobs Endpoints with MongoDB Integration
Production-grade implementation with full CRUD operations
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime
import uuid
import logging
import time
from app.services.scan_service import get_scan_service
from app.api.dependencies import get_current_user_optional
from app.core.database import get_database
from app.models.scan_job import (
    ScanJobInDB,
    ScanJobResponse,
    ScanJobListResponse,
    ScanStatus
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_file_size_mb(size_bytes: int) -> float:
    """Convert bytes to MB"""
    return round(size_bytes / (1024 * 1024), 2)


def get_file_type(filename: str) -> str:
    """Extract file extension"""
    return filename.split('.')[-1].lower() if '.' in filename else 'unknown'


async def save_scan_job_to_db(job_data: ScanJobInDB) -> bool:
    """
    Save scan job to MongoDB
    Returns True if successful, False otherwise
    """
    try:
        db = get_database()
        if db is None:
            logger.warning("⚠️ Database not available - scan job not persisted")
            return False
        
        # Convert to dict for MongoDB
        job_dict = job_data.dict()
        
        # Insert into database
        result = await db.scan_jobs.insert_one(job_dict)
        
        logger.info(f"✅ Scan job saved to DB: {job_data.job_id}")
        return result.acknowledged
        
    except Exception as e:
        logger.error(f"❌ Error saving scan job to DB: {str(e)}")
        return False


async def get_scan_jobs_from_db(
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[dict]:
    """
    Retrieve scan jobs from MongoDB
    """
    try:
        db = get_database()
        if db is None:
            logger.warning("⚠️ Database not available")
            return []
        
        # Build query
        query = {}
        if user_id:
            query["user_id"] = user_id
        
        # Fetch from database with pagination
        cursor = db.scan_jobs.find(query).sort("created_at", -1).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        # Remove MongoDB _id field
        for job in jobs:
            if "_id" in job:
                del job["_id"]
        
        logger.info(f"📊 Retrieved {len(jobs)} scan jobs from DB")
        return jobs
        
    except Exception as e:
        logger.error(f"❌ Error retrieving scan jobs from DB: {str(e)}")
        return []


async def get_scan_job_by_id(job_id: str) -> Optional[dict]:
    """
    Get a single scan job by ID
    """
    try:
        db = get_database()
        if db is None:
            return None
        
        job = await db.scan_jobs.find_one({"job_id": job_id})
        
        if job and "_id" in job:
            del job["_id"]
        
        return job
        
    except Exception as e:
        logger.error(f"❌ Error retrieving scan job {job_id}: {str(e)}")
        return None


async def count_scan_jobs(user_id: Optional[str] = None) -> int:
    """
    Count total scan jobs
    """
    try:
        db = get_database()
        if db is None:
            return 0
        
        query = {}
        if user_id:
            query["user_id"] = user_id
        
        count = await db.scan_jobs.count_documents(query)
        return count
        
    except Exception as e:
        logger.error(f"❌ Error counting scan jobs: {str(e)}")
        return 0


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/", status_code=201)
async def create_scan_job(
    file: UploadFile = File(...),
    datasource_name: Optional[str] = None,
    owner: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Create a new scan job by uploading a file
    - Validates file type
    - Processes file with scan service
    - Saves results to MongoDB
    - Returns scan summary
    """
    
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx', '.xls', '.json')):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Supported formats: CSV, Excel (.xlsx, .xls), JSON"
        )
    
    start_time = time.time()
    job_id = str(uuid.uuid4())
    
    try:
        logger.info(f"📤 [CreateScan] Starting scan job: {job_id}")
        logger.info(f"📄 [CreateScan] File: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        logger.info(f"📏 [CreateScan] File size: {get_file_size_mb(file_size)} MB")
        
        # Determine user_id and owner
        if current_user:
            user_id = current_user.get("user_id", "system")
            owner_name = current_user.get("email", owner or "System")
        else:
            user_id = "system"
            owner_name = owner or "System"
        
        logger.info(f"👤 [CreateScan] User: {user_id}, Owner: {owner_name}")
        
        # Execute scan
        scan_service = get_scan_service()
        scan_results = await scan_service.scan_file(
            file_content=file_content,
            filename=file.filename,
            job_id=job_id,
            datasource_name=datasource_name or file.filename,
            owner=owner_name,
            user_id=user_id
        )
        
        processing_time = time.time() - start_time
        
        logger.info(f"✅ [CreateScan] Scan completed in {processing_time:.2f}s")
        
        # Extract metrics from scan results
        summary = scan_results.get("summary", {})
        quality_metrics = scan_results.get("quality_metrics", {})
        issues_by_severity = scan_results.get("issues_by_severity", {})
        column_profiles = scan_results.get("column_profiles", [])
        
        # Build database model
        job_data = ScanJobInDB(
            job_id=job_id,
            user_id=user_id,
            filename=file.filename,
            datasource_name=datasource_name or file.filename,
            owner=owner_name,
            status=ScanStatus.COMPLETED,
            file_size=file_size,
            file_type=get_file_type(file.filename),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            
            # Scan metrics
            total_rows=summary.get("total_rows", 0),
            total_columns=summary.get("total_columns", 0),
            column_names=[col.get("column_name", "") for col in column_profiles],
            
            # Quality scores
            quality_score=quality_metrics.get("overall_quality_score", 0.0),
            completeness_score=quality_metrics.get("completeness_score", 0.0),
            accuracy_score=quality_metrics.get("accuracy_score", 0.0),
            consistency_score=quality_metrics.get("consistency_score", 0.0),
            
            # Issues
            total_issues=summary.get("total_issues", 0),
            critical_issues=issues_by_severity.get("CRITICAL", 0),
            high_issues=issues_by_severity.get("HIGH", 0),
            medium_issues=issues_by_severity.get("MEDIUM", 0),
            low_issues=issues_by_severity.get("LOW", 0),
            
            # Full results
            scan_results=scan_results,
            processing_time_seconds=processing_time
        )
        
        # Save to MongoDB
        saved = await save_scan_job_to_db(job_data)
        
        if saved:
            logger.info(f"💾 [CreateScan] Job saved to database")
        else:
            logger.warning(f"⚠️ [CreateScan] Job not saved to database")
        
        # Return response
        return {
            "success": True,
            "message": "Advanced scan completed successfully",
            "job_id": job_id,
            "saved_to_database": saved,
            "data": scan_results
        }
        
    except Exception as e:
        logger.error(f"❌ [CreateScan] Scan failed: {str(e)}", exc_info=True)
        
        # Try to save failed job to database
        try:
            failed_job = ScanJobInDB(
                job_id=job_id,
                user_id=user_id if 'user_id' in locals() else "system",
                filename=file.filename,
                datasource_name=datasource_name or file.filename,
                owner=owner_name if 'owner_name' in locals() else "System",
                status=ScanStatus.FAILED,
                file_size=len(file_content) if 'file_content' in locals() else 0,
                file_type=get_file_type(file.filename),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                error_message=str(e),
                scan_results={}
            )
            await save_scan_job_to_db(failed_job)
        except:
            pass
        
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=ScanJobListResponse)
async def list_scan_jobs(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    List all scan jobs with pagination
    - Returns jobs sorted by creation date (newest first)
    - Supports pagination
    - Filters by user if authenticated
    """
    
    try:
        logger.info(f"📋 [ListScans] Fetching scan jobs (skip={skip}, limit={limit})")
        
        # Determine user filter
        user_id = current_user.get("user_id") if current_user else None
        
        # Get jobs from database
        jobs = await get_scan_jobs_from_db(user_id=user_id, skip=skip, limit=limit)
        total = await count_scan_jobs(user_id=user_id)
        
        logger.info(f"✅ [ListScans] Found {len(jobs)} jobs (total: {total})")
        
        # Convert to response models
        job_responses = []
        for job in jobs:
            try:
                job_responses.append(ScanJobResponse(
                    job_id=job.get("job_id", ""),
                    filename=job.get("filename", ""),
                    datasource_name=job.get("datasource_name", ""),
                    owner=job.get("owner", ""),
                    status=job.get("status", "completed"),
                    created_at=job.get("created_at", datetime.utcnow()).isoformat(),
                    total_rows=job.get("total_rows", 0),
                    total_columns=job.get("total_columns", 0),
                    column_names=job.get("column_names", []),
                    quality_score=job.get("quality_score", 0.0),
                    total_issues=job.get("total_issues", 0)
                ))
            except Exception as e:
                logger.error(f"❌ Error converting job {job.get('job_id')}: {str(e)}")
                continue
        
        return ScanJobListResponse(
            success=True,
            total=total,
            jobs=job_responses
        )
        
    except Exception as e:
        logger.error(f"❌ [ListScans] Error: {str(e)}")
        return ScanJobListResponse(
            success=False,
            total=0,
            jobs=[]
        )


@router.get("/{job_id}")
async def get_scan_job(job_id: str):
    """
    Get detailed information about a specific scan job
    """
    
    try:
        logger.info(f"📄 [GetScan] Fetching job: {job_id}")
        
        job = await get_scan_job_by_id(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Scan job {job_id} not found")
        
        logger.info(f"✅ [GetScan] Job found: {job_id}")
        
        return {
            "success": True,
            "job": job
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [GetScan] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{job_id}")
async def delete_scan_job(job_id: str):
    """
    Delete a scan job
    """
    
    try:
        logger.info(f"🗑️ [DeleteScan] Deleting job: {job_id}")
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        result = await db.scan_jobs.delete_one({"job_id": job_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Scan job {job_id} not found")
        
        logger.info(f"✅ [DeleteScan] Job deleted: {job_id}")
        
        return {
            "success": True,
            "message": f"Scan job {job_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [DeleteScan] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}/status")
async def get_scan_job_status(job_id: str):
    """
    Get the status of a scan job
    """
    
    try:
        job = await get_scan_job_by_id(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Scan job {job_id} not found")
        
        return {
            "success": True,
            "job_id": job_id,
            "status": job.get("status", "unknown"),
            "progress": 100 if job.get("status") == "completed" else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/check")
async def scan_jobs_health():
    """
    Health check endpoint
    """
    
    scan_service = get_scan_service()
    db = get_database()
    
    return {
        "status": "healthy",
        "service": "Scan Jobs API",
        "version": "2.0.0",
        "database_connected": db is not None,
        "scans_processed": scan_service.scan_count
    }
