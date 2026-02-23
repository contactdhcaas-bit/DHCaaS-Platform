from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

class LineageNodeOut(BaseModel):
    id: str
    label: str
    type: str = Field(default="table")
    x: int
    y: int
    qualityScore: Optional[float] = None
    hasPII: Optional[bool] = None
    owner: Optional[str] = None
    lastScan: Optional[str] = None

class LineageResponse(BaseModel):
    nodes: List[LineageNodeOut]
    edges: List[dict]

# NO @router.get() here - endpoint is in main.py
