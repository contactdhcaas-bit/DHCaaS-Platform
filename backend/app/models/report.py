# app/models/report.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReportConfig(BaseModel):
    """Report configuration model"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    dataset_id: str = Field(..., min_length=1)
    chart_type: str = Field(..., pattern="^(bar|line|pie|area|scatter)$")
    x_axis: str = Field(..., min_length=1)
    y_axis: str = Field(..., min_length=1)
    aggregation: str = Field(..., pattern="^(sum|avg|count|min|max)$")
    color_by: Optional[str] = None

class ReportCreate(ReportConfig):
    """Schema for creating a new report"""
    pass

class ReportResponse(ReportConfig):
    """Schema for report response"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReportUpdate(BaseModel):
    """Schema for updating a report"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    dataset_id: Optional[str] = None
    chart_type: Optional[str] = Field(None, pattern="^(bar|line|pie|area|scatter)$")
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    aggregation: Optional[str] = Field(None, pattern="^(sum|avg|count|min|max)$")
    color_by: Optional[str] = None
