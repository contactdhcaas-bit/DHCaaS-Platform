# app/routers/pipeline.py
from fastapi import APIRouter, HTTPException, status
from typing import List
from database import db

from app.models.pipeline import Pipeline, PipelineCreate, PipelineUpdate, PipelineExecution
from app.services.pipeline_service import PipelineService

router = APIRouter(prefix="/api/v1/pipelines", tags=["Pipelines"])

DEMO_USER_ID = "demo-user-001"


@router.post("", response_model=Pipeline, status_code=status.HTTP_201_CREATED)
async def create_pipeline(pipeline_data: PipelineCreate):
    """Create a new visual ETL pipeline."""
    service = PipelineService(db)
    try:
        pipeline = await service.save_pipeline(pipeline_data, DEMO_USER_ID)
        return pipeline
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create pipeline: {str(e)}"
        )


@router.get("", response_model=List[Pipeline])
async def list_pipelines(skip: int = 0, limit: int = 50):
    """List all pipelines."""
    service = PipelineService(db)
    pipelines = await service.list_pipelines(DEMO_USER_ID, skip, limit)
    return pipelines


@router.get("/{pipeline_id}", response_model=Pipeline)
async def get_pipeline(pipeline_id: str):
    """Get a specific pipeline by ID."""
    service = PipelineService(db)
    pipeline = await service.get_pipeline(pipeline_id, DEMO_USER_ID)
    
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    return pipeline


@router.put("/{pipeline_id}", response_model=Pipeline)
async def update_pipeline(pipeline_id: str, pipeline_data: PipelineUpdate):
    """Update an existing pipeline."""
    service = PipelineService(db)
    
    update_data = pipeline_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )
    
    pipeline = await service.update_pipeline(pipeline_id, update_data, DEMO_USER_ID)
    
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    return pipeline


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pipeline(pipeline_id: str):
    """Delete a pipeline."""
    service = PipelineService(db)
    deleted = await service.delete_pipeline(pipeline_id, DEMO_USER_ID)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )


@router.post("/{pipeline_id}/run", response_model=PipelineExecution)
async def run_pipeline(pipeline_id: str):
    """Execute a pipeline."""
    service = PipelineService(db)
    
    try:
        execution = await service.execute_pipeline(pipeline_id, DEMO_USER_ID)
        return execution
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution failed: {str(e)}"
        )


@router.get("/{pipeline_id}/executions", response_model=List[PipelineExecution])
async def list_pipeline_executions(pipeline_id: str, skip: int = 0, limit: int = 50):
    """List all executions for a specific pipeline."""
    service = PipelineService(db)
    executions = await service.list_executions(pipeline_id, DEMO_USER_ID, skip, limit)
    return executions


@router.get("/{pipeline_id}/executions/{execution_id}", response_model=PipelineExecution)
async def get_execution_details(pipeline_id: str, execution_id: str):
    """Get detailed execution log and statistics."""
    service = PipelineService(db)
    execution = await service.get_execution(execution_id, DEMO_USER_ID)
    
    if not execution or execution.pipeline_id != pipeline_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    return execution
