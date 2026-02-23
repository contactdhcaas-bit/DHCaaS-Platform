# backend/mongodb_service.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, Optional, List


class MongoDBService:
    def __init__(self):
        self.timeout_ms = 10000
    
    async def test_connection(
        self, 
        connection_string: str, 
        database_name: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            # Use AsyncIOMotorClient for all operations
            async_client = AsyncIOMotorClient(
                connection_string,
                serverSelectionTimeoutMS=self.timeout_ms
            )
            
            # Get server info
            server_info = await async_client.server_info()
            
            # Get database names
            db_names = await async_client.list_database_names()
            
            # Close connection
            async_client.close()
            
            return {
                "success": True,
                "message": "Connection successful!",
                "server_info": {
                    "version": server_info.get("version"),
                    "host": connection_string.split("@")[-1].split("/")[0] if "@" in connection_string else "localhost"
                },
                "databases": db_names[:10]
            }
        except Exception as e:
            return {
                "success": False,
                "message": "Connection failed",
                "error": str(e)
            }
