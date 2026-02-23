"""
AI-Powered Data Classification Service
Competes with Informatica CLAIRE AI
Automatically tags and classifies data columns based on intelligent rule-based engine
"""

import re
from typing import Dict, List, Any, Optional
from datetime import datetime


class AIClassifier:
    """
    Intelligent Rule-Based AI Engine for automatic data classification.
    Analyzes column names and sample data to assign business context tags.
    """
    
    # Classification Rules Configuration
    FINANCIAL_PATTERNS = [
        'price', 'amount', 'salary', 'revenue', 'cost', 'fee', 'charge',
        'payment', 'balance', 'income', 'expense', 'profit', 'loss',
        'budget', 'invoice', 'total', 'subtotal', 'tax', 'discount',
        'wage', 'commission', 'bonus', 'refund', 'credit', 'debit'
    ]
    
    LOCATION_PATTERNS = [
        'city', 'country', 'zip', 'postal', 'lat', 'latitude', 'lon',
        'longitude', 'address', 'street', 'state', 'province', 'region',
        'location', 'geo', 'territory', 'area', 'zone', 'district',
        'county', 'municipality', 'coordinates', 'place'
    ]
    
    TECHNICAL_PATTERNS = [
        'id', 'key', 'guid', 'uuid', 'ip', 'mac', 'hash', 'token',
        'index', 'ref', 'reference', 'pointer', 'pk', 'fk', 'code',
        'identifier', 'serial', 'sequence', 'version', 'revision'
    ]
    
    PII_SENSITIVE_PATTERNS = [
        'email', 'phone', 'mobile', 'ssn', 'social_security', 'password',
        'passport', 'license', 'driver', 'credit_card', 'card_number',
        'account_number', 'bank', 'routing', 'pin', 'security',
        'username', 'login', 'credential', 'birth_date', 'dob',
        'personal', 'private', 'confidential', 'medical', 'health'
    ]
    
    TEMPORAL_PATTERNS = [
        'date', 'time', 'timestamp', 'datetime', 'created', 'updated',
        'modified', 'deleted', 'scheduled', 'due', 'start', 'end',
        'expired', 'valid', 'year', 'month', 'day', 'hour', 'minute'
    ]
    
    CONTACT_PATTERNS = [
        'name', 'first_name', 'last_name', 'full_name', 'contact',
        'customer', 'client', 'vendor', 'supplier', 'employee',
        'person', 'user', 'member', 'subscriber'
    ]
    
    BUSINESS_PATTERNS = [
        'product', 'service', 'order', 'transaction', 'sale', 'purchase',
        'inventory', 'stock', 'sku', 'category', 'department', 'division',
        'company', 'organization', 'business', 'merchant', 'brand'
    ]
    
    METRIC_PATTERNS = [
        'count', 'total', 'sum', 'average', 'mean', 'median', 'max',
        'min', 'rate', 'ratio', 'percentage', 'score', 'rank',
        'quantity', 'volume', 'weight', 'size', 'length', 'width'
    ]
    
    def __init__(self):
        """Initialize the AI Classifier."""
        self.classification_history = []
    
    def classify_schema(
        self, 
        columns: List[Dict[str, Any]], 
        sample_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Main classification function - analyzes columns and returns tags.
        
        Args:
            columns: List of column dictionaries with 'name' and optional metadata
            sample_data: Optional list of sample data rows for content analysis
        
        Returns:
            Dictionary mapping column names to their classification tags
            
        Example:
            {
                'email': {
                    'category': 'PII/Sensitive',
                    'sensitivity': 'High',
                    'business_context': 'Contact Information',
                    'data_type': 'Email Address',
                    'icon': '🔒',
                    'confidence': 0.95
                }
            }
        """
        classifications = {}
        
        for column in columns:
            column_name = column.get('name', '').lower()
            data_type = column.get('data_type', 'unknown')
            
            # Get sample values if available
            sample_values = self._extract_sample_values(column_name, sample_data)
            
            # Classify the column
            tags = self._classify_column(column_name, data_type, sample_values)
            
            classifications[column.get('name')] = tags
        
        # Store classification history for analytics
        self._record_classification(classifications)
        
        return classifications
    
    def _classify_column(
        self, 
        column_name: str, 
        data_type: str, 
        sample_values: List[Any]
    ) -> Dict[str, Any]:
        """
        Core classification logic for a single column.
        
        Args:
            column_name: Lowercase column name
            data_type: Data type of the column
            sample_values: Sample values from the column
        
        Returns:
            Classification tags dictionary
        """
        tags = {
            'category': 'General',
            'sensitivity': 'Low',
            'business_context': 'Operational Data',
            'data_type': data_type,
            'icon': '📊',
            'confidence': 0.5,
            'patterns_matched': [],
            'recommendations': []
        }
        
        # Priority 1: PII/Sensitive (Highest Security)
        if self._matches_patterns(column_name, self.PII_SENSITIVE_PATTERNS):
            tags.update({
                'category': 'PII/Sensitive',
                'sensitivity': 'High',
                'business_context': 'Personal Identifiable Information',
                'icon': '🔒',
                'confidence': 0.95,
                'patterns_matched': self._get_matched_patterns(column_name, self.PII_SENSITIVE_PATTERNS),
                'recommendations': [
                    'Enable encryption at rest',
                    'Apply access controls',
                    'Monitor for data leakage',
                    'Consider data masking for non-prod environments'
                ]
            })
            return tags
        
        # Priority 2: Financial Data
        if self._matches_patterns(column_name, self.FINANCIAL_PATTERNS):
            tags.update({
                'category': 'Financial',
                'sensitivity': 'High',
                'business_context': 'Financial/Monetary Data',
                'icon': '💰',
                'confidence': 0.90,
                'patterns_matched': self._get_matched_patterns(column_name, self.FINANCIAL_PATTERNS),
                'recommendations': [
                    'Implement audit logging',
                    'Validate numeric precision',
                    'Apply currency formatting rules'
                ]
            })
            return tags
        
        # Priority 3: Location/Geographic
        if self._matches_patterns(column_name, self.LOCATION_PATTERNS):
            tags.update({
                'category': 'Location',
                'sensitivity': 'Medium',
                'business_context': 'Geographic/Location Data',
                'icon': '🌍',
                'confidence': 0.88,
                'patterns_matched': self._get_matched_patterns(column_name, self.LOCATION_PATTERNS),
                'recommendations': [
                    'Validate geographic coordinates',
                    'Standardize address formats',
                    'Enable geocoding capabilities'
                ]
            })
            return tags
        
        # Priority 4: Technical/System
        if self._matches_patterns(column_name, self.TECHNICAL_PATTERNS):
            tags.update({
                'category': 'Technical',
                'sensitivity': 'Low',
                'business_context': 'System/Technical Identifier',
                'icon': '⚙️',
                'confidence': 0.92,
                'patterns_matched': self._get_matched_patterns(column_name, self.TECHNICAL_PATTERNS),
                'recommendations': [
                    'Ensure uniqueness constraints',
                    'Index for query performance',
                    'Validate format consistency'
                ]
            })
            return tags
        
        # Priority 5: Temporal Data
        if self._matches_patterns(column_name, self.TEMPORAL_PATTERNS):
            tags.update({
                'category': 'Temporal',
                'sensitivity': 'Low',
                'business_context': 'Date/Time Information',
                'icon': '📅',
                'confidence': 0.87,
                'patterns_matched': self._get_matched_patterns(column_name, self.TEMPORAL_PATTERNS),
                'recommendations': [
                    'Standardize timezone handling',
                    'Validate date ranges',
                    'Apply consistent date formats'
                ]
            })
            return tags
        
        # Priority 6: Contact Information
        if self._matches_patterns(column_name, self.CONTACT_PATTERNS):
            tags.update({
                'category': 'Contact',
                'sensitivity': 'Medium',
                'business_context': 'Contact/Identity Information',
                'icon': '👤',
                'confidence': 0.85,
                'patterns_matched': self._get_matched_patterns(column_name, self.CONTACT_PATTERNS),
                'recommendations': [
                    'Apply name standardization',
                    'Enable fuzzy matching',
                    'Consider deduplication'
                ]
            })
            return tags
        
        # Priority 7: Business Domain
        if self._matches_patterns(column_name, self.BUSINESS_PATTERNS):
            tags.update({
                'category': 'Business',
                'sensitivity': 'Low',
                'business_context': 'Business Domain Data',
                'icon': '🏢',
                'confidence': 0.82,
                'patterns_matched': self._get_matched_patterns(column_name, self.BUSINESS_PATTERNS),
                'recommendations': [
                    'Maintain referential integrity',
                    'Apply business rules validation',
                    'Enable business glossary linking'
                ]
            })
            return tags
        
        # Priority 8: Metrics/Measurements
        if self._matches_patterns(column_name, self.METRIC_PATTERNS):
            tags.update({
                'category': 'Metric',
                'sensitivity': 'Low',
                'business_context': 'Measurement/Statistical Data',
                'icon': '📈',
                'confidence': 0.80,
                'patterns_matched': self._get_matched_patterns(column_name, self.METRIC_PATTERNS),
                'recommendations': [
                    'Validate numeric ranges',
                    'Apply statistical analysis',
                    'Enable trend monitoring'
                ]
            })
            return tags
        
        # Content-based classification (if sample data available)
        if sample_values:
            content_tags = self._classify_by_content(sample_values)
            if content_tags['confidence'] > tags['confidence']:
                tags.update(content_tags)
        
        return tags
    
    def _matches_patterns(self, column_name: str, patterns: List[str]) -> bool:
        """Check if column name matches any pattern in the list."""
        for pattern in patterns:
            if pattern in column_name or column_name in pattern:
                return True
        return False
    
    def _get_matched_patterns(self, column_name: str, patterns: List[str]) -> List[str]:
        """Get list of patterns that matched the column name."""
        matched = []
        for pattern in patterns:
            if pattern in column_name or column_name in pattern:
                matched.append(pattern)
        return matched
    
    def _extract_sample_values(
        self, 
        column_name: str, 
        sample_data: Optional[List[Dict[str, Any]]]
    ) -> List[Any]:
        """Extract sample values for a specific column from sample data."""
        if not sample_data:
            return []
        
        values = []
        for row in sample_data[:10]:  # Analyze up to 10 sample rows
            if column_name in row:
                values.append(row[column_name])
        
        return values
    
    def _classify_by_content(self, sample_values: List[Any]) -> Dict[str, Any]:
        """
        Classify column based on actual data content.
        Uses pattern matching on sample values.
        """
        tags = {
            'category': 'General',
            'sensitivity': 'Low',
            'confidence': 0.5
        }
        
        if not sample_values:
            return tags
        
        # Convert to strings for pattern matching
        str_values = [str(v) for v in sample_values if v is not None]
        
        if not str_values:
            return tags
        
        # Email pattern detection
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        email_matches = sum(1 for v in str_values if re.match(email_pattern, v))
        if email_matches / len(str_values) > 0.7:
            return {
                'category': 'PII/Sensitive',
                'sensitivity': 'High',
                'business_context': 'Email Address',
                'icon': '📧',
                'confidence': 0.95,
                'patterns_matched': ['email_format'],
                'recommendations': ['Validate email format', 'Enable email verification']
            }
        
        # Phone number pattern
        phone_pattern = r'^\+?[\d\s\-\(\)]{10,}$'
        phone_matches = sum(1 for v in str_values if re.match(phone_pattern, v))
        if phone_matches / len(str_values) > 0.7:
            return {
                'category': 'PII/Sensitive',
                'sensitivity': 'High',
                'business_context': 'Phone Number',
                'icon': '📱',
                'confidence': 0.93,
                'patterns_matched': ['phone_format'],
                'recommendations': ['Standardize phone format', 'Validate country codes']
            }
        
        # URL pattern
        url_pattern = r'^https?://'
        url_matches = sum(1 for v in str_values if re.match(url_pattern, v))
        if url_matches / len(str_values) > 0.7:
            return {
                'category': 'Technical',
                'sensitivity': 'Low',
                'business_context': 'URL/Web Address',
                'icon': '🔗',
                'confidence': 0.90,
                'patterns_matched': ['url_format'],
                'recommendations': ['Validate URL accessibility', 'Check for broken links']
            }
        
        # Numeric currency values
        try:
            numeric_values = [float(v) for v in str_values if self._is_numeric(v)]
            if len(numeric_values) / len(str_values) > 0.8:
                # Check if values look like currency (reasonable ranges)
                if any(v > 0.01 and v < 1000000 for v in numeric_values):
                    return {
                        'category': 'Financial',
                        'sensitivity': 'High',
                        'business_context': 'Monetary Value',
                        'icon': '💵',
                        'confidence': 0.85,
                        'patterns_matched': ['numeric_currency_range'],
                        'recommendations': ['Apply currency formatting', 'Validate precision']
                    }
        except:
            pass
        
        return tags
    
    def _is_numeric(self, value: str) -> bool:
        """Check if a string value can be converted to a number."""
        try:
            float(value)
            return True
        except:
            return False
    
    def _record_classification(self, classifications: Dict[str, Any]):
        """Record classification for analytics and learning."""
        self.classification_history.append({
            'timestamp': datetime.now().isoformat(),
            'total_columns': len(classifications),
            'categories': self._summarize_categories(classifications)
        })
    
    def _summarize_categories(self, classifications: Dict[str, Any]) -> Dict[str, int]:
        """Summarize classification results by category."""
        summary = {}
        for column, tags in classifications.items():
            category = tags.get('category', 'General')
            summary[category] = summary.get(category, 0) + 1
        return summary
    
    def get_classification_summary(self, classifications: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary report of classifications.
        
        Returns:
            Summary statistics and insights
        """
        total_columns = len(classifications)
        
        # Count by category
        category_counts = {}
        sensitivity_counts = {'High': 0, 'Medium': 0, 'Low': 0}
        high_confidence_count = 0
        
        for column, tags in classifications.items():
            category = tags.get('category', 'General')
            category_counts[category] = category_counts.get(category, 0) + 1
            
            sensitivity = tags.get('sensitivity', 'Low')
            sensitivity_counts[sensitivity] = sensitivity_counts.get(sensitivity, 0) + 1
            
            if tags.get('confidence', 0) >= 0.85:
                high_confidence_count += 1
        
        return {
            'total_columns_classified': total_columns,
            'categories_breakdown': category_counts,
            'sensitivity_breakdown': sensitivity_counts,
            'high_confidence_classifications': high_confidence_count,
            'confidence_rate': (high_confidence_count / total_columns * 100) if total_columns > 0 else 0,
            'recommendations_generated': sum(len(tags.get('recommendations', [])) for tags in classifications.values())
        }


# Singleton instance
_classifier_instance = None

def get_classifier() -> AIClassifier:
    """Get or create the AI Classifier singleton instance."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = AIClassifier()
    return _classifier_instance


def classify_schema(
    columns: List[Dict[str, Any]], 
    sample_data: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Convenience function to classify schema.
    
    Args:
        columns: List of column dictionaries
        sample_data: Optional sample data for content analysis
    
    Returns:
        Classification results dictionary
    """
    classifier = get_classifier()
    return classifier.classify_schema(columns, sample_data)
