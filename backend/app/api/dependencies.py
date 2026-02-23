# app/api/dependencies.py
"""
API Dependencies
Common dependencies for FastAPI endpoints
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Get current authenticated user (OPTIONAL)
    Returns None if not authenticated (no error raised)
    
    This is a simplified version that allows guest access.
    For production, implement full JWT validation.
    """
    if not credentials:
        logger.info("No authentication credentials provided, using guest access")
        return None
    
    try:
        token = credentials.credentials
        
        # TODO: Implement JWT token validation here
        # For now, we'll extract basic info from token or return None
        
        logger.info("Authentication token provided (validation pending)")
        
        # Return a basic user object for now
        # In production, decode and validate JWT token
        return {
            "user_id": "authenticated_user",
            "email": "user@example.com",
            "role": "user"
        }
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}, using guest access")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user (REQUIRED)
    Raises 401 if not authenticated
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_current_user_optional(credentials)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current admin user
    Raises 403 if user is not admin
    """
    user = await get_current_user(credentials)
    
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return user
