# backend/scanner_engine.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, OperationFailure
import datetime


async def scan_mongodb_instance(connection_uri: str, db_name: str):
    """
    Connects to the database and gathers basic metadata statistics.
    """
    result = {
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "failed",
        "details": {},
        "error": None
    }

    try:
        # 1. Attempt connection with a 5-second timeout
        client = AsyncIOMotorClient(connection_uri, serverSelectionTimeoutMS=5000)
        
        # 2. Check connection (Ping)
        await client.admin.command('ping')
        
        # 3. Access the specific database
        db = client[db_name]
        
        # 4. Fetch database statistics (dbStats)
        stats = await db.command("dbStats")
        
        # 5. Fetch collection names
        collections = await db.list_collection_names()
        
        # 6. Get server info
        server_info = await client.server_info()

        # 7. Prepare success report
        result["status"] = "success"
        result["details"] = {
            "server_version": server_info.get('version', 'unknown'),
            "database_name": db_name,
            "collections_count": stats.get("collections", 0),
            "objects_count": stats.get("objects", 0),
            "data_size_bytes": stats.get("dataSize", 0),
            "storage_size_bytes": stats.get("storageSize", 0),
            "collections_list": collections
        }
        
        client.close()

    except ConnectionFailure:
        result["error"] = "Could not connect to server. Check URI or Network."
    except OperationFailure as e:
        result["error"] = f"Authentication or Permission error: {str(e)}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result
