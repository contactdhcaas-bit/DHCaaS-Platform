# app/models/audit.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.database import get_database

class AuditLog(BaseModel):
    """Audit log entry model"""
    action: str  # CREATE_USER, UPDATE_USER, DELETE_USER, LOGIN, LOGOUT, etc.
    actor_email: str
    actor_id: Optional[str] = None
    target_id: Optional[str] = None  # User ID being modified
    target_email: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AuditLogInDB(AuditLog):
    """Audit log with database ID"""
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Helper function to log activities
async def log_activity(
    action: str,
    actor_email: str,
    actor_id: Optional[str] = None,
    target_id: Optional[str] = None,
    target_email: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
) -> bool:
    """
    Log an audit activity to the database
    
    Args:
        action: Action type (CREATE_USER, DELETE_USER, LOGIN, etc.)
        actor_email: Email of user performing the action
        actor_id: ID of user performing the action
        target_id: ID of the target user (if applicable)
        target_email: Email of the target user (if applicable)
        details: Additional details about the action
        ip_address: IP address of the request
    
    Returns:
        bool: True if logged successfully
    """
    try:
        log_entry = {
            "action": action,
            "actor_email": actor_email,
            "actor_id": actor_id,
            "target_id": target_id,
            "target_email": target_email,
            "details": details or {},
            "ip_address": ip_address,
            "timestamp": datetime.utcnow()
        }
        
        result = await get_database().audit_logs.insert_one(log_entry)
        print(f"✅ Audit log saved: {action} by {actor_email} (ID: {result.inserted_id})")
        return True
    except Exception as e:
        print(f"❌ Error logging audit activity: {e}")
        return False

async def get_audit_logs(limit: int = 50, skip: int = 0) -> List[dict]:
    """
    Retrieve audit logs with pagination
    
    Args:
        limit: Maximum number of logs to return
        skip: Number of logs to skip
    
    Returns:
        list: List of audit log entries
    """
    try:
        cursor = get_database().audit_logs.find().sort("timestamp", -1).skip(skip).limit(limit)
        logs = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for log in logs:
            log["id"] = str(log.pop("_id"))
        
        return logs
    except Exception as e:
        print(f"❌ Error retrieving audit logs: {e}")
        return []

async def get_audit_logs_count() -> int:
    """Get total count of audit logs"""
    try:
        count = await get_database().audit_logs.count_documents({})
        return count
    except Exception as e:
        print(f"❌ Error counting audit logs: {e}")
        return 0




