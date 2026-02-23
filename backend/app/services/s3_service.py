"""
AWS S3 Cloud Connector Service
Handles S3 bucket operations, file listing, and direct file scanning
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, List, Optional


def test_connection(
    aws_access_key_id: str,
    aws_secret_access_key: str,
    region_name: str
) -> dict:
    """
    Test AWS S3 connection with provided credentials
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
        
        # Test by listing buckets
        s3_client.list_buckets()
        
        return {
            "success": True,
            "message": "Connection successful! Credentials validated.",
            "region": region_name
        }
        
    except NoCredentialsError:
        return {
            "success": False,
            "message": "Invalid credentials provided",
            "error_code": "INVALID_CREDENTIALS"
        }
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'InvalidAccessKeyId':
            return {
                "success": False,
                "message": "Invalid Access Key ID",
                "error_code": "INVALID_ACCESS_KEY"
            }
        elif error_code == 'SignatureDoesNotMatch':
            return {
                "success": False,
                "message": "Invalid Secret Access Key",
                "error_code": "INVALID_SECRET_KEY"
            }
        else:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "error_code": error_code
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}",
            "error_code": "UNKNOWN_ERROR"
        }


def list_buckets(
    aws_access_key_id: str,
    aws_secret_access_key: str,
    region_name: str
) -> dict:
    """
    List all S3 buckets accessible with provided credentials
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
        
        response = s3_client.list_buckets()
        
        buckets = []
        for bucket in response.get('Buckets', []):
            try:
                location = s3_client.get_bucket_location(Bucket=bucket['Name'])
                bucket_region = location.get('LocationConstraint') or 'us-east-1'
            except:
                bucket_region = 'unknown'
            
            buckets.append({
                "name": bucket['Name'],
                "creation_date": bucket['CreationDate'].isoformat() if bucket.get('CreationDate') else None,
                "region": bucket_region
            })
        
        return {
            "success": True,
            "message": f"Found {len(buckets)} bucket(s)",
            "bucket_count": len(buckets),
            "region": region_name,
            "buckets": buckets
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'AccessDenied':
            return {
                "success": False,
                "message": "Access denied. Check your IAM permissions.",
                "error_code": "ACCESS_DENIED"
            }
        return {
            "success": False,
            "message": f"Failed to list buckets: {str(e)}",
            "error_code": error_code
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}",
            "error_code": "UNKNOWN_ERROR"
        }


def list_files(
    aws_access_key_id: str,
    aws_secret_access_key: str,
    region_name: str,
    bucket_name: str,
    prefix: str = "",
    max_keys: int = 1000
) -> dict:
    """
    List files in a specific S3 bucket
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
        
        params = {
            'Bucket': bucket_name,
            'MaxKeys': max_keys
        }
        
        if prefix:
            params['Prefix'] = prefix
        
        response = s3_client.list_objects_v2(**params)
        
        files = []
        for obj in response.get('Contents', []):
            size_bytes = obj.get('Size', 0)
            files.append({
                "key": obj['Key'],
                "size": size_bytes,
                "size_mb": round(size_bytes / (1024 * 1024), 2),
                "last_modified": obj.get('LastModified').isoformat() if obj.get('LastModified') else None,
                "etag": obj.get('ETag', '').strip('"'),
                "storage_class": obj.get('StorageClass', 'STANDARD')
            })
        
        return {
            "success": True,
            "message": f"Found {len(files)} file(s) in bucket",
            "bucket_name": bucket_name,
            "prefix": prefix,
            "file_count": len(files),
            "is_truncated": response.get('IsTruncated', False),
            "files": files
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchBucket':
            return {
                "success": False,
                "message": f"Bucket '{bucket_name}' does not exist",
                "error_code": "BUCKET_NOT_FOUND"
            }
        elif error_code == 'AccessDenied':
            return {
                "success": False,
                "message": f"Access denied to bucket '{bucket_name}'",
                "error_code": "ACCESS_DENIED"
            }
        return {
            "success": False,
            "message": f"Failed to list files: {str(e)}",
            "error_code": error_code
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}",
            "error_code": "UNKNOWN_ERROR"
        }


def get_file_metadata(
    aws_access_key_id: str,
    aws_secret_access_key: str,
    region_name: str,
    bucket_name: str,
    file_key: str
) -> dict:
    """
    Get metadata for a specific S3 file
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
        
        response = s3_client.head_object(Bucket=bucket_name, Key=file_key)
        
        return {
            "success": True,
            "size": response.get('ContentLength', 0),
            "last_modified": response.get('LastModified').isoformat() if response.get('LastModified') else None,
            "content_type": response.get('ContentType'),
            "storage_class": response.get('StorageClass', 'STANDARD'),
            "etag": response.get('ETag', '').strip('"')
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            return {
                "success": False,
                "error": "File not found",
                "error_code": "NOT_FOUND"
            }
        return {
            "success": False,
            "error": str(e),
            "error_code": error_code
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "UNKNOWN_ERROR"
        }


def read_file_stream(
    aws_access_key_id: str,
    aws_secret_access_key: str,
    region_name: str,
    bucket_name: str,
    file_key: str,
    max_size_mb: int = 100
) -> dict:
    """
    Read file content from S3 as a byte stream
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
        
        # Get file size first
        head_response = s3_client.head_object(Bucket=bucket_name, Key=file_key)
        file_size = head_response.get('ContentLength', 0)
        
        # Check file size limit
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            return {
                "success": False,
                "error": f"File size ({file_size / 1024 / 1024:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)",
                "error_code": "FILE_TOO_LARGE"
            }
        
        # Download file content
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        content = response['Body'].read()
        
        return {
            "success": True,
            "content": content,
            "size": file_size,
            "content_type": response.get('ContentType')
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        return {
            "success": False,
            "error": str(e),
            "error_code": error_code
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "UNKNOWN_ERROR"
        }
