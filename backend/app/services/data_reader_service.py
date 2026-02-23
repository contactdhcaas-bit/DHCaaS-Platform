# app/services/data_reader_service.py
"""
Data Reader Service - File Loading, Type Inference, and Caching
Handles CSV/JSON file reading with intelligent field type detection
"""

import pandas as pd
import os
from typing import Tuple, List, Optional
from functools import lru_cache
from datetime import datetime, timedelta
import hashlib
import json
from pathlib import Path


class DataReaderService:
    """Service for reading and caching uploaded data files"""
    
    UPLOAD_DIR = "uploads"  # Base upload directory
    CACHE_TTL_SECONDS = 300  # 5 minutes
    MAX_CACHE_SIZE = 10  # Max number of DataFrames in memory
    
    # Cache for DataFrame objects with timestamp
    _dataframe_cache = {}
    
    @classmethod
    def get_dataframe(cls, dataset_id: str, file_path: str) -> pd.DataFrame:
        """
        Load DataFrame from file with caching support
        
        Args:
            dataset_id: Unique dataset identifier
            file_path: Relative or absolute path to the file
            
        Returns:
            Pandas DataFrame
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file format is unsupported
        """
        # Check cache first
        cache_key = f"{dataset_id}:{file_path}"
        cached_data = cls._get_from_cache(cache_key)
        if cached_data is not None:
            return cached_data
        
        # Build full file path
        full_path = cls._resolve_file_path(file_path)
        
        # Check if file exists
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Dataset file not found: {full_path}")
        
        # Load DataFrame based on file extension
        try:
            df = cls._load_file(full_path)
            
            # Clean DataFrame (handle NaN, strip whitespace, etc.)
            df = cls._clean_dataframe(df)
            
            # Cache the DataFrame
            cls._add_to_cache(cache_key, df)
            
            return df
            
        except Exception as e:
            raise ValueError(f"Failed to read file {file_path}: {str(e)}")
    
    @classmethod
    def _resolve_file_path(cls, file_path: str) -> str:
        """Convert relative path to absolute path"""
        if os.path.isabs(file_path):
            return file_path
        
        # Assume relative to UPLOAD_DIR
        return os.path.join(cls.UPLOAD_DIR, file_path)
    
    @classmethod
    def _load_file(cls, file_path: str) -> pd.DataFrame:
        """Load file based on extension"""
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == '.csv':
            return pd.read_csv(file_path)
        elif file_ext == '.json':
            return pd.read_json(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
    
    @classmethod
    def _clean_dataframe(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Clean DataFrame to prevent JSON serialization issues"""
        # Replace NaN with None (converts to null in JSON)
        df = df.where(pd.notna(df), None)
        
        # Strip whitespace from string columns
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
        
        return df
    
    @classmethod
    def _get_from_cache(cls, cache_key: str) -> Optional[pd.DataFrame]:
        """Retrieve DataFrame from cache if valid"""
        if cache_key not in cls._dataframe_cache:
            return None
        
        cached_item = cls._dataframe_cache[cache_key]
        timestamp = cached_item['timestamp']
        
        # Check if cache is still valid
        age = (datetime.now() - timestamp).total_seconds()
        if age > cls.CACHE_TTL_SECONDS:
            # Cache expired
            del cls._dataframe_cache[cache_key]
            return None
        
        return cached_item['dataframe']
    
    @classmethod
    def _add_to_cache(cls, cache_key: str, df: pd.DataFrame):
        """Add DataFrame to cache"""
        # Enforce cache size limit
        if len(cls._dataframe_cache) >= cls.MAX_CACHE_SIZE:
            # Remove oldest entry
            oldest_key = min(cls._dataframe_cache.keys(), 
                           key=lambda k: cls._dataframe_cache[k]['timestamp'])
            del cls._dataframe_cache[oldest_key]
        
        cls._dataframe_cache[cache_key] = {
            'dataframe': df,
            'timestamp': datetime.now()
        }
    
    @classmethod
    def clear_cache(cls, dataset_id: Optional[str] = None):
        """Clear cache for specific dataset or all"""
        if dataset_id:
            # Remove entries matching dataset_id
            keys_to_remove = [k for k in cls._dataframe_cache.keys() 
                            if k.startswith(f"{dataset_id}:")]
            for key in keys_to_remove:
                del cls._dataframe_cache[key]
        else:
            # Clear entire cache
            cls._dataframe_cache.clear()
    
    @classmethod
    def infer_field_types(cls, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        """
        Infer which columns are dimensions vs measures
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            Tuple of (dimensions, measures)
        """
        dimensions = []
        measures = []
        
        for column in df.columns:
            dtype = df[column].dtype
            unique_count = df[column].nunique()
            total_count = len(df)
            
            # Type inference logic
            if cls._is_measure(column, dtype, unique_count, total_count):
                measures.append(column)
            else:
                dimensions.append(column)
        
        return dimensions, measures
    
    @classmethod
    def _is_measure(cls, column_name: str, dtype, unique_count: int, total_count: int) -> bool:
        """Determine if column is a measure (numeric aggregatable field)"""
        
        # Rule 1: Numeric types are usually measures
        if pd.api.types.is_numeric_dtype(dtype):
            # Exception: If it looks like an ID field
            col_lower = column_name.lower()
            if any(id_keyword in col_lower for id_keyword in ['id', '_id', 'key', 'code']):
                return False
            
            # Exception: If too many unique values (likely an ID)
            if unique_count / total_count > 0.95 and total_count > 100:
                return False
            
            return True
        
        # Rule 2: Check column name patterns for measure keywords
        col_lower = column_name.lower()
        measure_keywords = [
            'amount', 'price', 'cost', 'total', 'sum', 'count', 
            'quantity', 'qty', 'value', 'revenue', 'profit', 
            'sales', 'balance', 'score', 'rating', 'weight', 'height'
        ]
        if any(keyword in col_lower for keyword in measure_keywords):
            return True
        
        return False
    
    @classmethod
    def get_dataframe_info(cls, df: pd.DataFrame) -> dict:
        """Get metadata about DataFrame"""
        return {
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'null_counts': df.isnull().sum().to_dict(),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / (1024 * 1024)
        }
    
    @classmethod
    def validate_fields_exist(cls, df: pd.DataFrame, fields: List[str]) -> Tuple[bool, List[str]]:
        """
        Validate that specified fields exist in DataFrame
        
        Returns:
            (all_valid, missing_fields)
        """
        missing = [field for field in fields if field not in df.columns]
        return len(missing) == 0, missing
