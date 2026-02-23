from typing import List, Optional, Dict
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection

# Global collection reference (initialized after MongoDB connects)
_sources_collection: Optional[AsyncIOMotorCollection] = None

# In-memory fallback storage when MongoDB is not available
_in_memory_sources: List[Dict] = []


def initialize_storage(collection: AsyncIOMotorCollection):
    """
    Initialize storage with MongoDB collection.
    If MongoDB is not connected, the app will continue using in-memory storage.
    """
    global _sources_collection
    _sources_collection = collection
    print("✅ Storage initialized with MongoDB collection")


class DataSourceRepository:
    """
    Repository for data sources.
    Uses MongoDB when available, otherwise falls back to in-memory list.
    """

    async def get_all(self) -> List[Dict]:
        """Get all data sources"""
        if not _sources_collection:
            # Fallback: return in-memory list
            return list(_in_memory_sources)

        cursor = _sources_collection.find({})
        sources = await cursor.to_list(length=None)

        # Convert ObjectId to string for JSON serialization
        for source in sources:
            if "_id" in source:
                source["_id"] = str(source["_id"])

        return sources

    async def get_by_id(self, source_id: str) -> Optional[Dict]:
        """Get data source by ID"""
        if not _sources_collection:
            # Fallback: search in in-memory list
            for source in _in_memory_sources:
                if source.get("id") == source_id:
                    return source
            return None

        source = await _sources_collection.find_one({"id": source_id})

        if source and "_id" in source:
            source["_id"] = str(source["_id"])

        return source

    async def add(self, source: Dict) -> Dict:
        """Add new data source"""
        # Add timestamp
        source["created_at"] = datetime.now().isoformat()

        # Set default flag if not present
        if "is_default" not in source:
            source["is_default"] = False

        if not _sources_collection:
            # Fallback: store in memory only
            _in_memory_sources.append(source)
            return source

        # Insert into MongoDB
        result = await _sources_collection.insert_one(source)
        source["_id"] = str(result.inserted_id)

        return source

    async def delete(self, source_id: str) -> bool:
        """Delete data source"""
        if not _sources_collection:
            # Fallback: delete from in-memory list
            global _in_memory_sources
            before = len(_in_memory_sources)
            _in_memory_sources = [
                s for s in _in_memory_sources if s.get("id") != source_id
            ]
            return len(_in_memory_sources) < before

        result = await _sources_collection.delete_one({"id": source_id})
        return result.deleted_count > 0

    async def set_default(self, source_id: str):
        """Set a source as default (unset all others)"""
        if not _sources_collection:
            # Fallback: update in-memory list
            for s in _in_memory_sources:
                s["is_default"] = s.get("id") == source_id
            return

        # Unset all defaults first
        await _sources_collection.update_many(
            {},
            {"$set": {"is_default": False}}
        )

        # Set the specified one as default
        await _sources_collection.update_one(
            {"id": source_id},
            {"$set": {"is_default": True}}
        )


# Singleton Instance
repo = DataSourceRepository()
