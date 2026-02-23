"""
API Key Management Service
Developer Portal - API Key Generation, Validation, and Monetization
"""

import secrets
import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import logging

from app.models.api_key import (
    APIKeyCreate,
    APIKeyResponse,
    APIKeyInfo,
    APIKeyUsage,
    APIKeyListResponse
)

logger = logging.getLogger(__name__)


class APIKeyService:
    """
    Service for managing API keys for developer portal
    Enables programmatic access to DHCaaS services
    """
    
    def __init__(self, mongodb_client: AsyncIOMotorClient):
        """Initialize API key service with MongoDB client"""
        self.db = mongodb_client.dhcaas
        self.collection = self.db.api_keys
        logger.info("APIKeyService initialized")
    
    async def _ensure_indexes(self):
        """Ensure database indexes exist"""
        await self.collection.create_index("key_hash", unique=True)
        await self.collection.create_index("owner")
        await self.collection.create_index([("owner", 1), ("is_active", 1)])
    
    def _generate_api_key(self) -> str:
        """
        Generate a cryptographically secure API key
        Format: dhc_live_[64 random hex chars]
        """
        random_bytes = secrets.token_bytes(32)
        key_suffix = random_bytes.hex()
        return f"dhc_live_{key_suffix}"
    
    def _hash_key(self, key: str) -> str:
        """Hash API key for secure storage"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    async def create_api_key(
        self,
        user_id: str,
        key_data: APIKeyCreate
    ) -> APIKeyResponse:
        """
        Create a new API key for a user
        
        Args:
            user_id: Owner user ID
            key_data: API key creation data
            
        Returns:
            APIKeyResponse with the generated key (shown only once)
        """
        await self._ensure_indexes()
        
        # Generate secure API key
        api_key = self._generate_api_key()
        key_hash = self._hash_key(api_key)
        
        # Create key document
        key_doc = {
            "key_hash": key_hash,
            "name": key_data.name,
            "description": key_data.description,
            "owner": user_id,
            "created_at": datetime.utcnow(),
            "last_used": None,
            "total_calls": 0,
            "is_active": True
        }
        
        result = await self.collection.insert_one(key_doc)
        key_id = str(result.inserted_id)
        
        logger.info(f"Created API key '{key_data.name}' for user {user_id}")
        
        return APIKeyResponse(
            id=key_id,
            key=api_key,
            name=key_data.name,
            description=key_data.description,
            owner=user_id,
            created_at=key_doc["created_at"],
            last_used=None,
            total_calls=0,
            is_active=True
        )
    
    async def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """
        Validate an API key and return key information
        
        Args:
            api_key: The API key to validate
            
        Returns:
            Key document if valid, None otherwise
        """
        if not api_key or not api_key.startswith("dhc_live_"):
            return None
        
        key_hash = self._hash_key(api_key)
        
        key_doc = await self.collection.find_one({
            "key_hash": key_hash,
            "is_active": True
        })
        
        if key_doc:
            # Update last_used and increment call count
            await self.collection.update_one(
                {"_id": key_doc["_id"]},
                {
                    "$set": {"last_used": datetime.utcnow()},
                    "$inc": {"total_calls": 1}
                }
            )
            
            logger.debug(f"API key validated for user {key_doc['owner']}")
            return key_doc
        
        logger.warning(f"Invalid API key attempted: {api_key[:20]}...")
        return None
    
    async def list_user_keys(self, user_id: str) -> APIKeyListResponse:
        """
        List all API keys for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of API keys (without exposing full keys)
        """
        cursor = self.collection.find({"owner": user_id})
        keys_list = await cursor.to_list(length=100)
        
        api_keys = []
        total_calls = 0
        active_count = 0
        
        for key_doc in keys_list:
            # Create preview (first 12 chars)
            key_preview = "dhc_live_****"
            
            api_keys.append(APIKeyInfo(
                id=str(key_doc["_id"]),
                key_preview=key_preview,
                name=key_doc["name"],
                description=key_doc.get("description"),
                owner=key_doc["owner"],
                created_at=key_doc["created_at"],
                last_used=key_doc.get("last_used"),
                total_calls=key_doc.get("total_calls", 0),
                is_active=key_doc.get("is_active", True)
            ))
            
            total_calls += key_doc.get("total_calls", 0)
            if key_doc.get("is_active", True):
                active_count += 1
        
        return APIKeyListResponse(
            keys=api_keys,
            total=len(api_keys),
            active_keys=active_count,
            total_calls=total_calls
        )
    
    async def revoke_api_key(self, key_id: str, user_id: str) -> bool:
        """
        Revoke (deactivate) an API key
        
        Args:
            key_id: API key ID
            user_id: Owner user ID (for authorization)
            
        Returns:
            True if revoked successfully
        """
        from bson import ObjectId
        
        result = await self.collection.update_one(
            {
                "_id": ObjectId(key_id),
                "owner": user_id
            },
            {
                "$set": {
                    "is_active": False,
                    "revoked_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Revoked API key {key_id} for user {user_id}")
            return True
        
        return False
    
    async def get_key_usage(self, key_id: str, user_id: str) -> Optional[APIKeyUsage]:
        """
        Get usage statistics for an API key
        
        Args:
            key_id: API key ID
            user_id: Owner user ID
            
        Returns:
            Usage statistics or None
        """
        from bson import ObjectId
        
        key_doc = await self.collection.find_one({
            "_id": ObjectId(key_id),
            "owner": user_id
        })
        
        if not key_doc:
            return None
        
        # Calculate calls today and this month
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # For now, return total calls (can be enhanced with detailed logging)
        return APIKeyUsage(
            key_id=key_id,
            key_name=key_doc["name"],
            total_calls=key_doc.get("total_calls", 0),
            calls_today=0,
            calls_this_month=0,
            last_used=key_doc.get("last_used"),
            created_at=key_doc["created_at"]
        )


# Singleton instance
_api_key_service_instance: Optional[APIKeyService] = None


def get_api_key_service(mongodb_client: AsyncIOMotorClient) -> APIKeyService:
    """Get or create singleton instance of APIKeyService"""
    global _api_key_service_instance
    if _api_key_service_instance is None:
        _api_key_service_instance = APIKeyService(mongodb_client)
    return _api_key_service_instance
