from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

print(f"📊 Database Stats:")
print(f"  Rules: {db.data_quality_rules.count_documents({})}")
print(f"  Scans: {db.scan_jobs.count_documents({})}")
print(f"  Violations: {db.violations.count_documents({})}")

print(f"\n📋 Active Rules for test_with_errors.csv:")
job_id = "040769b1-55d8-4e21-b49a-fa1070c15841"
rules = list(db.data_quality_rules.find({"job_id": job_id, "is_active": True}))
print(f"  Found: {len(rules)} rules")
for rule in rules:
    print(f"    - {rule['rule_name']} ({rule['rule_type']}) on '{rule.get('column_name', 'N/A')}'")

print(f"\n🔍 Violations for this job:")
violations = list(db.violations.find({"job_id": job_id}))
print(f"  Found: {len(violations)} violations")
for v in violations:
    print(f"    - {v.get('rule_name', 'Unknown')}")
    print(f"      Severity: {v.get('severity', 'N/A')}")
    print(f"      Count: {v.get('violation_count', 0)}")
    print(f"      Details: {v.get('violation_details', [])[:2]}")
    print()

print(f"\n📄 Job scan_results issues:")
job = db.scan_jobs.find_one({"job_id": job_id})
if job and 'scan_results' in job and 'issues' in job['scan_results']:
    for issue in job['scan_results']['issues']:
        print(f"  - {issue}")
