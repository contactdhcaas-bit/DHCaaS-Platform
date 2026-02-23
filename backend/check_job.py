from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

if job:
    print(f"Job: {job['filename']}")
    print(f"Status: {job['status']}")
    print(f"\nJob Keys: {list(job.keys())}")
    
    if 'columns' in job:
        print(f"\n✅ Columns found: {job['columns']}")
    else:
        print("\n❌ NO columns field!")
    
    if 'column_stats' in job:
        print(f"\n✅ Column Stats: {list(job['column_stats'].keys())}")
    else:
        print("\n❌ NO column_stats field!")
else:
    print("Job not found!")
