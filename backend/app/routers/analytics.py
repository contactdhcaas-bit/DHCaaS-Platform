# app/routers/analytics.py
"""
Analytics Router - Chart Data Generation with Real Data
Integrates with DataReaderService and AggregationService for live data aggregation
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Literal, Dict, Any
import pandas as pd

from app.services.data_reader_service import DataReaderService
from app.services.aggregation_service import AggregationService
from app.core.database import get_sync_database


router = APIRouter(prefix="/analytics", tags=["Analytics"])


class ChartDataRequest(BaseModel):
    dataset_id: str
    x_field: str
    y_field: str
    aggregation: Literal["sum", "avg", "count", "min", "max"]
    limit: int = 20


class ChartDataPoint(BaseModel):
    name: str
    value: float


class ChartDataResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]]  # Changed to Dict for Pydantic v2 compatibility
    total_points: int
    x_field: str
    y_field: str
    aggregation: str


def get_datasets_collection():
    """Get datasets collection from MongoDB"""
    db = get_sync_database()
    return db["datasets"]


@router.post("/chart", response_model=ChartDataResponse)
async def get_chart_data(request: ChartDataRequest):
    """
    Generate chart data from real uploaded files
    
    Process:
    1. Fetch dataset metadata from MongoDB
    2. Load file into DataFrame using DataReaderService
    3. Validate fields exist in DataFrame
    4. Perform aggregation using AggregationService
    5. Return chart-ready data
    """
    try:
        # Step 1: Get dataset metadata from MongoDB
        collection = get_datasets_collection()
        dataset = collection.find_one({"id": request.dataset_id})
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{request.dataset_id}' not found"
            )
        
        # Check if dataset has file_path
        file_path = dataset.get("file_path") or dataset.get("table_name")
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset '{request.dataset_id}' has no associated file"
            )
        
        # Step 2: Load DataFrame from file (with caching)
        try:
            df = DataReaderService.get_dataframe(request.dataset_id, file_path)
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset file not found: {file_path}"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading dataset file: {str(e)}"
            )
        
        # Step 3: Validate fields exist in DataFrame
        fields_to_check = [request.x_field]
        if request.aggregation != "count":
            fields_to_check.append(request.y_field)
        
        all_valid, missing_fields = DataReaderService.validate_fields_exist(df, fields_to_check)
        if not all_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Fields not found in dataset: {', '.join(missing_fields)}"
            )
        
        # Step 4: Perform aggregation
        try:
            chart_data = AggregationService.aggregate_data(
                df=df,
                x_field=request.x_field,
                y_field=request.y_field,
                aggregation=request.aggregation,
                limit=request.limit
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Aggregation error: {str(e)}"
            )
        
        # Step 5: Convert ChartDataPoint objects to dicts for Pydantic v2 compatibility
        chart_data_dicts = [
            {"name": point.name, "value": point.value} 
            for point in chart_data
        ]
        
        # Return response
        return ChartDataResponse(
            success=True,
            data=chart_data_dicts,
            total_points=len(chart_data_dicts),
            x_field=request.x_field,
            y_field=request.y_field,
            aggregation=request.aggregation
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch-all for unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error generating chart data: {str(e)}"
        )


@router.get("/health")
async def analytics_health():
    """Health check endpoint for analytics service"""
    return {
        "status": "healthy",
        "service": "Analytics Engine",
        "version": "2.0.0",
        "features": [
            "Real-time data aggregation",
            "CSV/JSON/Excel support",
            "Intelligent caching (5min TTL)",
            "GroupBy operations (sum, avg, count, min, max)"
        ],
        "cache_info": {
            "enabled": True,
            "ttl_seconds": DataReaderService.CACHE_TTL_SECONDS,
            "max_size": DataReaderService.MAX_CACHE_SIZE,
            "current_size": len(DataReaderService._dataframe_cache)
        }
    }


@router.post("/cache/clear")
async def clear_cache(dataset_id: str = None):
    """
    Clear DataFrame cache
    
    Args:
        dataset_id: Optional. If provided, only clear cache for this dataset.
                   If omitted, clear entire cache.
    """
    try:
        DataReaderService.clear_cache(dataset_id)
        return {
            "success": True,
            "message": f"Cache cleared for dataset: {dataset_id}" if dataset_id else "Entire cache cleared"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing cache: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/info")
async def get_dataset_info(dataset_id: str):
    """
    Get detailed information about a dataset's DataFrame
    
    Returns row count, column count, memory usage, null counts, etc.
    """
    try:
        # Get dataset metadata
        collection = get_datasets_collection()
        dataset = collection.find_one({"id": dataset_id})
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_id}' not found"
            )
        
        file_path = dataset.get("file_path") or dataset.get("table_name")
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset has no associated file"
            )
        
        # Load DataFrame
        df = DataReaderService.get_dataframe(dataset_id, file_path)
        
        # Get DataFrame info
        info = DataReaderService.get_dataframe_info(df)
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "info": info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dataset info: {str(e)}"
        )


@router.get("/fields/{dataset_id}/summary")
async def get_field_summary(dataset_id: str, field: str):
    """
    Get statistical summary for a specific field
    
    Returns count, sum, mean, median, min, max, std, null_count
    """
    try:
        # Get dataset
        collection = get_datasets_collection()
        dataset = collection.find_one({"id": dataset_id})
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_id}' not found"
            )
        
        file_path = dataset.get("file_path") or dataset.get("table_name")
        df = DataReaderService.get_dataframe(dataset_id, file_path)
        
        # Check if field exists
        if field not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Field '{field}' not found in dataset"
            )
        
        # Get summary statistics
        summary = AggregationService.get_aggregation_summary(df, field)
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "field": field,
            "summary": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting field summary: {str(e)}"
        )


