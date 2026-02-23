from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

# Find newest job
job = db.scan_jobs.find_one(
    {"filename": "test_errors_real.csv"},
    sort=[("created_at", -1)]
)

if job:
    print(f"✅ New Job ID: {job['job_id']}")
    print(f"Total Rows: {job.get('total_rows', 0)}")
    print(f"Columns: {job.get('columns', [])}")
    
    if job.get('total_rows', 0) > 0:
        print(f"\n🎉 File uploaded successfully with data!")
    else:
        print(f"\n⚠️ Warning: File uploaded but Total Rows = 0")
else:
    print("❌ File not found yet")
