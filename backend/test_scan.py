# test_scan.py
import asyncio
import sys
sys.path.insert(0, '.')

from app.routers.scans import ScanJobRequest, SourceType, SourceConfig, ScanOptions
from app.database import get_database
from app.routers.scans import execute_scan_job
from datetime import datetime

async def test_scan():
    print("🔄 Connecting to database...")
    
    # Get database
    db_gen = get_database()
    db = await db_gen.__anext__()
    
    # Create scan request
    request = ScanJobRequest(
        source_type=SourceType.CSV,
        source_config=SourceConfig(
            filepath="test_data/sample_customers.csv",
            delimiter=","
        ),
        scan_options=ScanOptions(
            include_quality=True,
            include_pii=True
        ),
        datasource_name="Test Customers CSV"
    )
    
    # Generate job ID
    job_id = f"test-scan-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    print(f"📋 Job ID: {job_id}")
    
    # Create initial job document
    await db["dhcaas"]["scan_jobs"].insert_one({
        "job_id": job_id,
        "status": "pending",
        "source_type": "csv",
        "datasource_name": "Test Customers CSV",
        "source_config": request.source_config.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    print("🔍 Starting scan...")
    await execute_scan_job(job_id, request, db)
    
    # Get results
    result = await db["dhcaas"]["scan_jobs"].find_one({"job_id": job_id})
    
    print("\n" + "="*60)
    print("✅ SCAN RESULTS")
    print("="*60)
    print(f"Status: {result['status']}")
    
    if result.get('results'):
        res = result['results']
        print(f"Overall Score: {res['overall_score']}%")
        print(f"Grade: {res['grade']}")
        print(f"Issues Found: {res['issues_found']}")
        print(f"Total Records: {res['total_records']}")
        print(f"Scan Duration: {res['scan_duration_seconds']}s")
        
        print(f"\n📊 Key Findings:")
        for finding in res.get('key_findings', []):
            print(f"   {finding}")
        
        if res.get('issues'):
            print(f"\n⚠️  Issues Detected:")
            for issue in res['issues'][:5]:  # Show first 5 issues
                print(f"   [{issue['severity'].upper()}] {issue['description']}")
        
        if res.get('breakdown'):
            print(f"\n📈 Column Breakdown:")
            for col, score in res['breakdown'].items():
                print(f"   {col}: {score}%")
    
    elif result.get('error_message'):
        print(f"❌ Error: {result['error_message']}")
    
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_scan())
