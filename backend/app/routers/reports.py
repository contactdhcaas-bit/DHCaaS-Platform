# app/routers/reports.py
from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from uuid import uuid4

from app.models.report import ReportCreate, ReportResponse, ReportUpdate
from app.core.database import get_sync_database

router = APIRouter(prefix="/reports", tags=["Reports"])

def get_reports_collection():
    """Get saved_reports collection"""
    db = get_sync_database()
    return db["saved_reports"]

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report: ReportCreate):
    """Create and save a new report configuration"""
    try:
        collection = get_reports_collection()
        
        report_id = str(uuid4())
        now = datetime.utcnow()
        
        report_doc = {
            "id": report_id,
            "title": report.title,
            "description": report.description,
            "dataset_id": report.dataset_id,
            "chart_type": report.chart_type,
            "x_axis": report.x_axis,
            "y_axis": report.y_axis,
            "aggregation": report.aggregation,
            "color_by": report.color_by,
            "created_at": now,
            "updated_at": None
        }
        
        result = collection.insert_one(report_doc)
        
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save report"
            )
        
        return ReportResponse(**report_doc)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating report: {str(e)}"
        )

@router.get("", response_model=List[ReportResponse])
async def get_all_reports(limit: int = 100, skip: int = 0):
    """Retrieve all saved reports"""
    try:
        collection = get_reports_collection()
        
        cursor = collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
        
        reports = []
        for doc in cursor:
            doc.pop("_id", None)
            reports.append(ReportResponse(**doc))
        
        return reports
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving reports: {str(e)}"
        )

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_by_id(report_id: str):
    """Retrieve a specific report by ID"""
    try:
        collection = get_reports_collection()
        
        report_doc = collection.find_one({"id": report_id})
        
        if not report_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {report_id} not found"
            )
        
        report_doc.pop("_id", None)
        
        return ReportResponse(**report_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving report: {str(e)}"
        )

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: str):
    """Delete a saved report"""
    try:
        collection = get_reports_collection()
        
        existing_report = collection.find_one({"id": report_id})
        if not existing_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {report_id} not found"
            )
        
        result = collection.delete_one({"id": report_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete report"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting report: {str(e)}"
        )

@router.get("/dataset/{dataset_id}", response_model=List[ReportResponse])
async def get_reports_by_dataset(dataset_id: str):
    """Retrieve all reports for a specific dataset"""
    try:
        collection = get_reports_collection()
        
        cursor = collection.find({"dataset_id": dataset_id}).sort("created_at", -1)
        
        reports = []
        for doc in cursor:
            doc.pop("_id", None)
            reports.append(ReportResponse(**doc))
        
        return reports
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving reports by dataset: {str(e)}"
        )


