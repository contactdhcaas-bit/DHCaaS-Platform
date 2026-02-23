"""
Cloud Connectors Router
Handles connectivity to cloud storage services (AWS S3, Azure Blob, GCP Storage)
"""


from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from app.services import s3_service


router = APIRouter()


# ============================================================
# PYDANTIC MODELS
# ============================================================


class S3Credentials(BaseModel):
    """AWS S3 credentials model"""
    aws_access_key_id: str = Field(..., description="AWS Access Key ID", min_length=16, max_length=128)
    aws_secret_access_key: str = Field(..., description="AWS Secret Access Key", min_length=16, max_length=128)
    region_name: str = Field(default="us-east-1", description="AWS Region", examples=["us-east-1", "eu-west-1", "ap-southeast-1"])


class S3BucketRequest(BaseModel):
    """Request model for S3 bucket operations"""
    aws_access_key_id: str = Field(..., description="AWS Access Key ID", min_length=16, max_length=128)
    aws_secret_access_key: str = Field(..., description="AWS Secret Access Key", min_length=16, max_length=128)
    region_name: str = Field(default="us-east-1", description="AWS Region")
    bucket_name: str = Field(..., description="S3 Bucket Name", min_length=3, max_length=63)
    prefix: Optional[str] = Field(default="", description="Optional prefix/folder path to filter files")
    max_keys: Optional[int] = Field(default=1000, description="Maximum number of files to return", ge=1, le=1000)


class BucketInfo(BaseModel):
    """S3 Bucket information model"""
    name: str
    creation_date: Optional[str]
    region: str


class FileInfo(BaseModel):
    """S3 File information model"""
    key: str
    size: int
    size_mb: float
    last_modified: Optional[str]
    etag: str
    storage_class: str


class S3BucketsResponse(BaseModel):
    """Response model for list buckets endpoint"""
    success: bool
    message: str
    bucket_count: int
    region: str
    buckets: List[BucketInfo]


class S3FilesResponse(BaseModel):
    """Response model for list files endpoint"""
    success: bool
    message: str
    bucket_name: str
    prefix: str
    file_count: int
    is_truncated: bool
    files: List[FileInfo]


class ConnectionTestResponse(BaseModel):
    """Response model for connection test"""
    success: bool
    message: str
    region: Optional[str] = None
    error_code: Optional[str] = None


# ============================================================
# AWS S3 ENDPOINTS
# ============================================================


@router.post(
    "/s3/test",
    response_model=ConnectionTestResponse,
    summary="Test AWS S3 Connection",
    description="Test connectivity to AWS S3 using provided credentials"
)
async def test_s3_connection(credentials: S3Credentials):
    """
    Test AWS S3 connection
    
    - **aws_access_key_id**: Your AWS Access Key ID
    - **aws_secret_access_key**: Your AWS Secret Access Key
    - **region_name**: AWS region (default: us-east-1)
    
    Returns connection status and validation result
    """
    try:
        result = s3_service.test_connection(
            aws_access_key_id=credentials.aws_access_key_id,
            aws_secret_access_key=credentials.aws_secret_access_key,
            region_name=credentials.region_name
        )
        
        return ConnectionTestResponse(**result)
        
    except Exception as e:
        return ConnectionTestResponse(
            success=False,
            message=f"Connection test failed: {str(e)}"
        )


@router.post(
    "/s3/buckets",
    response_model=S3BucketsResponse,
    summary="List AWS S3 Buckets",
    description="Retrieve list of all S3 buckets accessible with provided credentials"
)
async def list_s3_buckets(credentials: S3Credentials):
    """
    List all AWS S3 buckets
    
    - **aws_access_key_id**: Your AWS Access Key ID
    - **aws_secret_access_key**: Your AWS Secret Access Key
    - **region_name**: AWS region (default: us-east-1)
    
    Returns list of bucket names with creation dates
    """
    try:
        result = s3_service.list_buckets(
            aws_access_key_id=credentials.aws_access_key_id,
            aws_secret_access_key=credentials.aws_secret_access_key,
            region_name=credentials.region_name
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to list buckets")
            )
        
        return S3BucketsResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": f"Failed to list buckets: {str(e)}",
                "error_type": "InternalError"
            }
        )


@router.post(
    "/s3/files",
    response_model=S3FilesResponse,
    summary="List Files in S3 Bucket",
    description="Retrieve list of files from a specific S3 bucket with optional prefix filtering"
)
async def list_s3_files(request: S3BucketRequest):
    """
    List files in an AWS S3 bucket
    
    - **aws_access_key_id**: Your AWS Access Key ID
    - **aws_secret_access_key**: Your AWS Secret Access Key
    - **region_name**: AWS region (default: us-east-1)
    - **bucket_name**: Name of the S3 bucket
    - **prefix**: Optional prefix/folder path (e.g., "data/2024/")
    - **max_keys**: Maximum number of files to return (1-1000)
    
    Returns list of files with metadata (name, size, last modified date)
    """
    try:
        result = s3_service.list_files(
            aws_access_key_id=request.aws_access_key_id,
            aws_secret_access_key=request.aws_secret_access_key,
            region_name=request.region_name,
            bucket_name=request.bucket_name,
            prefix=request.prefix,
            max_keys=request.max_keys
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to list files")
            )
        
        return S3FilesResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": f"Failed to list files: {str(e)}",
                "error_type": "InternalError"
            }
        )


@router.get(
    "/s3/regions",
    summary="List AWS Regions",
    description="Get list of available AWS regions for S3"
)
async def list_aws_regions():
    """
    Get list of available AWS regions
    
    Returns commonly used AWS regions for S3 service
    """
    regions = [
        {"code": "us-east-1", "name": "US East (N. Virginia)"},
        {"code": "us-east-2", "name": "US East (Ohio)"},
        {"code": "us-west-1", "name": "US West (N. California)"},
        {"code": "us-west-2", "name": "US West (Oregon)"},
        {"code": "eu-west-1", "name": "Europe (Ireland)"},
        {"code": "eu-west-2", "name": "Europe (London)"},
        {"code": "eu-west-3", "name": "Europe (Paris)"},
        {"code": "eu-central-1", "name": "Europe (Frankfurt)"},
        {"code": "ap-south-1", "name": "Asia Pacific (Mumbai)"},
        {"code": "ap-southeast-1", "name": "Asia Pacific (Singapore)"},
        {"code": "ap-southeast-2", "name": "Asia Pacific (Sydney)"},
        {"code": "ap-northeast-1", "name": "Asia Pacific (Tokyo)"},
        {"code": "sa-east-1", "name": "South America (São Paulo)"},
        {"code": "ca-central-1", "name": "Canada (Central)"},
    ]
    
    return {
        "success": True,
        "message": "Available AWS regions",
        "region_count": len(regions),
        "regions": regions
    }
