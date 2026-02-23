# app/api/v1/endpoints/auth.py
"""
Authentication Endpoints
User registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timedelta

from app.models.user import UserRegister, UserLogin, User, Token, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.database import get_database
from app.dependencies.auth import get_current_active_user
from app.core.config import settings
from app.models.audit import log_activity
from bson import ObjectId

router = APIRouter()


# ===== HELPER FUNCTIONS =====
def user_doc_to_user(user_doc: dict) -> User:
    """Convert MongoDB document to User model"""
    return User(
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


def user_to_response(user: User) -> UserResponse:
    """Convert User model to UserResponse"""
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        company_id=user.company_id,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login
    )


# ===== ENDPOINTS =====

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, request: Request):
    """
    Register a new user account.
    
    **Features:**
    - Email uniqueness validation
    - Password hashing with bcrypt
    - Auto-generate JWT token
    - Default role: viewer
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Check if email already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {user_data.email} already exists"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user document
        now = datetime.utcnow()
        user_doc = {
            "email": user_data.email,
            "full_name": user_data.full_name,
            "password_hash": hashed_password,
            "role": "viewer",
            "company_id": user_data.company_id,
            "is_active": True,
            "is_verified": False,
            "created_at": now,
            "updated_at": now,
            "last_login": None
        }
        
        # Insert into database
        result = await db.users.insert_one(user_doc)
        
        # Retrieve created user
        created_user_doc = await db.users.find_one({"_id": result.inserted_id})
        created_user = user_doc_to_user(created_user_doc)
        
        # LOG ACTIVITY - Registration
        client_host = request.client.host if request.client else None
        await log_activity(
            action="REGISTER",
            actor_email=created_user.email,
            actor_id=str(created_user.id),
            details={
                "role": created_user.role,
                "full_name": created_user.full_name
            },
            ip_address=client_host
        )
        
        # Generate JWT token
        access_token = create_access_token(
            data={
                "user_id": str(created_user.id),
                "email": created_user.email,
                "role": created_user.role,
                "company_id": created_user.company_id
            }
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_to_response(created_user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request):
    """
    Authenticate user and return JWT token.
    
    **Features:**
    - Email and password validation
    - JWT token generation
    - Last login timestamp update
    - Audit logging
    """
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Find user by email
        user_doc = await db.users.find_one({"email": credentials.email})
        
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password (support both password_hash and hashed_password)
        stored_password = user_doc.get("password_hash") or user_doc.get("hashed_password")
        if not stored_password or not verify_password(credentials.password, stored_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Convert to User model
        user = user_doc_to_user(user_doc)
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Update last login timestamp
        await db.users.update_one(
            {"_id": ObjectId(user.id)},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # LOG ACTIVITY - Login
        client_host = request.client.host if request.client else None
        await log_activity(
            action="LOGIN",
            actor_email=user.email,
            actor_id=str(user.id),
            ip_address=client_host
        )
        
        # Generate JWT token
        access_token = create_access_token(
            data={
                "user_id": str(user.id),
                "email": user.email,
                "role": user.role,
                "company_id": user.company_id
            }
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_to_response(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    
    **Requires:** Valid JWT token
    """
    return user_to_response(current_user)


@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_active_user)):
    """
    Logout current user.
    
    Note: JWT tokens are stateless, so logout is handled on the client side
    by removing the token from storage. This endpoint exists for consistency
    and can be extended to implement token blacklisting if needed.
    """
    # LOG ACTIVITY - Logout
    client_host = request.client.host if request.client else None
    await log_activity(
        action="LOGOUT",
        actor_email=current_user.email,
        actor_id=str(current_user.id),
        ip_address=client_host
    )
    
    return {
        "message": "Successfully logged out",
        "user_email": current_user.email
    }


@router.get("/health")
async def auth_health():
    """
    Authentication service health check.
    """
    return {
        "status": "healthy",
        "service": "authentication",
        "timestamp": datetime.utcnow().isoformat()
    }
