import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "dhcaas"

async def setup_admin():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔐 Updating admin password...")
    
    # Hash password with bcrypt directly
    password = "Admin@2024!"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    hashed_str = hashed.decode('utf-8')
    
    print(f"✅ Password hashed successfully")
    
    # Update admin
    result = await db.users.update_one(
        {"email": "admin@dhcaas.com"},
        {
            "$set": {
                "password": hashed_str,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count > 0:
        print("✅ Password updated!")
    else:
        print("Creating new admin...")
        await db.users.insert_one({
            "email": "admin@dhcaas.com",
            "password": hashed_str,
            "name": "Admin",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        })
        print("✅ Admin created!")
    
    print("\n" + "="*50)
    print("Email: admin@dhcaas.com")
    print("Password: Admin@2024!")
    print("="*50)
    
    client.close()

asyncio.run(setup_admin())
