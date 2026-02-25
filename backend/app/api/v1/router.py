"""
API v1 Router
Aggregates all v1 endpoints for DHCaaS platform.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import incidents, scan_jobs, connectors, rules

api_router = APIRouter(prefix="/api/v1")

# Include all endpoint routers
api_router.include_router(incidents.router)
api_router.include_router(scan_jobs.router)
api_router.include_router(connectors.router, prefix="/connectors", tags=["Cloud Connectors"])
api_router.include_router(rules.router, prefix="/rules", tags=["Data Quality Rules"])
