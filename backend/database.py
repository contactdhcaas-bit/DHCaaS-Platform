# backend/database.py
"""
Central MongoDB connection module.
All routers MUST import collections from here.
Never create additional AsyncIOMotorClient instances elsewhere.
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional
import logging

# CRITICAL: Load .env BEFORE reading environment variables
from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient

try:
    from bson import ObjectId
except Exception:
    ObjectId = None

logger = logging.getLogger(__name__)

# ============================================================================
# MONGODB CONFIGURATION (SINGLE CLIENT - DO NOT DUPLICATE)
# ============================================================================

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("MONGODB_DB_NAME", "dhcaas")

if not MONGODB_URL:
    raise ValueError(
        "MONGODB_URL environment variable is not set. "
        "Please configure it in your .env file."
    )

# Single MongoDB client WITHOUT TLS (for local development)
client = AsyncIOMotorClient(
    MONGODB_URL,
    tls=False,
    tlsAllowInvalidCertificates=True,
    directConnection=True,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000,
    maxPoolSize=50,
    minPoolSize=10,
)

db = client[DB_NAME]

# Collection exports (all routers import from here)
users_col = db.users
scans_col = db.scans
sources_col = db.sources
incidents_col = db.incidents
assets_col = db.assets

# ============================================================================
# DEPENDENCY INJECTION FOR FASTAPI
# ============================================================================

async def get_database():
    """
    FastAPI dependency to inject database connection into routes.
    Usage: db = Depends(get_database)
    """
    return db

# ============================================================================
# CONNECTION HEALTH CHECK
# ============================================================================

async def check_db_connection() -> bool:
    """
    Ping MongoDB to verify connection.
    Returns True if healthy, False otherwise.
    """
    try:
        await client.admin.command("ping")
        return True
    except Exception as e:
        logger.error(f"MongoDB connection check failed: {e}")
        return False

# ============================================================================
# SCAN OPERATIONS
# ============================================================================

def _serialize_scan(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert MongoDB document to JSON-friendly payload."""
    if not doc:
        return doc
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

async def get_all_scans(limit: int = 50) -> List[Dict[str, Any]]:
    """Return latest scans from MongoDB."""
    cursor = scans_col.find({}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_serialize_scan(d) for d in docs if d]

async def get_dashboard_stats(recent_limit: int = 100) -> Dict[str, Any]:
    """Fetch real-time dashboard statistics."""
    total_scans = await scans_col.count_documents({})

    cursor = scans_col.find({}).sort("created_at", -1).limit(recent_limit)
    recent_scans = await cursor.to_list(length=recent_limit)

    recent_count = len(recent_scans)
    compliant_count = sum(1 for s in recent_scans if (s or {}).get("compliance_score", 0) > 80)
    total_score = sum((s or {}).get("compliance_score", 0) for s in recent_scans)
    avg_score = total_score / max(recent_count, 1)

    last_scan_dt = None
    if recent_scans and isinstance(recent_scans[0], dict):
        last_scan_dt = recent_scans[0].get("created_at")

    return {
        "total_scans": int(total_scans),
        "recent_scans": int(recent_count),
        "avg_score": round(float(avg_score), 1),
        "high_risk": int(recent_count - compliant_count),
        "datasets": int(recent_count),
        "last_scan": last_scan_dt.isoformat() if last_scan_dt else None,
        "compliant_ratio": round((compliant_count / max(recent_count, 1)) * 100, 1),
    }


