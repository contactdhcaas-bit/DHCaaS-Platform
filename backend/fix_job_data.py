from pymongo import MongoClient
import pandas as pd

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"

# قراءة الملف
df = pd.read_csv("test_errors_real.csv")

print(f"📊 File Stats:")
print(f"  Rows: {len(df)}")
print(f"  Columns: {list(df.columns)}")
print(f"\n📋 Data Preview:")
print(df)

# تحديث الـ job
update_data = {
    "total_rows": len(df),
    "columns": list(df.columns),
    "column_names": list(df.columns),
    "total_columns": len(df.columns)
}

# إضافة sample_data
if "scan_results" not in db.scan_jobs.find_one({"job_id": job_id}):
    update_data["scan_results"] = {}

update_data["scan_results.sample_data"] = df.to_dict('records')
update_data["scan_results.column_names"] = list(df.columns)

result = db.scan_jobs.update_one(
    {"job_id": job_id},
    {"$set": update_data}
)

print(f"\n✅ Updated job: {result.modified_count} document(s)")

# تحقق
job = db.scan_jobs.find_one({"job_id": job_id})
print(f"\n📊 After Update:")
print(f"  Total Rows: {job.get('total_rows', 0)}")
print(f"  Columns: {job.get('columns', [])}")
