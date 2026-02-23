# backend/seed_incidents.py
import asyncio
from datetime import datetime, timedelta
from database import incidents_col, scans_col
from bson import ObjectId


async def seed_incidents():
    """Add sample incidents to the database"""
    
    # Check if we already have incidents
    count = await incidents_col.count_documents({})
    if count > 0:
        print(f"✅ Database already has {count} incidents. Skipping seed.")
        return
    
    print("🌱 Seeding sample incidents...")
    
    # Create sample incidents
    sample_incidents = [
        {
            "severity": "critical",
            "status": "open",
            "type": "PII Exposure",
            "description": "Social Security Numbers found in unencrypted customer logs",
            "source": "Production Database",
            "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "high",
            "status": "investigating",
            "type": "Data Leak",
            "description": "Email addresses exposed in public API endpoint",
            "source": "Customer API",
            "created_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "medium",
            "status": "open",
            "type": "GDPR Violation",
            "description": "User consent not properly recorded for data processing",
            "source": "Marketing Database",
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "low",
            "status": "resolved",
            "type": "Missing Encryption",
            "description": "Database backup files stored without encryption",
            "source": "Backup Server",
            "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "resolved_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "resolution_code": "Fixed",
            "resolution_note": "Encryption enabled on all backup files",
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "high",
            "status": "open",
            "type": "Sensitive Data Access",
            "description": "Unauthorized access attempts detected on sensitive data tables",
            "source": "Analytics Database",
            "created_at": (datetime.utcnow() - timedelta(hours=8)).isoformat(),
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "critical",
            "status": "investigating",
            "type": "Data Breach",
            "description": "Potential data exfiltration detected in audit logs",
            "source": "Production Database",
            "created_at": (datetime.utcnow() - timedelta(hours=12)).isoformat(),
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "medium",
            "status": "resolved",
            "type": "Compliance Issue",
            "description": "Missing data retention policy documentation",
            "source": "Compliance System",
            "created_at": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "resolved_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "resolution_code": "Mitigated",
            "resolution_note": "Documentation created and approved",
            "owner": "admin@dhcaas.com"
        },
        {
            "severity": "low",
            "status": "open",
            "type": "Weak Security",
            "description": "Password hashing algorithm needs upgrade",
            "source": "User Authentication",
            "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "owner": "admin@dhcaas.com"
        }
    ]
    
    # Insert incidents
    result = await incidents_col.insert_many(sample_incidents)
    print(f"✅ Successfully added {len(result.inserted_ids)} sample incidents!")
    
    # Display summary
    print("\n📊 Incidents Summary:")
    for severity in ["critical", "high", "medium", "low"]:
        count = await incidents_col.count_documents({"severity": severity})
        print(f"   {severity.upper()}: {count}")
    
    print("\n🎯 Status Summary:")
    for status in ["open", "investigating", "resolved"]:
        count = await incidents_col.count_documents({"status": status})
        print(f"   {status.upper()}: {count}")


if __name__ == "__main__":
    asyncio.run(seed_incidents())
