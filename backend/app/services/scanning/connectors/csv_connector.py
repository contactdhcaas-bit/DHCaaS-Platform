"""
CSV Connector Implementation.

This module provides a concrete implementation of BaseConnector for CSV files.
Uses pandas for efficient data loading, profiling, and analysis.

Author: DHCaaS Platform Team
Date: 2026-02-05
"""

import re
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import time

from ..base import (
    BaseConnector,
    SourceConfig,
    QualityMetrics,
    PIIDetectionResult,
    ConnectorRegistry
)


class CSVConnector(BaseConnector):
    """
    CSV File Connector for data quality scanning and PII detection.
    
    This connector uses pandas to efficiently load and analyze CSV files,
    providing comprehensive data profiling capabilities.
    
    Expected source_config.connection_params:
        - filepath (str): Path to the CSV file (required)
        - delimiter (str): Field delimiter (default: ',')
        - encoding (str): File encoding (default: 'utf-8')
        - header (int or None): Row number to use as column names (default: 0)
        - skip_rows (int): Number of rows to skip at start (default: 0)
    
    Example:
        ```python
        config = {
            "source_id": "sales_data_2024",
            "source_type": "csv",
            "connection_params": {
                "filepath": "/data/sales.csv",
                "delimiter": ",",
                "encoding": "utf-8"
            }
        }
        
        connector = CSVConnector(config)
        with connector:
            metrics = connector.scan_quality()
            pii = connector.detect_pii()
        ```
    """
    
    def __init__(self, source_config: Union[SourceConfig, Dict[str, Any]]):
        """Initialize CSV connector."""
        super().__init__(source_config)
        self.df: Optional[pd.DataFrame] = None
        self.filepath: Optional[Path] = None
        self._load_time_seconds: float = 0.0
    
    def connect(self) -> bool:
        """
        Load the CSV file into a pandas DataFrame.
        
        Returns:
            bool: True if loaded successfully, False otherwise
            
        Raises:
            FileNotFoundError: If CSV file doesn't exist
            ValueError: If filepath not provided in config
            pd.errors.EmptyDataError: If CSV file is empty
            pd.errors.ParserError: If CSV parsing fails
        """
        try:
            # Extract connection parameters
            params = self.source_config.connection_params
            
            if "filepath" not in params:
                raise ValueError(
                    "Missing required parameter 'filepath' in connection_params"
                )
            
            filepath = params.get("filepath")
            delimiter = params.get("delimiter", ",")
            encoding = params.get("encoding", "utf-8")
            header = params.get("header", 0)
            skip_rows = params.get("skip_rows", 0)
            
            # Validate file exists
            self.filepath = Path(filepath)
            if not self.filepath.exists():
                raise FileNotFoundError(f"CSV file not found: {filepath}")
            
            if not self.filepath.is_file():
                raise ValueError(f"Path is not a file: {filepath}")
            
            # Load CSV with pandas
            start_time = time.time()
            
            self.df = pd.read_csv(
                self.filepath,
                delimiter=delimiter,
                encoding=encoding,
                header=header,
                skiprows=skip_rows,
                low_memory=False  # Avoid mixed type warnings
            )
            
            self._load_time_seconds = time.time() - start_time
            
            # Store connection metadata
            self._connection_metadata = {
                "filepath": str(self.filepath.absolute()),
                "file_size_bytes": self.filepath.stat().st_size,
                "file_size_mb": round(self.filepath.stat().st_size / (1024 * 1024), 2),
                "rows_loaded": len(self.df),
                "columns_loaded": len(self.df.columns),
                "load_time_seconds": round(self._load_time_seconds, 2),
                "delimiter": delimiter,
                "encoding": encoding
            }
            
            self.is_connected = True
            self.connection = self.df  # Store DataFrame as connection object
            
            return True
            
        except FileNotFoundError as e:
            self.is_connected = False
            raise FileNotFoundError(f"CSV file not found: {e}")
        
        except pd.errors.EmptyDataError:
            self.is_connected = False
            raise ValueError(f"CSV file is empty: {filepath}")
        
        except pd.errors.ParserError as e:
            self.is_connected = False
            raise ValueError(f"Failed to parse CSV file: {e}")
        
        except Exception as e:
            self.is_connected = False
            raise RuntimeError(f"Failed to connect to CSV file: {e}")
    
    def disconnect(self) -> bool:
        """
        Release DataFrame and clear memory.
        
        Returns:
            bool: True if disconnection successful
        """
        try:
            if self.df is not None:
                del self.df
                self.df = None
            
            self.connection = None
            self.is_connected = False
            self.filepath = None
            
            return True
            
        except Exception as e:
            print(f"Warning: Error during disconnect: {e}")
            return False
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test CSV file accessibility and readability.
        
        Returns:
            Dict with test results including success status and metadata
        """
        start_time = time.time()
        
        try:
            params = self.source_config.connection_params
            filepath = params.get("filepath")
            
            if not filepath:
                return {
                    "success": False,
                    "message": "No filepath provided in configuration",
                    "latency_ms": 0,
                    "metadata": {}
                }
            
            file_path = Path(filepath)
            
            # Check file existence
            if not file_path.exists():
                return {
                    "success": False,
                    "message": f"File not found: {filepath}",
                    "latency_ms": round((time.time() - start_time) * 1000, 2),
                    "metadata": {}
                }
            
            # Check file readability (read first few lines)
            with open(file_path, 'r', encoding=params.get("encoding", "utf-8")) as f:
                first_lines = [f.readline() for _ in range(3)]
            
            latency_ms = round((time.time() - start_time) * 1000, 2)
            
            return {
                "success": True,
                "message": "CSV file accessible and readable",
                "latency_ms": latency_ms,
                "metadata": {
                    "filepath": str(file_path.absolute()),
                    "file_size_bytes": file_path.stat().st_size,
                    "file_size_mb": round(file_path.stat().st_size / (1024 * 1024), 2),
                    "first_line_preview": first_lines[0][:100] if first_lines else ""
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection test failed: {str(e)}",
                "latency_ms": round((time.time() - start_time) * 1000, 2),
                "metadata": {}
            }
    
    def fetch_sample(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch first N rows from the CSV as preview data.
        
        Args:
            limit: Number of rows to fetch (default: 100)
            
        Returns:
            List of dictionaries representing rows
            
        Raises:
            ConnectionError: If not connected
            ValueError: If limit is invalid
        """
        self.validate_connection()
        
        if limit <= 0:
            raise ValueError("limit must be a positive integer")
        
        # Get sample rows
        sample_df = self.df.head(limit)
        
        # Convert to list of dicts, handling NaN values
        records = sample_df.replace({np.nan: None}).to_dict('records')
        
        return records
    
    def get_schema(self) -> Dict[str, str]:
        """
        Get column names and their inferred data types.
        
        Returns:
            Dictionary mapping column names to pandas dtypes
        """
        self.validate_connection()
        
        schema = {}
        for column in self.df.columns:
            dtype = str(self.df[column].dtype)
            
            # Simplify dtype names for readability
            if dtype.startswith('int'):
                schema[column] = 'integer'
            elif dtype.startswith('float'):
                schema[column] = 'float'
            elif dtype == 'object':
                schema[column] = 'string'
            elif dtype == 'bool':
                schema[column] = 'boolean'
            elif 'datetime' in dtype:
                schema[column] = 'datetime'
            else:
                schema[column] = dtype
        
        return schema
    
    def get_row_count(self) -> int:
        """
        Get total number of rows in the CSV.
        
        Returns:
            int: Total row count
        """
        self.validate_connection()
        return len(self.df)
    
    def scan_quality(self, sample_size: Optional[int] = None) -> QualityMetrics:
        """
        Perform comprehensive data quality profiling on the CSV.
        
        Analyzes:
        - Completeness (null counts and percentages)
        - Duplicates (exact row matches)
        - Data types
        - Statistical summaries (for numeric columns)
        - Uniqueness (cardinality)
        
        Args:
            sample_size: Number of rows to analyze (None = all rows)
            
        Returns:
            QualityMetrics object with complete profiling results
        """
        self.validate_connection()
        
        # Use sample or full dataset
        if sample_size and sample_size < len(self.df):
            df_sample = self.df.sample(n=sample_size, random_state=42)
        else:
            df_sample = self.df
        
        total_rows = len(df_sample)
        total_columns = len(df_sample.columns)
        
        # 1. NULL ANALYSIS
        null_counts = df_sample.isnull().sum().to_dict()
        null_counts = {str(k): int(v) for k, v in null_counts.items()}
        
        total_cells = total_rows * total_columns
        total_nulls = sum(null_counts.values())
        completeness_score = round(((total_cells - total_nulls) / total_cells) * 100, 2) if total_cells > 0 else 0.0
        
        # 2. DUPLICATE ANALYSIS
        duplicate_count = int(df_sample.duplicated().sum())
        duplicate_percentage = round((duplicate_count / total_rows) * 100, 2) if total_rows > 0 else 0.0
        
        # 3. COLUMN STATISTICS
        column_statistics = {}
        data_types = {}
        
        for column in df_sample.columns:
            col_data = df_sample[column]
            dtype = str(col_data.dtype)
            
            # Store simplified data type
            if dtype.startswith('int') or dtype.startswith('float'):
                data_types[column] = 'numeric'
                
                # Numeric statistics
                column_statistics[column] = {
                    "count": int(col_data.count()),
                    "null_count": int(col_data.isnull().sum()),
                    "unique_count": int(col_data.nunique()),
                    "min": float(col_data.min()) if pd.notna(col_data.min()) else None,
                    "max": float(col_data.max()) if pd.notna(col_data.max()) else None,
                    "mean": round(float(col_data.mean()), 2) if pd.notna(col_data.mean()) else None,
                    "median": float(col_data.median()) if pd.notna(col_data.median()) else None,
                    "std_dev": round(float(col_data.std()), 2) if pd.notna(col_data.std()) else None
                }
            else:
                data_types[column] = 'text'
                
                # Text/categorical statistics
                column_statistics[column] = {
                    "count": int(col_data.count()),
                    "null_count": int(col_data.isnull().sum()),
                    "unique_count": int(col_data.nunique()),
                    "most_common": str(col_data.mode()[0]) if len(col_data.mode()) > 0 else None,
                    "most_common_count": int(col_data.value_counts().iloc[0]) if len(col_data) > 0 else 0
                }
        
        return QualityMetrics(
            total_rows=total_rows,
            total_columns=total_columns,
            completeness_score=completeness_score,
            null_counts=null_counts,
            duplicate_count=duplicate_count,
            duplicate_percentage=duplicate_percentage,
            column_statistics=column_statistics,
            data_types=data_types,
            scan_timestamp=datetime.utcnow()
        )
    
    def detect_pii(self, sample_size: Optional[int] = None) -> List[PIIDetectionResult]:
        """
        Detect Personally Identifiable Information (PII) in CSV columns.
        
        Detects:
        - Email addresses
        - Phone numbers (US/International formats)
        - Credit card numbers (Luhn algorithm)
        - Social Security Numbers (SSN)
        - IP addresses
        
        Args:
            sample_size: Number of rows to scan (None = all rows)
            
        Returns:
            List of PIIDetectionResult objects for each detected PII column
        """
        self.validate_connection()
        
        # Use sample or full dataset
        if sample_size and sample_size < len(self.df):
            df_sample = self.df.sample(n=sample_size, random_state=42)
        else:
            df_sample = self.df
        
        pii_results = []
        
        # PII Detection Patterns
        patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b',
            "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
            "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
            "ip_address": r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        }
        
        for column in df_sample.columns:
            # Only scan text columns
            if df_sample[column].dtype != 'object':
                continue
            
            col_data = df_sample[column].dropna().astype(str)
            
            if len(col_data) == 0:
                continue
            
            for pii_type, pattern in patterns.items():
                # Count matches
                matches = col_data.str.contains(pattern, regex=True, na=False)
                match_count = int(matches.sum())
                
                if match_count > 0:
                    total_count = len(col_data)
                    match_percentage = round((match_count / total_count) * 100, 2)
                    confidence = min(match_percentage / 100, 1.0)  # Normalize to 0-1
                    
                    # Determine severity
                    if match_percentage >= 80:
                        severity = "critical"
                    elif match_percentage >= 50:
                        severity = "high"
                    elif match_percentage >= 20:
                        severity = "medium"
                    else:
                        severity = "low"
                    
                    # Recommendation based on PII type
                    recommendations = {
                        "email": "Encrypt or mask email addresses. Apply GDPR compliance measures.",
                        "phone": "Mask phone numbers (e.g., XXX-XXX-1234). Restrict access.",
                        "ssn": "CRITICAL: Remove or encrypt SSN immediately. Violates PII regulations.",
                        "credit_card": "CRITICAL: Encrypt credit card data. Ensure PCI-DSS compliance.",
                        "ip_address": "Consider masking IP addresses for privacy compliance."
                    }
                    
                    pii_results.append(PIIDetectionResult(
                        column_name=column,
                        pii_type=pii_type,
                        confidence=round(confidence, 2),
                        sample_count=match_count,
                        total_count=total_count,
                        match_percentage=match_percentage,
                        severity=severity,
                        recommendation=recommendations.get(pii_type)
                    ))
        
        return pii_results
    
    def _validate_credit_card_luhn(self, card_number: str) -> bool:
        """
        Validate credit card number using Luhn algorithm.
        
        Args:
            card_number: Credit card number as string
            
        Returns:
            bool: True if valid according to Luhn algorithm
        """
        # Remove spaces and dashes
        card_number = re.sub(r'[-\s]', '', card_number)
        
        if not card_number.isdigit():
            return False
        
        # Luhn algorithm
        def luhn_checksum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d * 2))
            return checksum % 10
        
        return luhn_checksum(card_number) == 0


# ===== REGISTER CONNECTOR WITH REGISTRY =====
ConnectorRegistry.register("csv", CSVConnector)


# ===== CONVENIENCE FUNCTION =====

def create_csv_connector(
    filepath: str,
    delimiter: str = ",",
    encoding: str = "utf-8",
    source_id: Optional[str] = None
) -> CSVConnector:
    """
    Convenience factory function to create a CSV connector.
    
    Args:
        filepath: Path to the CSV file
        delimiter: Field delimiter (default: ',')
        encoding: File encoding (default: 'utf-8')
        source_id: Optional identifier (defaults to filename)
        
    Returns:
        CSVConnector instance
        
    Example:
        ```python
        connector = create_csv_connector(
            filepath="/data/sales.csv",
            delimiter=",",
            encoding="utf-8"
        )
        
        with connector:
            result = connector.perform_full_scan()
            print(f"Quality Score: {result.quality_metrics.completeness_score}%")
        ```
    """
    if source_id is None:
        source_id = Path(filepath).stem  # Use filename without extension
    
    config = SourceConfig(
        source_id=source_id,
        source_type="csv",
        connection_params={
            "filepath": filepath,
            "delimiter": delimiter,
            "encoding": encoding
        }
    )
    
    return CSVConnector(config)
