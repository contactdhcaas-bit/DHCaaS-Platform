"""
DHCaaS - Enterprise Data Quality Scanner
Advanced validation engine with comprehensive quality metrics
"""

import pandas as pd
import numpy as np
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import hashlib


# ==========================================
# CONFIGURATION
# ==========================================

EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'
PHONE_REGEX = r'^\+?1?\d{9,15}$'

# Column name patterns for auto-detection
EMAIL_PATTERNS = ['email', 'e-mail', 'mail', 'email_address', 'user_email']
PHONE_PATTERNS = ['phone', 'telephone', 'mobile', 'cell', 'contact']
ID_PATTERNS = ['id', '_id', 'identifier', 'customer_id', 'user_id', 'transaction_id']
PRICE_PATTERNS = ['price', 'amount', 'cost', 'fee', 'charge', 'balance', 'salary']
AGE_PATTERNS = ['age', 'years', 'year_old']


# ==========================================
# UTILITY FUNCTIONS
# ==========================================

def detect_column_type(column_name: str, patterns: List[str]) -> bool:
    """Check if column name matches any pattern (case-insensitive)"""
    column_lower = column_name.lower().strip()
    return any(pattern in column_lower for pattern in patterns)


def is_email_column(column_name: str) -> bool:
    """Detect if column contains emails based on name"""
    return detect_column_type(column_name, EMAIL_PATTERNS)


def is_phone_column(column_name: str) -> bool:
    """Detect if column contains phone numbers based on name"""
    return detect_column_type(column_name, PHONE_PATTERNS)


def is_id_column(column_name: str) -> bool:
    """Detect if column is an ID field based on name"""
    return detect_column_type(column_name, ID_PATTERNS)


def is_price_column(column_name: str) -> bool:
    """Detect if column contains prices/amounts"""
    return detect_column_type(column_name, PRICE_PATTERNS)


def is_age_column(column_name: str) -> bool:
    """Detect if column contains age values"""
    return detect_column_type(column_name, AGE_PATTERNS)


# ==========================================
# CORE VALIDATION FUNCTIONS
# ==========================================

def validate_emails(series: pd.Series, column_name: str) -> Dict[str, Any]:
    """
    Validate email addresses using regex
    
    Returns:
        dict: {
            'total': int,
            'valid': int,
            'invalid': int,
            'invalid_percentage': float,
            'sample_invalid': List[str]
        }
    """
    # Remove null values
    non_null = series.dropna()
    total = len(non_null)
    
    if total == 0:
        return {
            'column': column_name,
            'total': 0,
            'valid': 0,
            'invalid': 0,
            'invalid_percentage': 0.0,
            'sample_invalid': []
        }
    
    # Validate emails
    valid_mask = non_null.astype(str).str.match(EMAIL_REGEX, na=False)
    valid_count = valid_mask.sum()
    invalid_count = total - valid_count
    
    # Get sample of invalid emails (max 5)
    if invalid_count > 0:
        invalid_emails = non_null[~valid_mask].head(5).tolist()
    else:
        invalid_emails = []
    
    return {
        'column': column_name,
        'total': total,
        'valid': int(valid_count),
        'invalid': int(invalid_count),
        'invalid_percentage': round((invalid_count / total) * 100, 2),
        'sample_invalid': [str(e) for e in invalid_emails]
    }


def validate_phone_numbers(series: pd.Series, column_name: str) -> Dict[str, Any]:
    """
    Validate phone numbers using regex
    
    Returns:
        dict: Phone validation results
    """
    non_null = series.dropna()
    total = len(non_null)
    
    if total == 0:
        return {
            'column': column_name,
            'total': 0,
            'valid': 0,
            'invalid': 0,
            'invalid_percentage': 0.0
        }
    
    # Clean phone numbers (remove spaces, dashes, parentheses)
    cleaned = non_null.astype(str).str.replace(r'[\s\-\(\)]', '', regex=True)
    valid_mask = cleaned.str.match(PHONE_REGEX, na=False)
    valid_count = valid_mask.sum()
    invalid_count = total - valid_count
    
    return {
        'column': column_name,
        'total': total,
        'valid': int(valid_count),
        'invalid': int(invalid_count),
        'invalid_percentage': round((invalid_count / total) * 100, 2)
    }


