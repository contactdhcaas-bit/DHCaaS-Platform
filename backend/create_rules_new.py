import requests

job_id = "NEW_JOB_ID_HERE"  # استبدل بالـ job_id الفعلي

rules = [
    {
        "rule_name": "Email Format Check",
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
        "rule_name": "Name Required",
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
        "rule_name": "Unique ID Check",
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

for rule in rules:
    response = requests.post("http://localhost:8000/api/v1/rules/", json=rule)
    if response.status_code == 201:
        print(f"✅ Created: {rule['rule_name']}")
    else:
        print(f"❌ Failed: {rule['rule_name']}")
