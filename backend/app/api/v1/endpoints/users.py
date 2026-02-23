# app/api/v1/endpoints/users.py
"""
User Management Endpoints (Admin Only)
Full CRUD operations for user management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import Optional
from datetime import datetime
import math

from app.models.user import (
    User,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse
)
from app.dependencies.auth import get_current_active_user, require_admin
from app.core.security import get_password_hash
from app.core.database import get_database
from app.models.audit import log_activity
from bson import ObjectId

router = APIRouter()


# ===== HELPER FUNCTIONS =====
def user_to_response(user_doc: dict) -> UserResponse:
    """Convert MongoDB user document to UserResponse"""
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        role=user_doc["role"],
        company_id=user_doc.get("company_id"),
        is_active=user_doc["is_active"],
        is_verified=user_doc["is_verified"],
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"],
        last_login=user_doc.get("last_login")
    )


# ===== ENDPOINTS =====

@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by email or name"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_admin)
):
    """
    Get list of all users (Admin only).
    
    **Permissions:** Admin only
    
    **Features:**
    - Pagination support
    - Search by email or full name
    - Filter by role and active status
    - Returns total count and page info
    """
    try:
        # Get database connection
        db = get_database()
        users_col = db.users
        
        # Build query filter
        query_filter = {}
        
        # Search filter
        if search:
            query_filter["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}}
            ]
        
        # Role filter
        if role:
            query_filter["role"] = role
        
        # Active status filter
        if is_active is not None:
            query_filter["is_active"] = is_active
        
        # Get total count
        total = await users_col.count_documents(query_filter)
        
        # Calculate pagination
        skip = (page - 1) * page_size
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        # Get users
        users_cursor = users_col.find(query_filter).skip(skip).limit(page_size).sort("created_at", -1)
        users = await users_cursor.to_list(length=page_size)
        
        # Convert to response models
        user_responses = [user_to_response(user) for user in users]
        
        return UserListResponse(
            users=user_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_admin)
):
    """
    Get user by ID (Admin only).
    
    **Permissions:** Admin only
    """
    try:
        # Get database connection
        db = get_database()
        users_col = db.users
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Find user
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        return user_to_response(user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user: {str(e)}"
        )


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: User = Depends(require_admin)
):
    """
    Create a new user (Admin only).
    
    **Permissions:** Admin only
    
    **Features:**
    - Admin can set user role (admin, editor, viewer)
    - Admin can set active and verified status
    - Passwords are securely hashed
    - Email uniqueness is enforced
    """
    try:
        # Get database connection
        db = get_database()
        users_col = db.users
        
        # Check if email already exists
        existing_user = await users_col.find_one({"email": user_data.email})
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
            "hashed_password": hashed_password,
            "role": user_data.role,
            "company_id": user_data.company_id,
            "is_active": user_data.is_active,
            "is_verified": user_data.is_verified,
            "created_at": now,
            "updated_at": now,
            "last_login": None
        }
        
        # Insert into database
        result = await users_col.insert_one(user_doc)
        
        # Retrieve created user
        created_user = await users_col.find_one({"_id": result.inserted_id})
        
        # LOG ACTIVITY
        client_host = request.client.host if request.client else None
        await log_activity(
            action="CREATE_USER",
            actor_email=current_user.email,
            actor_id=str(current_user.id),
            target_id=str(created_user["_id"]),
            target_email=created_user["email"],
            details={
                "role": created_user["role"],
                "full_name": created_user["full_name"]
            },
            ip_address=client_host
        )
        
        return user_to_response(created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    request: Request,
    current_user: User = Depends(require_admin)
):
    """
    Update user details (Admin only).
    
    **Permissions:** Admin only
    
    **Features:**
    - Partial updates supported (only send fields to update)
    - Can update role, active status, verified status
    - Can update email (with uniqueness check)
    - Can reset password
    """
    try:
        # Get database connection
        db = get_database()
        users_col = db.users
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Check if user exists
        existing_user = await users_col.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        # Build update dictionary (only include provided fields)
        update_data = {}
        
        if user_data.email is not None:
            # Check if new email already exists (for different user)
            email_check = await users_col.find_one({
                "email": user_data.email,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if email_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email {user_data.email} is already in use"
                )
            update_data["email"] = user_data.email
        
        if user_data.full_name is not None:
            update_data["full_name"] = user_data.full_name
        
        if user_data.role is not None:
            update_data["role"] = user_data.role
        
        if user_data.company_id is not None:
            update_data["company_id"] = user_data.company_id
        
        if user_data.is_active is not None:
            update_data["is_active"] = user_data.is_active
        
        if user_data.is_verified is not None:
            update_data["is_verified"] = user_data.is_verified
        
        if user_data.password is not None:
            update_data["hashed_password"] = get_password_hash(user_data.password)
        
        # Always update updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Perform update
        if update_data:
            await users_col.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
        
        # Retrieve updated user
        updated_user = await users_col.find_one({"_id": ObjectId(user_id)})
        
        # LOG ACTIVITY
        client_host = request.client.host if request.client else None
        await log_activity(
            action="UPDATE_USER",
            actor_email=current_user.email,
            actor_id=str(current_user.id),
            target_id=user_id,
            target_email=updated_user["email"],
            details={
                "role": updated_user["role"],
                "full_name": updated_user["full_name"],
                "is_active": updated_user["is_active"]
            },
            ip_address=client_host
        )
        
        return user_to_response(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str,
    request: Request,
    hard_delete: bool = Query(False, description="Permanently delete user (irreversible)"),
    current_user: User = Depends(require_admin)
):
    """
    Delete or deactivate user (Admin only).
    
    **Permissions:** Admin only
    
    **Features:**
    - Soft delete (default): Sets is_active=False
    - Hard delete: Permanently removes user from database
    - Cannot delete yourself (admin protection)
    
    **Parameters:**
    - hard_delete: If True, permanently deletes user. If False (default), soft deletes.
    """
    try:
        # Get database connection
        db = get_database()
        users_col = db.users
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Check if user exists
        user_to_delete = await users_col.find_one({"_id": ObjectId(user_id)})
        if not user_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        # Prevent admin from deleting themselves
        if str(user_to_delete["_id"]) == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own account"
            )
        
        # LOG ACTIVITY
        client_host = request.client.host if request.client else None
        
        if hard_delete:
            # Permanently delete user
            await users_col.delete_one({"_id": ObjectId(user_id)})
            
            await log_activity(
                action="DELETE_USER",
                actor_email=current_user.email,
                actor_id=str(current_user.id),
                target_id=user_id,
                target_email=user_to_delete["email"],
                details={
                    "role": user_to_delete["role"],
                    "full_name": user_to_delete["full_name"],
                    "hard_delete": True
                },
                ip_address=client_host
            )
            
            return {
                "message": f"User {user_to_delete['email']} permanently deleted",
                "user_id": user_id,
                "deleted": True
            }
        else:
            # Soft delete: set is_active=False
            await users_col.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            await log_activity(
                action="DEACTIVATE_USER",
                actor_email=current_user.email,
                actor_id=str(current_user.id),
                target_id=user_id,
                target_email=user_to_delete["email"],
                details={
                    "role": user_to_delete["role"],
                    "full_name": user_to_delete["full_name"],
                    "hard_delete": False
                },
                ip_address=client_host
            )
            
            return {
                "message": f"User {user_to_delete['email']} deactivated",
                "user_id": user_id,
                "deactivated": True
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(require_admin)
):
    """
    Reactivate a deactivated user (Admin only).
    
    **Permissions:** Admin only
    """
    try:
        # Get database connection
        db = get_database()
        users_col = db.users
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user before update
        user_to_activate = await users_col.find_one({"_id": ObjectId(user_id)})
        if not user_to_activate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        # Update user
        await users_col.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Retrieve updated user
        updated_user = await users_col.find_one({"_id": ObjectId(user_id)})
        
        # LOG ACTIVITY
        client_host = request.client.host if request.client else None
        await log_activity(
            action="ACTIVATE_USER",
            actor_email=current_user.email,
            actor_id=str(current_user.id),
            target_id=user_id,
            target_email=updated_user["email"],
            details={
                "role": updated_user["role"],
                "full_name": updated_user["full_name"]
            },
            ip_address=client_host
        )
        
        return user_to_response(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate user: {str(e)}"
        )