def check_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Check for duplicate rows across entire dataset
    
    Returns:
        dict: Duplicate analysis
    """
    total_rows = len(df)
    duplicate_mask = df.duplicated(keep='first')
    duplicate_count = duplicate_mask.sum()
    
    # Get sample of duplicate rows
    if duplicate_count > 0:
        sample_duplicates = df[duplicate_mask].head(3).to_dict('records')
    else:
        sample_duplicates = []
    
    return {
        'total_rows': total_rows,
        'duplicate_rows': int(duplicate_count),
        'duplicate_percentage': round((duplicate_count / total_rows) * 100, 2),
        'sample_duplicates': sample_duplicates
    }


def check_id_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Check for duplicate IDs in ID columns
    
    Returns:
        dict: ID duplicate analysis by column
    """
    id_duplicate_results = {}
    
    for column in df.columns:
        if is_id_column(column):
            non_null = df[column].dropna()
            total = len(non_null)
            
            if total == 0:
                continue
            
            duplicate_mask = non_null.duplicated(keep='first')
            duplicate_count = duplicate_mask.sum()
            
            if duplicate_count > 0:
                id_duplicate_results[column] = {
                    'total': total,
                    'duplicates': int(duplicate_count),
                    'duplicate_percentage': round((duplicate_count / total) * 100, 2),
                    'unique_values': int(non_null.nunique())
                }
    
    return id_duplicate_results


