from pymongo import MongoClient
from datetime import datetime

# Connect to LOCAL MongoDB
client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas

# Update all users to add role and company fields
result = db.users.update_many(
    {},
    {
        "$set": {
            "role": "admin",
            "company": "DHCaaS"
        }
    }
)

print(f"✓ Updated {result.modified_count} users with role and company fields")

# Verify admin user
admin = db.users.find_one({"email": "admin@dhcaas.com"})
if admin:
    print(f"\n✓ Admin user verified:")
    print(f"  Email: {admin['email']}")
    print(f"  Role: {admin.get('role', 'NOT SET')}")
    print(f"  Company: {admin.get('company', 'NOT SET')}")
    print(f"  ID: {str(admin['_id'])}")
else:
    print("⚠ Admin user not found!")

client.close()
