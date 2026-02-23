"""
AI Data Classification Engine - Service Layer
Analyzes datasets and classifies columns using pattern matching and heuristics.
Zero dependencies on FastAPI - Pure business logic.
"""

import pandas as pd
import uuid
import time
import re
from typing import Dict, List, Any, Tuple, Optional
from io import BytesIO


class DataClassifier:
    """
    Core classification engine for detecting PII, sensitive data, and business categories.
    Supports CSV and XLSX formats.
    """
    
    # Classification patterns and metadata
    CLASSIFICATION_PATTERNS = {
        "PII/Sensitive": {
            "patterns": [
                "email", "phone", "ssn", "password", "cin", "passport", 
                "national_id", "tax_id", "social_security", "license", "credential"
            ],
            "sensitivity": "High",
            "icon": "🔒",
            "business_context": "Contains personally identifiable information",
            "recommendations": [
                "Encrypt this column in storage",
                "Apply data masking before exporting",
                "Restrict access to authorized users only",
                "GDPR/Law 09-08 compliance required"
            ]
        },
        "Financial": {
            "patterns": [
                "salary", "price", "amount", "revenue", "card", "payment", 
                "invoice", "balance", "cost", "credit", "debit", "transaction"
            ],
            "sensitivity": "High",
            "icon": "💰",
            "business_context": "Contains financial or monetary data",
            "recommendations": [
                "Apply data masking for non-privileged users",
                "Audit trail required for all modifications",
                "Encrypt at rest and in transit",
                "Monitor for unusual patterns"
            ]
        },
        "Location": {
            "patterns": [
                "address", "city", "country", "zip", "postal", "location", 
                "region", "latitude", "longitude", "coordinates", "place"
            ],
            "sensitivity": "Medium",
            "icon": "📍",
            "business_context": "Contains geographic or location data",
            "recommendations": [
                "Anonymize if not business-critical",
                "Consider geohashing for privacy",
                "Validate format consistency",
                "Use for analytics with caution"
            ]
        },
        "Temporal": {
            "patterns": [
                "date", "created", "updated", "time", "timestamp", "modified", 
                "birth", "expiry", "start", "end", "deadline"
            ],
            "sensitivity": "Low",
            "icon": "🕐",
            "business_context": "Contains time-related information",
            "recommendations": [
                "Use for audit logging",
                "Track data lineage",
                "Standardize timezone handling",
                "Monitor for data freshness"
            ]
        },
        "Contact": {
            "patterns": [
                "name", "first_name", "last_name", "full_name", "username", 
                "contact", "person", "user", "customer"
            ],
            "sensitivity": "Medium",
            "icon": "👤",
            "business_context": "Contains personal contact information",
            "recommendations": [
                "Validate format consistency",
                "Consider anonymization for testing",
                "Apply access controls",
                "Review data retention policies"
            ]
        },
        "Technical": {
            "patterns": [
                "id", "uuid", "key", "token", "hash", "index", "code", 
                "reference", "identifier", "serial"
            ],
            "sensitivity": "Low",
            "icon": "⚡",
            "business_context": "Contains technical identifiers",
            "recommendations": [
                "Index for query performance",
                "Ensure uniqueness constraints",
                "Use for data relationships",
                "Document ID generation logic"
            ]
        },
        "Business": {
            "patterns": [
                "company", "department", "title", "role", "position", 
                "organization", "team", "division", "branch"
            ],
            "sensitivity": "Low",
            "icon": "🏢",
            "business_context": "Contains business organizational data",
            "recommendations": [
                "Standardize naming conventions",
                "Maintain data dictionaries",
                "Use for reporting and analytics",
                "Keep hierarchies up to date"
            ]
        },
        "Metric": {
            "patterns": [
                "count", "total", "score", "rate", "percentage", "quantity", 
                "number", "sum", "average", "value", "measure"
            ],
            "sensitivity": "Low",
            "icon": "📊",
            "business_context": "Contains quantitative measurements",
            "recommendations": [
                "Monitor for anomalies",
                "Set up alerting thresholds",
                "Validate data ranges",
                "Use for KPI tracking"
            ]
        }
    }
    
    def __init__(self, file_bytes: bytes, filename: str):
        """
        Initialize the classifier with file data.
        
        Args:
            file_bytes: Raw file content as bytes
            filename: Original filename (used for format detection)
        """
        self.file_bytes = file_bytes
        self.filename = filename
        self.analysis_id = str(uuid.uuid4())
        self.start_time = time.time()
        self.df: Optional[pd.DataFrame] = None
        
    def analyze(self) -> Dict[str, Any]:
        """
        Main entry point - performs complete analysis and returns results.
        
        Returns:
            Dictionary matching frontend ClassificationResult interface
            
        Raises:
            ValueError: If file format is unsupported or file is empty
            Exception: For pandas parsing errors
        """
        try:
            # Load data into DataFrame
            self._load_dataframe()
            
            # Validate dataset
            if self.df is None or self.df.empty:
                raise ValueError("File contains no data")
            
            if len(self.df.columns) == 0:
                raise ValueError("File contains no columns")
            
            # Classify each column
            classified_columns = []
            categories_count: Dict[str, int] = {}
            sensitivity_count: Dict[str, int] = {}
            total_confidence = 0.0
            
            for col_name in self.df.columns:
                col_data = self.df[col_name]
                classification = self._classify_column(col_name, col_data)
                classified_columns.append(classification)
                
                # Update counters
                category = classification["ai_classification"]["category"]
                sensitivity = classification["ai_classification"]["sensitivity"]
                categories_count[category] = categories_count.get(category, 0) + 1
                sensitivity_count[sensitivity] = sensitivity_count.get(sensitivity, 0) + 1
                total_confidence += classification["ai_classification"]["confidence"]
            
            # Calculate summary statistics
            total_columns = len(self.df.columns)
            pii_columns = sum(1 for col in classified_columns 
                            if col["ai_classification"]["category"] == "PII/Sensitive")
            sensitive_columns = sum(1 for col in classified_columns 
                                  if col["ai_classification"]["sensitivity"] in ["High", "Medium"])
            high_confidence_rate = (total_confidence / total_columns) * 100
            
            # Calculate latency
            latency_ms = int((time.time() - self.start_time) * 1000)
            
            # Build final response
            return {
                "analysis_id": self.analysis_id,
                "file_name": self.filename,
                "latency_ms": latency_ms,
                "dataset_summary": {
                    "total_rows": len(self.df),
                    "total_columns": total_columns,
                    "pii_columns": pii_columns,
                    "sensitive_columns": sensitive_columns,
                    "categories_detected": len(categories_count),
                    "high_confidence_rate": round(high_confidence_rate, 2)
                },
                "columns": classified_columns,
                "classification_summary": {
                    "total_columns_classified": total_columns,
                    "categories_breakdown": categories_count,
                    "sensitivity_breakdown": sensitivity_count
                }
            }
            
        except pd.errors.EmptyDataError:
            raise ValueError("File is empty or contains no parseable data")
        except pd.errors.ParserError as e:
            raise ValueError(f"Failed to parse file: {str(e)}")
        except Exception as e:
            raise Exception(f"Analysis failed: {str(e)}")
    
    def _load_dataframe(self) -> None:
        """
        Loads file bytes into a pandas DataFrame based on file extension.
        
        Raises:
            ValueError: If file format is unsupported
        """
        file_lower = self.filename.lower()
        buffer = BytesIO(self.file_bytes)
        
        if file_lower.endswith('.csv'):
            self.df = pd.read_csv(buffer)
        elif file_lower.endswith(('.xlsx', '.xls')):
            self.df = pd.read_excel(buffer)
        else:
            raise ValueError(f"Unsupported file format. Only CSV and XLSX are supported.")
    
    def _classify_column(self, col_name: str, col_data: pd.Series) -> Dict[str, Any]:
        """
        Classifies a single column using pattern matching and data analysis.
        
        Args:
            col_name: Name of the column
            col_data: pandas Series containing the column data
            
        Returns:
            Dictionary with column name, data type, and AI classification
        """
        # Normalize column name for matching
        normalized_name = self._normalize_column_name(col_name)
        
        # Find best matching category
        category, confidence = self._find_best_category(normalized_name, col_data)
        
        # Get metadata for the category
        category_info = self.CLASSIFICATION_PATTERNS.get(
            category, 
            self.CLASSIFICATION_PATTERNS["Technical"]
        )
        
        # Detect pandas data type
        data_type = str(col_data.dtype)
        
        return {
            "name": col_name,
            "data_type": data_type,
            "ai_classification": {
                "category": category,
                "sensitivity": category_info["sensitivity"],
                "business_context": category_info["business_context"],
                "icon": category_info["icon"],
                "confidence": confidence,
                "recommendations": category_info["recommendations"]
            }
        }
    
    def _find_best_category(self, normalized_name: str, col_data: pd.Series) -> Tuple[str, float]:
        """
        Determines the best matching category and confidence score.
        
        Args:
            normalized_name: Normalized column name
            col_data: Column data for pattern validation
            
        Returns:
            Tuple of (category_name, confidence_score)
        """
        best_category = "Technical"
        best_confidence = 0.60  # Default fallback confidence
        
        for category, info in self.CLASSIFICATION_PATTERNS.items():
            for pattern in info["patterns"]:
                if pattern in normalized_name:
                    # Calculate confidence based on match quality
                    if normalized_name == pattern:
                        # Exact match
                        confidence = 0.95
                    elif normalized_name.startswith(pattern) or normalized_name.endswith(pattern):
                        # Starts or ends with pattern
                        confidence = 0.90
                    else:
                        # Contains pattern
                        confidence = 0.85
                    
                    # Bonus: Validate with data patterns if high-confidence category
                    if category in ["PII/Sensitive", "Financial"] and not col_data.empty:
                        if self._validate_data_pattern(pattern, col_data):
                            confidence += 0.05
                    
                    # Keep best match
                    if confidence > best_confidence:
                        best_category = category
                        best_confidence = min(confidence, 1.0)  # Cap at 1.0
        
        return best_category, round(best_confidence, 2)
    
    def _validate_data_pattern(self, pattern: str, col_data: pd.Series) -> bool:
        """
        Validates if column data matches expected patterns for high-confidence categories.
        
        Args:
            pattern: Pattern keyword (e.g., 'email', 'phone')
            col_data: Column data to validate
            
        Returns:
            True if data matches pattern, False otherwise
        """
        # Sample first 10 non-null values
        sample = col_data.dropna().head(10).astype(str)
        
        if len(sample) == 0:
            return False
        
        # Pattern validation rules
        validators = {
            "email": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            "phone": r'^\+?[\d\s\-\(\)]{7,}$',
            "card": r'^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$',
        }
        
        if pattern in validators:
            regex = validators[pattern]
            matches = sample.str.match(regex, na=False).sum()
            return matches / len(sample) > 0.5  # At least 50% match
        
        return False
    
    def _normalize_column_name(self, col_name: str) -> str:
        """
        Normalizes column name for pattern matching.
        
        Args:
            col_name: Original column name
            
        Returns:
            Normalized lowercase name with underscores
        """
        # Convert to lowercase
        normalized = col_name.lower()
        # Replace spaces with underscores
        normalized = normalized.replace(' ', '_')
        # Remove special characters except underscores
        normalized = re.sub(r'[^a-z0-9_]', '', normalized)
        return normalized


class DataClassifierException(Exception):
    """Custom exception for classifier errors."""
    pass
