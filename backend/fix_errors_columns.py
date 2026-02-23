from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

# Fix test_with_errors.csv columns
job = db.scan_jobs.find_one({"filename": "test_with_errors.csv"})

if job and 'scan_results' in job:
    scan_results = job['scan_results']
    columns = scan_results.get('column_names', [])
    
    print(f"✅ Found columns in scan_results: {columns}")
    
    # Update job
    db.scan_jobs.update_one(
        {"job_id": job["job_id"]},
        {"$set": {
            "columns": columns,
            "column_names": columns,
            "total_columns": len(columns) if columns else 0
        }}
    )
    print(f"✅ Updated job with {len(columns)} columns!")
else:
    print("❌ No scan_results or columns found")
