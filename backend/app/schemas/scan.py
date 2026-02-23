"""
DHCaaS Backend - Scan Schemas
Pydantic models for data quality scanning, compliance checks, and incident management.

Author: DHCaaS Platform Team
Date: 2026-02-04
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from enum import Enum


# ===== TYPE ALIASES =====
ProcessingType = Literal["full", "incremental", "sample"]
JobStatus = Literal["pending", "running", "completed", "failed", "cancelled"]
GdprRiskLevel = Literal["none", "low", "medium", "high", "critical"]
IncidentStatus = Literal["open", "in_progress", "resolved", "closed"]


# ===== ENUMS =====
class SeverityLevel(str, Enum):
    """Incident severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class IncidentCategory(str, Enum):
    """Incident classification categories"""
    SCHEMA = "schema"
    SECURITY = "security"
    QUALITY = "quality"
    PIPELINE = "pipeline"
    METADATA = "metadata"
    LINEAGE = "lineage"
    COMPLIANCE = "compliance"


# ===== SCAN JOB METADATA =====
class ScanJobMeta(BaseModel):
    """
    Metadata for scan job execution
    Tracks connection details and scan parameters
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "connection_id": "conn_mysql_prod_001",
                "table_count": 45,
                "estimated_rows": 1500000,
                "processing_type": "incremental"
            }
        }
    )

    connection_id: str = Field(
        ...,
        description="Unique identifier for the database connection",
        min_length=1,
        max_length=100
    )
    table_count: int = Field(
        ...,
        description="Number of tables to be scanned",
        ge=0,
        le=10000
    )
    estimated_rows: int = Field(
        ...,
        description="Estimated total number of rows across all tables",
        ge=0
    )
    processing_type: ProcessingType = Field(
        default="full",
        description="Type of processing: full scan, incremental, or sample"
    )
    filters: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional filters to apply during scanning (e.g., date range, table pattern)"
    )
    configuration: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional scan configuration parameters"
    )


# ===== QUALITY METRICS =====
class QualityMetrics(BaseModel):
    """
    Data quality assessment metrics
    Evaluates multiple dimensions of data health
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "completeness": 94.5,
                "validity": 88.2,
                "consistency": 91.7,
                "accuracy": 96.3,
                "uniqueness": 99.1,
                "timeliness": 87.5
            }
        }
    )

    completeness: float = Field(
        ...,
        description="Percentage of non-null values in required fields",
        ge=0.0,
        le=100.0
    )
    validity: float = Field(
        ...,
        description="Percentage of values conforming to defined formats/patterns",
        ge=0.0,
        le=100.0
    )
    consistency: float = Field(
        ...,
        description="Percentage of values consistent across related fields",
        ge=0.0,
        le=100.0
    )
    accuracy: float = Field(
        ...,
        description="Percentage of values matching reference data",
        ge=0.0,
        le=100.0
    )
    uniqueness: Optional[float] = Field(
        default=None,
        description="Percentage of unique values where uniqueness is expected",
        ge=0.0,
        le=100.0
    )
    timeliness: Optional[float] = Field(
        default=None,
        description="Percentage of data updated within expected timeframe",
        ge=0.0,
        le=100.0
    )
    overall_score: Optional[float] = Field(
        default=None,
        description="Weighted average of all quality dimensions",
        ge=0.0,
        le=100.0
    )


