# app/api/v1/api.py
"""
API Router Configuration
Implements Default-Deny: all routers are protected by default unless explicitly placed in public_router.
"""

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_active_user
from app.api.v1.endpoints import (
    scans,
    reports,
    auth,
    dashboard,
    users,
    rules,
    policies,
    datasets,
    governance,
    audit,
    analysis,
    connectors
)

api_router = APIRouter()

# ==============================================================================
# 1. PUBLIC ROUTER (Explicit Allowlist Only)
# Endpoints inside auth.router handle login, register, and health checks.
# Note: /auth/me and /auth/logout retain their explicit get_current_active_user dependencies.
# ==============================================================================
public_router = APIRouter()
public_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# ==============================================================================
# 2. PROTECTED ROUTER (Default-Deny: Mandatory Authentication Dependency)
# Any route registered here strictly rejects unauthenticated anonymous requests.
# ==============================================================================
protected_router = APIRouter(dependencies=[Depends(get_current_active_user)])

protected_router.include_router(
    users.router,
    prefix="/users",
    tags=["User Management"]
)

protected_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

protected_router.include_router(
    scans.router,
    prefix="/scan-jobs",
    tags=["Scan Jobs"]
)

protected_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)

protected_router.include_router(
    rules.router,
    prefix="/rules",
    tags=["Data Quality Rules"]
)

protected_router.include_router(
    policies.router,
    prefix="/policies",
    tags=["Policies"]
)

protected_router.include_router(
    datasets.router,
    prefix="/datasets",
    tags=["Datasets"]
)

protected_router.include_router(
    governance.router,
    prefix="/governance",
    tags=["Governance"]
)

protected_router.include_router(
    audit.router,
    prefix="/audit",
    tags=["Audit Logs"]
)

protected_router.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["AI Classification"]
)

protected_router.include_router(
    connectors.router,
    prefix="/connectors",
    tags=["Cloud Connectors"]
)

# Mount both routers onto the root api_router
api_router.include_router(public_router)
api_router.include_router(protected_router)
