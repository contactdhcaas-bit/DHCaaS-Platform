from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"

print(f"Searching for job_id: {job_id}\n")

# Search by job_id
job = db.scan_jobs.find_one({"job_id": job_id})

if job:
    print(f"FOUND by job_id!")
    print(f"  _id: {job.get('_id')}")
    print(f"  job_id: {job.get('job_id')}")
    print(f"  filename: {job.get('filename')}")
else:
    print(f"NOT FOUND by job_id!")
    
    # Try to find by any field
    print(f"\nSearching all jobs with 'test_errors_real.csv'...")
    jobs = list(db.scan_jobs.find({"filename": "test_errors_real.csv"}))
    
    if jobs:
        print(f"\nFound {len(jobs)} job(s):")
        for j in jobs:
            print(f"\n  Job:")
            print(f"    _id: {j.get('_id')}")
            print(f"    job_id: {j.get('job_id')}")
            print(f"    filename: {j.get('filename')}")
            print(f"    total_rows: {j.get('total_rows', 0)}")
    else:
        print("  No jobs found!")

print(f"\nTotal scan_jobs in DB: {db.scan_jobs.count_documents({})}")