# ===== COMPLIANCE CHECK =====
class ComplianceCheck(BaseModel):
    """
    GDPR and compliance assessment results
    Tracks PII detection and regulatory compliance status
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "gdpr_compliant": False,
                "pii_fields_detected": ["ssn", "email", "phone_number"],
                "encryption_status": "partial",
                "retention_policy_met": True,
                "risk_level": "high"
            }
        }
    )

    gdpr_compliant: bool = Field(
        ...,
        description="Whether the data source meets GDPR requirements"
    )
    pii_fields_detected: List[str] = Field(
        default_factory=list,
        description="List of field names containing Personally Identifiable Information"
    )
    encryption_status: Literal["encrypted", "partial", "unencrypted"] = Field(
        ...,
        description="Status of data encryption for sensitive fields"
    )
    retention_policy_met: bool = Field(
        ...,
        description="Whether data retention policies are being followed"
    )
    risk_level: GdprRiskLevel = Field(
        ...,
        description="Overall compliance risk level"
    )
    ccpa_compliant: Optional[bool] = Field(
        default=None,
        description="Whether the data source meets CCPA requirements (California)"
    )
    hipaa_compliant: Optional[bool] = Field(
        default=None,
        description="Whether the data source meets HIPAA requirements (Healthcare)"
    )
    recommendations: Optional[List[str]] = Field(
        default_factory=list,
        description="List of recommended actions to improve compliance"
    )


# ===== PREDICTIVE ANALYSIS =====
class PredictiveAnalysis(BaseModel):
    """
    ML-powered predictions and anomaly detection
    Provides insights on future data health trends
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "anomalies_detected": 3,
                "predicted_issues": [
                    "High null rate in email field (expected 15% increase next week)",
                    "Schema drift likely in orders table within 48 hours"
                ],
                "confidence_score": 87.5,
                "trend": "degrading"
            }
        }
    )

    anomalies_detected: int = Field(
        ...,
        description="Number of statistical anomalies found in the data",
        ge=0
    )
    predicted_issues: List[str] = Field(
        default_factory=list,
        description="List of potential data quality issues forecasted by ML models"
    )
    confidence_score: float = Field(
        ...,
        description="Confidence level of the predictive analysis (0-100)",
        ge=0.0,
        le=100.0
    )
    trend: Literal["improving", "stable", "degrading"] = Field(
        ...,
        description="Overall trend direction of data quality"
    )
    recommended_actions: Optional[List[str]] = Field(
        default_factory=list,
        description="AI-recommended actions to prevent predicted issues"
    )
    model_version: Optional[str] = Field(
        default="v1.0",
        description="Version of the ML model used for analysis"
    )


# ===== SCAN JOB =====
class ScanJob(BaseModel):
    """
    Complete scan job record
    Represents a single data quality scan execution with all associated metrics
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "job_id": "scan_20260204_143022_mysql_prod",
                "owner_id": "user_123456",
                "source_id": "src_mysql_production_db",
                "source_name": "MySQL Production Database",
                "status": "completed",
                "progress": 100,
                "started_at": "2026-02-04T14:30:22Z",
                "completed_at": "2026-02-04T14:35:48Z",
                "metadata": {
                    "connection_id": "conn_mysql_prod_001",
                    "table_count": 45,
                    "estimated_rows": 1500000,
                    "processing_type": "full"
                },
                "quality_metrics": {
                    "completeness": 94.5,
                    "validity": 88.2,
                    "consistency": 91.7,
                    "accuracy": 96.3
                },
                "compliance": {
                    "gdpr_compliant": False,
                    "pii_fields_detected": ["ssn", "email"],
                    "encryption_status": "partial",
                    "retention_policy_met": True,
                    "risk_level": "high"
                },
                "issues_found": 12,
                "total_records_scanned": 1487562
            }
        }
    )

    job_id: str = Field(
        ...,
        description="Unique identifier for the scan job",
        min_length=1,
        max_length=100
    )
    owner_id: str = Field(
        ...,
        description="User ID who owns this scan job",
        min_length=1,
        max_length=100
    )
    source_id: str = Field(
        ...,
        description="ID of the data source being scanned",
        min_length=1,
        max_length=100
    )
    source_name: str = Field(
        ...,
        description="Human-readable name of the data source",
        min_length=1,
        max_length=255
    )
    status: JobStatus = Field(
        ...,
        description="Current status of the scan job"
    )
    progress: int = Field(
        default=0,
        description="Completion percentage (0-100)",
        ge=0,
        le=100
    )
    started_at: datetime = Field(
        ...,
        description="Timestamp when the scan job started (ISO 8601)"
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the scan job completed (ISO 8601)"
    )
    metadata: ScanJobMeta = Field(
        ...,
        description="Metadata about the scan execution"
    )
    quality_metrics: Optional[QualityMetrics] = Field(
        default=None,
        description="Calculated quality metrics (available after completion)"
    )
    compliance: Optional[ComplianceCheck] = Field(
        default=None,
        description="Compliance assessment results (available after completion)"
    )
    predictive: Optional[PredictiveAnalysis] = Field(
        default=None,
        description="AI-powered predictive insights (optional, requires ML module)"
    )
    issues_found: int = Field(
        default=0,
        description="Total number of data quality issues detected",
        ge=0
    )
    total_records_scanned: int = Field(
        default=0,
        description="Total number of records processed during scan",
        ge=0
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Error details if the scan failed",
        max_length=1000
    )
    duration_seconds: Optional[float] = Field(
        default=None,
        description="Total scan duration in seconds",
        ge=0.0
    )


# ===== INCIDENT =====
class Incident(BaseModel):
    """
    Data quality incident record
    Tracks issues discovered during scans or reported manually
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "incident_id": "INC-2026-001",
                "owner_id": "user_123456",
                "severity": "critical",
                "title": "Schema Drift Detected in Sales Table",
                "description": "Unexpected column removal detected: sales_table.customer_email",
                "source_id": "src_mysql_production_db",
                "source_name": "MySQL Production Database",
                "category": "schema",
                "status": "open",
                "assignee": None,
                "created_at": "2026-02-04T14:35:50Z",
                "affected_tables": ["sales_table", "customer_history"],
                "affected_rows": 125000
            }
        }
    )

    incident_id: str = Field(
        ...,
        description="Unique incident identifier (e.g., INC-2026-001)",
        pattern=r"^INC-\d{4}-\d{3,6}$"
    )
    owner_id: Optional[str] = Field(
        default=None,
        description="User ID who owns this incident (None for global/system incidents)",
        max_length=100
    )
    severity: SeverityLevel = Field(
        ...,
        description="Severity level of the incident"
    )
    title: str = Field(
        ...,
        description="Brief title describing the incident",
        min_length=5,
        max_length=200
    )
    description: str = Field(
        ...,
        description="Detailed description of the incident and its impact",
        min_length=10,
        max_length=2000
    )
    source_id: str = Field(
        ...,
        description="ID of the data source where the incident occurred",
        min_length=1,
        max_length=100
    )
    source_name: str = Field(
        ...,
        description="Human-readable name of the affected data source",
        min_length=1,
        max_length=255
    )
    category: IncidentCategory = Field(
        ...,
        description="Classification category of the incident"
    )
    status: IncidentStatus = Field(
        default="open",
        description="Current status of the incident"
    )
    assignee: Optional[str] = Field(
        default=None,
        description="User ID or name of the person assigned to resolve the incident",
        max_length=100
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the incident was created (ISO 8601)"
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the incident was last updated (ISO 8601)"
    )
    resolved_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the incident was resolved (ISO 8601)"
    )
    scan_job_id: Optional[str] = Field(
        default=None,
        description="ID of the scan job that detected this incident",
        max_length=100
    )
    affected_tables: Optional[List[str]] = Field(
        default_factory=list,
        description="List of database tables affected by this incident"
    )
    affected_rows: Optional[int] = Field(
        default=None,
        description="Number of rows affected by this incident",
        ge=0
    )
    root_cause: Optional[str] = Field(
        default=None,
        description="Root cause analysis details",
        max_length=1000
    )
    resolution_notes: Optional[str] = Field(
        default=None,
        description="Notes on how the incident was resolved",
        max_length=1000
    )
    tags: Optional[List[str]] = Field(
        default_factory=list,
        description="Tags for categorization and filtering"
    )


