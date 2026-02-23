"""
Scan Executor Service
Executes data quality and PII scans on various data sources
"""

import pandas as pd
import os
from typing import Dict, Any
from datetime import datetime

from app.services.data_quality import DataQualityAnalyzer
from app.services.pii_detector import PIIDetector


class ScanExecutor:
    """
    Executes scans on data sources
    """

    def __init__(self):
        self.quality_analyzer = DataQualityAnalyzer()
        self.pii_detector = PIIDetector()

    async def execute(
        self,
        source_type: str,
        source_config: Dict[str, Any],
        scan_options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a scan based on source type and configuration

        Args:
            source_type: Type of data source (csv, database, api)
            source_config: Configuration for the data source
            scan_options: Options for the scan (include_quality, include_pii, etc.)

        Returns:
            Dictionary containing scan results
        """
        start_time = datetime.utcnow()

        # Load data based on source type
        if source_type == "csv":
            df = await self._load_csv(source_config)
        elif source_type == "database":
            df = await self._load_database(source_config)
        elif source_type == "api":
            df = await self._load_api(source_config)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

        # Apply sample size if specified
        sample_size = scan_options.get("sample_size")
        if sample_size and sample_size < len(df):
            df = df.sample(n=sample_size, random_state=42)

        # Initialize results
        results = {
            "source_id": source_config.get("filepath", "unknown"),
            "source_type": source_type,
            "quality_metrics": {},
            "pii_detections": [],
            "errors": [],
            "warnings": [],
            "scan_duration_seconds": 0
        }

        try:
            # Run quality analysis if enabled
            if scan_options.get("include_quality", True):
                quality_results = self.quality_analyzer.analyze(
                    df,
                    source_id=source_config.get("filepath", "unknown")
                )
                results["quality_metrics"] = quality_results

            # Run PII detection if enabled
            if scan_options.get("include_pii", True):
                # Convert DataFrame to list of dictionaries for PII detection
                data_records = df.to_dict('records')
                pii_columns = self.pii_detector.detect_pii_columns(data_records)
                
                # Get comprehensive PII scan results
                pii_scan_results = self.pii_detector.scan_dataset(data_records)
                
                results["pii_detections"] = {
                    "pii_columns": pii_columns,
                    "pii_types_found": pii_scan_results.get("pii_types_found", []),
                    "total_pii_instances": pii_scan_results.get("total_pii_instances", 0),
                    "risk_level": pii_scan_results.get("risk_level", "none")
                }

        except Exception as e:
            results["errors"].append(str(e))
            raise

        finally:
            # Calculate duration
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            results["scan_duration_seconds"] = duration

        return results

    async def _load_csv(self, config: Dict[str, Any]) -> pd.DataFrame:
        """
        Load data from CSV file

        Args:
            config: Configuration containing filepath and delimiter

        Returns:
            Pandas DataFrame
        """
        filepath = config.get("filepath")
        delimiter = config.get("delimiter", ",")

        if not filepath:
            raise ValueError("filepath is required for CSV source")

        # Check if file exists
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"CSV file not found: {filepath}")

        # Load CSV
        try:
            df = pd.read_csv(filepath, delimiter=delimiter)
            print(f"✅ Loaded CSV: {len(df)} rows, {len(df.columns)} columns")
            return df
        except Exception as e:
            raise Exception(f"Failed to load CSV file: {str(e)}")

    async def _load_database(self, config: Dict[str, Any]) -> pd.DataFrame:
        """
        Load data from database (not implemented yet)

        Args:
            config: Configuration containing connection string and query

        Returns:
            Pandas DataFrame
        """
        raise NotImplementedError("Database source not yet implemented")

    async def _load_api(self, config: Dict[str, Any]) -> pd.DataFrame:
        """
        Load data from API (not implemented yet)

        Args:
            config: Configuration containing API endpoint and parameters

        Returns:
            Pandas DataFrame
        """
        raise NotImplementedError("API source not yet implemented")
