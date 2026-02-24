# app/api/v1/api.py
"""
API Router Configuration
Aggregates all API v1 endpoints
"""


from fastapi import APIRouter
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


# Create main API router
api_router = APIRouter()


# ===== AUTHENTICATION ENDPOINTS =====
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)


# ===== USER MANAGEMENT ENDPOINTS =====
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["User Management"]
)


# ===== DASHBOARD ENDPOINTS =====
api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ===== SCAN JOBS ENDPOINTS =====
api_router.include_router(
    scans.router,
    prefix="/scan-jobs",
    tags=["Scan Jobs"]
)


# ===== REPORTS ENDPOINTS =====
api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)


# ===== DATA QUALITY RULES ENDPOINTS =====
api_router.include_router(
    rules.router,
    prefix="/rules",
    tags=["Data Quality Rules"]
)


# ===== POLICIES ENDPOINTS =====
api_router.include_router(
    policies.router,
    prefix="/policies",
    tags=["Policies"]
)


# ===== DATASETS ENDPOINTS =====
api_router.include_router(
    datasets.router,
    prefix="/datasets",
    tags=["Datasets"]
)


# ===== GOVERNANCE ENDPOINTS =====
api_router.include_router(
    governance.router,
    prefix="/governance",
    tags=["Governance"]
)


# ===== AUDIT LOG ENDPOINTS =====
api_router.include_router(
    audit.router,
    prefix="/audit",
    tags=["Audit Logs"]
)


# ===== AI CLASSIFICATION ENDPOINTS =====
api_router.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["AI Classification"]
)


# ===== CLOUD CONNECTORS ENDPOINTS =====
api_router.include_router(
    connectors.router,
    prefix="/connectors",
    tags=["Cloud Connectors"]
)
