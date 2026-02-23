# backend/services/scanner_service.py
import asyncio
import socket
import time
from typing import Dict, Any
import httpx
from datetime import datetime
from pydantic import BaseModel

class ScanResult(BaseModel):
    status: str  # "Healthy" | "Unhealthy"
    latency_ms: float
    checked_at: datetime
    details: Dict[str, Any]

async def perform_health_check(target: str, asset_type: str) -> ScanResult:
    """
    Perform connectivity health check on asset.
    
    Args:
        target: IP, domain, or URL
        asset_type: "file" | "source" (determines check type)
    
    Returns:
        ScanResult with status, latency, timestamp
    """
    start_time = time.time()
    
    try:
        if asset_type == "file":
            # File: Simple existence check (mock for MVP)
            # Real impl: Check if file exists in MinIO/S3
            await asyncio.sleep(0.5)  # Simulate file check
            latency = (time.time() - start_time) * 1000
            return ScanResult(
                status="Healthy",
                latency_ms=round(latency, 2),
                checked_at=datetime.utcnow(),
                details={"type": "file", "size_mb": 2.3, "records": 1523}
            )
        
        elif asset_type == "source":
            # Source: TCP connect + port scan (80/443/5432/27017)
            ports = [80, 443, 5432, 27017]  # HTTP, HTTPS, Postgres, MongoDB
            open_ports = []
            
            for port in ports:
                try:
                    reader, writer = await asyncio.wait_for(
                        asyncio.open_connection(target, port),
                        timeout=3.0
                    )
                    writer.close()
                    await writer.wait_closed()
                    open_ports.append(port)
                except:
                    pass
            
            latency = (time.time() - start_time) * 1000
            return ScanResult(
                status="Healthy" if open_ports else "Unhealthy",
                latency_ms=round(latency, 2),
                checked_at=datetime.utcnow(),
                details={
                    "type": "source",
                    "open_ports": open_ports,
                    "ports_tested": len(ports)
                }
            )
        
        else:
            raise ValueError(f"Unknown asset_type: {asset_type}")
    
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        return ScanResult(
            status="Unhealthy",
            latency_ms=round(latency, 2),
            checked_at=datetime.utcnow(),
            details={"error": str(e)[:100]}
        )

# Sync wrapper for FastAPI
def perform_health_check_sync(target: str, asset_type: str) -> ScanResult:
    return asyncio.run(perform_health_check(target, asset_type))
