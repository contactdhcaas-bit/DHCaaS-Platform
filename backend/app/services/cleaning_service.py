"""
Data Cleaning & Integration Service (ETL Engine)
Competes with Informatica Data Integration
Applies transformations and fixes data quality issues
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class CleaningService:
    """
    ETL Engine for data cleaning and transformation
    """
    
    SUPPORTED_RULES = [
        'drop_duplicates',
        'fill_missing',
        'standardize_case',
        'trim_whitespace',
        'remove_special_chars',
        'normalize_dates',
        'fix_data_types',
        'remove_outliers'
    ]
    
    def __init__(self, output_dir: str = "cleaned_files"):
        """
        Initialize cleaning service
        
        Args:
            output_dir: Directory to store cleaned files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        logger.info(f"CleaningService initialized with output directory: {output_dir}")
    
    def clean_dataset(
        self, 
        file_path: str, 
        cleaning_rules: List[str],
        custom_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main cleaning function - applies transformations to dataset
        
        Args:
            file_path: Path to the input file
            cleaning_rules: List of cleaning rules to apply
            custom_options: Optional custom parameters for rules
        
        Returns:
            Dictionary with cleaned file path and change summary
        """
        start_time = datetime.now()
        
        try:
            # Validate rules
            invalid_rules = [rule for rule in cleaning_rules if rule not in self.SUPPORTED_RULES]
            if invalid_rules:
                raise ValueError(f"Invalid rules: {', '.join(invalid_rules)}")
            
            logger.info(f"Starting cleaning process for: {file_path}")
            logger.info(f"Applying rules: {', '.join(cleaning_rules)}")
            
            # Load dataset
            df_original = self._load_file(file_path)
            df = df_original.copy()
            
            # Track changes
            changes = {
                'rules_applied': [],
                'rows_before': len(df),
                'rows_after': 0,
                'columns_before': len(df.columns),
                'columns_after': 0,
                'cells_modified': 0,
                'duplicates_removed': 0,
                'missing_filled': 0,
                'outliers_removed': 0,
                'transformations': []
            }
            
            # Apply cleaning rules in sequence
            for rule in cleaning_rules:
                if rule == 'drop_duplicates':
                    df, rule_changes = self._drop_duplicates(df)
                    changes['duplicates_removed'] = rule_changes['rows_removed']
                    changes['transformations'].append(f"Removed {rule_changes['rows_removed']} duplicate rows")
                
                elif rule == 'fill_missing':
                    df, rule_changes = self._fill_missing(df)
                    changes['missing_filled'] = rule_changes['cells_filled']
                    changes['transformations'].append(f"Filled {rule_changes['cells_filled']} missing values")
                
                elif rule == 'standardize_case':
                    df, rule_changes = self._standardize_case(df)
                    changes['cells_modified'] += rule_changes['cells_modified']
                    changes['transformations'].append(f"Standardized case for {rule_changes['columns_affected']} columns")
                
                elif rule == 'trim_whitespace':
                    df, rule_changes = self._trim_whitespace(df)
                    changes['cells_modified'] += rule_changes['cells_modified']
                    changes['transformations'].append(f"Trimmed whitespace in {rule_changes['cells_modified']} cells")
                
                elif rule == 'remove_special_chars':
                    df, rule_changes = self._remove_special_chars(df)
                    changes['cells_modified'] += rule_changes['cells_modified']
                    changes['transformations'].append(f"Cleaned special characters from {rule_changes['columns_affected']} columns")
                
                elif rule == 'normalize_dates':
                    df, rule_changes = self._normalize_dates(df)
                    changes['transformations'].append(f"Normalized {rule_changes['columns_affected']} date columns")
                
                elif rule == 'fix_data_types':
                    df, rule_changes = self._fix_data_types(df)
                    changes['transformations'].append(f"Fixed data types for {rule_changes['columns_affected']} columns")
                
                elif rule == 'remove_outliers':
                    df, rule_changes = self._remove_outliers(df, custom_options)
                    changes['outliers_removed'] = rule_changes['rows_removed']
                    changes['transformations'].append(f"Removed {rule_changes['rows_removed']} outlier rows")
                
                changes['rules_applied'].append(rule)
            
            # Update final counts
            changes['rows_after'] = len(df)
            changes['columns_after'] = len(df.columns)
            changes['rows_removed'] = changes['rows_before'] - changes['rows_after']
            
            # Save cleaned file
            cleaned_file_path = self._save_cleaned_file(df, file_path)
            
            # Calculate processing time
            elapsed = (datetime.now() - start_time).total_seconds()
            
            result = {
                'status': 'success',
                'cleaned_file_path': cleaned_file_path,
                'cleaned_file_name': os.path.basename(cleaned_file_path),
                'original_file_name': os.path.basename(file_path),
                'changes': changes,
                'processing_time': f"{elapsed:.2f}s",
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Cleaning completed successfully in {elapsed:.2f}s")
            logger.info(f"Cleaned file saved to: {cleaned_file_path}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error during cleaning: {str(e)}")
            raise Exception(f"Cleaning failed: {str(e)}")
    
    def _load_file(self, file_path: str) -> pd.DataFrame:
        """Load file into DataFrame"""
        file_extension = Path(file_path).suffix.lower()
        
        if file_extension == '.csv':
            return pd.read_csv(file_path)
        elif file_extension in ['.xlsx', '.xls']:
            return pd.read_excel(file_path)
        elif file_extension == '.json':
            return pd.read_json(file_path)
        elif file_extension == '.parquet':
            return pd.read_parquet(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    
    def _save_cleaned_file(self, df: pd.DataFrame, original_path: str) -> str:
        """Save cleaned DataFrame to file"""
        original_name = Path(original_path).stem
        extension = Path(original_path).suffix
        
        cleaned_filename = f"cleaned_{original_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
        cleaned_path = os.path.join(self.output_dir, cleaned_filename)
        
        if extension == '.csv':
            df.to_csv(cleaned_path, index=False)
        elif extension in ['.xlsx', '.xls']:
            df.to_excel(cleaned_path, index=False)
        elif extension == '.json':
            df.to_json(cleaned_path, orient='records', indent=2)
        elif extension == '.parquet':
            df.to_parquet(cleaned_path, index=False)
        
        return cleaned_path
    
    def _drop_duplicates(self, df: pd.DataFrame) -> tuple:
        """Remove duplicate rows"""
        rows_before = len(df)
        df_cleaned = df.drop_duplicates()
        rows_after = len(df_cleaned)
        
        return df_cleaned, {
            'rows_removed': rows_before - rows_after
        }
    
    def _fill_missing(self, df: pd.DataFrame) -> tuple:
        """Fill missing values intelligently"""
        cells_filled = 0
        df_cleaned = df.copy()
        
        for col in df_cleaned.columns:
            missing_count = df_cleaned[col].isnull().sum()
            
            if missing_count > 0:
                if df_cleaned[col].dtype in ['float64', 'int64']:
                    # Fill numeric with mean
                    fill_value = df_cleaned[col].mean()
                    df_cleaned[col].fillna(fill_value, inplace=True)
                else:
                    # Fill string/object with "Unknown"
                    df_cleaned[col].fillna('Unknown', inplace=True)
                
                cells_filled += missing_count
        
        return df_cleaned, {
            'cells_filled': cells_filled
        }
    
    def _standardize_case(self, df: pd.DataFrame) -> tuple:
        """Convert string columns to lowercase"""
        df_cleaned = df.copy()
        cells_modified = 0
        columns_affected = 0
        
        for col in df_cleaned.columns:
            if df_cleaned[col].dtype == 'object':
                df_cleaned[col] = df_cleaned[col].astype(str).str.lower()
                cells_modified += len(df_cleaned)
                columns_affected += 1
        
        return df_cleaned, {
            'cells_modified': cells_modified,
            'columns_affected': columns_affected
        }
    
    def _trim_whitespace(self, df: pd.DataFrame) -> tuple:
        """Strip whitespace from string columns"""
        df_cleaned = df.copy()
        cells_modified = 0
        
        for col in df_cleaned.columns:
            if df_cleaned[col].dtype == 'object':
                df_cleaned[col] = df_cleaned[col].astype(str).str.strip()
                # Count cells that actually changed
                cells_modified += (df[col].astype(str) != df_cleaned[col]).sum()
        
        return df_cleaned, {
            'cells_modified': cells_modified
        }
    
    def _remove_special_chars(self, df: pd.DataFrame) -> tuple:
        """Remove special characters from string columns"""
        df_cleaned = df.copy()
        cells_modified = 0
        columns_affected = 0
        
        for col in df_cleaned.columns:
            if df_cleaned[col].dtype == 'object':
                df_cleaned[col] = df_cleaned[col].astype(str).str.replace(r'[^a-zA-Z0-9\s@._-]', '', regex=True)
                cells_modified += (df[col].astype(str) != df_cleaned[col]).sum()
                columns_affected += 1
        
        return df_cleaned, {
            'cells_modified': cells_modified,
            'columns_affected': columns_affected
        }
    
    def _normalize_dates(self, df: pd.DataFrame) -> tuple:
        """Normalize date columns to standard format"""
        df_cleaned = df.copy()
        columns_affected = 0
        
        for col in df_cleaned.columns:
            if 'date' in col.lower() or 'time' in col.lower():
                try:
                    df_cleaned[col] = pd.to_datetime(df_cleaned[col], errors='coerce')
                    columns_affected += 1
                except:
                    pass
        
        return df_cleaned, {
            'columns_affected': columns_affected
        }
    
    def _fix_data_types(self, df: pd.DataFrame) -> tuple:
        """Auto-detect and fix data types"""
        df_cleaned = df.copy()
        columns_affected = 0
        
        for col in df_cleaned.columns:
            # Try to convert to numeric if possible
            try:
                converted = pd.to_numeric(df_cleaned[col], errors='coerce')
                if converted.notna().sum() / len(converted) > 0.8:  # 80% success rate
                    df_cleaned[col] = converted
                    columns_affected += 1
            except:
                pass
        
        return df_cleaned, {
            'columns_affected': columns_affected
        }
    
    def _remove_outliers(
        self, 
        df: pd.DataFrame, 
        custom_options: Optional[Dict[str, Any]] = None
    ) -> tuple:
        """Remove statistical outliers from numeric columns"""
        df_cleaned = df.copy()
        rows_before = len(df_cleaned)
        
        # Use IQR method
        threshold = custom_options.get('threshold', 1.5) if custom_options else 1.5
        
        for col in df_cleaned.select_dtypes(include=[np.number]).columns:
            Q1 = df_cleaned[col].quantile(0.25)
            Q3 = df_cleaned[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            
            df_cleaned = df_cleaned[
                (df_cleaned[col] >= lower_bound) & 
                (df_cleaned[col] <= upper_bound)
            ]
        
        rows_after = len(df_cleaned)
        
        return df_cleaned, {
            'rows_removed': rows_before - rows_after
        }


# Singleton instance
_cleaning_service_instance = None


def get_cleaning_service() -> CleaningService:
    """Get singleton instance of CleaningService"""
    global _cleaning_service_instance
    if _cleaning_service_instance is None:
        _cleaning_service_instance = CleaningService()
    return _cleaning_service_instance


def clean_dataset(
    file_path: str,
    cleaning_rules: List[str],
    custom_options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Convenience function to clean a dataset
    
    Args:
        file_path: Path to input file
        cleaning_rules: List of cleaning rules to apply
        custom_options: Optional custom parameters
    
    Returns:
        Cleaning results with file path and summary
    """
    service = get_cleaning_service()
    return service.clean_dataset(file_path, cleaning_rules, custom_options)
