import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

# Database connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "dhcaas"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup_admin():
    # Direct MongoDB connection
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("📋 Checking existing users...")
    users = await db.users.find({}, {"email": 1, "name": 1}).to_list(length=100)
    
    if users:
        print("\nExisting users:")
        for u in users:
            print(f"  - {u.get('email', 'N/A')}")
    else:
        print("  No users found.")
    
    # Admin user data
    admin = {
        "email": "admin@dhcaas.com",
        "password": pwd_context.hash("Admin@2024!"),
        "name": "System Admin",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    # Upsert admin
    result = await db.users.update_one(
        {"email": "admin@dhcaas.com"},
        {"$set": admin},
        upsert=True
    )
    
    if result.upserted_id:
        print("\n✅ New admin user created!")
    else:
        print("\n✅ Admin user password updated!")
    
    print("\n" + "="*50)
    print("🔐 ADMIN CREDENTIALS")
    print("="*50)
    print("Email/Username: admin@dhcaas.com")
    print("Password:       Admin@2024!")
    print("="*50)
    print("\n📍 Login URL: http://localhost:8000/api/v1/auth/login")
    
    client.close()

if __name__ == "__main__":
    try:
        asyncio.run(setup_admin())
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
