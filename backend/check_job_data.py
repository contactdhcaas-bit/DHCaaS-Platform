from pymongo import MongoClient
import json

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job_id = "040769b1-55d8-4e21-b49a-fa1070c15841"
job = db.scan_jobs.find_one({"job_id": job_id})

print("📊 Job Details:")
print(f"  Filename: {job.get('filename')}")
print(f"  Columns: {job.get('columns', [])}")
print(f"  Total Rows: {job.get('total_rows', 0)}")

if 'scan_results' in job:
    print(f"\n🔍 Scan Results:")
    print(f"  Quality Score: {job['scan_results'].get('quality_score')}")
    print(f"  Issues Found: {len(job['scan_results'].get('issues', []))}")
    
    # Print sample data if available
    if 'sample_data' in job['scan_results']:
        print(f"\n📋 Sample Data (first 3 rows):")
        sample = job['scan_results']['sample_data'][:3]
        print(json.dumps(sample, indent=2))
