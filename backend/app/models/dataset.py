# app/models/dataset.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Dataset(BaseModel):
    """Dataset model for Report Builder"""
    id: str
    name: str
    description: Optional[str] = None
    source_type: str  # e.g., "csv", "postgresql", "mongodb", "s3"
    connection_string: Optional[str] = None
    table_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class DatasetCreate(BaseModel):
    """Dataset creation model"""
    name: str
    description: Optional[str] = None
    source_type: str
    connection_string: Optional[str] = None
    table_name: Optional[str] = None

class FieldsResponse(BaseModel):
    """Available fields response"""
    dimensions: List[str]
    measures: List[str]

class DatasetsResponse(BaseModel):
    """List of datasets response"""
    datasets: List[Dataset]
