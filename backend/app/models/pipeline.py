# app/models/pipeline.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId


class PipelineNode(BaseModel):
    """Represents a node in the pipeline graph"""
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "node-1",
                "type": "source",
                "position": {"x": 100, "y": 100},
                "data": {"label": "CSV Source", "config": {}}
            }
        }
    )


class PipelineEdge(BaseModel):
    """Represents a connection between two nodes"""
    id: str
    source: str
    target: str
    type: Optional[str] = "default"
    animated: Optional[bool] = False

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "edge-1",
                "source": "node-1",
                "target": "node-2",
                "type": "default",
                "animated": False
            }
        }
    )


class Pipeline(BaseModel):
    """Complete pipeline definition with nodes and edges"""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: Optional[str] = None
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "draft"
    execution_count: int = 0
    last_executed_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()},
        json_schema_extra={
            "example": {
                "name": "Sales ETL Pipeline",
                "description": "Extract, transform, and load sales data",
                "nodes": [
                    {
                        "id": "node-1",
                        "type": "source",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "CSV Source"}
                    }
                ],
                "edges": [],
                "owner_id": "user123",
                "status": "draft"
            }
        }
    )


class PipelineExecution(BaseModel):
    """Record of a pipeline execution run"""
    id: Optional[str] = Field(default=None, alias="_id")
    pipeline_id: str
    pipeline_name: str
    status: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    rows_processed: int = 0
    rows_output: int = 0
    error_message: Optional[str] = None
    execution_log: List[Dict[str, Any]] = []
    owner_id: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()},
        json_schema_extra={
            "example": {
                "pipeline_id": "507f1f77bcf86cd799439011",
                "pipeline_name": "Sales ETL Pipeline",
                "status": "running",
                "rows_processed": 1000,
                "rows_output": 950,
                "owner_id": "user123"
            }
        }
    )


class PipelineCreate(BaseModel):
    """Request model for creating a new pipeline"""
    name: str
    description: Optional[str] = None
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "New Pipeline",
                "description": "Pipeline description",
                "nodes": [
                    {
                        "id": "node-1",
                        "type": "source",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Source Node"}
                    }
                ],
                "edges": []
            }
        }
    )


class PipelineUpdate(BaseModel):
    """Request model for updating an existing pipeline"""
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[PipelineNode]] = None
    edges: Optional[List[PipelineEdge]] = None
    status: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Pipeline Name",
                "description": "Updated description",
                "status": "active"
            }
        }
    )