# ===== REQUEST/RESPONSE MODELS =====
class ScanJobCreateRequest(BaseModel):
    """Request model for creating a new scan job"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source_id": "src_mysql_production_db",
                "processing_type": "incremental",
                "filters": {"tables": ["orders", "customers"]}
            }
        }
    )

    source_id: str = Field(
        ...,
        description="ID of the data source to scan",
        min_length=1,
        max_length=100
    )
    processing_type: ProcessingType = Field(
        default="full",
        description="Type of scan processing"
    )
    filters: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional scan filters"
    )


class ScanJobResponse(BaseModel):
    """Response model for scan job operations"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: Optional[ScanJob] = Field(default=None, description="Scan job data if successful")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class IncidentCreateRequest(BaseModel):
    """Request model for creating a new incident"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "severity": "high",
                "title": "Duplicate Records in Customer Table",
                "description": "Found 1,240 duplicate customer IDs",
                "source_id": "src_postgres_analytics",
                "category": "quality"
            }
        }
    )

    severity: SeverityLevel = Field(..., description="Incident severity")
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    source_id: str = Field(..., min_length=1, max_length=100)
    category: IncidentCategory = Field(..., description="Incident category")
    affected_tables: Optional[List[str]] = Field(default_factory=list)
    affected_rows: Optional[int] = Field(default=None, ge=0)


class IncidentUpdateRequest(BaseModel):
    """Request model for updating an incident"""
    status: Optional[IncidentStatus] = None
    assignee: Optional[str] = None
    root_cause: Optional[str] = None
    resolution_notes: Optional[str] = None
    tags: Optional[List[str]] = None


class IncidentResponse(BaseModel):
    """Response model for incident operations"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Incident] = Field(default=None, description="Incident data if successful")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
