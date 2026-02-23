"""
Data Quality Analyzer Service
Analyzes data quality metrics for datasets
"""

import pandas as pd
from typing import Dict, Any


class DataQualityAnalyzer:
    """
    Analyzes data quality metrics including completeness, accuracy, consistency, etc.
    """
    
    def analyze(self, df: pd.DataFrame, source_id: str) -> Dict[str, Any]:
        """
        Analyze data quality metrics for a dataframe
        
        Args:
            df: Pandas DataFrame to analyze
            source_id: Identifier for the data source
            
        Returns:
            Dictionary containing quality metrics
        """
        total_rows = len(df)
        total_columns = len(df.columns)
        
        # Calculate null counts per column
        null_counts = df.isnull().sum().to_dict()
        
        # Calculate completeness score (percentage of non-null values)
        total_cells = total_rows * total_columns
        null_cells = df.isnull().sum().sum()
        completeness_score = ((total_cells - null_cells) / total_cells * 100) if total_cells > 0 else 0
        
        # Detect duplicates
        duplicate_count = df.duplicated().sum()
        duplicate_percentage = (duplicate_count / total_rows * 100) if total_rows > 0 else 0
        
        # Column data types
        column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        return {
            "source_id": source_id,
            "total_rows": int(total_rows),
            "total_columns": int(total_columns),
            "completeness_score": float(completeness_score),
            "null_counts": {k: int(v) for k, v in null_counts.items()},
            "total_null_cells": int(null_cells),
            "duplicate_count": int(duplicate_count),
            "duplicate_percentage": float(duplicate_percentage),
            "column_types": column_types,
        }
