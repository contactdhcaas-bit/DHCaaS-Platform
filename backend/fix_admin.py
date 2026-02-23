import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

# Database connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "dhcaas"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup_admin():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔐 Resetting admin password...")
    
    # Hash password properly
    hashed_password = pwd_context.hash("Admin@2024!")
    print(f"✅ Password hashed successfully")
    
    # Update admin with proper hash
    result = await db.users.update_one(
        {"email": "admin@dhcaas.com"},
        {
            "$set": {
                "password": hashed_password,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count > 0:
        print("✅ Admin password updated successfully!")
    else:
        print("❌ No admin found - creating new one...")
        await db.users.insert_one({
            "email": "admin@dhcaas.com",
            "password": hashed_password,
            "name": "System Admin",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        })
        print("✅ New admin created!")
    
    print("\n" + "="*50)
    print("🔐 CREDENTIALS")
    print("="*50)
    print("Email: admin@dhcaas.com")
    print("Password: Admin@2024!")
    print("="*50)
    
    client.close()

asyncio.run(setup_admin())
