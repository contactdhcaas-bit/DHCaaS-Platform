from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"

print(f"📊 Total Violations in DB: {db.violations.count_documents({})}")
print(f"📊 Violations for this job: {db.violations.count_documents({'job_id': job_id})}")

violations = list(db.violations.find({"job_id": job_id}))
for v in violations:
    print(f"\n  Rule: {v.get('rule_name', 'Unknown')}")
    print(f"  Message: {v.get('violation_message')}")
    print(f"  Severity: {v.get('severity')}")