async def save_scan_result(result: Dict[str, Any]) -> str:
    """
    Save/update scan result with ADVANCED METRICS
    
    Schema includes:
    - Basic metadata (filename, job_id, owner, dates)
    - Quality scores (overall + dimensional breakdown)
    - Issues list
    - Advanced metrics:
        - Email/phone validation results
        - Duplicate detection (rows + IDs)
        - Negative value analysis
        - Outlier detection
        - Consistency checks
        - Null value analysis
    """
    
    try:
        # Extract advanced_metrics if present
        advanced_metrics = result.get('advanced_metrics', {})
        
        # Calculate summary counts for quick querying
        invalid_emails_count = sum(
            email_result.get('invalid', 0) 
            for email_result in advanced_metrics.get('validity', {}).get('emails', [])
        )
        
        invalid_phones_count = sum(
            phone_result.get('invalid', 0) 
            for phone_result in advanced_metrics.get('validity', {}).get('phones', [])
        )
        
        duplicate_rows_count = advanced_metrics.get('duplicates', {}).get('row_duplicates', 0)
        
        duplicate_ids_count = sum(
            id_result.get('duplicates', 0)
            for id_result in advanced_metrics.get('duplicates', {}).get('id_duplicates', {}).values()
        )
        
        negative_values_count = sum(
            neg_result.get('negative_count', 0)
            for neg_result in advanced_metrics.get('negative_values', {}).values()
        )
        
        outliers_count = sum(
            outlier_result.get('outlier_count', 0)
            for outlier_result in advanced_metrics.get('outliers', {}).values()
        )
        
        consistency_issues_count = len(advanced_metrics.get('inconsistent_formats', []))
        null_columns_count = len(advanced_metrics.get('null_values', {}))
        
        # Build comprehensive MongoDB document
        scan_doc = {
            # Basic Metadata
            "job_id": result.get('job_id'),
            "filename": result.get("filename", "unknown.csv"),
            "datasource_name": result.get('datasource_name'),
            "owner": result.get('owner'),
            "description": result.get('description'),
            
            # Timestamps
            "created_at": result.get("created_at", datetime.utcnow()),
            "scan_date": result.get('scan_date'),
            "scan_timestamp": result.get('scan_timestamp'),
            "processing_time": result.get('processing_time'),
            
            # Data Statistics
            "total_rows": result.get("total_rows", result.get("total_rows_scanned", 0)),
            "rows": result.get('rows'),
            "columns": result.get('columns'),
            "column_names": result.get('column_names', []),
            "column_types": result.get('column_types', {}),
            
            # Quality Scores
            "score": result.get("score", result.get("compliance_score", 0)),
            "compliance_score": result.get("compliance_score", result.get("score", 0)),
            "dq_score": result.get('dq_score', result.get("score", 0)),
            "quality_dimensions": result.get('quality_dimensions', {}),
            "score_breakdown": result.get('score_breakdown', {}),
            
            # Status & Health
            "status": result.get("status", "completed"),
            "health_status": result.get('health_status'),
            
            # Issues
            "issues": result.get('issues', []),
            "columns_with_issues": result.get('columns_with_issues', []),
            "critical_issues_count": result.get('critical_issues_count', 0),
            
            # PII Detection
            "pii_detected": result.get("pii_detected", result.get("pii_columns_found", [])),
            "has_pii": result.get('has_pii', False),
            "pii_columns": result.get('pii_columns', []),
            "pii_total_exposure": result.get("pii_count", result.get("pii_total_exposure", 0)),
            
            # ADVANCED METRICS - FULL DETAIL
            "advanced_metrics": {
                # Duplicates
                "duplicates": {
                    "row_duplicates": duplicate_rows_count,
                    "row_duplicate_percentage": advanced_metrics.get('duplicates', {}).get('row_duplicate_percentage', 0),
                    "id_duplicates": advanced_metrics.get('duplicates', {}).get('id_duplicates', {}),
                    "total_duplicate_ids": duplicate_ids_count
                },
                
                # Validity (Email/Phone)
                "validity": {
                    "emails": advanced_metrics.get('validity', {}).get('emails', []),
                    "phones": advanced_metrics.get('validity', {}).get('phones', []),
                    "invalid_emails_count": invalid_emails_count,
                    "invalid_phones_count": invalid_phones_count
                },
                
                # Negative Values
                "negative_values": advanced_metrics.get('negative_values', {}),
                "negative_values_count": negative_values_count,
                
                # Consistency
                "inconsistent_formats": advanced_metrics.get('inconsistent_formats', []),
                "consistency_details": advanced_metrics.get('consistency_details', {}),
                "consistency_issues_count": consistency_issues_count,
                
                # Outliers
                "outliers": advanced_metrics.get('outliers', {}),
                "outliers_count": outliers_count,
                
                # Null Values
                "null_values": advanced_metrics.get('null_values', {}),
                "null_columns_count": null_columns_count
            },
            
            # QUICK SUMMARY FIELDS (for fast queries and dashboards)
            "summary": {
                "invalid_emails_count": invalid_emails_count,
                "invalid_phones_count": invalid_phones_count,
                "duplicate_rows_count": duplicate_rows_count,
                "duplicate_ids_count": duplicate_ids_count,
                "negative_values_count": negative_values_count,
                "outliers_count": outliers_count,
                "consistency_issues_count": consistency_issues_count,
                "null_columns_count": null_columns_count,
                "total_data_quality_issues": (
                    invalid_emails_count + 
                    duplicate_rows_count + 
                    duplicate_ids_count + 
                    negative_values_count + 
                    consistency_issues_count
                )
            }
        }
        
        # Check if updating existing document
        provided_id = result.get("id") or result.get("_id")
        if provided_id and ObjectId is not None:
            try:
                oid = ObjectId(str(provided_id))
                existing = await scans_col.find_one({"_id": oid})
                if existing:
                    await scans_col.update_one({"_id": oid}, {"$set": scan_doc})
                    logger.info(
                        f"✅ Advanced metrics saved for Scan ID: {result.get('job_id')} | "
                        f"MongoDB ID: {oid} | "
                        f"Score: {scan_doc['score']}/100 | "
                        f"Issues: Invalid Emails={invalid_emails_count}, "
                        f"Duplicates={duplicate_rows_count + duplicate_ids_count}, "
                        f"Negative Values={negative_values_count}, "
                        f"Outliers={outliers_count}"
                    )
                    return str(oid)
            except Exception as e:
                logger.warning(f"Could not update existing document: {e}")
        
        # Insert new document
        insert_result = await scans_col.insert_one(scan_doc)
        inserted_id = str(insert_result.inserted_id)
        
        logger.info(
            f"✅ Advanced metrics saved for Scan ID: {result.get('job_id')} | "
            f"MongoDB ID: {inserted_id} | "
            f"Score: {scan_doc['score']}/100 | "
            f"Issues: Invalid Emails={invalid_emails_count}, "
            f"Duplicates={duplicate_rows_count + duplicate_ids_count}, "
            f"Negative Values={negative_values_count}, "
            f"Outliers={outliers_count}"
        )
        
        return inserted_id
        
    except Exception as e:
        logger.error(f"❌ Failed to save scan result with advanced metrics: {str(e)}")
        raise Exception(f"Database save failed: {str(e)}")


async def get_scan_by_job_id(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve scan result by job_id"""
    try:
        scan = await scans_col.find_one({"job_id": job_id})
        return _serialize_scan(scan)
    except Exception as e:
        logger.error(f"Error retrieving scan {job_id}: {str(e)}")
        return None


async def delete_scan(job_id: str) -> bool:
    """Delete scan by job_id"""
    try:
        result = await scans_col.delete_one({"job_id": job_id})
        if result.deleted_count > 0:
            logger.info(f"✅ Deleted scan: {job_id}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting scan {job_id}: {str(e)}")
        return False


async def update_scan(job_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update scan metadata"""
    try:
        result = await scans_col.find_one_and_update(
            {"job_id": job_id},
            {"$set": update_data},
            return_document=True
        )
        return _serialize_scan(result)
    except Exception as e:
        logger.error(f"Error updating scan {job_id}: {str(e)}")
        return None
