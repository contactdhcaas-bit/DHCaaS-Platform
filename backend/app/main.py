# app/main.py
"""
DHCaaS Backend - Main Application Entry Point
Enterprise Data Health Check as a Service API

This is the main FastAPI application that orchestrates all API routes,
middleware, and application configuration.

Author: DHCaaS Platform Team
Date: 2026-02-20
Version: 2.0.0
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from contextlib import asynccontextmanager
import logging

# Import routers
from app.api.v1.api import api_router

# Import database functions
from app.core.database import (
    connect_to_mongo, 
    close_mongo_connection,
    get_database
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ===== LIFESPAN CONTEXT MANAGER =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # ===== STARTUP =====
    logger.info("=" * 60)
    logger.info("🚀 DHCaaS API Starting...")
    logger.info("=" * 60)
    logger.info("📦 Version: 2.0.0")
    logger.info("🌐 CORS: Configured")
    logger.info("📚 Documentation: http://localhost:8000/docs")
    logger.info("💚 Health Check: http://localhost:8000/health")
    logger.info("=" * 60)
    
    # Initialize MongoDB connection
    await connect_to_mongo()
    
    logger.info("✅ DHCaaS API Started Successfully!")
    logger.info("=" * 60)
    
    yield
    
    # ===== SHUTDOWN =====
    logger.info("=" * 60)
    logger.info("🛑 DHCaaS API Shutting Down...")
    logger.info("=" * 60)
    
    # Close MongoDB connection
    await close_mongo_connection()
    
    logger.info("✅ DHCaaS API Stopped Successfully!")
    logger.info("=" * 60)


# ===== APPLICATION CONFIGURATION =====
app = FastAPI(
    title="DHCaaS API",
    description="""
    ## Data Health Check as a Service - Enterprise Backend

    **DHCaaS** provides comprehensive data quality monitoring, governance,
    and compliance management for enterprise data teams.

    ### Key Features:
    - 📊 **Data Quality Scanning** - Multi-dimensional quality analysis
    - 🛡️ **Compliance Monitoring** - GDPR, CCPA, HIPAA compliance checks
    - 🤖 **Predictive Analytics** - ML-powered anomaly detection
    - 📈 **Quality Metrics** - Completeness, validity, consistency, accuracy
    - 🔍 **PII Detection** - Automatic sensitive data identification
    - 📄 **PDF Reports** - Professional compliance reports
    - 🔐 **Authentication & RBAC** - Secure user management with role-based access

    ### API Versions:
    - **v1**: Current stable version (documented here)

    ### Authentication:
    - JWT-based authentication (Bearer token)
    - Roles: admin, editor, viewer

    ### Support:
    - Documentation: https://docs.dhcaas.com
    - Email: support@dhcaas.com
    """,
    version="2.0.0",
    contact={
        "name": "DHCaaS Platform Team",
        "email": "support@dhcaas.com",
        "url": "https://dhcaas.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://dhcaas.com/license"
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)


# ===== CORS MIDDLEWARE CONFIGURATION =====
# Configure Cross-Origin Resource Sharing for frontend integration
origins = [
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",      # Vite dev server (alt)
    "http://localhost:3000",      # Alternative frontend port
    "http://127.0.0.1:3000",      # Alternative frontend port (alt)
    # Add production origins here:
    # "https://app.dhcaas.com",
    # "https://dhcaas.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


# ===== INCLUDE API ROUTERS =====
# Mount v1 API routers
app.include_router(
    api_router,
    prefix="/api/v1"
)


# ===== ROOT ENDPOINTS =====

@app.get("/", tags=["root"])
async def read_root():
    """
    Root endpoint - API welcome message.

    Returns basic information about the API and links to documentation.
    """
    db = get_database()
    
    return {
        "message": "DHCaaS Enterprise API is Running 🚀",
        "service": "Data Health Check as a Service",
        "version": "2.0.0",
        "status": "operational",
        "database": "connected" if db else "disconnected",
        "timestamp": datetime.utcnow().isoformat(),
        "authentication": {
            "type": "JWT Bearer Token",
            "endpoints": {
                "login": "/api/v1/auth/login",
                "register": "/api/v1/auth/register",
                "me": "/api/v1/auth/me"
            }
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/api/v1/openapi.json"
        },
        "endpoints": {
            "health": "/health",
            "scan_jobs": "/api/v1/scan-jobs",
            "reports": "/api/v1/reports",
            "auth": "/api/v1/auth",
            "rules": "/api/v1/rules"
        },
        "support": {
            "email": "support@dhcaas.com",
            "docs": "https://docs.dhcaas.com"
        }
    }


@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.

    Returns the operational status of the API service.
    This endpoint should be used by:
    - Docker health checks
    - Kubernetes liveness/readiness probes
    - Load balancers
    - Monitoring systems (Datadog, New Relic, etc.)

    Returns:
        dict: Service health status and metadata
    """
    db = get_database()
    
    return {
        "status": "healthy",
        "service": "dhcaas-backend",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "api": "operational",
            "database": "connected" if db else "disconnected",
            "authentication": "active",
        }
    }


@app.get("/api/v1/info", tags=["info"])
async def api_info():
    """
    API information endpoint.

    Provides detailed information about the API version, capabilities,
    and available endpoints.

    Returns:
        dict: Comprehensive API metadata
    """
    return {
        "api_version": "2.0.0",
        "service": "DHCaaS",
        "description": "Data Health Check as a Service - Enterprise Backend",
        "features": [
            "Data Quality Scanning",
            "MongoDB Integration",
            "Data Quality Rules Engine",
            "Compliance Monitoring (GDPR/CCPA/HIPAA)",
            "Predictive Analytics",
            "PII Detection",
            "PDF Report Generation",
            "Incident Management",
            "Policy Enforcement",
            "User Management & RBAC",
            "JWT Authentication"
        ],
        "supported_data_sources": [
            "CSV Upload",
            "Excel (.xlsx, .xls)",
            "JSON",
            "MySQL",
            "PostgreSQL",
            "MongoDB",
            "Snowflake",
            "BigQuery",
            "Redshift",
            "S3",
            "Azure Blob Storage"
        ],
        "authentication": {
            "type": "JWT Bearer Token",
            "token_expiration": "30 minutes",
            "roles": ["admin", "editor", "viewer"],
            "endpoints": {
                "login": "POST /api/v1/auth/login",
                "register": "POST /api/v1/auth/register",
                "me": "GET /api/v1/auth/me"
            }
        },
        "rate_limits": {
            "default": "1000 requests/hour",
            "burst": "100 requests/minute"
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# ===== EXCEPTION HANDLERS =====

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 error handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"The requested resource '{request.url.path}' was not found",
            "status_code": 404,
            "timestamp": datetime.utcnow().isoformat(),
            "documentation": "/docs"
        }
    )


@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    """Custom 500 error handler"""
    logger.error(f"Internal server error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please contact support if this persists.",
            "status_code": 500,
            "timestamp": datetime.utcnow().isoformat(),
            "support": "support@dhcaas.com"
        }
    )


# ===== MAIN ENTRY POINT =====
if __name__ == "__main__":
    import uvicorn

    # Run the application directly (for development)
    # In production, use: uvicorn app.main:app --host 0.0.0.0 --port 8000
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes (dev only)
        log_level="info",
        access_log=True,
    )
