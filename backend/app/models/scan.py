"""
Scan Job Model (MongoDB)
Pydantic models for scan job operations
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class ScanJobBase(BaseModel):
    """Base scan job model"""
    job_id: str
    user_id: str
    scan_name: str
    source_type: str  # "upload", "s3", "database", "api"
    source_path: Optional[str] = None
    status: str = "pending"  # pending, running, completed, failed
    rows_scanned: int = 0
    columns_scanned: int = 0
    quality_score: float = 0.0
    issues_found: int = 0
    metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class ScanJobCreate(ScanJobBase):
    """Model for creating a scan job"""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ScanJobInDB(ScanJobBase):
    """Scan job as stored in MongoDB"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ScanJobResponse(BaseModel):
    """Scan job response model"""
    id: str
    job_id: str
    user_id: str
    scan_name: str
    source_type: str
    source_path: Optional[str] = None
    status: str
    rows_scanned: int
    columns_scanned: int
    quality_score: float
    issues_found: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
