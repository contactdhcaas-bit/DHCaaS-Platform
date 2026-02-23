"""
Base Connector for Data Source Scanning.

This module defines the abstract base class for all data source connectors.
Following Clean Architecture and Open/Closed Principle, this allows extending
the system with new connector types without modifying existing code.

Author: DHCaaS Platform Team
Date: 2026-02-05
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field


# ===== DATA MODELS =====

class SourceConfig(BaseModel):
    """Configuration model for data source connection."""
    
    source_id: str = Field(..., description="Unique identifier for the data source")
    source_type: str = Field(..., description="Type of data source (csv, sql, api, etc.)")
    connection_params: Dict[str, Any] = Field(
        default_factory=dict,
        description="Connection parameters specific to source type"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metadata about the source"
    )


class QualityMetrics(BaseModel):
    """Data quality metrics result model."""
    
    total_rows: int = Field(..., description="Total number of rows scanned")
    total_columns: int = Field(..., description="Total number of columns")
    completeness_score: float = Field(..., ge=0.0, le=100.0, description="Percentage of non-null values")
    null_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Null count per column"
    )
    duplicate_count: int = Field(default=0, description="Number of duplicate rows")
    duplicate_percentage: float = Field(default=0.0, ge=0.0, le=100.0, description="Percentage of duplicates")
    column_statistics: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Statistical summary per column (min, max, mean, etc.)"
    )
    data_types: Dict[str, str] = Field(
        default_factory=dict,
        description="Detected data type per column"
    )
    scan_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the scan was performed"
    )


class PIIDetectionResult(BaseModel):
    """PII (Personally Identifiable Information) detection result."""
    
    column_name: str = Field(..., description="Name of the column containing PII")
    pii_type: str = Field(..., description="Type of PII detected (email, phone, ssn, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of detection")
    sample_count: int = Field(..., description="Number of samples that match PII pattern")
    total_count: int = Field(..., description="Total non-null values in column")
    match_percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of matches")
    severity: str = Field(..., description="Risk severity (critical, high, medium, low)")
    recommendation: Optional[str] = Field(
        None,
        description="Recommended action (encrypt, mask, remove, etc.)"
    )


class ScanResult(BaseModel):
    """Complete scan result including quality and PII detection."""
    
    source_id: str
    source_type: str
    quality_metrics: QualityMetrics
    pii_detections: List[PIIDetectionResult]
    errors: List[str] = Field(default_factory=list, description="Any errors encountered during scan")
    warnings: List[str] = Field(default_factory=list, description="Warnings during scan")
    scan_duration_seconds: float = Field(..., description="Time taken to complete scan")


# ===== BASE CONNECTOR ABSTRACT CLASS =====

class BaseConnector(ABC):
    """
    Abstract Base Class for all data source connectors.
    
    This class defines the contract that all concrete connectors must implement.
    Each connector type (CSV, SQL, API, etc.) should inherit from this class
    and provide implementations for all abstract methods.
    
    Design Principles:
    - Open/Closed Principle: Open for extension (new connectors), closed for modification
    - Interface Segregation: Each method has a single, well-defined purpose
    - Dependency Inversion: Depend on abstractions, not concrete implementations
    
    Attributes:
        source_config (SourceConfig): Configuration for the data source
        is_connected (bool): Connection status flag
        connection: Optional connection object (specific to connector type)
    """
    
    def __init__(self, source_config: Union[SourceConfig, Dict[str, Any]]):
        """
        Initialize the base connector.
        
        Args:
            source_config: Configuration object or dictionary for the data source
        """
        if isinstance(source_config, dict):
            self.source_config = SourceConfig(**source_config)
        else:
            self.source_config = source_config
        
        self.is_connected: bool = False
        self.connection: Optional[Any] = None
        self._connection_metadata: Dict[str, Any] = {}
    
    # ===== ABSTRACT METHODS (MUST BE IMPLEMENTED BY SUBCLASSES) =====
    
    @abstractmethod
    def connect(self) -> bool:
        """
        Establish connection to the data source.
        
        This method should:
        1. Validate connection parameters from source_config
        2. Attempt to establish connection
        3. Set self.is_connected flag
        4. Store connection object in self.connection
        5. Handle connection errors gracefully
        
        Returns:
            bool: True if connection successful, False otherwise
            
        Raises:
            ConnectionError: If connection fails critically
            ValueError: If configuration is invalid
            
        Example:
            ```python
            connector = CSVConnector(source_config)
            if connector.connect():
                print("Connected successfully!")
            ```
        """
        pass
    
    @abstractmethod
    def disconnect(self) -> bool:
        """
        Close connection to the data source.
        
        This method should:
        1. Close any open connections/file handles
        2. Clean up resources
        3. Set self.is_connected to False
        4. Clear self.connection
        
        Returns:
            bool: True if disconnection successful, False otherwise
        """
        pass
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection without performing a full scan.
        
        This is a lightweight operation to verify connectivity and credentials.
        
        Returns:
            Dict containing:
                - success (bool): Whether test passed
                - message (str): Human-readable status message
                - latency_ms (float): Connection latency in milliseconds
                - metadata (dict): Any additional connection info
                
        Example:
            ```python
            result = connector.test_connection()
            if result["success"]:
                print(f"Connection OK (latency: {result['latency_ms']}ms)")
            ```
        """
        pass
    
    @abstractmethod
    def fetch_sample(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch a sample of rows from the data source for preview.
        
        This method should:
        1. Ensure connection is established
        2. Retrieve up to 'limit' rows
        3. Return data as list of dictionaries (column -> value)
        4. Handle pagination if necessary
        
        Args:
            limit: Maximum number of rows to fetch (default: 100)
            
        Returns:
            List of dictionaries, where each dict represents a row
            
        Raises:
            ConnectionError: If not connected
            ValueError: If limit is invalid
            
        Example:
            ```python
            sample = connector.fetch_sample(limit=50)
            print(f"Fetched {len(sample)} rows")
            print(sample)  # First row
            ```
        """
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, str]:
        """
        Retrieve schema information (column names and data types).
        
        Returns:
            Dictionary mapping column names to data types
            
        Example:
            ```python
            schema = connector.get_schema()
            # {"customer_id": "integer", "email": "string", "age": "integer"}
            ```
        """
        pass
    
    @abstractmethod
    def get_row_count(self) -> int:
        """
        Get total number of rows in the data source.
        
        Returns:
            int: Total row count
            
        Raises:
            ConnectionError: If not connected
        """
        pass
    
    @abstractmethod
    def scan_quality(self, sample_size: Optional[int] = None) -> QualityMetrics:
        """
        Perform comprehensive data quality profiling.
        
        This is the CORE scanning logic that analyzes:
        - Completeness (null counts, missing data percentage)
        - Duplicates (exact row duplicates)
        - Data types (inferred types per column)
        - Statistical summary (min, max, mean, median for numeric columns)
        - Uniqueness (cardinality per column)
        - Validity (pattern matching, range checks)
        
        Args:
            sample_size: Number of rows to analyze (None = all rows)
            
        Returns:
            QualityMetrics object containing all quality measurements
            
        Raises:
            ConnectionError: If not connected
            RuntimeError: If scan fails
            
        Example:
            ```python
            metrics = connector.scan_quality(sample_size=10000)
            print(f"Completeness: {metrics.completeness_score}%")
            print(f"Duplicates: {metrics.duplicate_count}")
            ```
        """
        pass
    
    @abstractmethod
    def detect_pii(self, sample_size: Optional[int] = None) -> List[PIIDetectionResult]:
        """
        Detect Personally Identifiable Information (PII) in the data.
        
        This method scans for sensitive data patterns:
        - Email addresses (regex: user@domain.com)
        - Phone numbers (various formats)
        - Social Security Numbers (SSN)
        - Credit card numbers
        - IP addresses
        - Names (using NLP/heuristics)
        - Addresses
        
        Args:
            sample_size: Number of rows to scan (None = all rows)
            
        Returns:
            List of PIIDetectionResult objects, one per detected PII column
            
        Raises:
            ConnectionError: If not connected
            
        Example:
            ```python
            pii_results = connector.detect_pii(sample_size=5000)
            for result in pii_results:
                print(f"Found {result.pii_type} in column {result.column_name}")
                print(f"  Confidence: {result.confidence * 100}%")
                print(f"  Severity: {result.severity}")
            ```
        """
        pass
    
    # ===== CONCRETE HELPER METHODS (SHARED ACROSS ALL CONNECTORS) =====
    
    def validate_connection(self) -> None:
        """
        Validate that connection is established before operations.
        
        Raises:
            ConnectionError: If not connected
        """
        if not self.is_connected or self.connection is None:
            raise ConnectionError(
                f"Not connected to {self.source_config.source_type} source. "
                f"Call connect() first."
            )
    
    def perform_full_scan(
        self,
        include_quality: bool = True,
        include_pii: bool = True,
        sample_size: Optional[int] = None
    ) -> ScanResult:
        """
        Perform a complete scan including quality profiling and PII detection.
        
        This is a convenience method that orchestrates the full scan workflow.
        
        Args:
            include_quality: Whether to run quality profiling (default: True)
            include_pii: Whether to run PII detection (default: True)
            sample_size: Number of rows to analyze (None = all rows)
            
        Returns:
            ScanResult object containing all scan results
            
        Example:
            ```python
            result = connector.perform_full_scan(sample_size=10000)
            print(f"Quality Score: {result.quality_metrics.completeness_score}")
            print(f"PII Found: {len(result.pii_detections)} columns")
            ```
        """
        from time import time
        
        self.validate_connection()
        
        start_time = time()
        errors: List[str] = []
        warnings: List[str] = []
        
        # Initialize default results
        quality_metrics: Optional[QualityMetrics] = None
        pii_detections: List[PIIDetectionResult] = []
        
        # Quality Profiling
        if include_quality:
            try:
                quality_metrics = self.scan_quality(sample_size=sample_size)
            except Exception as e:
                errors.append(f"Quality scan failed: {str(e)}")
                # Provide default metrics on failure
                quality_metrics = QualityMetrics(
                    total_rows=0,
                    total_columns=0,
                    completeness_score=0.0
                )
        
        # PII Detection
        if include_pii:
            try:
                pii_detections = self.detect_pii(sample_size=sample_size)
                if pii_detections:
                    warnings.append(
                        f"Found PII in {len(pii_detections)} column(s). "
                        f"Review security measures."
                    )
            except Exception as e:
                errors.append(f"PII detection failed: {str(e)}")
        
        scan_duration = time() - start_time
        
        return ScanResult(
            source_id=self.source_config.source_id,
            source_type=self.source_config.source_type,
            quality_metrics=quality_metrics,
            pii_detections=pii_detections,
            errors=errors,
            warnings=warnings,
            scan_duration_seconds=round(scan_duration, 2)
        )
    
    def get_connection_metadata(self) -> Dict[str, Any]:
        """
        Retrieve metadata about the current connection.
        
        Returns:
            Dictionary containing connection metadata
        """
        return {
            "source_id": self.source_config.source_id,
            "source_type": self.source_config.source_type,
            "is_connected": self.is_connected,
            "connection_params": self.source_config.connection_params,
            **self._connection_metadata
        }
    
    def __enter__(self):
        """Context manager entry: establish connection."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit: close connection."""
        self.disconnect()
    
    def __repr__(self) -> str:
        """String representation of the connector."""
        status = "connected" if self.is_connected else "disconnected"
        return (
            f"<{self.__class__.__name__} "
            f"source_id={self.source_config.source_id} "
            f"type={self.source_config.source_type} "
            f"status={status}>"
        )


# ===== CONNECTOR REGISTRY =====

class ConnectorRegistry:
    """
    Registry for managing available connector types.
    
    This allows dynamic registration and retrieval of connector classes,
    supporting the plugin architecture for adding new data sources.
    """
    
    _connectors: Dict[str, type] = {}
    
    @classmethod
    def register(cls, source_type: str, connector_class: type) -> None:
        """
        Register a new connector type.
        
        Args:
            source_type: Identifier for the source type (e.g., "csv", "mysql")
            connector_class: The connector class (must inherit from BaseConnector)
            
        Raises:
            ValueError: If connector doesn't inherit from BaseConnector
        """
        if not issubclass(connector_class, BaseConnector):
            raise ValueError(
                f"{connector_class.__name__} must inherit from BaseConnector"
            )
        cls._connectors[source_type.lower()] = connector_class
    
    @classmethod
    def get_connector(cls, source_type: str) -> Optional[type]:
        """
        Retrieve a connector class by source type.
        
        Args:
            source_type: The source type identifier
            
        Returns:
            Connector class or None if not found
        """
        return cls._connectors.get(source_type.lower())
    
    @classmethod
    def list_connectors(cls) -> List[str]:
        """
        List all registered connector types.
        
        Returns:
            List of source type identifiers
        """
        return list(cls._connectors.keys())
    
    @classmethod
    def create_connector(
        cls,
        source_type: str,
        source_config: Union[SourceConfig, Dict[str, Any]]
    ) -> BaseConnector:
        """
        Factory method to create a connector instance.
        
        Args:
            source_type: The source type identifier
            source_config: Configuration for the connector
            
        Returns:
            Instantiated connector
            
        Raises:
            ValueError: If source_type is not registered
        """
        connector_class = cls.get_connector(source_type)
        if connector_class is None:
            available = ", ".join(cls.list_connectors())
            raise ValueError(
                f"Unknown source type: {source_type}. "
                f"Available types: {available}"
            )
        return connector_class(source_config)
