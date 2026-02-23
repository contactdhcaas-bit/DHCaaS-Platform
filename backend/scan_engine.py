from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
import uuid

# Import storage repository and decryption
try:
    from backend.storage import repo
    from backend.security import decrypt_text
except ImportError:
    from storage import repo
    from security import decrypt_text

# If you have real scanning logic, import it here.
# For now, we simulate scanning.

router = APIRouter(prefix="/scan", tags=["scan"])

# --- Models ---

class ScanRequest(BaseModel):
    source_id: str
    scan_type: str = "quick"  # quick, deep, compliance

class ScanResult(BaseModel):
    scan_id: str
    source_id: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    issues_found: int = 0
    details: Optional[Dict[str, Any]] = None

# In-memory storage for scan results (temporary)
_scan_results: Dict[str, Dict] = {}

# --- Background Task Logic ---

async def perform_scan_task(scan_id: str, source_id: str, connection_string: str):
    """
    Simulates a background scanning process.
    """
    print(f"🚀 [Scan:{scan_id}] Starting scan for source {source_id}...")
    
    # Simulate processing time
    await asyncio.sleep(5)
    
    # Retrieve current result to update
    if scan_id in _scan_results:
        result = _scan_results[scan_id]
        result["status"] = "completed"
        result["completed_at"] = datetime.now().isoformat()
        result["issues_found"] = 42  # Dummy number found
        result["details"] = {
            "scanned_collections": 5,
            "pii_detected": ["email", "phone_number"],
            "compliance_score": 85
        }
        print(f"✅ [Scan:{scan_id}] Scan completed successfully.")

# --- Endpoints ---

@router.post("/start", response_model=ScanResult)
async def start_scan(payload: ScanRequest, background_tasks: BackgroundTasks):
    """
    Initiates a new scan job for a specific data source.
    """
    # 1. Verify source exists
    source = await repo.get_by_id(payload.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    # 2. Decrypt connection string (to be used by scanner)
    try:
        raw_uri = decrypt_text(source["encrypted_uri"])
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt connection string")

    # 3. Create Scan Job ID
    scan_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    new_scan = {
        "scan_id": scan_id,
        "source_id": payload.source_id,
        "status": "running",
        "started_at": now,
        "completed_at": None,
        "issues_found": 0,
        "details": None
    }
    
    # Save to memory
    _scan_results[scan_id] = new_scan
    
    # 4. Launch Background Task
    background_tasks.add_task(perform_scan_task, scan_id, payload.source_id, raw_uri)
    
    return ScanResult(**new_scan)


@router.get("/{scan_id}", response_model=ScanResult)
async def get_scan_status(scan_id: str):
    """
    Check the status of a specific scan job.
    """
    if scan_id not in _scan_results:
        raise HTTPException(status_code=404, detail="Scan job not found")
    
    return ScanResult(**_scan_results[scan_id])

@router.get("/history/{source_id}", response_model=List[ScanResult])
async def get_scan_history(source_id: str):
    """
    Get all scans for a specific source.
    """
    # Filter scans by source_id
    history = [s for s in _scan_results.values() if s["source_id"] == source_id]
    return [ScanResult(**s) for s in history]

