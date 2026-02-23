from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

if job and 'scan_results' in job:
    scan_results = job['scan_results']
    
    if 'columns' in scan_results:
        columns = scan_results['columns']
        print(f"✅ Found columns in scan_results: {columns}")
        
        # Update job with columns
        db.scan_jobs.update_one(
            {"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"},
            {"$set": {
                "columns": columns,
                "column_names": columns,
                "total_columns": len(columns)
            }}
        )
        print(f"✅ Updated job with {len(columns)} columns!")
    else:
        print("❌ No columns in scan_results!")
else:
    print("❌ No scan_results!")
