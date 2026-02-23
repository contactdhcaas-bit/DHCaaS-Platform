import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "dhcaas"

# Use SAME context as app.core.security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix_admin():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔐 Fixing admin with correct passlib hash...")
    
    # Hash using passlib (same as security.py)
    hashed = pwd_context.hash("Admin@2024!")
    
    # Update with correct field name
    result = await db.users.update_one(
        {"email": "admin@dhcaas.com"},
        {
            "$set": {
                "hashed_password": hashed,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count > 0:
        print("✅ Admin password fixed!")
    else:
        print("❌ Admin not found, creating...")
        await db.users.insert_one({
            "email": "admin@dhcaas.com",
            "hashed_password": hashed,
            "full_name": "System Admin",
            "role": "admin",
            "is_active": True,
            "is_superuser": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        print("✅ Admin created!")
    
    print("\n" + "="*50)
    print("Email: admin@dhcaas.com")
    print("Password: Admin@2024!")
    print("="*50)
    
    client.close()

asyncio.run(fix_admin())
