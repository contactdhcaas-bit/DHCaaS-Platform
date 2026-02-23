"""
Data Integration & ETL Endpoints
Competing with Informatica Data Integration
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import logging
import shutil
from datetime import datetime

from app.services.cleaning_service import get_cleaning_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["integration"])


# --- Pydantic Models ---

class CleaningRequest(BaseModel):
    file_path: str
    rules: List[str]
    custom_options: Optional[Dict[str, Any]] = None


class CleaningResponse(BaseModel):
    status: str
    cleaned_file_path: str
    cleaned_file_name: str
    original_file_name: str
    download_url: str
    changes: Dict[str, Any]
    processing_time: str
    timestamp: str


# --- Endpoints ---

@router.post("/clean", response_model=CleaningResponse)
async def clean_dataset(
    file: UploadFile = File(...),
    rules: str = Form(...)  # Comma-separated rules
):
    """
    Upload a file and apply cleaning transformations
    
    Args:
        file: CSV/XLSX file to clean
        rules: Comma-separated list of cleaning rules
        
    Available rules:
        - drop_duplicates: Remove duplicate rows
        - fill_missing: Fill NaN values intelligently
        - standardize_case: Convert strings to lowercase
        - trim_whitespace: Strip whitespace
        - remove_special_chars: Clean special characters
        - normalize_dates: Standardize date formats
        - fix_data_types: Auto-detect and fix types
        - remove_outliers: Remove statistical outliers
    
    Returns:
        CleaningResponse with download link and change summary
    """
    try:
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'xlsx', 'xls', 'json', 'parquet']:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}"
            )
        
        logger.info(f"Received cleaning request for: {file.filename}")
        
        # Save uploaded file temporarily
        upload_dir = "temp_uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        temp_file_path = os.path.join(
            upload_dir,
            f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        )
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved temporarily to: {temp_file_path}")
        
        # Parse rules
        cleaning_rules = [rule.strip() for rule in rules.split(',') if rule.strip()]
        
        if not cleaning_rules:
            raise HTTPException(
                status_code=400,
                detail="No cleaning rules provided"
            )
        
        logger.info(f"Applying rules: {', '.join(cleaning_rules)}")
        
        # Run cleaning service
        cleaning_service = get_cleaning_service()
        result = cleaning_service.clean_dataset(temp_file_path, cleaning_rules)
        
        # Clean up temp file
        try:
            os.remove(temp_file_path)
        except:
            pass
        
        # Build download URL
        download_url = f"/api/v1/integration/download/{result['cleaned_file_name']}"
        
        response = CleaningResponse(
            status=result['status'],
            cleaned_file_path=result['cleaned_file_path'],
            cleaned_file_name=result['cleaned_file_name'],
            original_file_name=result['original_file_name'],
            download_url=download_url,
            changes=result['changes'],
            processing_time=result['processing_time'],
            timestamp=result['timestamp']
        )
        
        logger.info(f"Cleaning completed: {result['cleaned_file_name']}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during cleaning: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Cleaning failed: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_cleaned_file(filename: str):
    """
    Download a cleaned file
    
    Args:
        filename: Name of the cleaned file
    
    Returns:
        File download response
    """
    try:
        file_path = os.path.join("cleaned_files", filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Download failed: {str(e)}"
        )


@router.get("/rules")
async def get_available_rules():
    """Get list of available cleaning rules with descriptions"""
    return {
        "rules": [
            {
                "name": "drop_duplicates",
                "description": "Remove duplicate rows from the dataset",
                "category": "Data Quality"
            },
            {
                "name": "fill_missing",
                "description": "Fill missing values (mean for numeric, 'Unknown' for text)",
                "category": "Data Quality"
            },
            {
                "name": "standardize_case",
                "description": "Convert all text to lowercase",
                "category": "Standardization"
            },
            {
                "name": "trim_whitespace",
                "description": "Remove leading/trailing whitespace",
                "category": "Standardization"
            },
            {
                "name": "remove_special_chars",
                "description": "Clean special characters from text",
                "category": "Standardization"
            },
            {
                "name": "normalize_dates",
                "description": "Standardize date formats",
                "category": "Data Types"
            },
            {
                "name": "fix_data_types",
                "description": "Auto-detect and fix column data types",
                "category": "Data Types"
            },
            {
                "name": "remove_outliers",
                "description": "Remove statistical outliers using IQR method",
                "category": "Data Quality"
            }
        ]
    }


@router.get("/health")
async def integration_health():
    """Health check for integration service"""
    return {
        "service": "Data Integration & ETL",
        "status": "operational",
        "version": "1.0.0",
        "engine": "Informatica Competitor"
    }
