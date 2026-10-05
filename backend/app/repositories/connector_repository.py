"""ConnectorRepository -- ADR-001 compliant."""
from __future__ import annotations
from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.tenant import TenantContext

class ConnectorRepository:
    COLLECTION = "data_sources"
    INDEX_NAME = "tenant_id_id_1"

    def __init__(self, db: AsyncIOMotorDatabase, tenant: TenantContext) -> None:  
        self._col = db[self.COLLECTION]  
        self._tenant_id = tenant.tenant_id

    @classmethod  
    async def ensure_indexes(cls, db: AsyncIOMotorDatabase) -> None:  
        existing = {i["name"] async for i in db[cls.COLLECTION].list_indexes()}  
        if cls.INDEX_NAME not in existing:  
            await db[cls.COLLECTION].create_index(  
                [("tenant_id", 1), ("_id", 1)],  
                name=cls.INDEX_NAME,  
                background=True,  
            )  
            print(f"[INDEX] Created {cls.INDEX_NAME} on {cls.COLLECTION}")

    def _tenant_filter(self, extra: dict | None = None) -> dict:  
        f: dict = {"tenant_id": self._tenant_id}  
        if extra:  
            f.update(extra)  
        return f

    def _id_filter(self, connector_id: str) -> dict:  
        try:  
            oid = ObjectId(connector_id)  
        except Exception:  
            raise HTTPException(status_code=404)  
        return self._tenant_filter({"_id": oid})

    async def get_by_id_raw(self, connector_id: str) -> dict:  
        doc = await self._col.find_one(self._id_filter(connector_id))  
        if doc is None:  
            raise HTTPException(status_code=404)  
        return doc

    async def list_for_tenant(self, skip: int = 0, limit: int = 100) -> list[dict]:  
        cursor = self._col.find(self._tenant_filter()).skip(skip).limit(limit)  
        return await cursor.to_list(length=limit)

    def stamp_tenant(self, doc: dict) -> dict:  
        doc["tenant_id"] = self._tenant_id  
        return doc

    async def delete(self, connector_id: str) -> None:  
        result = await self._col.delete_one(self._id_filter(connector_id))  
        if result.deleted_count == 0:  
            raise HTTPException(status_code=404)

    async def update_by_id(self, connector_id: str, update: dict) -> None:  
        await self._col.update_one(self._id_filter(connector_id), update)  
