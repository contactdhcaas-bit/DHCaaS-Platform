import os
import asyncio
from pathlib import Path

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

EMAIL = "contactdhcaas@gmail.com"

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

async def main():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"), tls=True, tlsCAFile=certifi.where())
    db = client[os.getenv("DB_NAME", "dhcaas")]
    count = await db.users.count_documents({"email": EMAIL})
    print("count =", count)
    docs = await db.users.find({"email": EMAIL}, {"_id": 1, "email": 1, "phone_number": 1}).to_list(length=10)
    print("docs =", docs)
    client.close()

asyncio.run(main())
