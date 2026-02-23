"""
DHCaaS Database Diagnostic & Seeding Script - FIXED
Checks MongoDB connection, analyzes existing data, and seeds if empty
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

print("=" * 80)
print("🔍 DHCAAS DATABASE DIAGNOSTIC & SEEDING SCRIPT")
print("=" * 80)
print()

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
print(f"✓ Project root: {project_root}")
print()

# ============================================================
# STEP 1: IMPORT DATABASE MODULE
# ============================================================
print("=" * 80)
print("STEP 1: IMPORTING DATABASE MODULE")
print("=" * 80)

scans_col = None
import_success = False

try:
    print("⏳ Attempting: from database import scans_col...")
    from database import scans_col
    import_success = True
    print("✅ SUCCESS: Imported from database")
except ImportError as e:
    print(f"❌ FAILED: {str(e)}")
    try:
        print("⏳ Attempting fallback: from backend.database import scans_col...")
        from backend.database import scans_col
        import_success = True
        print("✅ SUCCESS: Imported from backend.database")
    except ImportError as e2:
        print(f"❌ FAILED: {str(e2)}")
        try:
            print("⏳ Attempting fallback: from app.database import scans_col...")
            from app.database import scans_col
            import_success = True
            print("✅ SUCCESS: Imported from app.database")
        except ImportError as e3:
            print(f"❌ FAILED: {str(e3)}")
            print("\n🛑 CRITICAL ERROR: Cannot import database module!")
            sys.exit(1)

if not import_success or scans_col is None:
    print("\n🛑 CRITICAL ERROR: scans_col is None!")
    sys.exit(1)

print(f"\n✓ Collection Type: {type(scans_col)}")
print(f"✓ Collection Name: {scans_col.name if hasattr(scans_col, 'name') else 'Unknown'}")
print()

# ============================================================
# MAIN ASYNC FUNCTION - RUN EVERYTHING IN ONE EVENT LOOP
# ============================================================

async def main():
    """Main async function to run all diagnostics"""
    
    # STEP 2: CHECK CONNECTION
    print("=" * 80)
    print("STEP 2: TESTING DATABASE CONNECTION")
    print("=" * 80)
    
    try:
        initial_count = await scans_col.count_documents({})
        print("✅ MongoDB connection is ALIVE")
        print(f"\n✓ Current document count: {initial_count}")
        print()
    except Exception as e:
        print(f"❌ MongoDB connection FAILED: {str(e)}")
        print("\n🛑 CRITICAL ERROR: Cannot connect to MongoDB!")
        return False
    
    # STEP 3: ANALYZE DATA
    print("=" * 80)
    print("STEP 3: ANALYZING EXISTING DATA")
    print("=" * 80)
    
    if initial_count == 0:
        print("⚠️  Database is EMPTY - No documents to analyze")
        print()
    else:
        print(f"📊 Found {initial_count} document(s) in scans collection")
        print()
        
        first_doc = await scans_col.find_one({})
        
        if first_doc:
            print("🔍 FIRST DOCUMENT STRUCTURE:")
            print("-" * 80)
            print(f"{'Field Name':<30} {'Type':<20} {'Sample Value'}")
            print("-" * 80)
            
            for key, value in first_doc.items():
                value_type = type(value).__name__
                
                if isinstance(value, str) and len(value) > 40:
                    sample = value[:37] + "..."
                elif isinstance(value, datetime):
                    sample = value.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    sample = str(value)[:40]
                
                print(f"{key:<30} {value_type:<20} {sample}")
            
            print("-" * 80)
            print()
            
            required_fields = ['filename', 'compliance_score', 'created_at', 'has_pii']
            print("✓ REQUIRED FIELDS CHECK:")
            for field in required_fields:
                status = "✅ Present" if field in first_doc else "❌ Missing"
                print(f"  {field:<25} {status}")
            print()
    
    # STEP 4: SEEDING
    print("=" * 80)
    print("STEP 4: DATABASE SEEDING")
    print("=" * 80)
    
    if initial_count > 0:
        print(f"✓ Database already has {initial_count} document(s)")
        print("  Skipping seeding...")
        print()
    else:
        print("⚠️  Database is EMPTY - Starting seeding process...")
        print()
        
        test_scans = [
            {
                "filename": "users_table.csv",
                "database_type": "MySQL Production",
                "target_table": "users",
                "compliance_score": 88.5,
                "dq_score": 88.5,
                "has_pii": True,
                "owner": "Analytics Team",
                "created_by": "Admin User",
                "created_at": datetime.now(),
                "status": "completed",
                "total_rows": 15420,
                "columns_scanned": 12,
                "issues_found": 3
            },
            {
                "filename": "orders_history.csv",
                "database_type": "PostgreSQL Warehouse",
                "target_table": "orders",
                "compliance_score": 92.3,
                "dq_score": 92.3,
                "has_pii": False,
                "owner": "Sales Team",
                "created_by": "Admin User",
                "created_at": datetime.now(),
                "status": "completed",
                "total_rows": 48302,
                "columns_scanned": 8,
                "issues_found": 1
            },
            {
                "filename": "products_catalog.csv",
                "database_type": "MySQL Production",
                "target_table": "products",
                "compliance_score": 85.7,
                "dq_score": 85.7,
                "has_pii": False,
                "owner": "Product Team",
                "created_by": "Admin User",
                "created_at": datetime.now(),
                "status": "completed",
                "total_rows": 3204,
                "columns_scanned": 15,
                "issues_found": 5
            },
            {
                "filename": "customer_profiles.csv",
                "database_type": "MongoDB Atlas",
                "target_table": "customers",
                "compliance_score": 78.9,
                "dq_score": 78.9,
                "has_pii": True,
                "owner": "Marketing Team",
                "created_by": "Admin User",
                "created_at": datetime.now(),
                "status": "completed",
                "total_rows": 9876,
                "columns_scanned": 18,
                "issues_found": 8
            }
        ]
        
        result = await scans_col.insert_many(test_scans)
        
        print(f"✅ SUCCESS: Inserted {len(result.inserted_ids)} documents")
        print()
        
        print("📊 SEEDED DATA SUMMARY:")
        print("-" * 80)
        print(f"{'Filename':<35} {'Score':<8} {'PII':<6} {'Rows'}")
        print("-" * 80)
        
        for scan in test_scans:
            pii_flag = "🔒 Yes" if scan['has_pii'] else "   No"
            print(f"{scan['filename']:<35} {scan['compliance_score']:>6.1f}% {pii_flag:<6} {scan['total_rows']:>8}")
        
        print("-" * 80)
        print()
    
    # STEP 5: FINAL VERIFICATION
    print("=" * 80)
    print("STEP 5: FINAL VERIFICATION")
    print("=" * 80)
    
    final_count = await scans_col.count_documents({})
    
    print(f"\n📊 Final document count: {final_count}")
    
    if final_count > 0:
        print("✅ Database is ready for production use!")
        print()
        print("🚀 NEXT STEPS:")
        print("   1. Restart your FastAPI server:")
        print("      uvicorn app.main:app --reload --port 8000")
        print()
        print("   2. Refresh the frontend:")
        print("      http://localhost:5173/lineage")
        print()
        print("   3. You should now see REAL DATA from MongoDB!")
    else:
        print("⚠️  Database is still empty!")
    
    return final_count > 0

# Run the main function
success = asyncio.run(main())

print()
print("=" * 80)
print("✅ DIAGNOSTIC COMPLETE")
print("=" * 80)
print()

sys.exit(0 if success else 1)
