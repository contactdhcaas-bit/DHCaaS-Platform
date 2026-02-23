# app/api/v1/endpoints/reports.py
"""
API Endpoints for PDF Report Generation
Connected to MongoDB for real scan data
"""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response, JSONResponse
from datetime import datetime
from bson import ObjectId
import logging

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.database import get_database

# Report builder - transforms ScanEngine results to PDF format
from app.services.report_builder import build_report_from_scan

# PDF service - generates PDF from report data
from app.services.pdf_service import generate_pdf_report, get_pdf_engine_status

# Logger setup
logger = logging.getLogger(__name__)

# Router definition
router = APIRouter(tags=["reports"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_scan_by_job_id(
    job_id: str, 
    db: AsyncIOMotorClient
) -> Dict[str, Any]:
    """
    Fetch scan document from MongoDB using job_id
    
    Args:
        job_id: The job ID string (UUID format)
        db: MongoDB database instance
        
    Returns:
        Scan document dictionary
        
    Raises:
        HTTPException: If scan not found
    """
    collection = db["dhcaas"]["scan_jobs"]
    scan = await collection.find_one({"job_id": job_id})
    
    if not scan:
        raise HTTPException(
            status_code=404, 
            detail=f"Scan with job_id '{job_id}' not found"
        )
    
    return scan


# ============================================================================
# MAIN ENDPOINTS
# ============================================================================

@router.get("/download-by-job/{job_id}")
async def download_report_by_job_id(
    job_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Download PDF report using job_id from ScanEngine results.
    
    This endpoint:
    1. Fetches the scan job from MongoDB
    2. Validates it's completed
    3. Transforms ScanEngine results to report format using ReportBuilder
    4. Generates professional PDF using HTML templates
    5. Returns PDF as downloadable file
    
    Args:
        job_id: Scan job UUID (e.g., d03e2e52-b6bb-4c5d-b86a-f03b801ae34b)
        
    Returns:
        PDF file download with real scan results
        
    Example:
        GET /api/v1/reports/download-by-job/d03e2e52-b6bb-4c5d-b86a-f03b801ae34b
    """
    try:
        logger.info(f"📥 Downloading report for job_id: {job_id}")
        
        # Fetch scan job from database
        scan_data = await get_scan_by_job_id(job_id, db)
        
        # Check if scan is completed
        status = scan_data.get('status')
        if status != 'completed':
            raise HTTPException(
                status_code=400,
                detail=f"Scan job is not completed yet. Current status: {status}. "
                       f"Please wait for the scan to finish before generating a report."
            )
        
        # Check if results exist
        if not scan_data.get('results'):
            raise HTTPException(
                status_code=400,
                detail="Scan job has no results. The scan may have failed."
            )
        
        logger.info(f"✅ Scan found - Score: {scan_data['results'].get('overall_score')}%")
        
        # Transform ScanEngine results to PDF template format using ReportBuilder
        report_data = build_report_from_scan(scan_data)
        
        logger.info(f"✅ Report data transformed - Grade: {report_data['smart_score']['grade']}")
        
        # Generate PDF using HTML template service
        pdf_bytes = generate_pdf_report(report_data)
        
        # Prepare filename
        datasource_name = scan_data.get('datasource_name', 'report').replace(' ', '_')
        filename = f"DHCaaS_Report_{datasource_name}_{job_id[:8]}.pdf"
        
        logger.info(f"✅ PDF generated successfully: {filename} ({len(pdf_bytes):,} bytes)")
        
        # Return PDF as download
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_bytes))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating report for {job_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/preview-by-job/{job_id}")
async def preview_report_data_by_job(
    job_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Preview report data without generating PDF (for debugging).
    
    Useful for:
    - Debugging template issues
    - Verifying data transformation
    - Testing ReportBuilder logic
    
    Args:
        job_id: Scan job UUID
        
    Returns:
        JSON with complete report data structure
    """
    try:
        logger.info(f"🔍 Previewing report data for job_id: {job_id}")
        
        # Fetch scan from MongoDB
        scan_data = await get_scan_by_job_id(job_id, db)
        
        # Transform to report data
        report_data = build_report_from_scan(scan_data)
        
        return JSONResponse(content={
            "success": True,
            "job_id": job_id,
            "scan_status": scan_data.get('status'),
            "report_data": report_data,
            "metadata": {
                "datasource": scan_data.get('datasource_name'),
                "scan_date": str(scan_data.get('created_at')),
                "overall_score": report_data['smart_score']['overall_score'],
                "grade": report_data['smart_score']['grade'],
                "issues_count": len(report_data['issues'])
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error previewing report for {job_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to preview report: {str(e)}"
        )


@router.get("/scan-status/{job_id}")
async def get_scan_status_for_report(
    job_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Check if a scan is ready for report generation.
    
    Returns quick status without generating the report.
    Useful for frontend polling before attempting download.
    
    Args:
        job_id: Scan job UUID
        
    Returns:
        JSON with scan status and report readiness
    """
    try:
        collection = db["dhcaas"]["scan_jobs"]
        scan = await collection.find_one(
            {"job_id": job_id},
            {"job_id": 1, "status": 1, "datasource_name": 1, "created_at": 1, 
             "completed_at": 1, "results.overall_score": 1, "results.grade": 1, "_id": 0}
        )
        
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan job not found: {job_id}")
        
        status = scan.get('status')
        is_ready = status == 'completed'
        
        return {
            "job_id": job_id,
            "status": status,
            "ready_for_report": is_ready,
            "datasource_name": scan.get('datasource_name'),
            "scan_date": scan.get('created_at'),
            "completed_at": scan.get('completed_at'),
            "score": scan.get('results', {}).get('overall_score'),
            "grade": scan.get('results', {}).get('grade'),
            "message": (
                "Report is ready for download" if is_ready 
                else f"Scan is still {status}. Please wait."
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error checking scan status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LEGACY/ALTERNATIVE ENDPOINTS
# ============================================================================

@router.get("/download/{scan_id}")
async def download_report_by_object_id(
    scan_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    [ALTERNATIVE] Download PDF report using MongoDB ObjectId.
    
    Most users should use /download-by-job/{job_id} instead.
    This endpoint exists for backward compatibility.
    
    Args:
        scan_id: MongoDB ObjectId as string
        
    Returns:
        PDF file download
    """
    try:
        # Validate ObjectId format
        try:
            obj_id = ObjectId(scan_id)
        except Exception:
            raise HTTPException(
                status_code=400, 
                detail="Invalid scan ID format. Use /download-by-job/{job_id} instead."
            )
        
        # Fetch by ObjectId
        collection = db["dhcaas"]["scan_jobs"]
        scan_data = await collection.find_one({"_id": obj_id})
        
        if not scan_data:
            raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
        
        # Check completion
        if scan_data.get('status') != 'completed':
            raise HTTPException(
                status_code=400,
                detail=f"Scan not completed. Status: {scan_data.get('status')}"
            )
        
        # Generate report
        report_data = build_report_from_scan(scan_data)
        pdf_bytes = generate_pdf_report(report_data)
        
        # Return PDF
        datasource_name = scan_data.get('datasource_name', 'report').replace(' ', '_')
        filename = f"DHCaaS_Report_{datasource_name}_{scan_id[:8]}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def reports_health(db: AsyncIOMotorClient = Depends(get_database)):
    """
    Health check for reports service.
    
    Verifies:
    - MongoDB connectivity
    - PDF service availability
    - Report builder functionality
    """
    try:
        # Check MongoDB connection
        await db.command('ping')
        
        # Count available scans
        collection = db["dhcaas"]["scan_jobs"]
        total_scans = await collection.count_documents({})
        completed_scans = await collection.count_documents({"status": "completed"})
        
        # Check PDF service
        engine_info = get_pdf_engine_status()
        
        return {
            "service": "Reports Generator",
            "status": "operational",
            "version": "4.0.0",
            "mongodb": {
                "status": "connected",
                "total_scans": total_scans,
                "completed_scans": completed_scans,
                "reports_available": completed_scans
            },
            "pdf_engine": {
                "current": engine_info['current_engine'],
                "available_engines": engine_info['engines_available']
            },
            "features": {
                "scan_engine_integration": "enabled",
                "report_builder": "enabled",
                "html_templates": "enabled",
                "ai_recommendations": "enabled"
            },
            "endpoints": {
                "primary": "/download-by-job/{job_id}",
                "preview": "/preview-by-job/{job_id}",
                "status_check": "/scan-status/{job_id}"
            }
        }
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return {
            "service": "Reports Generator",
            "status": "degraded",
            "mongodb": "disconnected",
            "error": str(e)
        }

