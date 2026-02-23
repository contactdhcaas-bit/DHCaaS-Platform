"""
Data Catalog API Endpoints
Auto-discovery and smart tagging for datasets
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.catalog import CatalogItem, CatalogListResponse, CatalogStats
from app.core.database import get_database
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/items", response_model=CatalogListResponse)
async def list_catalog_items(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    search: Optional[str] = Query(None, description="Search in name/description"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    List all catalog items with pagination and filtering
    
    Features:
    - Pagination support
    - Filter by tags
    - Search by name/description
    """
    try:
        collection = db["catalog"]
        
        # Build query filter
        query_filter = {}
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            query_filter["tags"] = {"$in": tag_list}
        
        if search:
            query_filter["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = await collection.count_documents(query_filter)
        
        # Get paginated results
        skip = (page - 1) * page_size
        cursor = collection.find(query_filter).skip(skip).limit(page_size).sort("updated_at", -1)
        
        items_list = await cursor.to_list(length=page_size)
        
        # Convert to CatalogItem models
        catalog_items = []
        for item in items_list:
            try:
                # Convert ObjectId to string
                if "_id" in item:
                    item["_id"] = str(item["_id"])
                catalog_items.append(CatalogItem(**item))
            except Exception as e:
                logger.warning(f"Skipping invalid catalog item: {e}")
                continue
        
        logger.info(f"Retrieved {len(catalog_items)} catalog items (page {page})")
        
        return CatalogListResponse(
            total=total,
            items=catalog_items,
            page=page,
            page_size=page_size
        )
    
    except Exception as e:
        logger.error(f"Error listing catalog items: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve catalog: {str(e)}")


@router.get("/stats", response_model=CatalogStats)
async def get_catalog_stats(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get catalog statistics
    
    Returns:
    - Total datasets
    - Average quality score
    - Total rows
    - Unique tags
    """
    try:
        collection = db["catalog"]
        
        # Get total datasets
        total_datasets = await collection.count_documents({})
        
        if total_datasets == 0:
            return CatalogStats(
                total_datasets=0,
                average_quality_score=0.0,
                total_rows=0,
                unique_tags=0
            )
        
        # Aggregate stats
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_quality": {"$avg": "$quality_score"},
                    "total_rows": {"$sum": "$row_count"},
                    "all_tags": {"$push": "$tags"}
                }
            }
        ]
        
        result = await collection.aggregate(pipeline).to_list(length=1)
        
        if not result:
            unique_tags = 0
            avg_quality = 0.0
            total_rows = 0
        else:
            stats = result[0]
            avg_quality = stats.get("avg_quality", 0.0) or 0.0
            total_rows = stats.get("total_rows", 0) or 0
            
            # Count unique tags
            all_tags_nested = stats.get("all_tags", [])
            unique_tags_set = set()
            for tag_list in all_tags_nested:
                if isinstance(tag_list, list):
                    unique_tags_set.update(tag_list)
            unique_tags = len(unique_tags_set)
        
        return CatalogStats(
            total_datasets=total_datasets,
            average_quality_score=round(avg_quality, 2),
            total_rows=total_rows,
            unique_tags=unique_tags
        )
    
    except Exception as e:
        logger.error(f"Error getting catalog stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
