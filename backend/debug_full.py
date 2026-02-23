from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"

print("📊 Job Info:")
job = db.scan_jobs.find_one({"job_id": job_id})
print(f"  Filename: {job.get('filename')}")
print(f"  Total Rows: {job.get('total_rows', 0)}")
print(f"  Columns: {job.get('columns', [])}")

print("\n📋 Active Rules:")
rules = list(db.data_quality_rules.find({"job_id": job_id, "is_active": True}))
for rule in rules:
    print(f"  - {rule['rule_name']}: {rule['rule_type']} on '{rule['column_name']}'")

print("\n🔍 Violations:")
violations = list(db.violations.find({"job_id": job_id}))
print(f"  Total: {len(violations)}")
for v in violations:
    print(f"  - {v.get('rule_name')}: {v.get('violation_count')} violations")

print("\n📄 Scan Issues:")
if 'scan_results' in job and 'issues' in job['scan_results']:
    for issue in job['scan_results']['issues']:
        print(f"  - {issue}")
