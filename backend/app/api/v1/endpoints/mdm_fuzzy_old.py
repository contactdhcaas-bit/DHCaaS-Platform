"""
Master Data Management (MDM) API Endpoints
Identity Resolution, Fuzzy Matching, Customer 360
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
import logging

from app.models.mdm import MatchRequest, MatchResult, MatchedPair
from app.services.matching_service import get_matching_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["mdm"])


@router.post("/match", response_model=MatchResult)
async def find_matches(request: MatchRequest):
    """
    Find matching records between two datasets using fuzzy matching
    
    This endpoint enables:
    - Customer 360 (matching customer records across systems)
    - Duplicate detection
    - Identity resolution
    - Master data management
    
    Args:
        request: Match request with source/target files and configuration
        
    Returns:
        MatchResult with matched pairs and statistics
    """
    try:
        matching_service = get_matching_service()
        
        result = matching_service.find_matches(
            source_file_id=request.source_file_id,
            target_file_id=request.target_file_id,
            match_columns=request.match_columns,
            threshold=request.threshold,
            limit=request.limit or 100
        )
        
        logger.info(
            f"Match completed: {result.summary['total_matches']} matches found "
            f"({result.execution_time:.2f}s)"
        )
        
        return result
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Matching failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform matching: {str(e)}"
        )


@router.post("/deduplicate", response_model=MatchResult)
async def deduplicate_dataset(
    file_id: str = Query(..., description="File to deduplicate"),
    match_columns: List[str] = Query(..., description="Columns to use for matching"),
    threshold: int = Query(90, ge=0, le=100, description="Similarity threshold")
):
    """
    Find duplicate records within a single dataset
    
    Args:
        file_id: File identifier
        match_columns: List of columns to compare
        threshold: Minimum similarity threshold (default: 90%)
        
    Returns:
        MatchResult with duplicate pairs
    """
    try:
        matching_service = get_matching_service()
        
        result = matching_service.deduplicate(
            file_id=file_id,
            match_columns=match_columns,
            threshold=threshold
        )
        
        logger.info(
            f"Deduplication completed: {result.summary['total_matches']} duplicates found"
        )
        
        return result
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Deduplication failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to deduplicate: {str(e)}"
        )


@router.get("/health")
async def mdm_health():
    """Health check for MDM service"""
    matching_service = get_matching_service()
    
    return {
        "service": "Master Data Management (MDM)",
        "status": "operational",
        "version": "1.0.0",
        "features": [
            "Fuzzy Matching",
            "Identity Resolution",
            "Duplicate Detection",
            "Customer 360"
        ],
        "fuzzy_engine": "thefuzz" if matching_service.use_fuzz else "difflib",
        "max_comparison_size": "500x500 rows",
        "supported_formats": ["CSV", "Excel", "JSON", "Parquet"]
    }
