from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas_db

print("📋 Existing Rules:")
for rule in db.data_quality_rules.find():
    print(f"  - {rule['rule_name']}")
    print(f"    Type: {rule['rule_type']}")
    print(f"    Column: {rule.get('column_name', 'N/A')}")
    print(f"    Job ID: {rule.get('job_id', 'N/A')[:8]}...")
    print()
