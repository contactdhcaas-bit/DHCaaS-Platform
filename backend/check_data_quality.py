from pymongo import MongoClient
import pandas as pd

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

# Get scan job
job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

print(f"📊 Dataset: {job['filename']}")
print(f"Total Rows: {job.get('total_rows', 0)}")
print(f"Total Columns: {job.get('total_columns', 0)}")
print(f"Columns: {job.get('columns', [])}")

# Check scan_results for actual data quality issues
if 'scan_results' in job:
    scan_results = job['scan_results']
    print(f"\n🔍 Issues Found in Scan:")
    if 'issues' in scan_results:
        for issue in scan_results['issues']:
            print(f"  ⚠️ {issue}")
    
    print(f"\n📈 Quality Score: {scan_results.get('score', 'N/A')}")
    print(f"PII Detected: {scan_results.get('pii_detected', False)}")

# Check violations
violations_count = db.violations.count_documents({})
print(f"\n📋 Violations in DB: {violations_count}")
