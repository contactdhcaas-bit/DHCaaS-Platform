"""
MDM (Master Data Management) Router
Golden Record creation and Customer 360 view
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.models.mdm import (
    GoldenRecord,
    GoldenRecordCreate,
    GoldenRecordResponse,
    SourceRecord,
    SourceSystem,
    MergeStats
)
from app.services.mdm_service import get_mdm_service

router = APIRouter(prefix="/api/v1/mdm", tags=["Master Data Management"])
logger = logging.getLogger(__name__)


# ============================================================================
# GOLDEN RECORD CREATION
# ============================================================================

@router.post(
    "/golden-record",
    response_model=GoldenRecordResponse,
    summary="Create Golden Record",
    description="Merge multiple source records into a unified Golden Record"
)
async def create_golden_record(request: GoldenRecordCreate):
    """
    Create a Golden Record from source records using intelligent merging
    
    **Merge Logic:**
    - **Rule 1**: Most frequent value wins (Voting)
    - **Rule 2**: If tie, latest timestamp wins (Recency)
    - **Rule 3**: Quality score as tiebreaker
    
    **Confidence Calculation:**
    - Based on agreement across sources
    - Source diversity bonus
    - High agreement bonus
    """
    
    try:
        start_time = datetime.utcnow()
        service = get_mdm_service()
        
        # Validate input
        if not request.source_records:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one source record is required"
            )
        
        # Create golden record
        golden_record = service.create_golden_record(
            cluster_id=request.cluster_id,
            source_records=request.source_records
        )
        
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Calculate stats
        conflicts = len([
            fc for fc in golden_record.field_confidences
            if fc.source_count < len(request.source_records)
        ])
        
        stats = MergeStats(
            total_records=len(request.source_records),
            fields_merged=len(golden_record.unified_data),
            conflicts_resolved=conflicts,
            confidence_score=golden_record.confidence_score,
            processing_time_ms=processing_time
        )
        
        return GoldenRecordResponse(
            success=True,
            golden_record=golden_record,
            message=f"✅ Golden Record created successfully with {stats.fields_merged} fields",
            stats=stats.dict()
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error creating golden record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create golden record: {str(e)}"
        )


@router.post(
    "/golden-record/{cluster_id}",
    response_model=GoldenRecordResponse,
    summary="Create Golden Record by Cluster ID",
    description="Create Golden Record from existing cluster"
)
async def create_golden_record_by_cluster(
    cluster_id: str,
    source_records: List[SourceRecord]
):
    """
    Create Golden Record for a specific cluster
    
    - **cluster_id**: Identity resolution cluster ID
    - **source_records**: List of matched records to merge
    """
    
    request = GoldenRecordCreate(
        cluster_id=cluster_id,
        source_records=source_records
    )
    
    return await create_golden_record(request)


# ============================================================================
# GOLDEN RECORD RETRIEVAL
# ============================================================================

@router.get(
    "/golden-record/{golden_id}",
    response_model=GoldenRecord,
    summary="Get Golden Record by ID",
    description="Retrieve full Golden Record details including sources"
)
async def get_golden_record(golden_id: str):
    """
    Get Golden Record with complete details
    
    **Returns:**
    - Unified data
    - Source records
    - Field confidence scores
    - Overall confidence
    """
    
    service = get_mdm_service()
    golden_record = service.get_golden_record(golden_id)
    
    if not golden_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Golden Record not found: {golden_id}"
        )
    
    return golden_record


@router.get(
    "/golden-record/cluster/{cluster_id}",
    response_model=GoldenRecord,
    summary="Get Golden Record by Cluster ID"
)
async def get_golden_record_by_cluster(cluster_id: str):
    """Get Golden Record for a specific cluster"""
    
    service = get_mdm_service()
    golden_record = service.get_golden_record_by_cluster(cluster_id)
    
    if not golden_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Golden Record found for cluster: {cluster_id}"
        )
    
    return golden_record


@router.get(
    "/golden-records",
    response_model=List[GoldenRecord],
    summary="List All Golden Records",
    description="Get all Golden Records in the system"
)
async def list_golden_records(
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
    skip: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    List all Golden Records with pagination
    
    - **limit**: Maximum number of records (default: 100)
    - **skip**: Number of records to skip (default: 0)
    """
    
    service = get_mdm_service()
    all_records = service.list_golden_records()
    
    # Apply pagination
    paginated = all_records[skip : skip + limit]
    
    return paginated


# ============================================================================
# GOLDEN RECORD MANAGEMENT
# ============================================================================

@router.delete(
    "/golden-record/{golden_id}",
    summary="Delete Golden Record",
    description="Remove a Golden Record from the system"
)
async def delete_golden_record(golden_id: str):
    """Delete a Golden Record"""
    
    service = get_mdm_service()
    success = service.delete_golden_record(golden_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Golden Record not found: {golden_id}"
        )
    
    return {
        "success": True,
        "message": f"✅ Golden Record deleted: {golden_id}"
    }


# ============================================================================
# DEMO / TESTING ENDPOINTS
# ============================================================================

@router.post(
    "/demo/create-sample-golden-record",
    response_model=GoldenRecordResponse,
    summary="Create Sample Golden Record (Demo)",
    description="Create a demo Golden Record with sample data"
)
async def create_sample_golden_record():
    """
    Create a sample Golden Record for testing
    
    Demonstrates merging 3 records from different systems:
    - CRM
    - ERP
    - E-Commerce
    """
    
    # Sample source records
    source_records = [
        SourceRecord(
            id="crm_001",
            system=SourceSystem.CRM,
            data={
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "company": "Acme Inc",
                "title": "VP Sales"
            },
            timestamp=datetime(2026, 2, 10, 10, 0, 0),
            quality_score=95.0
        ),
        SourceRecord(
            id="erp_002",
            system=SourceSystem.ERP,
            data={
                "name": "John M. Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "company": "Acme Corporation",
                "address": "123 Main St, New York, NY"
            },
            timestamp=datetime(2026, 2, 15, 14, 30, 0),
            quality_score=88.0
        ),
        SourceRecord(
            id="ecom_003",
            system=SourceSystem.ECOMMERCE,
            data={
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "company": "Acme Inc",
                "loyalty_tier": "Gold",
                "total_purchases": 15420.50
            },
            timestamp=datetime(2026, 2, 16, 9, 15, 0),
            quality_score=92.0
        )
    ]
    
    request = GoldenRecordCreate(
        cluster_id="demo_cluster_001",
        source_records=source_records
    )
    
    return await create_golden_record(request)


@router.get(
    "/stats",
    summary="Get MDM Statistics",
    description="Get overall MDM system statistics"
)
async def get_mdm_stats():
    """Get MDM system statistics"""
    
    service = get_mdm_service()
    all_records = service.list_golden_records()
    
    if not all_records:
        return {
            "total_golden_records": 0,
            "average_confidence": 0.0,
            "total_source_records": 0,
            "average_sources_per_record": 0.0
        }
    
    total_confidence = sum(r.confidence_score for r in all_records)
    total_sources = sum(r.record_count for r in all_records)
    
    return {
        "total_golden_records": len(all_records),
        "average_confidence": total_confidence / len(all_records),
        "total_source_records": total_sources,
        "average_sources_per_record": total_sources / len(all_records),
        "high_confidence_records": len([
            r for r in all_records if r.confidence_score >= 90
        ])
    }
