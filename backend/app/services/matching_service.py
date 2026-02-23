"""
Master Data Management (MDM) - Identity Resolution & Fuzzy Matching Service
Competes with Informatica Customer 360, Tamr, Reltio MDM
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import logging
import time
from datetime import datetime

# Use thefuzz for fuzzy string matching (pip install thefuzz python-Levenshtein)
try:
    from thefuzz import fuzz
    FUZZ_AVAILABLE = True
except ImportError:
    FUZZ_AVAILABLE = False
    logging.warning("thefuzz not installed. Using difflib fallback.")
    import difflib

from app.models.mdm import MatchedPair, MatchResult

logger = logging.getLogger(__name__)


class MatchingService:
    """
    Service for fuzzy matching and identity resolution across datasets
    Enables Customer 360, duplicate detection, and master data management
    """
    
    def __init__(self):
        """Initialize matching service"""
        self.use_fuzz = FUZZ_AVAILABLE
        logger.info(f"MatchingService initialized (fuzzy engine: {'thefuzz' if FUZZ_AVAILABLE else 'difflib'})")
    
    def find_matches(
        self,
        source_file_id: str,
        target_file_id: str,
        match_columns: List[str],
        threshold: int = 85,
        limit: int = 100
    ) -> MatchResult:
        """
        Find matching records between two datasets using fuzzy matching
        
        Args:
            source_file_id: Source file identifier
            target_file_id: Target file identifier
            match_columns: List of column names to use for matching
            threshold: Minimum similarity threshold (0-100)
            limit: Maximum number of matches to return
            
        Returns:
            MatchResult with matched pairs and summary statistics
        """
        start_time = time.time()
        
        logger.info(f"Starting fuzzy matching: {source_file_id} vs {target_file_id}")
        logger.info(f"Match columns: {match_columns}, Threshold: {threshold}%")
        
        # Load datasets
        source_df = self._load_file(source_file_id)
        target_df = self._load_file(target_file_id)
        
        logger.info(f"Loaded source: {len(source_df)} rows, target: {len(target_df)} rows")
        
        # Validate columns exist
        self._validate_columns(source_df, target_df, match_columns)
        
        # Find matches
        matches = self._compute_matches(
            source_df, target_df, match_columns, threshold, limit
        )
        
        execution_time = time.time() - start_time
        
        # Build summary statistics
        summary = self._build_summary(matches, len(source_df), len(target_df), threshold)
        
        result = MatchResult(
            matches=matches,
            summary=summary,
            execution_time=execution_time,
            source_file=source_file_id,
            target_file=target_file_id,
            match_columns=match_columns,
            threshold=threshold
        )
        
        logger.info(f"Matching complete: {len(matches)} matches found in {execution_time:.2f}s")
        
        return result
    
    def _load_file(self, file_id: str) -> pd.DataFrame:
        """Load file from uploads directory"""
        upload_dir = Path("uploads")
        temp_uploads = Path("temp_uploads")
        
        # Normalize file_id
        base_file_id = file_id.replace('.csv', '').replace('.xlsx', '').replace('.json', '')
        
        # Try to find the file
        file_path = None
        for directory in [upload_dir, temp_uploads]:
            if directory.exists():
                for file in directory.glob("*"):
                    file_base = file.stem
                    if base_file_id in file_base or file_base == base_file_id or file_id in file.name:
                        file_path = file
                        break
            if file_path:
                break
        
        if not file_path or not file_path.exists():
            raise FileNotFoundError(f"File '{file_id}' not found in uploads directory")
        
        # Load based on extension
        if file_path.suffix.lower() == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_path.suffix.lower() == '.json':
            df = pd.read_json(file_path)
        elif file_path.suffix.lower() == '.parquet':
            df = pd.read_parquet(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        return df
    
    def _validate_columns(
        self, 
        source_df: pd.DataFrame, 
        target_df: pd.DataFrame, 
        match_columns: List[str]
    ):
        """Validate that match columns exist in both datasets"""
        source_cols = set(source_df.columns)
        target_cols = set(target_df.columns)
        
        missing_source = [col for col in match_columns if col not in source_cols]
        missing_target = [col for col in match_columns if col not in target_cols]
        
        if missing_source:
            raise ValueError(f"Columns not found in source file: {missing_source}")
        if missing_target:
            raise ValueError(f"Columns not found in target file: {missing_target}")
    
    def _compute_matches(
        self,
        source_df: pd.DataFrame,
        target_df: pd.DataFrame,
        match_columns: List[str],
        threshold: int,
        limit: int
    ) -> List[MatchedPair]:
        """Compute fuzzy matches between datasets"""
        matches = []
        
        # Limit comparison size for performance
        max_source_rows = min(len(source_df), 500)
        max_target_rows = min(len(target_df), 500)
        
        if len(source_df) > max_source_rows:
            logger.warning(f"Limiting source to {max_source_rows} rows for performance")
        if len(target_df) > max_target_rows:
            logger.warning(f"Limiting target to {max_target_rows} rows for performance")
        
        source_subset = source_df.head(max_source_rows)
        target_subset = target_df.head(max_target_rows)
        
        # Compare each source row with each target row
        for source_idx, source_row in source_subset.iterrows():
            for target_idx, target_row in target_subset.iterrows():
                
                # Calculate similarity for each column
                column_scores = {}
                total_score = 0
                
                for col in match_columns:
                    source_val = str(source_row[col]) if pd.notna(source_row[col]) else ""
                    target_val = str(target_row[col]) if pd.notna(target_row[col]) else ""
                    
                    score = self._calculate_similarity(source_val, target_val)
                    column_scores[col] = score
                    total_score += score
                
                # Average score across all columns
                avg_score = total_score / len(match_columns) if match_columns else 0
                
                # If above threshold, add to matches
                if avg_score >= threshold:
                    confidence = self._get_confidence_level(avg_score)
                    
                    matched_pair = MatchedPair(
                        source_record=source_row.to_dict(),
                        target_record=target_row.to_dict(),
                        similarity_score=round(avg_score, 2),
                        column_scores={k: round(v, 2) for k, v in column_scores.items()},
                        match_confidence=confidence,
                        source_index=int(source_idx),
                        target_index=int(target_idx)
                    )
                    
                    matches.append(matched_pair)
                    
                    # Stop if limit reached
                    if len(matches) >= limit:
                        logger.info(f"Reached match limit of {limit}")
                        return matches
        
        # Sort by similarity score (highest first)
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return matches
    
    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """
        Calculate similarity score between two strings
        Returns score from 0-100
        """
        if not str1 and not str2:
            return 100.0  # Both empty = perfect match
        if not str1 or not str2:
            return 0.0  # One empty = no match
        
        # Normalize strings
        str1 = str1.lower().strip()
        str2 = str2.lower().strip()
        
        if str1 == str2:
            return 100.0  # Exact match
        
        if self.use_fuzz:
            # Use thefuzz library (better performance and accuracy)
            # Try multiple algorithms and use the best score
            ratio = fuzz.ratio(str1, str2)
            partial = fuzz.partial_ratio(str1, str2)
            token_sort = fuzz.token_sort_ratio(str1, str2)
            token_set = fuzz.token_set_ratio(str1, str2)
            
            # Return best score
            return float(max(ratio, partial, token_sort, token_set))
        else:
            # Fallback to difflib
            ratio = difflib.SequenceMatcher(None, str1, str2).ratio()
            return float(ratio * 100)
    
    def _get_confidence_level(self, score: float) -> str:
        """Get confidence level based on similarity score"""
        if score >= 95:
            return "high"
        elif score >= 85:
            return "medium"
        else:
            return "low"
    
    def _build_summary(
        self, 
        matches: List[MatchedPair], 
        source_count: int, 
        target_count: int,
        threshold: int
    ) -> Dict[str, Any]:
        """Build summary statistics for match result"""
        if not matches:
            return {
                "total_matches": 0,
                "source_rows": source_count,
                "target_rows": target_count,
                "match_rate": 0.0,
                "confidence_distribution": {"high": 0, "medium": 0, "low": 0},
                "avg_similarity": 0.0,
                "min_similarity": threshold,
                "max_similarity": 0.0
            }
        
        # Confidence distribution
        confidence_dist = {
            "high": sum(1 for m in matches if m.match_confidence == "high"),
            "medium": sum(1 for m in matches if m.match_confidence == "medium"),
            "low": sum(1 for m in matches if m.match_confidence == "low")
        }
        
        # Score statistics
        scores = [m.similarity_score for m in matches]
        
        return {
            "total_matches": len(matches),
            "source_rows": source_count,
            "target_rows": target_count,
            "match_rate": round((len(matches) / min(source_count, target_count)) * 100, 2),
            "confidence_distribution": confidence_dist,
            "avg_similarity": round(np.mean(scores), 2),
            "min_similarity": round(min(scores), 2),
            "max_similarity": round(max(scores), 2),
            "threshold_used": threshold
        }
    
    def deduplicate(
        self,
        file_id: str,
        match_columns: List[str],
        threshold: int = 90
    ) -> MatchResult:
        """
        Find duplicates within a single dataset
        
        Args:
            file_id: File to deduplicate
            match_columns: Columns to use for matching
            threshold: Similarity threshold for duplicates
            
        Returns:
            MatchResult with duplicate pairs
        """
        logger.info(f"Starting deduplication on {file_id}")
        
        # Use same file as both source and target
        return self.find_matches(
            source_file_id=file_id,
            target_file_id=file_id,
            match_columns=match_columns,
            threshold=threshold,
            limit=500
        )


# Singleton instance
_matching_service_instance = None


def get_matching_service() -> MatchingService:
    """Get singleton instance of MatchingService"""
    global _matching_service_instance
    if _matching_service_instance is None:
        _matching_service_instance = MatchingService()
    return _matching_service_instance
