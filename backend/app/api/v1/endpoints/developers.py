"""
Developer Portal API Endpoints
API Key Management & Monetization
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import logging

from app.models.api_key import (
    APIKeyCreate,
    APIKeyResponse,
    APIKeyListResponse,
    RevokeAPIKeyResponse,
    APIKeyUsage
)
from app.services.api_key_service import get_api_key_service
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Developer Portal"])


# TODO: Replace with actual user authentication
def get_current_user_id() -> str:
    """Temporary function - replace with actual auth"""
    return "user_12345"


@router.post("/keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: APIKeyCreate,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Generate a new API key
    
    **IMPORTANT**: The full API key is returned only once. Store it securely!
    
    Args:
        key_data: API key creation data (name, description)
        
    Returns:
        APIKeyResponse with the generated key
    """
    try:
        user_id = get_current_user_id()
        api_key_service = get_api_key_service(db)
        
        result = await api_key_service.create_api_key(user_id, key_data)
        
        logger.info(f"Created API key '{key_data.name}' for user {user_id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to create API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}"
        )


@router.get("/keys", response_model=APIKeyListResponse)
async def list_api_keys(
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    List all API keys for the current user
    
    Returns:
        List of API keys (with key previews, not full keys)
    """
    try:
        user_id = get_current_user_id()
        api_key_service = get_api_key_service(db)
        
        result = await api_key_service.list_user_keys(user_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to list API keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list API keys: {str(e)}"
        )


@router.delete("/keys/{key_id}", response_model=RevokeAPIKeyResponse)
async def revoke_api_key(
    key_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Revoke (deactivate) an API key
    
    Args:
        key_id: The ID of the API key to revoke
        
    Returns:
        Success message
    """
    try:
        user_id = get_current_user_id()
        api_key_service = get_api_key_service(db)
        
        success = await api_key_service.revoke_api_key(key_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found or you don't have permission to revoke it"
            )
        
        return RevokeAPIKeyResponse(
            success=True,
            message="API key revoked successfully",
            key_id=key_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke API key: {str(e)}"
        )


@router.get("/keys/{key_id}/usage", response_model=APIKeyUsage)
async def get_key_usage(
    key_id: str,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """
    Get usage statistics for an API key
    
    Args:
        key_id: The ID of the API key
        
    Returns:
        Usage statistics including total calls, recent usage, etc.
    """
    try:
        user_id = get_current_user_id()
        api_key_service = get_api_key_service(db)
        
        usage = await api_key_service.get_key_usage(key_id, user_id)
        
        if not usage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return usage
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get key usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get key usage: {str(e)}"
        )


@router.get("/health")
async def developer_portal_health():
    """Health check for developer portal"""
    return {
        "service": "Developer Portal",
        "status": "operational",
        "version": "1.0.0",
        "features": [
            "API Key Generation",
            "API Key Management",
            "Usage Tracking",
            "Monetization Ready"
        ]
    }
