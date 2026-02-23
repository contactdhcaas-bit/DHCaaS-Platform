"""
Standalone MongoDB connection test script.
Usage: python db_ping.py
"""

import os
import sys
import certifi
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME", "dhcaas")

def test_connection():
    """Test MongoDB connection with detailed diagnostics."""
    
    if not MONGODB_URL:
        print("=" * 70)
        print("ERROR: MONGODB_URL not found in environment")
        print("=" * 70)
        print("Please set it in your .env file")
        print("Example:")
        print('MONGODB_URL="mongodb+srv://user:pass@cluster.mongodb.net/dbname"')
        print("=" * 70)
        return False
    
    print("=" * 70)
    print("MongoDB Connection Test - DHCaaS")
    print("=" * 70)
    print(f"Database: {DB_NAME}")
    print(f"URL: {MONGODB_URL[:50]}...")
    print(f"CA Bundle: {certifi.where()}")
    print("=" * 70)
    print()

    try:
        print("[1/4] Creating MongoDB client...")
        client = MongoClient(
            MONGODB_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
        )
        print("    SUCCESS: Client created")
        
        print("[2/4] Pinging MongoDB server...")
        client.admin.command("ping")
        print("    SUCCESS: Server responded to ping")
        
        print("[3/4] Accessing database...")
        db = client[DB_NAME]
        collections = db.list_collection_names()
        print(f"    SUCCESS: Database '{DB_NAME}' accessible")
        if collections:
            print(f"    Collections found: {', '.join(collections)}")
        else:
            print("    Collections found: none (empty database)")
        
        print("[4/4] Testing users collection...")
        users_col = db.users
        user_count = users_col.count_documents({})
        print(f"    SUCCESS: Users collection has {user_count} document(s)")
        
        print()
        print("=" * 70)
        print("SUCCESS: MongoDB connection fully functional!")
        print("=" * 70)
        print()
        print("Next steps:")
        print("1. Start backend: uvicorn main:app --reload")
        print("2. Test login at: http://127.0.0.1:8000/docs")
        print("=" * 70)
        
        client.close()
        return True
        
    except ServerSelectionTimeoutError as e:
        print()
        print("=" * 70)
        print("ERROR: TIMEOUT - Could not connect to MongoDB Atlas")
        print("=" * 70)
        print(f"Details: {e}")
        print()
        print("Possible causes:")
        print("  1. Network firewall blocking port 27017")
        print("  2. MongoDB Atlas IP whitelist not configured")
        print("     Solution: Add 0.0.0.0/0 to Network Access in Atlas")
        print("  3. Invalid connection string in .env file")
        print("  4. MongoDB Atlas cluster paused or unavailable")
        print("=" * 70)
        return False
        
    except ConnectionFailure as e:
        print()
        print("=" * 70)
        print("ERROR: CONNECTION FAILED")
        print("=" * 70)
        print(f"Details: {e}")
        print()
        print("Check your MONGODB_URL in .env file")
        print("=" * 70)
        return False
        
    except Exception as e:
        print()
        print("=" * 70)
        print(f"ERROR: UNEXPECTED ERROR ({type(e).__name__})")
        print("=" * 70)
        print(f"Details: {e}")
        print()
        print("Please check:")
        print("  1. .env file exists in backend directory")
        print("  2. MONGODB_URL is correctly formatted")
        print("  3. certifi package is installed (pip install certifi)")
        print("=" * 70)
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
