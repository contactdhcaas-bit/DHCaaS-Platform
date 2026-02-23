# app/services/aggregation_service.py
"""
Aggregation Service - Data Aggregation Engine
Performs GroupBy operations on Pandas DataFrames for chart generation
"""

import pandas as pd
import numpy as np
from typing import List, Literal
from pydantic import BaseModel


class ChartDataPoint(BaseModel):
    """Single data point for chart rendering"""
    name: str
    value: float


class AggregationService:
    """Service for performing data aggregations"""
    
    SUPPORTED_AGGREGATIONS = ['sum', 'avg', 'count', 'min', 'max']
    MAX_DATA_POINTS = 100  # Limit chart points for performance
    
    @classmethod
    def aggregate_data(
        cls,
        df: pd.DataFrame,
        x_field: str,
        y_field: str,
        aggregation: Literal['sum', 'avg', 'count', 'min', 'max'],
        limit: int = 20
    ) -> List[ChartDataPoint]:
        """
        Perform aggregation on DataFrame
        
        Args:
            df: Pandas DataFrame
            x_field: Column to group by (X-axis)
            y_field: Column to aggregate (Y-axis)
            aggregation: Type of aggregation
            limit: Maximum number of data points
            
        Returns:
            List of ChartDataPoint objects
        """
        # Validate aggregation type
        if aggregation not in cls.SUPPORTED_AGGREGATIONS:
            raise ValueError(f"Unsupported aggregation: {aggregation}")
        
        # Validate fields exist
        if x_field not in df.columns:
            raise ValueError(f"X-field '{x_field}' not found in dataset")
        
        # Special handling for COUNT aggregation (doesn't need Y field)
        if aggregation == 'count':
            result = cls._aggregate_count(df, x_field)
        else:
            if y_field not in df.columns:
                raise ValueError(f"Y-field '{y_field}' not found in dataset")
            result = cls._aggregate_with_y(df, x_field, y_field, aggregation)
        
        # Convert to ChartDataPoint list
        chart_data = cls._convert_to_chart_data(result, limit)
        
        return chart_data
    
    @classmethod
    def _aggregate_count(cls, df: pd.DataFrame, x_field: str) -> pd.DataFrame:
        """Perform COUNT aggregation"""
        result = df.groupby(x_field).size().reset_index(name='value')
        result = result.sort_values('value', ascending=False)
        return result
    
    @classmethod
    def _aggregate_with_y(
        cls, 
        df: pd.DataFrame, 
        x_field: str, 
        y_field: str, 
        aggregation: str
    ) -> pd.DataFrame:
        """Perform aggregation requiring Y field"""
        
        # Ensure Y field is numeric
        if not pd.api.types.is_numeric_dtype(df[y_field]):
            # Try to convert to numeric
            df[y_field] = pd.to_numeric(df[y_field], errors='coerce')
        
        # Remove NaN values in Y field
        df_clean = df[[x_field, y_field]].dropna()
        
        # Perform aggregation
        agg_map = {
            'sum': 'sum',
            'avg': 'mean',
            'min': 'min',
            'max': 'max'
        }
        
        result = df_clean.groupby(x_field)[y_field].agg(agg_map[aggregation]).reset_index()
        result.columns = [x_field, 'value']
        
        # Sort by value descending
        result = result.sort_values('value', ascending=False)
        
        return result
    
    @classmethod
    def _convert_to_chart_data(cls, result: pd.DataFrame, limit: int) -> List[ChartDataPoint]:
        """Convert DataFrame to list of ChartDataPoint"""
        
        # Apply limit
        result = result.head(min(limit, cls.MAX_DATA_POINTS))
        
        chart_data = []
        for _, row in result.iterrows():
            # Get name (first column) and value (second column)
            name = str(row.iloc[0])
            value = float(row.iloc[1])
            
            # Handle NaN values
            if pd.isna(value):
                value = 0.0
            
            # Round to 2 decimal places
            value = round(value, 2)
            
            chart_data.append(ChartDataPoint(name=name, value=value))
        
        return chart_data
    
    @classmethod
    def get_aggregation_summary(cls, df: pd.DataFrame, field: str) -> dict:
        """Get summary statistics for a field"""
        if not pd.api.types.is_numeric_dtype(df[field]):
            df[field] = pd.to_numeric(df[field], errors='coerce')
        
        series = df[field].dropna()
        
        return {
            'count': int(series.count()),
            'sum': float(series.sum()),
            'mean': float(series.mean()),
            'median': float(series.median()),
            'min': float(series.min()),
            'max': float(series.max()),
            'std': float(series.std()),
            'null_count': int(df[field].isnull().sum())
        }
    
    @classmethod
    def get_unique_values(cls, df: pd.DataFrame, field: str, limit: int = 100) -> List[str]:
        """Get unique values for a dimension field"""
        unique_values = df[field].dropna().unique()
        unique_values = [str(val) for val in unique_values[:limit]]
        return sorted(unique_values)
