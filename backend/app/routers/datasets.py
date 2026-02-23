# app/routers/datasets.py
"""
Datasets Router - Dataset Management with Real Field Discovery
Handles dataset CRUD operations and dynamic field introspection
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from uuid import uuid4

from app.models.dataset import Dataset, DatasetCreate, FieldsResponse, DatasetsResponse
from app.core.database import get_sync_database
from app.services.data_reader_service import DataReaderService


router = APIRouter(prefix="/datasets", tags=["Datasets"])


def get_datasets_collection():
    """Get datasets collection from MongoDB"""
    db = get_sync_database()
    return db["datasets"]


@router.get("", response_model=DatasetsResponse)
async def get_all_datasets():
    """
    Get all available datasets
    
    Returns list of datasets from MongoDB.
    If no datasets exist, creates sample datasets for demo purposes.
    """
    try:
        collection = get_datasets_collection()
        
        cursor = collection.find({}).sort("created_at", -1)
        
        datasets = []
        for doc in cursor:
            doc.pop("_id", None)
            datasets.append(Dataset(**doc))
        
        # If no datasets exist, create sample datasets
        if len(datasets) == 0:
            sample_datasets = [
                {
                    "id": "sample_sales",
                    "name": "Sales Data",
                    "description": "Sample sales transactions dataset",
                    "source_type": "csv",
                    "table_name": "sales.csv",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": "sample_customers",
                    "name": "Customer Data",
                    "description": "Sample customer information dataset",
                    "source_type": "csv",
                    "table_name": "customers.csv",
                    "created_at": datetime.utcnow()
                }
            ]
            
            collection.insert_many(sample_datasets)
            datasets = [Dataset(**ds) for ds in sample_datasets]
        
        return DatasetsResponse(datasets=datasets)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving datasets: {str(e)}"
        )


@router.get("/{dataset_id}/fields", response_model=FieldsResponse)
async def get_dataset_fields(dataset_id: str):
    """
    Get available fields (dimensions and measures) for a dataset
    
    Process:
    1. Fetch dataset metadata from MongoDB
    2. Load file into DataFrame
    3. Infer field types (dimensions vs measures)
    4. Return field lists
    """
    try:
        # Step 1: Get dataset metadata from MongoDB
        collection = get_datasets_collection()
        dataset = collection.find_one({"id": dataset_id})
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_id}' not found"
            )
        
        # Step 2: Get file path
        file_path = dataset.get("file_path") or dataset.get("table_name")
        
        if not file_path:
            # Fallback to mock data for sample datasets without files
            return _get_mock_fields(dataset_id)
        
        # Step 3: Load DataFrame from file
        try:
            df = DataReaderService.get_dataframe(dataset_id, file_path)
        except FileNotFoundError:
            # File not found - return mock data for sample datasets
            return _get_mock_fields(dataset_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading dataset file: {str(e)}"
            )
        
        # Step 4: Infer field types
        dimensions, measures = DataReaderService.infer_field_types(df)
        
        # Ensure we have at least one field of each type
        if len(dimensions) == 0 and len(measures) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields found in dataset"
            )
        
        return FieldsResponse(dimensions=dimensions, measures=measures)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving fields: {str(e)}"
        )


def _get_mock_fields(dataset_id: str) -> FieldsResponse:
    """
    Fallback mock fields for sample datasets without actual files
    Used for demo purposes when files don't exist yet
    """
    fields_map = {
        "sample_sales": {
            "dimensions": ["product_name", "category", "region", "sales_date", "customer_id"],
            "measures": ["quantity", "revenue", "profit", "discount"]
        },
        "sample_customers": {
            "dimensions": ["customer_name", "segment", "country", "city", "join_date"],
            "measures": ["total_purchases", "lifetime_value", "order_count"]
        }
    }
    
    if dataset_id not in fields_map:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' not found and no mock data available"
        )
    
    return FieldsResponse(**fields_map[dataset_id])


@router.post("", response_model=Dataset, status_code=status.HTTP_201_CREATED)
async def create_dataset(dataset: DatasetCreate):
    """
    Create a new dataset
    
    Stores dataset metadata in MongoDB.
    Actual file should be uploaded separately via file upload endpoint.
    """
    try:
        collection = get_datasets_collection()
        
        dataset_id = str(uuid4())
        now = datetime.utcnow()
        
        dataset_doc = {
            "id": dataset_id,
            "name": dataset.name,
            "description": dataset.description,
            "source_type": dataset.source_type,
            "connection_string": dataset.connection_string,
            "table_name": dataset.table_name,
            "created_at": now,
            "updated_at": None
        }
        
        result = collection.insert_one(dataset_doc)
        
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create dataset"
            )
        
        return Dataset(**dataset_doc)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating dataset: {str(e)}"
        )


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(dataset_id: str):
    """
    Delete a dataset
    
    Removes dataset metadata from MongoDB.
    Also clears any cached DataFrame data for this dataset.
    """
    try:
        collection = get_datasets_collection()
        
        result = collection.delete_one({"id": dataset_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_id}' not found"
            )
        
        # Clear cache for this dataset
        DataReaderService.clear_cache(dataset_id)
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting dataset: {str(e)}"
        )


@router.get("/{dataset_id}/preview")
async def preview_dataset(dataset_id: str, limit: int = 10):
    """
    Get a preview of the dataset (first N rows)
    
    Useful for validating data before creating charts
    """
    try:
        # Get dataset metadata
        collection = get_datasets_collection()
        dataset = collection.find_one({"id": dataset_id})
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_id}' not found"
            )
        
        file_path = dataset.get("file_path") or dataset.get("table_name")
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset has no associated file"
            )
        
        # Load DataFrame
        df = DataReaderService.get_dataframe(dataset_id, file_path)
        
        # Get first N rows
        preview_df = df.head(limit)
        
        # Convert to dict format for JSON response
        preview_data = preview_df.to_dict(orient='records')
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "total_rows": len(df),
            "preview_rows": len(preview_data),
            "columns": list(df.columns),
            "data": preview_data
        }
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error previewing dataset: {str(e)}"
        )


@router.get("/{dataset_id}/columns")
async def get_dataset_columns(dataset_id: str):
    """
    Get list of all columns in the dataset with data types
    
    Returns detailed column information including dtype and sample values
    """
    try:
        # Get dataset metadata
        collection = get_datasets_collection()
        dataset = collection.find_one({"id": dataset_id})
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_id}' not found"
            )
        
        file_path = dataset.get("file_path") or dataset.get("table_name")
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset has no associated file"
            )
        
        # Load DataFrame
        df = DataReaderService.get_dataframe(dataset_id, file_path)
        
        # Build column information
        columns_info = []
        for col in df.columns:
            columns_info.append({
                "name": col,
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
                "sample_values": df[col].dropna().head(3).tolist()
            })
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "total_columns": len(columns_info),
            "columns": columns_info
        }
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving columns: {str(e)}"
        )


