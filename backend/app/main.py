"""
DHCaaS Backend - Main Application Entry Point
Enterprise Data Health Check as a Service API

This is the main FastAPI application that orchestrates all API routes,
middleware, and application configuration.

Author: DHCaaS Platform Team
Date: 2026-02-20
Version: 2.0.0
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from contextlib import asynccontextmanager
import logging
from app.api.v1.api import api_router
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    logger.info('=' * 60)
    logger.info('?? DHCaaS API Starting...')
    logger.info('=' * 60)
    logger.info('?? Version: 2.0.0')
    logger.info('?? CORS: Configured')
    logger.info('?? Documentation: http://localhost:8000/docs')
    logger.info('?? Health Check: http://localhost:8000/health')
    logger.info('=' * 60)
    await connect_to_mongo()
    logger.info('? DHCaaS API Started Successfully!')
    logger.info('=' * 60)
    yield
    logger.info('=' * 60)
    logger.info('?? DHCaaS API Shutting Down...')
    logger.info('=' * 60)
    await close_mongo_connection()
    logger.info('? DHCaaS API Stopped Successfully!')
    logger.info('=' * 60)
is_prod = os.getenv('ENVIRONMENT', 'development').lower() == 'production'
app = FastAPI(title='DHCaaS API', description='\n    ## Data Health Check as a Service - Enterprise Backend\n\n    **DHCaaS** provides comprehensive data quality monitoring, governance,\n    and compliance management for enterprise data teams.\n\n    ### Key Features:\n    - ?? **Data Quality Scanning** - Multi-dimensional quality analysis\n    - ??? **Compliance Monitoring** - GDPR, CCPA, HIPAA compliance checks\n    - ?? **Predictive Analytics** - ML-powered anomaly detection\n    - ?? **Quality Metrics** - Completeness, validity, consistency, accuracy\n    - ?? **PII Detection** - Automatic sensitive data identification\n    - ?? **PDF Reports** - Professional compliance reports\n    - ?? **Authentication & RBAC** - Secure user management with role-based access\n\n    ### API Versions:\n    - **v1**: Current stable version (documented here)\n\n    ### Authentication:\n    - JWT-based authentication (Bearer token)\n    - Roles: admin, editor, viewer\n\n    ### Support:\n    - Documentation: https://docs.dhcaas.com\n    - Email: support@dhcaas.com\n    ', version='2.0.0', contact={'name': 'DHCaaS Platform Team', 'email': 'support@dhcaas.com', 'url': 'https://dhcaas.com'}, license_info={'name': 'Proprietary', 'url': 'https://dhcaas.com/license'}, lifespan=lifespan, docs_url=None if is_prod else '/docs', redoc_url=None if is_prod else '/redoc', openapi_url=None if is_prod else '/api/v1/openapi.json')
origins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000']
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'], expose_headers=['*'], max_age=3600)
app.include_router(api_router, prefix='/api/v1')

@app.get('/', tags=['root'])
async def read_root():
    """
    Root endpoint - API welcome message.

    Returns basic information about the API and links to documentation.
    """
    db = get_database()
    return {'message': 'DHCaaS Enterprise API is Running ??', 'service': 'Data Health Check as a Service', 'version': '2.0.0', 'status': 'operational', 'database': 'connected' if db else 'disconnected', 'timestamp': datetime.utcnow().isoformat(), 'authentication': {'type': 'JWT Bearer Token', 'endpoints': {'login': '/api/v1/auth/login', 'register': '/api/v1/auth/register', 'me': '/api/v1/auth/me'}}, 'documentation': {'swagger_ui': '/docs', 'redoc': '/redoc', 'openapi_json': '/api/v1/openapi.json'}, 'endpoints': {'health': '/health', 'scan_jobs': '/api/v1/scan-jobs', 'reports': '/api/v1/reports', 'auth': '/api/v1/auth', 'rules': '/api/v1/rules'}, 'support': {'email': 'support@dhcaas.com', 'docs': 'https://docs.dhcaas.com'}}

@app.get('/health', tags=['health'])
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
    return {'status': 'healthy', 'service': 'dhcaas-backend', 'version': '2.0.0', 'timestamp': datetime.utcnow().isoformat(), 'checks': {'api': 'operational', 'database': 'connected' if db else 'disconnected', 'authentication': 'active'}}

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 error handler"""
    return JSONResponse(status_code=404, content={'error': 'Not Found', 'message': f"The requested resource '{request.url.path}' was not found", 'status_code': 404, 'timestamp': datetime.utcnow().isoformat(), 'documentation': '/docs'})

@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    """Custom 500 error handler"""
    logger.error(f'Internal server error: {str(exc)}', exc_info=True)
    return JSONResponse(status_code=500, content={'error': 'Internal Server Error', 'message': 'An unexpected error occurred. Please contact support if this persists.', 'status_code': 500, 'timestamp': datetime.utcnow().isoformat(), 'support': 'support@dhcaas.com'})

# BEGIN DHC_R2_VALIDATION_HANDLER_V1
from fastapi.exceptions import RequestValidationError as _DHCR2ValidationError
from fastapi.responses import JSONResponse as _DHCR2JSONResponse


@app.exception_handler(_DHCR2ValidationError)
async def _dhc_r2_validation_exception_handler(request, exc: _DHCR2ValidationError):
    errors = [
        {"loc": error["loc"], "msg": error["msg"], "type": error["type"]}
        for error in exc.errors()
    ]
    return _DHCR2JSONResponse(
        status_code=422,
        content={"title": "Validation error", "errors": errors},
    )
# END DHC_R2_VALIDATION_HANDLER_V1

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True, log_level='info', access_log=True)
