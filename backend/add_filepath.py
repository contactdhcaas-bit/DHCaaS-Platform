from pymongo import MongoClient
import os

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"

# تحديث الـ job بإضافة file_path
file_path = os.path.abspath("test_errors_real.csv")

db.scan_jobs.update_one(
    {"job_id": job_id},
    {"$set": {"file_path": file_path}}
)

print(f"✅ Updated job with file_path: {file_path}")
