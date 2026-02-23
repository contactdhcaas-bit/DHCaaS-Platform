from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

if job and 'column_names' in job:
    print(f"✅ Column Names found: {job['column_names']}")
    
    # Copy to 'columns' field for frontend
    db.scan_jobs.update_one(
        {"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"},
        {"$set": {"columns": job['column_names']}}
    )
    print("✅ Copied to 'columns' field!")
else:
    print("❌ No column_names!")