def check_negative_values(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Check for negative values in columns where they shouldn't exist
    (prices, ages, counts, etc.)
    
    Returns:
        dict: Negative value analysis by column
    """
    negative_results = {}
    
    for column in df.columns:
        # Check numeric columns that should be positive
        if df[column].dtype in ['int64', 'float64']:
            should_check = (
                is_price_column(column) or 
                is_age_column(column) or
                'count' in column.lower() or
                'quantity' in column.lower()
            )
            
            if should_check:
                non_null = df[column].dropna()
                total = len(non_null)
                
                if total == 0:
                    continue
                
                negative_mask = non_null < 0
                negative_count = negative_mask.sum()
                
                if negative_count > 0:
                    negative_results[column] = {
                        'total': total,
                        'negative_count': int(negative_count),
                        'negative_percentage': round((negative_count / total) * 100, 2),
                        'min_value': float(non_null.min()),
                        'sample_negative': non_null[negative_mask].head(5).tolist()
                    }
    
    return negative_results


def check_consistency(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Check for inconsistent formatting in categorical columns
    (mixed capitalization, extra spaces, etc.)
    
    Returns:
        dict: Consistency issues by column
    """
    consistency_results = {}
    
    for column in df.columns:
        # Check string/object columns
        if df[column].dtype == 'object':
            non_null = df[column].dropna()
            total = len(non_null)
            
            if total == 0 or total > 10000:  # Skip very large columns
                continue
            
            # Convert to string
            string_values = non_null.astype(str)
            
            # Check for mixed capitalization
            unique_values = string_values.unique()
            
            if len(unique_values) > 100:  # Skip high-cardinality columns
                continue
            
            # Normalize to lowercase and check if original had variations
            normalized = string_values.str.lower().str.strip()
            normalized_unique = normalized.unique()
            
            # If normalized count is less, we have inconsistencies
            if len(normalized_unique) < len(unique_values):
                inconsistent_ratio = (len(unique_values) - len(normalized_unique)) / len(unique_values)
                
                if inconsistent_ratio > 0.1:  # More than 10% inconsistency
                    # Find examples
                    examples = {}
                    for norm_val in list(normalized_unique)[:5]:
                        variations = string_values[normalized == norm_val].unique().tolist()
                        if len(variations) > 1:
                            examples[norm_val] = variations[:5]
                    
                    consistency_results[column] = {
                        'total_unique': len(unique_values),
                        'normalized_unique': len(normalized_unique),
                        'inconsistency_rate': round(inconsistent_ratio * 100, 2),
                        'examples': examples
                    }
    
    return consistency_results


def check_outliers_iqr(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Detect statistical outliers using IQR method
    
    Returns:
        dict: Outlier analysis by numeric column
    """
    outlier_results = {}
    
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    
    for column in numeric_columns:
        non_null = df[column].dropna()
        
        if len(non_null) < 10:  # Need minimum data
            continue
        
        Q1 = non_null.quantile(0.25)
        Q3 = non_null.quantile(0.75)
        IQR = Q3 - Q1
        
        # Define outlier bounds
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers_mask = (non_null < lower_bound) | (non_null > upper_bound)
        outlier_count = outliers_mask.sum()
        
        if outlier_count > 0:
            outlier_results[column] = {
                'total': len(non_null),
                'outlier_count': int(outlier_count),
                'outlier_percentage': round((outlier_count / len(non_null)) * 100, 2),
                'lower_bound': float(lower_bound),
                'upper_bound': float(upper_bound),
                'min_outlier': float(non_null[outliers_mask].min()),
                'max_outlier': float(non_null[outliers_mask].max())
            }
    
    return outlier_results


def check_null_values(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Comprehensive null value analysis
    
    Returns:
        dict: Null analysis by column
    """
    null_results = {}
    
    for column in df.columns:
        null_count = df[column].isnull().sum()
        total = len(df)
        
        if null_count > 0:
            null_results[column] = {
                'null_count': int(null_count),
                'total': total,
                'null_percentage': round((null_count / total) * 100, 2)
            }
    
    return null_results


# ==========================================
# MAIN SCANNER FUNCTION
# ==========================================

def scan_dataframe(df: pd.DataFrame, filename: str) -> Dict[str, Any]:
    """
    Perform comprehensive data quality scan on a DataFrame
    
    Args:
        df (pd.DataFrame): Input dataframe to scan
        filename (str): Name of the source file
    
    Returns:
        dict: Comprehensive scan results with advanced metrics
    """
    start_time = datetime.now()
    
    # Basic metadata
    total_rows = len(df)
    total_columns = len(df.columns)
    
    # 1. NULL VALUE ANALYSIS
    null_analysis = check_null_values(df)
    
    # 2. DUPLICATE ANALYSIS
    duplicate_analysis = check_duplicates(df)
    id_duplicate_analysis = check_id_duplicates(df)
    
    # 3. EMAIL VALIDATION
    email_validations = []
    for column in df.columns:
        if is_email_column(column):
            email_result = validate_emails(df[column], column)
            if email_result['total'] > 0:
                email_validations.append(email_result)
    
    # 4. PHONE VALIDATION
    phone_validations = []
    for column in df.columns:
        if is_phone_column(column):
            phone_result = validate_phone_numbers(df[column], column)
            if phone_result['total'] > 0:
                phone_validations.append(phone_result)
    
    # 5. NEGATIVE VALUE CHECK
    negative_analysis = check_negative_values(df)
    
    # 6. CONSISTENCY CHECK
    consistency_analysis = check_consistency(df)
    
    # 7. OUTLIER DETECTION
    outlier_analysis = check_outliers_iqr(df)
    
    # 8. PII DETECTION (Basic)
    pii_detected = False
    pii_columns = []
    
    for column in df.columns:
        if is_email_column(column) or is_phone_column(column):
            pii_detected = True
            pii_columns.append(column)
    
    # 9. CALCULATE QUALITY SCORE
    score_components = {
        'completeness': 100,
        'validity': 100,
        'uniqueness': 100,
        'consistency': 100,
        'accuracy': 100
    }
    
    # Deduct for nulls
    if null_analysis:
        avg_null_pct = sum(v['null_percentage'] for v in null_analysis.values()) / len(null_analysis)
        score_components['completeness'] = max(0, 100 - avg_null_pct)
    
    # Deduct for invalid emails
    if email_validations:
        avg_invalid_email_pct = sum(v['invalid_percentage'] for v in email_validations) / len(email_validations)
        score_components['validity'] -= min(20, avg_invalid_email_pct)
    
    # Deduct for duplicates
    if duplicate_analysis['duplicate_percentage'] > 0:
        score_components['uniqueness'] -= min(30, duplicate_analysis['duplicate_percentage'] * 2)
    
    # Deduct for inconsistencies
    if consistency_analysis:
        avg_inconsistency = sum(v['inconsistency_rate'] for v in consistency_analysis.values()) / len(consistency_analysis)
        score_components['consistency'] -= min(20, avg_inconsistency)
    
    # Deduct for negative values
    if negative_analysis:
        score_components['accuracy'] -= min(15, len(negative_analysis) * 5)
    
    # Overall score (weighted average)
    overall_score = round(
        (score_components['completeness'] * 0.25 +
         score_components['validity'] * 0.20 +
         score_components['uniqueness'] * 0.20 +
         score_components['consistency'] * 0.15 +
         score_components['accuracy'] * 0.20),
        1
    )
    
    # 10. BUILD ISSUES LIST
    issues = []
    columns_with_issues = []
    
    # Null issues
    for col, data in null_analysis.items():
        if data['null_percentage'] > 5:
            issues.append(f"Missing values in '{col}' column ({data['null_count']} rows - {data['null_percentage']}%)")
            if col not in columns_with_issues:
                columns_with_issues.append(col)
    
    # Email issues
    for email_data in email_validations:
        if email_data['invalid'] > 0:
            issues.append(f"Invalid email format in '{email_data['column']}' column ({email_data['invalid']} rows - {email_data['invalid_percentage']}%)")
            if email_data['column'] not in columns_with_issues:
                columns_with_issues.append(email_data['column'])
    
    # Duplicate issues
    if duplicate_analysis['duplicate_rows'] > 0:
        issues.append(f"Duplicate rows detected ({duplicate_analysis['duplicate_rows']} duplicates - {duplicate_analysis['duplicate_percentage']}%)")
    
    # ID duplicate issues
    for col, data in id_duplicate_analysis.items():
        issues.append(f"Duplicate IDs in '{col}' column ({data['duplicates']} duplicates)")
        if col not in columns_with_issues:
            columns_with_issues.append(col)
    
    # Negative value issues
    for col, data in negative_analysis.items():
        issues.append(f"Negative values in '{col}' column ({data['negative_count']} rows - {data['negative_percentage']}%)")
        if col not in columns_with_issues:
            columns_with_issues.append(col)
    
    # Consistency issues
    for col, data in consistency_analysis.items():
        issues.append(f"Inconsistent formatting in '{col}' column ({data['inconsistency_rate']}% variance)")
        if col not in columns_with_issues:
            columns_with_issues.append(col)
    
    # 11. PROCESSING TIME
    end_time = datetime.now()
    processing_time = (end_time - start_time).total_seconds()
    
    # 12. BUILD FINAL RESULT
    scan_result = {
        "filename": filename,
        "scan_date": datetime.now().strftime('%Y-%m-%d'),
        "scan_timestamp": datetime.now().isoformat(),
        "processing_time": round(processing_time, 2),
        
        "rows": total_rows,
        "columns": total_columns,
        "score": overall_score,
        "pii_detected": pii_detected,
        "pii_columns": pii_columns,
        
        "score_breakdown": score_components,
        
        "issues": issues,
        "columns_with_issues": columns_with_issues,
        
        "advanced_metrics": {
            "duplicates": {
                "row_duplicates": duplicate_analysis['duplicate_rows'],
                "row_duplicate_percentage": duplicate_analysis['duplicate_percentage'],
                "id_duplicates": id_duplicate_analysis
            },
            "validity": {
                "emails": email_validations,
                "phones": phone_validations
            },
            "negative_values": negative_analysis,
            "inconsistent_formats": list(consistency_analysis.keys()),
            "consistency_details": consistency_analysis,
            "outliers": outlier_analysis,
            "null_values": null_analysis
        },
        
        "column_names": df.columns.tolist(),
        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()}
    }
    
    return scan_result


# ==========================================
# CONVENIENCE FUNCTIONS
# ==========================================

def scan_csv_file(file_path: str) -> Dict[str, Any]:
    """Scan a CSV file"""
    df = pd.read_csv(file_path)
    filename = file_path.split('/')[-1]
    return scan_dataframe(df, filename)


def scan_excel_file(file_path: str, sheet_name: str = 0) -> Dict[str, Any]:
    """Scan an Excel file"""
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    filename = file_path.split('/')[-1]
    return scan_dataframe(df, filename)


def scan_uploaded_file(file_content: bytes, filename: str) -> Dict[str, Any]:
    """Scan an uploaded file from FastAPI UploadFile"""
    from io import BytesIO
    
    # Determine file type and read accordingly
    if filename.endswith('.csv'):
        df = pd.read_csv(BytesIO(file_content))
    elif filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(BytesIO(file_content))
    elif filename.endswith('.json'):
        df = pd.read_json(BytesIO(file_content))
    else:
        raise ValueError(f"Unsupported file type: {filename}")
    
    return scan_dataframe(df, filename)
