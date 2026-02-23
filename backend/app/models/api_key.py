"""
Pydantic models for API Key Management
Developer Portal & API Monetization
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class APIKeyCreate(BaseModel):
    """Request model for creating a new API key"""
    name: str = Field(..., min_length=1, max_length=100, description="Friendly name for the API key")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Production Key",
                "description": "API key for production environment"
            }
        }


class APIKeyResponse(BaseModel):
    """Response model for API key (with actual key shown only once)"""
    id: str = Field(..., description="Unique identifier")
    key: str = Field(..., description="The actual API key (shown only on creation)")
    name: str = Field(..., description="Friendly name")
    description: Optional[str] = Field(None, description="Description")
    owner: str = Field(..., description="Owner user ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_used: Optional[datetime] = Field(None, description="Last usage timestamp")
    total_calls: int = Field(0, description="Total API calls made")
    is_active: bool = Field(True, description="Whether key is active")


class APIKeyInfo(BaseModel):
    """Response model for API key list (without exposing full key)"""
    id: str = Field(..., description="Unique identifier")
    key_preview: str = Field(..., description="First 8 chars of key for identification")
    name: str = Field(..., description="Friendly name")
    description: Optional[str] = Field(None, description="Description")
    owner: str = Field(..., description="Owner user ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_used: Optional[datetime] = Field(None, description="Last usage timestamp")
    total_calls: int = Field(0, description="Total API calls made")
    is_active: bool = Field(True, description="Whether key is active")


class APIKeyUsage(BaseModel):
    """API key usage statistics"""
    key_id: str
    key_name: str
    total_calls: int
    calls_today: int
    calls_this_month: int
    last_used: Optional[datetime]
    created_at: datetime


class APIKeyListResponse(BaseModel):
    """Response model for listing API keys"""
    keys: List[APIKeyInfo]
    total: int
    active_keys: int
    total_calls: int


class RevokeAPIKeyResponse(BaseModel):
    """Response model for revoking an API key"""
    success: bool
    message: str
    key_id: str
