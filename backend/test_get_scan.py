import sys
sys.path.insert(0, ".")
import asyncio

from app.core.database import get_scan_by_job_id

async def test():
    job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"
    
    print(f"Testing get_scan_by_job_id({job_id})\n")
    
    result = await get_scan_by_job_id(job_id)
    
    if result:
        print(f"SUCCESS!")
        print(f"  job_id: {result.get('job_id')}")
        print(f"  filename: {result.get('filename')}")
        print(f"  total_rows: {result.get('total_rows', 0)}")
        print(f"  columns: {result.get('columns', [])}")
        print(f"  file_path: {result.get('file_path', 'N/A')}")
    else:
        print(f"FAILED - result is None!")
        
        # Check database connection
        from app.core.database import get_database
        db = get_database()
        print(f"\nDatabase: {db}")
        
        if db:
            print(f"Database name: {db.name}")
            
            # Try direct query
            print(f"\nDirect MongoDB query:")
            job = await db.scan_jobs.find_one({"job_id": job_id})
            if job:
                print(f"  FOUND via direct query!")
                print(f"  job_id: {job.get('job_id')}")
            else:
                print(f"  NOT FOUND via direct query!")

asyncio.run(test())
