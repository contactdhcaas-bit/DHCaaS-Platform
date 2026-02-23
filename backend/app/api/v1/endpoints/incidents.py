"""
DHCaaS Incident Management API
===============================

Enterprise-grade incident tracking and resolution system for data quality 
and compliance violations.

Features:
- Pagination support (20 items per page)
- Multi-parameter filtering (status, severity)
- State management (open -> acknowledged -> resolved)
- Comprehensive error handling and validation
- Audit trail logging

Author: DHCaaS Engineering Team
Version: 1.0
Date: February 05, 2026
"""

from __future__ import annotations

import logging
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services.incident_store import IncidentStore

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Initialize router
router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Data store path
INCIDENTS_STORE_PATH = Path(__file__).parent.parent.parent.parent.parent / "incidents_store.json"

# Initialize store singleton
incident_store = IncidentStore(INCIDENTS_STORE_PATH)


# =============================================================================
# ENUMS & CONSTANTS
# =============================================================================

class IncidentStatus(str, Enum):
    """Valid incident status values."""
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class IncidentSeverity(str, Enum):
    """Valid incident severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class Incident(BaseModel):
    """Complete incident data model with all fields."""
    
    id: str = Field(..., description="Unique incident identifier")
    severity: IncidentSeverity = Field(..., description="Incident severity level")
    title: str = Field(..., min_length=1, max_length=200, description="Incident title")
    description: str = Field(..., min_length=1, description="Detailed incident description")
    status: IncidentStatus = Field(..., description="Current incident status")
    source: str = Field(..., description="Incident source system")
    scan_id: Optional[str] = Field(None, description="Related scan job ID")
    data_source: Optional[str] = Field(None, description="Affected data source")
    affected_records: Optional[int] = Field(None, ge=0, description="Number of affected records")
    regulatory_frameworks: list[str] = Field(default_factory=list, description="Applicable regulatory frameworks")
    created_at: str = Field(..., description="ISO 8601 timestamp of creation")
    acknowledged: bool = Field(..., description="Whether incident has been acknowledged")
    acknowledged_at: Optional[str] = Field(None, description="ISO 8601 timestamp of acknowledgment")
    acknowledged_by: Optional[str] = Field(None, description="Email of user who acknowledged")
    resolved_at: Optional[str] = Field(None, description="ISO 8601 timestamp of resolution")
    resolved_by: Optional[str] = Field(None, description="Email of user who resolved")
    assignee: Optional[str] = Field(None, description="Assigned team or individual")
    tags: list[str] = Field(default_factory=list, description="Incident tags for categorization")
    resolution_notes: Optional[str] = Field(None, description="Notes explaining resolution")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "INC-2026-001",
                "severity": "critical",
                "title": "Unencrypted PII Data Detected",
                "description": "Sensitive data found in public storage",
                "status": "open",
                "source": "automated_scan",
                "created_at": "2026-02-05T10:15:32Z",
                "acknowledged": False
            }
        }


class IncidentListResponse(BaseModel):
    """Paginated list response for incidents."""
    
    total: int = Field(..., description="Total number of incidents matching filters")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, le=100, description="Number of items per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    incidents: list[Incident] = Field(..., description="List of incidents for current page")


class AcknowledgeRequest(BaseModel):
    """Request body for acknowledging an incident."""
    
    acknowledged_by: str = Field(
        ..., 
        min_length=1, 
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        description="Email address of user acknowledging the incident"
    )
    notes: Optional[str] = Field(None, max_length=500, description="Optional acknowledgment notes")


class ResolveRequest(BaseModel):
    """Request body for resolving an incident."""
    
    resolved_by: str = Field(
        ..., 
        min_length=1,
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        description="Email address of user resolving the incident"
    )
    resolution_notes: str = Field(
        ..., 
        min_length=10, 
        max_length=1000, 
        description="Detailed explanation of resolution"
    )


class MessageResponse(BaseModel):
    """Generic success message response."""
    
    message: str = Field(..., description="Success message")
    incident: Incident = Field(..., description="Updated incident data")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def filter_incidents(
    incidents: list[dict[str, Any]],
    status_filter: Optional[IncidentStatus] = None,
    severity_filter: Optional[IncidentSeverity] = None
) -> list[dict[str, Any]]:
    """
    Apply status and severity filters to incident list.
    
    Args:
        incidents: List of incident dictionaries
        status_filter: Optional status to filter by
        severity_filter: Optional severity to filter by
        
    Returns:
        Filtered list of incidents
    """
    filtered = incidents
    
    if status_filter:
        filtered = [inc for inc in filtered if inc.get("status") == status_filter.value]
        logger.debug(f"Filtered by status={status_filter.value}: {len(filtered)} results")
    
    if severity_filter:
        filtered = [inc for inc in filtered if inc.get("severity") == severity_filter.value]
        logger.debug(f"Filtered by severity={severity_filter.value}: {len(filtered)} results")
    
    return filtered


def paginate_results(
    items: list[Any],
    page: int,
    page_size: int
) -> tuple[list[Any], int]:
    """
    Paginate list of items.
    
    Args:
        items: List to paginate
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        Tuple of (paginated items, total pages)
    """
    total_items = len(items)
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    paginated = items[start_idx:end_idx]
    
    return paginated, total_pages


def get_current_timestamp() -> str:
    """
    Generate ISO 8601 timestamp for current UTC time.
    
    Returns:
        ISO 8601 formatted timestamp string
    """
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.get(
    "",
    response_model=IncidentListResponse,
    summary="List All Incidents",
    description="Retrieve paginated list of incidents with optional filtering by status and severity"
)
async def list_incidents(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[IncidentStatus] = Query(None, description="Filter by incident status"),
    severity: Optional[IncidentSeverity] = Query(None, description="Filter by severity level")
) -> IncidentListResponse:
    """
    Retrieve paginated and filtered list of incidents.
    
    Supports filtering by:
    - Status (open, acknowledged, resolved)
    - Severity (critical, high, medium, low)
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (max 100)
        status: Optional status filter
        severity: Optional severity filter
        
    Returns:
        IncidentListResponse with paginated results
        
    Raises:
        HTTPException: If data store cannot be accessed
    """
    logger.info(
        f"Listing incidents: page={page}, page_size={page_size}, "
        f"status={status.value if status else 'all'}, "
        f"severity={severity.value if severity else 'all'}"
    )
    
    # Retrieve all incidents
    all_incidents = incident_store.get_all()
    
    # Apply filters
    filtered_incidents = filter_incidents(all_incidents, status, severity)
    
    # Sort by created_at (newest first)
    filtered_incidents.sort(
        key=lambda x: x.get("created_at", ""),
        reverse=True
    )
    
    # Paginate
    paginated_incidents, total_pages = paginate_results(
        filtered_incidents,
        page,
        page_size
    )
    
    # Convert to Pydantic models
    incident_models = [Incident(**inc) for inc in paginated_incidents]
    
    logger.info(
        f"Retrieved {len(incident_models)} incidents "
        f"(page {page}/{total_pages}, total: {len(filtered_incidents)})"
    )
    
    return IncidentListResponse(
        total=len(filtered_incidents),
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        incidents=incident_models
    )


@router.post(
    "/{incident_id}/acknowledge",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Acknowledge Incident",
    description="Mark an incident as acknowledged by a specific user"
)
async def acknowledge_incident(
    incident_id: str,
    request: AcknowledgeRequest
) -> MessageResponse:
    """
    Acknowledge an incident and record who acknowledged it.
    
    Updates incident status from 'open' to 'acknowledged' and records
    timestamp and user information.
    
    Args:
        incident_id: Unique incident identifier
        request: Acknowledgment details (user email, optional notes)
        
    Returns:
        MessageResponse with updated incident data
        
    Raises:
        HTTPException 404: If incident not found
        HTTPException 400: If incident already acknowledged or resolved
    """
    logger.info(f"Acknowledging incident {incident_id} by {request.acknowledged_by}")
    
    # Retrieve incident
    incident = incident_store.get_by_id(incident_id)
    
    if not incident:
        logger.warning(f"Incident {incident_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found"
        )
    
    # Validate current state
    current_status = incident.get("status")
    
    if current_status == IncidentStatus.RESOLVED.value:
        logger.warning(f"Cannot acknowledge resolved incident {incident_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot acknowledge incident {incident_id}: already resolved"
        )
    
    if incident.get("acknowledged"):
        logger.warning(f"Incident {incident_id} already acknowledged")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident {incident_id} has already been acknowledged"
        )
    
    # Update incident
    updates = {
        "status": IncidentStatus.ACKNOWLEDGED.value,
        "acknowledged": True,
        "acknowledged_at": get_current_timestamp(),
        "acknowledged_by": request.acknowledged_by
    }
    
    updated_incident = incident_store.update(incident_id, updates)
    
    logger.info(
        f"Incident {incident_id} acknowledged by {request.acknowledged_by} "
        f"at {updates['acknowledged_at']}"
    )
    
    return MessageResponse(
        message=f"Incident {incident_id} acknowledged successfully",
        incident=Incident(**updated_incident)
    )


@router.post(
    "/{incident_id}/resolve",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Resolve Incident",
    description="Mark an incident as resolved with resolution notes"
)
async def resolve_incident(
    incident_id: str,
    request: ResolveRequest
) -> MessageResponse:
    """
    Resolve an incident and record resolution details.
    
    Updates incident status to 'resolved' and records timestamp,
    user information, and resolution notes.
    
    Args:
        incident_id: Unique incident identifier
        request: Resolution details (user email, resolution notes)
        
    Returns:
        MessageResponse with updated incident data
        
    Raises:
        HTTPException 404: If incident not found
        HTTPException 400: If incident already resolved
    """
    logger.info(f"Resolving incident {incident_id} by {request.resolved_by}")
    
    # Retrieve incident
    incident = incident_store.get_by_id(incident_id)
    
    if not incident:
        logger.warning(f"Incident {incident_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found"
        )
    
    # Validate current state
    current_status = incident.get("status")
    
    if current_status == IncidentStatus.RESOLVED.value:
        logger.warning(f"Incident {incident_id} already resolved")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident {incident_id} is already resolved"
        )
    
    # Update incident
    resolved_at = get_current_timestamp()
    
    updates = {
        "status": IncidentStatus.RESOLVED.value,
        "resolved_at": resolved_at,
        "resolved_by": request.resolved_by,
        "resolution_notes": request.resolution_notes
    }
    
    # Auto-acknowledge if not already acknowledged
    if not incident.get("acknowledged"):
        updates.update({
            "acknowledged": True,
            "acknowledged_at": resolved_at,
            "acknowledged_by": request.resolved_by
        })
        logger.info(f"Auto-acknowledging incident {incident_id} during resolution")
    
    updated_incident = incident_store.update(incident_id, updates)
    
    logger.info(
        f"Incident {incident_id} resolved by {request.resolved_by} "
        f"at {resolved_at}"
    )
    
    return MessageResponse(
        message=f"Incident {incident_id} resolved successfully",
        incident=Incident(**updated_incident)
    )


# =============================================================================
# HEALTH CHECK
# =============================================================================

@router.get(
    "/health",
    summary="Health Check",
    description="Verify incidents API and data store are operational",
    tags=["Health"]
)
async def health_check() -> dict[str, str]:
    """
    Health check endpoint for incidents API.
    
    Verifies:
    - Data store file is accessible
    - JSON structure is valid
    
    Returns:
        Status message and incident count
        
    Raises:
        HTTPException: If data store is inaccessible
    """
    try:
        incidents = incident_store.get_all()
        return {
            "status": "healthy",
            "message": "Incidents API operational",
            "incident_count": str(len(incidents)),
            "data_store": str(INCIDENTS_STORE_PATH)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Incidents API unhealthy: {str(e)}"
        ) from e
