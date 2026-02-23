from pymongo import MongoClient
import bcrypt

# Connect to LOCAL MongoDB
client = MongoClient("mongodb://127.0.0.1:27017")
db = client.dhcaas

# Find admin user
admin = db.users.find_one({"email": "admin@dhcaas.com"})

if admin:
    print(f"✓ Admin user found:")
    print(f"  Email: {admin['email']}")
    print(f"  Hashed Password: {admin['hashed_password'][:60]}...")
    
    # Test password verification
    test_passwords = ["Admin@123", "admin123", "Admin123"]
    print(f"\n=== Testing passwords ===")
    
    for pwd in test_passwords:
        try:
            result = bcrypt.checkpw(pwd.encode('utf-8'), admin['hashed_password'].encode('utf-8'))
            print(f"  '{pwd}': {'✓ MATCH' if result else '✗ NO MATCH'}")
        except Exception as e:
            print(f"  '{pwd}': Error - {str(e)}")
    
    # Show all users
    print(f"\n=== All users in database ===")
    all_users = db.users.find({})
    for user in all_users:
        print(f"  - {user['email']} (ID: {str(user['_id'])})")
else:
    print("⚠ Admin user not found!")

client.close()
