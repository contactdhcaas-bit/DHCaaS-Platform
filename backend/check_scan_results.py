from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job = db.scan_jobs.find_one({"job_id": "a4df64f4-81a0-4feb-b318-da708635d8d6"})

if job:
    print(f"Total Columns: {job.get('total_columns', 0)}")
    print(f"Column Names: {job.get('column_names', [])}")
    
    if 'scan_results' in job:
        print(f"\n✅ Scan Results exists")
        print(f"Type: {type(job['scan_results'])}")
        if isinstance(job['scan_results'], dict):
            print(f"Keys: {list(job['scan_results'].keys())[:10]}")
    else:
        print("\n❌ No scan_results!")
