"""
AI Classification API Endpoints
Provides file upload and analysis for PII/sensitive data detection.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
import logging

from app.services.ai_classifier import DataClassifier, DataClassifierException

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}


@router.post("/scan", response_model=Dict[str, Any])
async def scan_dataset(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    Analyze uploaded dataset and classify columns using AI engine.
    
    Args:
        file: Uploaded CSV or XLSX file (max 50MB)
        
    Returns:
        Classification results with dataset summary and column analysis
        
    Raises:
        HTTPException 400: Invalid file format or empty file
        HTTPException 413: File too large
        HTTPException 500: Analysis failed
    """
    try:
        # Validate file is provided
        if not file or not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided"
            )
        
        # Validate file extension
        file_ext = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Validate file size
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )
        
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
            )
        
        # Initialize classifier and analyze
        classifier = DataClassifier(file_bytes=file_bytes, filename=file.filename)
        results = classifier.analyze()
        
        logger.info(f"Successfully analyzed file: {file.filename} - {results['dataset_summary']['total_columns']} columns classified")
        
        return results
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        # Handle validation errors from classifier
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except DataClassifierException as e:
        # Handle custom classifier exceptions
        logger.error(f"Classification error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(e)}"
        )
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error during analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during analysis"
        )
