# backend/mongodb.py
import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

# Import our modules (storage + security)
try:
    from backend.storage import repo
    from backend.security import encrypt_text, decrypt_text
except ImportError:
    from storage import repo
    from security import encrypt_text, decrypt_text

router = APIRouter(prefix="/mongodb", tags=["mongodb"])

# --- Helper for SSL Environment ---
def get_mongo_ssl_kwargs() -> Dict[str, Any]:
    """
    SSL options for MongoDB connection.
    In production, this should be hardened. For local dev, we allow invalid certs.
    """
    return {"tlsAllowInvalidCertificates": True}

# --- Service Logic (Wrapper) ---
class MongoDBService:
    def __init__(self):
        self.timeout_ms = 5000
        self.ssl_kwargs = get_mongo_ssl_kwargs()

    async def test_live_connection(self, connection_string: str) -> Dict[str, Any]:
        """
        Tests a MongoDB connection string immediately.
        Returns a dict with success flag, message, server_info and databases list.
        """
        try:
            # Async client
            client = AsyncIOMotorClient(
                connection_string,
                serverSelectionTimeoutMS=self.timeout_ms,
                **self.ssl_kwargs
            )

            # List databases as proof of connection
            db_names = await client.list_database_names()

            # Get server info (async)
            server_info: Dict[str, Any] = {}
            try:
                server_info = await client.server_info()
            except Exception:
                # If server_info fails, continue with empty info
                pass

            client.close()

            return {
                "success": True,
                "message": "Connection successful!",
                "server_info": {
                    "version": server_info.get("version", "unknown"),
                    "host": connection_string.split("@")[-1].split("/")[0] if "@" in connection_string else "unknown"
                },
                "databases": db_names[:10],
            }
        except Exception as e:
            return {
                "success": False,
                "message": "Connection failed",
                "error": str(e)
            }

# --- Pydantic Models ---
class ConnectionPayload(BaseModel):
    name: str
    connection_string: str
    database_name: str

class ConnectionResponse(BaseModel):
    id: str
    name: str
    database: str
    status: str
    is_default: bool
    created_at: Optional[str] = None

class TestResponse(BaseModel):
    success: bool
    message: str
    server_info: Optional[dict] = None
    databases: Optional[list] = None
    error: Optional[str] = None

class DashboardStatusResponse(BaseModel):
    total_sources: int
    default_source: str
    system_status: str
    last_scan: str

# --- Endpoints ---

# 1. Get All Connections
@router.get("/connections", response_model=List[ConnectionResponse])
async def get_connections():
    """
    Returns all saved MongoDB sources (without exposing raw URIs).
    """
    raw_data = await repo.get_all()

    return [
        ConnectionResponse(
            id=d["id"],
            name=d["name"],
            database=d["database"],
            status=d.get("status", "unknown"),
            is_default=d.get("is_default", False),
            created_at=d.get("created_at")
        )
        for d in raw_data
    ]

# 2. Save Connection (Create)
@router.post("/save", response_model=ConnectionResponse)
async def save_connection(payload: ConnectionPayload):
    """
    Saves a new MongoDB connection (encrypted URI).
    """
    encrypted_uri = encrypt_text(payload.connection_string)

    new_source = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "encrypted_uri": encrypted_uri,
        "database": payload.database_name,
        "status": "active",
        "is_default": False,
    }

    saved = await repo.add(new_source)

    return ConnectionResponse(
        id=saved["id"],
        name=saved["name"],
        database=saved["database"],
        status=saved["status"],
        is_default=saved["is_default"],
        created_at=saved["created_at"],
    )

# 3. Test Connection
@router.post("/test-connection", response_model=TestResponse)
async def test_connection(payload: ConnectionPayload):
    """
    Tests a MongoDB connection using the raw connection string provided by the user.
    """
    service = MongoDBService()
    result = await service.test_live_connection(payload.connection_string)

    return TestResponse(
        success=result.get("success", False),
        message=result.get("message", ""),
        server_info=result.get("server_info"),
        databases=result.get("databases"),
        error=result.get("error"),
    )

# 4. Delete Connection
@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(source_id: str):
    """
    Deletes a saved MongoDB source by ID.
    """
    success = await repo.delete(source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return None

# 5. Set Default Source
@router.post("/{source_id}/set-default")
async def set_default_source(source_id: str):
    """
    Marks a specific source as the default one.
    """
    existing = await repo.get_by_id(source_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Source not found")

    await repo.set_default(source_id)
    return {"success": True, "message": "Default source updated"}

# 6. Dashboard Status (For Overview)
@router.get("/status", response_model=DashboardStatusResponse)
async def get_dashboard_status():
    """
    Returns a simple status summary for the MongoDB sources dashboard.
    """
    sources = await repo.get_all()
    default_source = next((s for s in sources if s.get("is_default")), None)

    return DashboardStatusResponse(
        total_sources=len(sources),
        default_source=default_source["name"] if default_source else "None",
        system_status="Healthy" if len(sources) > 0 else "No Sources",
        last_scan="Never",
    )
