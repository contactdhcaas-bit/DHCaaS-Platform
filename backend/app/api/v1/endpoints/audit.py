# app/api/v1/endpoints/audit.py
"""
Audit Log Endpoints
Tracks and retrieves user activity logs
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.user import User
from app.models.audit import get_audit_logs, get_audit_logs_count
from app.dependencies.auth import get_current_active_user

router = APIRouter()


@router.get("/logs")
async def list_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve audit logs (Admin only)
    
    Returns paginated list of audit log entries
    
    **Permissions:** Admin only
    
    **Features:**
    - Pagination support
    - Returns total count and page info
    - Chronological order (newest first)
    """
    # Only admins can view audit logs
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view audit logs"
        )
    
    # Validate pagination parameters
    if per_page > 100:
        per_page = 100
    
    # Calculate skip
    skip = (page - 1) * per_page
    
    try:
        # Get logs and total count
        logs = await get_audit_logs(limit=per_page, skip=skip)
        total = await get_audit_logs_count()
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1
        
        return {
            "logs": logs,
            "total": total,
            "page": page,
            "page_size": per_page,
            "total_pages": total_pages
        }
        
    except Exception as e:
        # Return empty array on error to prevent frontend crash
        print(f"Error fetching audit logs: {str(e)}")
        return {
            "logs": [],
            "total": 0,
            "page": page,
            "page_size": per_page,
            "total_pages": 1
        }
