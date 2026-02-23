import requests

job_id = "040769b1-55d8-4e21-b49a-fa1070c15841"

# Create rules for test_with_errors.csv
rules = [
    {
        "rule_name": "Email Format - Errors File",
        "description": "Validate email format",
        "job_id": job_id,
        "rule_type": "EMAIL",
        "scope": "COLUMN",
        "column_name": "email",
        "severity": "HIGH",
        "is_active": True,
        "created_by": "system@dhcaas.com"
    },
    {
        "rule_name": "Name Not Null - Errors File",
        "description": "Name must not be empty",
        "job_id": job_id,
        "rule_type": "NOT_NULL",
        "scope": "COLUMN",
        "column_name": "name",
        "severity": "HIGH",
        "is_active": True,
        "created_by": "system@dhcaas.com"
    },
    {
        "rule_name": "Unique ID - Errors File",
        "description": "ID must be unique",
        "job_id": job_id,
        "rule_type": "UNIQUE",
        "scope": "COLUMN",
        "column_name": "id",
        "severity": "CRITICAL",
        "is_active": True,
        "created_by": "system@dhcaas.com"
    }
]

print("📝 Creating rules...")
for rule in rules:
    response = requests.post("http://localhost:8000/api/v1/rules/", json=rule)
    if response.status_code == 201:
        print(f"✅ Created: {rule['rule_name']}")
    else:
        print(f"❌ Failed: {rule['rule_name']} - {response.status_code}")

print("\n✅ All rules created!")
