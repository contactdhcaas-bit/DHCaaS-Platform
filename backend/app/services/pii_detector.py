"""
PII Detector Service
Detects Personally Identifiable Information in data
"""

import re
from typing import List, Dict, Any


class PIIDetector:
    """Detect PII in data columns"""
    
    def __init__(self):
        self.pii_patterns = {
            'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            'phone': r'\+?[\d\s\-\(\)]{10,}',
            'ssn': r'\d{3}-\d{2}-\d{4}',
            'credit_card': r'\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}',
        }
    
    def detect_pii_columns(self, data: List[Dict[str, Any]]) -> List[str]:
        """
        Detect columns containing PII
        
        Args:
            data: List of dictionaries representing rows
            
        Returns:
            List of column names containing PII
        """
        if not data:
            return []
        
        pii_columns = set()
        
        # Check first 100 rows
        sample_data = data[:100]
        
        for row in sample_data:
            for column, value in row.items():
                if self._is_pii(str(value)):
                    pii_columns.add(column)
        
        return list(pii_columns)
    
    def _is_pii(self, value: str) -> bool:
        """Check if a value contains PII"""
        for pattern_type, pattern in self.pii_patterns.items():
            if re.search(pattern, value):
                return True
        return False
    
    def detect_pii(self, text: str) -> List[str]:
        """
        Detect PII types in a text string
        
        Args:
            text: Text to analyze
            
        Returns:
            List of detected PII types (e.g., ['email', 'phone'])
        """
        detected_types = []
        
        for pii_type, pattern in self.pii_patterns.items():
            if re.search(pattern, str(text)):
                detected_types.append(pii_type)
        
        return detected_types
    
    def detect_pii_in_value(self, value: Any) -> Dict[str, bool]:
        """
        Detect all PII types in a single value
        
        Args:
            value: Value to check for PII
            
        Returns:
            Dictionary with PII type as key and detection status as value
        """
        text = str(value)
        results = {}
        
        for pii_type, pattern in self.pii_patterns.items():
            results[pii_type] = bool(re.search(pattern, text))
        
        return results
    
    def scan_dataset(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Comprehensive PII scan of entire dataset
        
        Args:
            data: List of dictionaries representing rows
            
        Returns:
            Dictionary with scan results including:
            - pii_columns: List of columns containing PII
            - pii_types_found: List of PII types detected
            - total_pii_instances: Count of PII occurrences
            - risk_level: Overall PII risk level
        """
        if not data:
            return {
                'pii_columns': [],
                'pii_types_found': [],
                'total_pii_instances': 0,
                'risk_level': 'none'
            }
        
        pii_columns = set()
        pii_types_found = set()
        total_pii_instances = 0
        
        # Scan all data
        for row in data:
            for column, value in row.items():
                detected_types = self.detect_pii(str(value))
                if detected_types:
                    pii_columns.add(column)
                    pii_types_found.update(detected_types)
                    total_pii_instances += len(detected_types)
        
        # Determine risk level
        if total_pii_instances == 0:
            risk_level = 'none'
        elif total_pii_instances < 10:
            risk_level = 'low'
        elif total_pii_instances < 50:
            risk_level = 'medium'
        elif total_pii_instances < 100:
            risk_level = 'high'
        else:
            risk_level = 'critical'
        
        return {
            'pii_columns': list(pii_columns),
            'pii_types_found': list(pii_types_found),
            'total_pii_instances': total_pii_instances,
            'risk_level': risk_level
        }
