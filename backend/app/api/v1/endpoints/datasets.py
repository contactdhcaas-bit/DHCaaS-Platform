from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.core.database import get_database

router = APIRouter()

@router.get("/")
async def get_datasets(status: Optional[str] = Query(None), owner: Optional[str] = Query(None)):
    try:
        db = get_database()
        query_filter = {}
        if status:
            query_filter["status"] = status
        if owner:
            query_filter["owner"] = owner
        scan_jobs_cursor = db.scan_jobs.find(query_filter).sort("created_at", -1)
        scan_jobs = await scan_jobs_cursor.to_list(length=None)
        datasets = []
        for job in scan_jobs:
            datasets.append({
                "job_id": job.get("job_id", str(job.get("_id"))),
                "datasource_name": job.get("datasource_name", job.get("filename", "Unknown")),
                "filename": job.get("filename", "Unknown"),
                "status": job.get("status", "unknown"),
                "created_at": job.get("created_at"),
                "owner": job.get("owner", job.get("created_by", "unknown")),
                "column_names": job.get("column_names", []),
                "row_count": job.get("row_count", 0)
            })
        return {"success": True, "count": len(datasets), "datasets": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch datasets: {str(e)}")
