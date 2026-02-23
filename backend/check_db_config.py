import os
import re
import asyncio
from pathlib import Path

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

EMAIL_TO_CHECK = "contactdhcaas@gmail.com"

def mask_mongodb_url(url: str) -> str:
    if not url:
        return ""
    return re.sub(r"(mongodb(?:\+srv)?://)([^:@/]+):([^@/]+)@", r"\1\2:***@", url)

def load_env():
    dotenv_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=dotenv_path, override=True)
    return dotenv_path

async def main():
    dotenv_path = load_env()

    mongodb_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DB_NAME", "dhcaas")

    print("DOTENV_PATH =", str(dotenv_path))
    print("DB_NAME =", db_name)
    print("MONGODB_URL(masked) =", mask_mongodb_url(mongodb_url))

    if not mongodb_url:
        print("ERROR: MONGODB_URL is missing.")
        return

    client = AsyncIOMotorClient(
        mongodb_url,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
    )

    try:
        await client.admin.command("ping")
        print("PING = ok")
    except Exception as e:
        print("PING = failed:", repr(e))
        return

    db = client[db_name]
    users_col = db.users

    user = await users_col.find_one(
        {"email": EMAIL_TO_CHECK},
        {"_id": 0, "email": 1, "phone_number": 1}
    )
    print("USER =", user)

    if user and user.get("phone_number"):
        print("phone_number =", user["phone_number"])
    else:
        print("phone_number = MISSING/EMPTY")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())
