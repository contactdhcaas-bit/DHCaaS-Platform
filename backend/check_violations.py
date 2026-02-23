from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

print(f"📊 Total Stats:")
print(f"  Rules: {db.data_quality_rules.count_documents({})}")
print(f"  Scans: {db.scan_jobs.count_documents({})}")
print(f"  Violations: {db.violations.count_documents({})}")

print(f"\n📋 Violations Details:")
for v in db.violations.find():
    print(f"  - Rule: {v.get('rule_name', 'Unknown')}")
    print(f"    Job: {v.get('job_id', 'N/A')[:8]}...")
    print(f"    Severity: {v.get('severity', 'N/A')}")
    print(f"    Count: {v.get('violation_count', 0)}")
    print()
