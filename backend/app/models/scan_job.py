# app/models/scan_job.py
"""
Scan Job Data Models
Production-grade Pydantic models for scan job management
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ScanStatus(str, Enum):
    """Scan job status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanJobCreate(BaseModel):
    """Request model for creating a scan job"""
    filename: str
    datasource_name: Optional[str] = None
    owner: Optional[str] = None


class ScanJobInDB(BaseModel):
    """
    Internal database model
    Complete representation of scan job stored in MongoDB
    """
    # Basic info
    job_id: str
    user_id: str
    filename: str
    datasource_name: str
    owner: str
    status: ScanStatus
    file_size: int
    file_type: str
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    # Scan results - basic metrics
    total_rows: int = 0
    total_columns: int = 0
    column_names: List[str] = []
    
    # Quality metrics (0-100 scale)
    quality_score: float = 0.0
    completeness_score: float = 0.0
    accuracy_score: float = 0.0
    consistency_score: float = 0.0
    
    # Issues summary
    total_issues: int = 0
    critical_issues: int = 0
    high_issues: int = 0
    medium_issues: int = 0
    low_issues: int = 0
    
    # Detailed results (stored as JSON)
    scan_results: Dict[str, Any] = {}
    
    # Metadata
    processing_time_seconds: float = 0.0
    error_message: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user123",
                "filename": "customer_data.csv",
                "datasource_name": "Customer Database",
                "owner": "john@example.com",
                "status": "completed",
                "file_size": 1048576,
                "file_type": "csv",
                "created_at": "2026-02-20T14:30:00",
                "updated_at": "2026-02-20T14:30:05",
                "completed_at": "2026-02-20T14:30:05",
                "total_rows": 1000,
                "total_columns": 15,
                "column_names": ["id", "name", "email", "age"],
                "quality_score": 85.5,
                "completeness_score": 90.0,
                "accuracy_score": 82.0,
                "consistency_score": 84.5,
                "total_issues": 25,
                "critical_issues": 2,
                "high_issues": 5,
                "medium_issues": 10,
                "low_issues": 8,
                "processing_time_seconds": 5.23
            }
        }


class ScanJobResponse(BaseModel):
    """
    Response model for API
    Simplified view for list endpoints
    """
    job_id: str
    filename: str
    datasource_name: str
    owner: str
    status: str
    created_at: str
    total_rows: int
    total_columns: int
    column_names: List[str]
    quality_score: float
    total_issues: int
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "filename": "customer_data.csv",
                "datasource_name": "Customer Database",
                "owner": "john@example.com",
                "status": "completed",
                "created_at": "2026-02-20T14:30:00",
                "total_rows": 1000,
                "total_columns": 15,
                "column_names": ["id", "name", "email", "age"],
                "quality_score": 85.5,
                "total_issues": 25
            }
        }


class ScanJobDetailResponse(BaseModel):
    """
    Detailed response model for single job endpoint
    Includes full scan results
    """
    job_id: str
    filename: str
    datasource_name: str
    owner: str
    status: str
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    
    # Metrics
    total_rows: int
    total_columns: int
    column_names: List[str]
    file_size: int
    file_type: str
    processing_time_seconds: float
    
    # Quality scores
    quality_score: float
    completeness_score: float
    accuracy_score: float
    consistency_score: float
    
    # Issues
    total_issues: int
    critical_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int
    
    # Full results
    scan_results: Dict[str, Any]
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class ScanJobListResponse(BaseModel):
    """Response model for list endpoint with pagination"""
    success: bool
    total: int
    jobs: List[ScanJobResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "total": 150,
                "jobs": [
                    {
                        "job_id": "550e8400-e29b-41d4-a716-446655440000",
                        "filename": "customer_data.csv",
                        "datasource_name": "Customer Database",
                        "owner": "john@example.com",
                        "status": "completed",
                        "created_at": "2026-02-20T14:30:00",
                        "total_rows": 1000,
                        "total_columns": 15,
                        "column_names": ["id", "name", "email"],
                        "quality_score": 85.5,
                        "total_issues": 25
                    }
                ]
            }
        }


class ScanJobUpdate(BaseModel):
    """Model for updating scan job (partial updates)"""
    datasource_name: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[ScanStatus] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "datasource_name": "Updated Customer Database",
                "status": "completed"
            }
        }


class ScanJobStats(BaseModel):
    """Statistics model for dashboard"""
    total_scans: int
    completed_scans: int
    failed_scans: int
    total_rows_processed: int
    total_issues_found: int
    average_quality_score: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_scans": 150,
                "completed_scans": 145,
                "failed_scans": 5,
                "total_rows_processed": 1500000,
                "total_issues_found": 3500,
                "average_quality_score": 87.5
            }
        }
