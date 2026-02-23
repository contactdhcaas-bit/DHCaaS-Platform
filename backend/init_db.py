import asyncio
from database import db, connect_to_mongo, close_mongo_connection, DB_NAME
import pymongo

async def init_collections_and_indexes():
    """
    Initializes required collections and indexes for DHCaaS.
    Run this script once to set up the database schema/indexes.
    """
    print("🚀 Starting Database Initialization...")
    
    # Ensure connection is open
    await connect_to_mongo()
    
    # FIX: Use the explicit DB_NAME from database.py instead of get_default_database()
    print(f"📂 Target Database: {DB_NAME}")
    database = db.client[DB_NAME] 
    
    # 1. Collection: data_sources
    # Index: { org_id: 1, type: 1 } for fast lookup by organization and source type
    print("🔹 Setting up 'data_sources'...")
    await database["data_sources"].create_index(
        [("org_id", pymongo.ASCENDING), ("type", pymongo.ASCENDING)],
        name="idx_datasources_org_type"
    )
    
    # 2. Collection: datasets
    # Index: { org_id: 1, source_id: 1 } to link datasets to sources within an org
    print("🔹 Setting up 'datasets'...")
    await database["datasets"].create_index(
        [("org_id", pymongo.ASCENDING), ("source_id", pymongo.ASCENDING)],
        name="idx_datasets_org_source"
    )
    
    # 3. Collection: audit_logs
    # Index: { org_id: 1, created_at: -1 } for showing latest logs first
    print("🔹 Setting up 'audit_logs'...")
    await database["audit_logs"].create_index(
        [("org_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
        name="idx_audit_org_time"
    )

    print("✅ Database Initialization Complete!")
    await close_mongo_connection()

if __name__ == "__main__":
    # Run the async initialization loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(init_collections_and_indexes())
    loop.close()
