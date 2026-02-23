from pymongo import MongoClient
import json

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

if job and 'scan_results' in job:
    scan_results = job['scan_results']
    
    print("📦 Scan Results Structure:")
    print(json.dumps(scan_results, indent=2, default=str))
else:
    print("❌ No scan_results!")
