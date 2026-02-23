import os
import asyncio
from pathlib import Path

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

EMAIL = "contactdhcaas@gmail.com"
PHONE = "+212609519375"

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

async def main():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"), tls=True, tlsCAFile=certifi.where())
    db = client[os.getenv("DB_NAME", "dhcaas")]

    r = await db.users.update_one(
        {"email": EMAIL},
        {"$set": {"phone_number": PHONE}}
    )
    print("matched =", r.matched_count, "modified =", r.modified_count)

    user = await db.users.find_one({"email": EMAIL}, {"_id": 0, "email": 1, "phone_number": 1})
    print("user =", user)

    client.close()

asyncio.run(main())
