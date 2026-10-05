# app/core/security.py
"""
DHCaaS Security Utilities
Password hashing and JWT token management using industry best practices.

Security Features:
- Bcrypt password hashing (12 rounds by default)
- JWT token generation and validation
- Constant-time password verification
- Token expiration handling
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import settings
import time
from uuid import uuid4


logger = logging.getLogger(__name__)


# ===== Password Hashing Configuration =====
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.PASSWORD_BCRYPT_ROUNDS  # Cost factor (12 = ~0.3s per hash)
)


# ===== Password Hashing Functions =====

def get_password_hash(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    
    Security features:
    - Automatic salt generation
    - Configurable cost factor (12 rounds by default)
    - Resistant to rainbow table and GPU attacks
    
    Args:
        password: Plain-text password to hash
        
    Returns:
        str: Bcrypt hashed password (60 characters)
        
    Example:
        >>> hashed = get_password_hash("mypassword123")
        >>> print(hashed)
        $2b$12$KIXxBVzGJlGv7y7xZ8bWpO...
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.
    
    Uses constant-time comparison to prevent timing attacks.
    
    Args:
        plain_password: Plain-text password to verify
        hashed_password: Bcrypt hashed password from database
        
    Returns:
        bool: True if password matches, False otherwise
        
    Example:
        >>> hashed = get_password_hash("mypassword123")
        >>> verify_password("mypassword123", hashed)
        True
        >>> verify_password("wrongpassword", hashed)
        False
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


# ===== JWT Token Functions =====

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Mint a JWT with the full RFC 7519 standard claim set.
    All timestamps use int(time.time()) -- timezone-independent (F6 removed).
    """
    now = int(time.time())
    ttl = (
        int(expires_delta.total_seconds())
        if expires_delta
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    # tenant_id per ADR-001: company_id (shared) or user_id (per-user fallback)
    _company = data.get("company_id")
    tenant_id = str(_company) if _company else str(data.get("user_id", ""))
    payload: dict = {
        # RFC 7519 registered claims
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "sub": str(data.get("user_id", "")),
        "iat": now,
        "nbf": now,
        "exp": now + ttl,
        "jti": str(uuid4()),
        # Application claims
        "user_id": str(data.get("user_id", "")),   # kept for one-release compat
        "tenant_id": tenant_id,
        "role": data.get("role", ""),
        "email": data.get("email", ""),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT access token.
    
    Validates:
    - Token signature (using JWT_SECRET_KEY)
    - Token expiration (exp claim)
    - Token structure (required claims)
    
    Args:
        token: JWT token string to decode
        
    Returns:
        dict: Token payload if valid, None if invalid/expired
        
    Example:
        >>> token = create_access_token({"user_id": "123", "email": "user@example.com"})
        >>> payload = decode_access_token(token)
        >>> print(payload)
        {'user_id': '123', 'email': 'user@example.com', 'sub': '123', 'exp': 1234567890, 'iat': 1234567890}
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM], audience=settings.JWT_AUDIENCE)
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error decoding JWT: {e}")
        return None


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a long-lived JWT refresh token.
    
    Refresh tokens are used to obtain new access tokens without re-authentication.
    They have longer expiration times (7 days by default) and should be stored securely.
    
    Args:
        data: Dictionary containing user information (user_id, email)
        
    Returns:
        str: Encoded JWT refresh token
        
    Example:
        >>> refresh_token = create_refresh_token({
        ...     "user_id": "507f1f77bcf86cd799439011",
        ...     "email": "user@example.com"
        ... })
    """
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "sub": str(data.get("user_id")),
        "type": "refresh"  # Mark as refresh token
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


# ===== Password Validation =====

def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength according to security policies.
    
    Requirements:
    - Minimum length (8 characters by default)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Plain-text password to validate
        
    Returns:
        tuple: (is_valid: bool, error_message: Optional[str])
        
    Example:
        >>> validate_password_strength("weakpass")
        (False, "Password must be at least 8 characters")
        >>> validate_password_strength("StrongPass123!")
        (True, None)
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters"
    
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(char.islower() for char in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one digit"
    
    if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in password):
        return False, "Password must contain at least one special character"
    
    return True, None