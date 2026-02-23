"""
AI-Powered Data Classification and Analysis Endpoints
Smart data classification using CLAIRE AI competitor engine
"""

from typing import Any, Dict, List
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging
import pandas as pd
import io
import time

# Import AI Classifier
from app.services.ai_classifier import classify_schema, get_classifier

# Logger setup
logger = logging.getLogger(__name__)

# Router definition
router = APIRouter(tags=["analysis"])


# --- Pydantic Models ---

class AnalysisResponse(BaseModel):
    analysis_id: str
    file_name: str
    file_size_bytes: int
    analysis_timestamp: datetime
    latency_ms: int
    dataset_summary: Dict[str, Any]
    columns: list
    smart_tags: Dict[str, Any]
    classification_summary: Dict[str, Any]


class ClassifyRequest(BaseModel):
    columns: List[Dict[str, Any]]


# --- Endpoints ---

@router.post("/scan", response_model=AnalysisResponse)
async def analyze_dataset(
    file: UploadFile = File(...)
):
    """
    Upload CSV/XLSX file and get AI-powered smart schema analysis
    
    Args:
        file: CSV or XLSX file to analyze
        
    Returns:
        AnalysisResponse with detected types, tags, AI descriptions, and classifications
    """
    start_time = time.time()
    
    try:
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}. Only CSV and XLSX are supported."
            )
        
        logger.info(f"Analyzing file: {file.filename} (type: {file_extension})")
        
        # Read file content
        contents = await file.read()
        file_size = len(contents)
        
        # Validate file size (50MB limit)
        max_size = 50 * 1024 * 1024  # 50MB in bytes
        if file_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: 50MB. Your file: {file_size / 1024 / 1024:.2f}MB"
            )
        
        # Check if file is empty
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )
        
        # Parse file into DataFrame
        try:
            if file_extension == 'csv':
                df = pd.read_csv(io.BytesIO(contents))
            else:  # xlsx or xls
                df = pd.read_excel(io.BytesIO(contents))
        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            raise HTTPException(
                status_code=422,
                detail=f"Failed to parse file: {str(e)}"
            )
        
        # Validate DataFrame
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="File contains no data"
            )
        
        logger.info(f"DataFrame shape: {df.shape} (rows: {len(df)}, columns: {len(df.columns)})")
        
        # Build columns list for AI classification
        columns_data = []
        for col in df.columns:
            col_info = {
                'name': col,
                'data_type': str(df[col].dtype),
                'null_count': int(df[col].isnull().sum()),
                'null_percentage': float((df[col].isnull().sum() / len(df)) * 100) if len(df) > 0 else 0,
                'unique_count': int(df[col].nunique()),
                'sample_values': df[col].dropna().head(3).tolist()
            }
            columns_data.append(col_info)
        
        # Convert sample data for content analysis
        sample_data = []
        if not df.empty:
            sample_rows = df.head(10).to_dict('records')
            for row in sample_rows:
                lowercase_row = {k.lower(): v for k, v in row.items()}
                sample_data.append(lowercase_row)
        
        # Run AI Classification
        logger.info(f"Running AI classification on {len(columns_data)} columns...")
        smart_tags = classify_schema(columns_data, sample_data)
        
        # Get classification summary
        classifier = get_classifier()
        classification_summary = classifier.get_classification_summary(smart_tags)
        
        # Build dataset summary
        pii_columns = sum(
            1 for tags in smart_tags.values() 
            if tags.get('category') == 'PII/Sensitive'
        )
        
        sensitive_columns = sum(
            1 for tags in smart_tags.values() 
            if tags.get('sensitivity') == 'High'
        )
        
        dataset_summary = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'pii_columns': pii_columns,
            'sensitive_columns': sensitive_columns,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'memory_usage_mb': round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2),
            'categories_detected': len(classification_summary.get('categories_breakdown', {})),
            'high_confidence_rate': classification_summary.get('confidence_rate', 0)
        }
        
        # Enhance columns data with AI tags
        for col_info in columns_data:
            col_name = col_info['name']
            if col_name in smart_tags:
                col_info['ai_classification'] = {
                    'category': smart_tags[col_name].get('category'),
                    'sensitivity': smart_tags[col_name].get('sensitivity'),
                    'business_context': smart_tags[col_name].get('business_context'),
                    'icon': smart_tags[col_name].get('icon'),
                    'confidence': smart_tags[col_name].get('confidence'),
                    'recommendations': smart_tags[col_name].get('recommendations', [])
                }
        
        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Build response
        response = AnalysisResponse(
            analysis_id=str(uuid.uuid4()),
            file_name=file.filename,
            file_size_bytes=file_size,
            analysis_timestamp=datetime.now(),
            latency_ms=latency_ms,
            dataset_summary=dataset_summary,
            columns=columns_data,
            smart_tags=smart_tags,
            classification_summary=classification_summary
        )
        
        logger.info(
            f"Analysis completed in {latency_ms}ms - "
            f"PII: {pii_columns} columns, "
            f"Sensitive: {sensitive_columns} columns, "
            f"Confidence: {classification_summary.get('confidence_rate', 0):.1f}%"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/classify-columns")
async def classify_columns_endpoint(request: ClassifyRequest):
    """
    Classify a list of columns without uploading a file
    
    Request body example:
    {
      "columns": [
        {"name": "email", "data_type": "string"},
        {"name": "salary", "data_type": "float"}
      ]
    }
    
    Args:
        request: ClassifyRequest with columns list
        
    Returns:
        Classification results with smart tags and summary
    """
    try:
        columns = request.columns
        
        if not columns:
            raise HTTPException(status_code=400, detail="No columns provided")
        
        logger.info(f"Classifying {len(columns)} columns...")
        
        # Run classification
        smart_tags = classify_schema(columns)
        
        # Get summary
        classifier = get_classifier()
        classification_summary = classifier.get_classification_summary(smart_tags)
        
        logger.info(
            f"Classification completed: {len(columns)} columns, "
            f"{classification_summary.get('high_confidence_classifications', 0)} high-confidence"
        )
        
        return {
            "status": "success",
            "total_columns": len(columns),
            "classifications": smart_tags,
            "summary": classification_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error classifying columns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.get("/health")
async def analysis_health():
    """Health check for analysis service"""
    return {
        "service": "AI-Powered Data Classification",
        "status": "operational",
        "version": "2.0.0",
        "engine": "CLAIRE AI Competitor",
        "features": [
            "8 classification categories",
            "Content-based analysis",
            "Confidence scoring",
            "Actionable recommendations"
        ]
    }
