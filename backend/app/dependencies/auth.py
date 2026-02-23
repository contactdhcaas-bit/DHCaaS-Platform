# app/dependencies/auth.py
"""
Authentication Dependencies
JWT token validation and user extraction
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime

from app.core.config import settings
from app.models.user import User
from app.core.database import get_database
from bson import ObjectId


# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Extract and validate JWT token, return current user.

    Raises:
    - 401 if token is invalid or expired
    - 404 if user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT token
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception

        # Check token expiration
        exp = payload.get("exp")
        if exp is None or datetime.utcnow().timestamp() > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except JWTError:
        raise credentials_exception

    # Fetch user from database
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available"
        )
    
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_doc is None:
        raise credentials_exception

    # Convert to User model (support both password_hash and hashed_password)
    user = User(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        hashed_password=user_doc.get("password_hash") or user_doc.get("hashed_password"),
        role=user_doc["role"],
        company_id=user_doc.get("company_id"),
        is_active=user_doc["is_active"],
        is_verified=user_doc["is_verified"],
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"],
        last_login=user_doc.get("last_login")
    )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure user is active.

    Raises:
    - 403 if user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require user to have admin role.

    Raises:
    - 403 if user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def require_editor(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require user to have editor role or higher.

    Raises:
    - 403 if user is not an editor or admin
    """
    if current_user.role not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor privileges required"
        )
    return current_user


async def require_viewer(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require user to have viewer role or higher (any authenticated user).

    This is the same as get_current_active_user but provided for consistency.
    """
    return current_user
