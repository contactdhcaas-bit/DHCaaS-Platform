"""
Data Privacy & Masking Service
Dynamic data masking for PII protection
"""

import pandas as pd
import re
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class MaskingService:
    """
    Service for applying dynamic data masking to sensitive columns
    Protects PII from unauthorized viewing
    """
    
    # Sensitivity keywords that trigger masking
    SENSITIVE_TAGS = [
        'PII',
        'Sensitivity: High',
        'Sensitivity: Critical',
        'Personal Information',
        'Confidential',
        'Restricted',
        'Email',
        'Phone',
        'SSN',
        'Credit Card',
        'Password',
    ]
    
    def __init__(self):
        """Initialize masking service"""
        logger.info("MaskingService initialized")
    
    def mask_dataset(
        self, 
        df: pd.DataFrame, 
        column_tags: Dict[str, List[str]],
        show_sample: bool = True,
        sample_rows: int = 10
    ) -> Dict[str, Any]:
        """
        Apply dynamic data masking to sensitive columns
        
        Args:
            df: Original DataFrame
            column_tags: Dictionary mapping column names to their AI tags
            show_sample: Whether to return only a sample (default: True for preview)
            sample_rows: Number of rows to return if show_sample=True
            
        Returns:
            Dictionary with masked data and metadata
        """
        logger.info(f"Masking dataset with {len(df)} rows, {len(df.columns)} columns")
        
        # Create a copy to avoid modifying original
        masked_df = df.copy()
        
        # Track masking operations
        masked_columns = []
        masking_summary = {}
        
        # Iterate through columns and apply masking
        for column in masked_df.columns:
            tags = column_tags.get(column, [])
            
            # Check if column should be masked
            if self._should_mask_column(tags):
                mask_type = self._detect_mask_type(column, tags, masked_df[column])
                masked_df[column] = self._apply_masking(masked_df[column], mask_type)
                
                masked_columns.append(column)
                masking_summary[column] = {
                    'mask_type': mask_type,
                    'tags': tags,
                    'values_masked': len(masked_df[column])
                }
                
                logger.info(f"Masked column '{column}' with type '{mask_type}'")
        
        # Return sample if requested
        if show_sample:
            masked_df = masked_df.head(sample_rows)
        
        # Convert to dictionary format
        result = {
            'data': masked_df.to_dict(orient='records'),
            'columns': list(masked_df.columns),
            'total_rows': len(df),
            'displayed_rows': len(masked_df),
            'masked_columns': masked_columns,
            'masking_summary': masking_summary,
            'privacy_applied': True
        }
        
        logger.info(f"Masking complete: {len(masked_columns)} columns masked")
        
        return result
    
    def _should_mask_column(self, tags: List[str]) -> bool:
        """
        Determine if a column should be masked based on tags
        
        Args:
            tags: List of AI-generated tags for the column
            
        Returns:
            True if column should be masked
        """
        for tag in tags:
            for sensitive_tag in self.SENSITIVE_TAGS:
                if sensitive_tag.lower() in tag.lower():
                    return True
        return False
    
    def _detect_mask_type(
        self, 
        column_name: str, 
        tags: List[str], 
        series: pd.Series
    ) -> str:
        """
        Detect the type of masking to apply
        
        Args:
            column_name: Name of the column
            tags: AI tags for the column
            series: Pandas Series to analyze
            
        Returns:
            Mask type: 'email', 'phone', 'ssn', 'credit_card', 'generic'
        """
        # Check tags first
        tags_lower = [t.lower() for t in tags]
        
        if any('email' in t for t in tags_lower):
            return 'email'
        elif any('phone' in t for t in tags_lower):
            return 'phone'
        elif any('ssn' in t for t in tags_lower):
            return 'ssn'
        elif any('credit' in t or 'card' in t for t in tags_lower):
            return 'credit_card'
        
        # Check column name
        column_lower = column_name.lower()
        if 'email' in column_lower or 'mail' in column_lower:
            return 'email'
        elif 'phone' in column_lower or 'tel' in column_lower or 'mobile' in column_lower:
            return 'phone'
        elif 'ssn' in column_lower or 'social' in column_lower:
            return 'ssn'
        elif 'card' in column_lower or 'credit' in column_lower:
            return 'credit_card'
        
        # Check data patterns (sample first non-null value)
        sample_value = None
        for val in series.dropna():
            if pd.notna(val) and str(val).strip():
                sample_value = str(val)
                break
        
        if sample_value:
            # Email pattern
            if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', sample_value):
                return 'email'
            # Phone pattern
            elif re.match(r'^[\d\s\-\(\)]+$', sample_value) and len(re.sub(r'\D', '', sample_value)) >= 10:
                return 'phone'
            # SSN pattern
            elif re.match(r'^\d{3}-\d{2}-\d{4}$', sample_value):
                return 'ssn'
            # Credit card pattern
            elif re.match(r'^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$', sample_value):
                return 'credit_card'
        
        return 'generic'
    
    def _apply_masking(self, series: pd.Series, mask_type: str) -> pd.Series:
        """
        Apply masking logic based on detected type
        
        Args:
            series: Pandas Series to mask
            mask_type: Type of masking to apply
            
        Returns:
            Masked Series
        """
        def mask_value(val):
            if pd.isna(val) or not str(val).strip():
                return val
            
            val_str = str(val)
            
            if mask_type == 'email':
                return self._mask_email(val_str)
            elif mask_type == 'phone':
                return self._mask_phone(val_str)
            elif mask_type == 'ssn':
                return self._mask_ssn(val_str)
            elif mask_type == 'credit_card':
                return self._mask_credit_card(val_str)
            else:
                return self._mask_generic(val_str)
        
        return series.apply(mask_value)
    
    def _mask_email(self, email: str) -> str:
        """
        Mask email address: user@example.com -> u***@example.com
        
        Args:
            email: Email address to mask
            
        Returns:
            Masked email
        """
        try:
            if '@' not in email:
                return '***@***.com'
            
            local, domain = email.split('@', 1)
            if len(local) <= 1:
                masked_local = '*'
            elif len(local) <= 3:
                masked_local = local[0] + '*' * (len(local) - 1)
            else:
                masked_local = local[0] + '***'
            
            return f"{masked_local}@{domain}"
        except Exception:
            return '***@***.com'
    
    def _mask_phone(self, phone: str) -> str:
        """
        Mask phone number: 123-456-7890 -> ***-***-7890
        
        Args:
            phone: Phone number to mask
            
        Returns:
            Masked phone number
        """
        try:
            # Extract digits only
            digits = re.sub(r'\D', '', phone)
            
            if len(digits) < 4:
                return '***-***-****'
            
            # Keep last 4 digits
            last_four = digits[-4:]
            
            # Format based on original structure
            if '-' in phone:
                return f"***-***-{last_four}"
            elif '(' in phone:
                return f"(***) ***-{last_four}"
            elif ' ' in phone:
                return f"*** *** {last_four}"
            else:
                return f"******{last_four}"
        except Exception:
            return '***-***-****'
    
    def _mask_ssn(self, ssn: str) -> str:
        """
        Mask SSN: 123-45-6789 -> ***-**-6789
        
        Args:
            ssn: SSN to mask
            
        Returns:
            Masked SSN
        """
        try:
            # Extract digits
            digits = re.sub(r'\D', '', ssn)
            
            if len(digits) < 4:
                return '***-**-****'
            
            # Keep last 4 digits
            last_four = digits[-4:]
            return f"***-**-{last_four}"
        except Exception:
            return '***-**-****'
    
    def _mask_credit_card(self, card: str) -> str:
        """
        Mask credit card: 1234 5678 9012 3456 -> **** **** **** 3456
        
        Args:
            card: Credit card number to mask
            
        Returns:
            Masked credit card
        """
        try:
            # Extract digits
            digits = re.sub(r'\D', '', card)
            
            if len(digits) < 4:
                return '**** **** **** ****'
            
            # Keep last 4 digits
            last_four = digits[-4:]
            
            # Format based on original structure
            if '-' in card:
                return f"****-****-****-{last_four}"
            elif ' ' in card:
                return f"**** **** **** {last_four}"
            else:
                return f"************{last_four}"
        except Exception:
            return '**** **** **** ****'
    
    def _mask_generic(self, value: str) -> str:
        """
        Generic masking: Show first and last character, mask middle
        
        Args:
            value: Value to mask
            
        Returns:
            Masked value
        """
        if len(value) <= 2:
            return '*' * len(value)
        elif len(value) <= 4:
            return value[0] + '*' * (len(value) - 1)
        else:
            return value[0] + '*' * (len(value) - 2) + value[-1]
    
    def unmask_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Unmask data (for authorized users only)
        In production, this should check user permissions
        
        Args:
            df: Masked DataFrame
            
        Returns:
            Original unmasked DataFrame
        """
        # In production, implement permission checking here
        logger.warning("Unmasking requested - ensure user has proper authorization")
        return df


# Singleton instance
_masking_service_instance = None


def get_masking_service() -> MaskingService:
    """Get singleton instance of MaskingService"""
    global _masking_service_instance
    if _masking_service_instance is None:
        _masking_service_instance = MaskingService()
    return _masking_service_instance
