import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def reset_password():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['dhcaas']
    
    # Hash new password
    password = 'Admin123!'
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Update admin user
    result = await db.users.update_one(
        {'email': 'admin@dhcaas.com'},
        {'$set': {'hashed_password': hashed}}
    )
    
    print('✓ Password updated for admin@dhcaas.com')
    print('New password: Admin123!')
    print('Modified count:', result.modified_count)
    
    client.close()

asyncio.run(reset_password())
