"""
Data Catalog Models
Automatic dataset discovery and smart tagging system
"""

from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from bson import ObjectId


class ColumnMetadata(BaseModel):
    """Column metadata within a catalog item"""
    name: str
    data_type: str
    sample_values: Optional[List[Any]] = None  # Changed from List[str] to List[Any]
    null_count: Optional[int] = None
    unique_count: Optional[int] = None
    tags: Optional[List[str]] = []


class CatalogItem(BaseModel):
    """Data Catalog Item - Represents a discovered dataset"""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str = Field(..., description="Dataset/File name")
    description: Optional[str] = Field(None, description="Auto-generated or user-defined description")
    tags: List[str] = Field(default_factory=list, description="Smart tags (PII, Financial, etc.)")
    columns: List[ColumnMetadata] = Field(default_factory=list, description="Column metadata")
    row_count: int = Field(0, description="Number of rows")
    quality_score: Optional[float] = Field(None, description="Quality score (0-100)")
    owner_id: Optional[str] = Field(None, description="User who owns this item")
    scan_id: Optional[str] = Field(None, description="Latest scan ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_scanned_at: Optional[datetime] = None
    total_incidents: Optional[int] = 0
    critical_incidents: Optional[int] = 0
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class CatalogListResponse(BaseModel):
    """Response for catalog listing"""
    total: int
    items: List[CatalogItem]
    page: int
    page_size: int


class CatalogStats(BaseModel):
    """Statistics for the entire catalog"""
    total_datasets: int = Field(..., description="Total number of datasets")
    average_quality_score: float = Field(..., description="Average quality score across all datasets")
    total_rows: int = Field(..., description="Total rows across all datasets")
    unique_tags: int = Field(..., description="Number of unique tags")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_datasets": 150,
                "average_quality_score": 87.5,
                "total_rows": 1000000,
                "unique_tags": 25
            }
        }
