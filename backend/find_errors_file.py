from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

# Find test_with_errors.csv
job = db.scan_jobs.find_one({"filename": "test_with_errors.csv"})

if job:
    print(f"✅ Found: {job['filename']}")
    print(f"Job ID: {job['job_id']}")
    print(f"\nColumns: {job.get('columns', [])}")
    
    # Check scan issues
    if 'scan_results' in job and 'issues' in job['scan_results']:
        print(f"\n⚠️ Issues:")
        for issue in job['scan_results']['issues']:
            print(f"  - {issue}")
else:
    print("❌ File not found")
