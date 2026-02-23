from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

if job and 'scan_results' in job:
    scan_results = job['scan_results']
    
    # Get column_names from scan_results
    columns = scan_results.get('column_names', [])
    total_cols = scan_results.get('columns', 0)
    
    print(f"✅ Found columns: {columns}")
    print(f"✅ Total columns: {total_cols}")
    
    # Update job
    db.scan_jobs.update_one(
        {"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"},
        {"$set": {
            "columns": columns,
            "column_names": columns,
            "total_columns": total_cols
        }}
    )
    print(f"✅ Job updated successfully!")
else:
    print("❌ No scan_results!")
