import os, asyncio
from pathlib import Path
from dotenv import load_dotenv
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

async def main():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"), tls=True, tlsCAFile=certifi.where())
    dbs = await client.list_database_names()
    print("DATABASES:", dbs)
    for name in dbs:
        if name.lower().startswith(("dh", "data", "test")):
            cols = await client[name].list_collection_names()
            print(name, "collections:", cols)
    client.close()

asyncio.run(main())
