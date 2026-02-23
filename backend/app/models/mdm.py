"""
MDM (Master Data Management) Models
Golden Record creation and source record management
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class SourceSystem(str, Enum):
    """Source system types"""
    CRM = "CRM"
    ERP = "ERP"
    ECOMMERCE = "E-Commerce"
    MARKETING = "Marketing"
    SUPPORT = "Support"
    MANUAL = "Manual"
    API = "API"
    IMPORT = "Import"


class SourceRecord(BaseModel):
    """Individual source record from a system"""
    id: str = Field(..., description="Unique record ID")
    system: SourceSystem = Field(..., description="Source system name")
    data: Dict[str, Any] = Field(..., description="Record data fields")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Record timestamp")
    quality_score: Optional[float] = Field(None, description="Data quality score (0-100)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "crm_12345",
                "system": "CRM",
                "data": {
                    "name": "John Doe",
                    "email": "john.doe@example.com",
                    "phone": "+1234567890",
                    "company": "Acme Inc"
                },
                "timestamp": "2026-02-16T17:00:00Z",
                "quality_score": 95.5
            }
        }


class FieldConfidence(BaseModel):
    """Confidence score for a specific field"""
    field_name: str
    value: Any
    confidence: float = Field(..., ge=0, le=100, description="Confidence percentage")
    source_count: int = Field(..., description="Number of sources agreeing")
    sources: List[str] = Field(..., description="Source systems providing this value")


class GoldenRecord(BaseModel):
    """Unified golden record from multiple sources"""
    id: str = Field(..., description="Golden record unique ID")
    cluster_id: str = Field(..., description="Cluster ID from identity resolution")
    unified_data: Dict[str, Any] = Field(..., description="Merged unified data")
    sources: List[SourceRecord] = Field(..., description="Source records used")
    field_confidences: List[FieldConfidence] = Field(
        default_factory=list,
        description="Confidence scores per field"
    )
    confidence_score: float = Field(
        ..., 
        ge=0, 
        le=100, 
        description="Overall confidence score"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    record_count: int = Field(..., description="Number of source records merged")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "golden_abc123",
                "cluster_id": "cluster_001",
                "unified_data": {
                    "name": "John Doe",
                    "email": "john.doe@example.com",
                    "phone": "+1234567890",
                    "company": "Acme Inc",
                    "address": "123 Main St"
                },
                "confidence_score": 92.5,
                "record_count": 3
            }
        }


class GoldenRecordCreate(BaseModel):
    """Request to create golden record"""
    cluster_id: str = Field(..., description="Cluster ID to merge")
    source_records: List[SourceRecord] = Field(..., description="Records to merge")


class GoldenRecordResponse(BaseModel):
    """Response with golden record details"""
    success: bool
    golden_record: Optional[GoldenRecord] = None
    message: str
    stats: Optional[Dict[str, Any]] = None


class MergeStats(BaseModel):
    """Statistics about the merge operation"""
    total_records: int
    fields_merged: int
    conflicts_resolved: int
    confidence_score: float
    processing_time_ms: float
