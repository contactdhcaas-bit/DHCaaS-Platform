import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_scans():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["dhcaas"]
    
    result = await db.scans.delete_many({})
    print(f"✅ Deleted {result.deleted_count} scans")
    
    client.close()

asyncio.run(clear_scans())
