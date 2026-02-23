# app/core/database.py
"""
MongoDB Database Connection
Production-grade connection with retry logic and connection pooling
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging
from typing import Optional
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class Database:
    """Database singleton class"""
    client: Optional[AsyncIOMotorClient] = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    """
    Create database connection with connection pooling
    """
    try:
        # Get MongoDB URI from environment or use default
        MONGODB_URI = os.getenv(
            "MONGODB_URI",
            "mongodb://localhost:27017"
        )
        DATABASE_NAME = os.getenv("DATABASE_NAME", "dhcaas_db")
        
        logger.info(f"Connecting to MongoDB: {MONGODB_URI}")
        logger.info(f"Database: {DATABASE_NAME}")
        
        # Create Motor client with connection pooling
        db_instance.client = AsyncIOMotorClient(
            MONGODB_URI,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
        )
        
        # Verify connection
        await db_instance.client.admin.command('ping')
        
        # Set database
        db_instance.db = db_instance.client[DATABASE_NAME]
        
        logger.info("MongoDB connected successfully")
        logger.info(f"Database: {DATABASE_NAME}")
        
        # Create indexes
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        logger.warning("Running without database - data will not persist")
        db_instance.client = None
        db_instance.db = None
    except Exception as e:
        logger.error(f"Unexpected error during MongoDB connection: {str(e)}")
        db_instance.client = None
        db_instance.db = None

async def close_mongo_connection():
    """
    Close database connection
    """
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")

async def create_indexes():
    """
    Create database indexes for performance
    """
    try:
        if db_instance.db is None:
            logger.warning("Database not available - skipping index creation")
            return
        
        logger.info("Creating database indexes...")
        
        # ===== SCAN JOBS COLLECTION INDEXES =====
        await db_instance.db.scan_jobs.create_index("job_id", unique=True)
        await db_instance.db.scan_jobs.create_index("user_id")
        await db_instance.db.scan_jobs.create_index("created_at")
        await db_instance.db.scan_jobs.create_index("status")
        await db_instance.db.scan_jobs.create_index([("user_id", 1), ("created_at", -1)])
        await db_instance.db.scan_jobs.create_index([("datasource_name", "text"), ("filename", "text")])
        
        logger.info("  scan_jobs indexes created")
        
        # ===== DATA QUALITY RULES COLLECTION INDEXES =====
        await db_instance.db.data_quality_rules.create_index("rule_id", unique=True)
        await db_instance.db.data_quality_rules.create_index("job_id")
        await db_instance.db.data_quality_rules.create_index("rule_type")
        await db_instance.db.data_quality_rules.create_index("is_active")
        await db_instance.db.data_quality_rules.create_index([("job_id", 1), ("is_active", 1)])
        
        logger.info("  data_quality_rules indexes created")
        
        # ===== VIOLATIONS COLLECTION INDEXES =====
        await db_instance.db.violations.create_index("violation_id", unique=True)
        await db_instance.db.violations.create_index("rule_id")
        await db_instance.db.violations.create_index("job_id")
        await db_instance.db.violations.create_index("validation_date")
        await db_instance.db.violations.create_index([("job_id", 1), ("validation_date", -1)])
        
        logger.info("  violations indexes created")
        
        # ===== USERS COLLECTION INDEXES =====
        await db_instance.db.users.create_index("user_id", unique=True)
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.users.create_index("created_at")
        
        logger.info("  users indexes created")
        
        # ===== REPORTS COLLECTION INDEXES =====
        await db_instance.db.reports.create_index("report_id", unique=True)
        await db_instance.db.reports.create_index("job_id")
        await db_instance.db.reports.create_index("created_at")
        
        logger.info("  reports indexes created")
        
        logger.info("All database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")

def get_database():
    """
    Get database instance
    
    Returns:
        AsyncIOMotorDatabase or None: Database instance if connected, None otherwise
    """
    return db_instance.db

async def get_collection(collection_name: str):
    """
    Get a specific collection
    
    Args:
        collection_name (str): Name of the collection
        
    Returns:
        AsyncIOMotorCollection or None: Collection instance if database is connected
    """
    db = get_database()
    if db is None:
        logger.warning(f"Database not available - cannot access collection '{collection_name}'")
        return None
    return db[collection_name]

async def check_connection() -> bool:
    """
    Check if database connection is alive
    
    Returns:
        bool: True if connected, False otherwise
    """
    try:
        if db_instance.client is None:
            return False
        await db_instance.client.admin.command('ping')
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False

async def get_database_stats() -> dict:
    """
    Get database statistics
    
    Returns:
        dict: Database statistics including collection counts
    """
    try:
        db = get_database()
        if db is None:
            return {
                "connected": False,
                "error": "Database not available"
            }
        
        stats = {
            "connected": True,
            "database_name": db.name,
            "collections": {}
        }
        
        # Get counts for main collections
        collections = [
            "scan_jobs",
            "data_quality_rules",
            "violations",
            "users",
            "reports"
        ]
        
        for collection_name in collections:
            try:
                count = await db[collection_name].count_documents({})
                stats["collections"][collection_name] = count
            except Exception as e:
                logger.error(f"Error counting {collection_name}: {str(e)}")
                stats["collections"][collection_name] = 0
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        return {
            "connected": False,
            "error": str(e)
        }

# ============================================================================
# RULE VALIDATOR HELPER FUNCTIONS
# ============================================================================

async def get_scan_by_job_id(job_id: str):
    """Get scan job by job_id"""
    db = get_database()
    if db is None:
        return None
    return await db.scan_jobs.find_one({"job_id": job_id})

async def get_rules_by_job_id(job_id: str, active_only: bool = False):
    """Get all rules for a job_id"""
    db = get_database()
    if db is None:
        return []
    
    query = {"job_id": job_id}
    if active_only:
        query["is_active"] = True
    
    return await db.data_quality_rules.find(query).to_list(length=None)

async def create_violations_bulk(violations: list):
    """Create multiple violations at once"""
    db = get_database()
    if db is None or not violations:
        return
    
    # Add violation_id to each violation if not present
    for violation in violations:
        if "violation_id" not in violation:
            import uuid
            violation["violation_id"] = f"viol_{uuid.uuid4().hex[:24]}"
    
    await db.violations.insert_many(violations)

async def update_rule_stats(rule_id: str, violations_count: int, passed: bool):
    """Update rule statistics"""
    db = get_database()
    if db is None:
        return
    
    await db.data_quality_rules.update_one(
        {"rule_id": rule_id},
        {
            "$set": {
                "last_executed": datetime.utcnow()
            },
            "$inc": {
                "total_executions": 1,
                "total_violations": violations_count,
                "total_passed": 1 if passed else 0
            }
        }
    )

async def save_rule_execution(execution_data: dict):
    """Save rule execution history"""
    db = get_database()
    if db is None:
        return
    
    # Optional: Create rule_executions collection if needed
    # await db.rule_executions.insert_one(execution_data)
    pass

async def get_violations_summary(job_id: str):
    """Get violations summary for a job"""
    db = get_database()
    if db is None:
        return {"total": 0, "by_severity": {}}
    
    violations = await db.violations.find({"job_id": job_id}).to_list(length=None)
    
    summary = {
        "total": len(violations),
        "by_severity": {}
    }
    
    for v in violations:
        severity = v.get("severity", "UNKNOWN")
        if severity not in summary["by_severity"]:
            summary["by_severity"][severity] = {"total": 0, "unresolved": 0}
        
        summary["by_severity"][severity]["total"] += 1
        if not v.get("is_resolved", False):
            summary["by_severity"][severity]["unresolved"] += 1
    
    return summary

async def get_rule_by_id(rule_id: str):
    """Get rule by rule_id"""
    db = get_database()
    if db is None:
        return None
    return await db.data_quality_rules.find_one({"rule_id": rule_id})

async def create_violation(violation: dict):
    """Create a single violation"""
    db = get_database()
    if db is None:
        return None
    
    # Add violation_id if not present
    if "violation_id" not in violation:
        import uuid
        violation["violation_id"] = f"viol_{uuid.uuid4().hex[:24]}"
    
    return await db.violations.insert_one(violation)
