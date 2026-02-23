"""
Scan Router (MongoDB Version)
Handles data quality scanning operations including S3 direct scanning
"""


from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
import pandas as pd
import io
from datetime import datetime
import uuid


from app.core.database import get_database
from app.services import s3_service
from pydantic import BaseModel


router = APIRouter(prefix="/api/v1/scan", tags=["Scanning"])


class S3ScanRequest(BaseModel):
    """Request model for S3 file scanning"""
    bucket_name: str
    file_key: str
    aws_access_key_id: str
    aws_secret_access_key: str
    region_name: str
    scan_name: Optional[str] = None


class S3ScanResponse(BaseModel):
    """Response model for S3 file scanning"""
    success: bool
    message: str
    scan_id: Optional[str] = None
    job_id: Optional[str] = None
    file_info: Optional[dict] = None


def analyze_dataframe_quality(df: pd.DataFrame) -> dict:
    """
    Analyze data quality of a DataFrame
    Returns quality metrics and issues
    """
    total_rows = len(df)
    total_columns = len(df.columns)
    total_cells = total_rows * total_columns
    
    # Calculate metrics
    missing_values = df.isnull().sum().sum()
    duplicate_rows = df.duplicated().sum()
    
    # Quality score calculation
    completeness = ((total_cells - missing_values) / total_cells * 100) if total_cells > 0 else 0
    uniqueness = ((total_rows - duplicate_rows) / total_rows * 100) if total_rows > 0 else 0
    quality_score = (completeness + uniqueness) / 2
    
    # Column analysis
    columns_analysis = []
    for col in df.columns:
        col_missing = df[col].isnull().sum()
        col_unique = df[col].nunique()
        
        columns_analysis.append({
            "name": col,
            "type": str(df[col].dtype),
            "missing_count": int(col_missing),
            "missing_percentage": round((col_missing / total_rows * 100), 2),
            "unique_values": int(col_unique),
            "sample_values": df[col].dropna().head(3).tolist()
        })
    
    total_issues = missing_values + duplicate_rows
    
    return {
        "summary": {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "quality_score": round(quality_score, 2),
            "total_issues": int(total_issues),
            "missing_values": int(missing_values),
            "duplicate_rows": int(duplicate_rows)
        },
        "columns": columns_analysis
    }


@router.post("/s3", response_model=S3ScanResponse)
async def scan_s3_file(
    request: S3ScanRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Scan a file directly from S3 without downloading to disk.
    
    Process:
    1. Read file stream from S3
    2. Load into Pandas DataFrame
    3. Run data quality analysis
    4. Save scan results to MongoDB
    5. Return scan ID for results viewing
    """
    
    try:
        # Step 1: Get file metadata from S3
        file_metadata = s3_service.get_file_metadata(
            aws_access_key_id=request.aws_access_key_id,
            aws_secret_access_key=request.aws_secret_access_key,
            region_name=request.region_name,
            bucket_name=request.bucket_name,
            file_key=request.file_key
        )
        
        if not file_metadata["success"]:
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {request.file_key}"
            )
        
        # Step 2: Read file stream from S3
        file_stream = s3_service.read_file_stream(
            aws_access_key_id=request.aws_access_key_id,
            aws_secret_access_key=request.aws_secret_access_key,
            region_name=request.region_name,
            bucket_name=request.bucket_name,
            file_key=request.file_key
        )
        
        if not file_stream["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to read file from S3: {file_stream.get('error', 'Unknown error')}"
            )
        
        # Step 3: Load into Pandas DataFrame based on file type
        file_extension = request.file_key.split('.')[-1].lower()
        
        try:
            if file_extension == 'csv':
                df = pd.read_csv(io.BytesIO(file_stream["content"]))
            elif file_extension in ['xlsx', 'xls']:
                df = pd.read_excel(io.BytesIO(file_stream["content"]))
            elif file_extension == 'json':
                df = pd.read_json(io.BytesIO(file_stream["content"]))
            elif file_extension == 'parquet':
                df = pd.read_parquet(io.BytesIO(file_stream["content"]))
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {file_extension}. Supported formats: csv, xlsx, xls, json, parquet"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse file: {str(e)}"
            )
        
        # Step 4: Run Data Quality Analysis
        scan_name = request.scan_name or f"S3 Scan - {request.file_key}"
        job_id = f"s3-scan-{uuid.uuid4().hex[:12]}"
        
        quality_results = analyze_dataframe_quality(df)
        
        # Step 5: Save scan results to MongoDB
        scan_document = {
            "job_id": job_id,
            "user_id": "system",  # Temporary until auth is implemented
            "scan_name": scan_name,
            "source_type": "s3",
            "source_path": f"s3://{request.bucket_name}/{request.file_key}",
            "status": "completed",
            "rows_scanned": quality_results["summary"]["total_rows"],
            "columns_scanned": quality_results["summary"]["total_columns"],
            "quality_score": quality_results["summary"]["quality_score"],
            "issues_found": quality_results["summary"]["total_issues"],
            "created_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "metadata": {
                "bucket": request.bucket_name,
                "key": request.file_key,
                "region": request.region_name,
                "file_size": file_metadata.get("size", 0),
                "file_type": file_extension,
                "storage_class": file_metadata.get("storage_class"),
                "columns": quality_results["columns"]
            }
        }
        
        result = await db.scan_jobs.insert_one(scan_document)
        scan_id = str(result.inserted_id)
        
        # Step 6: Return success response
        return S3ScanResponse(
            success=True,
            message=f"Successfully scanned {request.file_key} from S3",
            scan_id=scan_id,
            job_id=job_id,
            file_info={
                "bucket": request.bucket_name,
                "key": request.file_key,
                "size": file_metadata.get("size", 0),
                "rows": quality_results["summary"]["total_rows"],
                "columns": quality_results["summary"]["total_columns"],
                "quality_score": quality_results["summary"]["quality_score"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scan failed: {str(e)}"
        )


