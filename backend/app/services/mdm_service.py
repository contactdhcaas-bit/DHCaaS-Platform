"""
MDM Service
Master Data Management - Golden Record Creation
"""

from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
from datetime import datetime
import logging
from uuid import uuid4

from app.models.mdm import (
    SourceRecord,
    GoldenRecord,
    FieldConfidence,
    SourceSystem
)

logger = logging.getLogger(__name__)


class MDMService:
    """Master Data Management Service for Golden Record creation"""
    
    def __init__(self):
        """Initialize MDM service"""
        self.golden_records: Dict[str, GoldenRecord] = {}
        logger.info("✅ MDM Service initialized")
    
    
    def create_golden_record(
        self,
        cluster_id: str,
        source_records: List[SourceRecord]
    ) -> GoldenRecord:
        """
        Create a unified Golden Record from source records
        
        Args:
            cluster_id: Cluster identifier
            source_records: List of source records to merge
        
        Returns:
            GoldenRecord with unified data
        """
        
        if not source_records:
            raise ValueError("No source records provided for merging")
        
        start_time = datetime.utcnow()
        
        # Step 1: Extract all fields from all records
        all_fields = self._extract_all_fields(source_records)
        
        # Step 2: Merge each field using voting + recency
        unified_data = {}
        field_confidences = []
        conflicts_resolved = 0
        
        for field_name in all_fields:
            merged_value, confidence = self._merge_field(
                field_name,
                source_records
            )
            
            if merged_value is not None:
                unified_data[field_name] = merged_value
                field_confidences.append(confidence)
                
                if confidence.source_count < len(source_records):
                    conflicts_resolved += 1
        
        # Step 3: Calculate overall confidence score
        overall_confidence = self._calculate_confidence(
            field_confidences,
            source_records
        )
        
        # Step 4: Create golden record
        golden_record = GoldenRecord(
            id=f"golden_{uuid4().hex[:12]}",
            cluster_id=cluster_id,
            unified_data=unified_data,
            sources=source_records,
            field_confidences=field_confidences,
            confidence_score=overall_confidence,
            record_count=len(source_records)
        )
        
        # Step 5: Store golden record
        self.golden_records[golden_record.id] = golden_record
        
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.info(
            f"✅ Golden Record created: {golden_record.id} | "
            f"Cluster: {cluster_id} | "
            f"Records: {len(source_records)} | "
            f"Fields: {len(unified_data)} | "
            f"Confidence: {overall_confidence:.1f}% | "
            f"Time: {processing_time:.0f}ms"
        )
        
        return golden_record
    
    
    def _extract_all_fields(self, records: List[SourceRecord]) -> set:
        """Extract all unique field names from records"""
        all_fields = set()
        for record in records:
            all_fields.update(record.data.keys())
        return all_fields
    
    
    def _merge_field(
        self,
        field_name: str,
        records: List[SourceRecord]
    ) -> Tuple[Any, FieldConfidence]:
        """
        Merge a single field using voting + recency rules
        
        Rules:
        1. Most frequent value wins (Voting)
        2. If tie, latest timestamp wins (Recency)
        3. If still tie, highest quality score wins
        
        Returns:
            (merged_value, field_confidence)
        """
        
        # Collect all values for this field
        field_values = []
        for record in records:
            if field_name in record.data:
                value = record.data[field_name]
                if value is not None and value != "":
                    field_values.append({
                        "value": value,
                        "timestamp": record.timestamp,
                        "system": record.system,
                        "quality": record.quality_score or 50.0
                    })
        
        if not field_values:
            return None, FieldConfidence(
                field_name=field_name,
                value=None,
                confidence=0.0,
                source_count=0,
                sources=[]
            )
        
        # Rule 1: Count frequency of each value
        value_counts = Counter([str(v["value"]) for v in field_values])
        max_count = max(value_counts.values())
        
        # Get all values with max frequency
        candidates = [
            v for v in field_values
            if value_counts[str(v["value"])] == max_count
        ]
        
        # Rule 2: If multiple candidates, pick latest timestamp
        if len(candidates) > 1:
            candidates.sort(
                key=lambda x: (x["timestamp"], x["quality"]),
                reverse=True
            )
        
        # Select winner
        winner = candidates[0]
        
        # Calculate confidence
        agreement_ratio = max_count / len(field_values)
        base_confidence = agreement_ratio * 100
        
        # Boost confidence if high quality
        quality_boost = (winner["quality"] / 100) * 10
        final_confidence = min(base_confidence + quality_boost, 100.0)
        
        # Get source systems
        sources = list(set([
            v["system"]
            for v in field_values
            if str(v["value"]) == str(winner["value"])
        ]))
        
        confidence = FieldConfidence(
            field_name=field_name,
            value=winner["value"],
            confidence=final_confidence,
            source_count=max_count,
            sources=sources
        )
        
        return winner["value"], confidence
    
    
    def _calculate_confidence(
        self,
        field_confidences: List[FieldConfidence],
        records: List[SourceRecord]
    ) -> float:
        """
        Calculate overall confidence score
        
        Factors:
        - Average field confidence
        - Number of sources (more is better)
        - Agreement across sources
        """
        
        if not field_confidences:
            return 0.0
        
        # Average field confidence
        avg_field_confidence = sum(
            fc.confidence for fc in field_confidences
        ) / len(field_confidences)
        
        # Source diversity bonus (more sources = higher confidence)
        source_diversity = min(len(records) / 5, 1.0) * 10
        
        # High agreement bonus
        high_agreement_count = sum(
            1 for fc in field_confidences
            if fc.confidence >= 90
        )
        agreement_bonus = (high_agreement_count / len(field_confidences)) * 5
        
        total_confidence = avg_field_confidence + source_diversity + agreement_bonus
        
        return min(total_confidence, 100.0)
    
    
    def get_golden_record(self, golden_id: str) -> Optional[GoldenRecord]:
        """Retrieve golden record by ID"""
        return self.golden_records.get(golden_id)
    
    
    def get_golden_record_by_cluster(
        self,
        cluster_id: str
    ) -> Optional[GoldenRecord]:
        """Retrieve golden record by cluster ID"""
        for record in self.golden_records.values():
            if record.cluster_id == cluster_id:
                return record
        return None
    
    
    def list_golden_records(self) -> List[GoldenRecord]:
        """List all golden records"""
        return list(self.golden_records.values())
    
    
    def delete_golden_record(self, golden_id: str) -> bool:
        """Delete a golden record"""
        if golden_id in self.golden_records:
            del self.golden_records[golden_id]
            logger.info(f"🗑️ Golden Record deleted: {golden_id}")
            return True
        return False


# Singleton instance
_mdm_service = None


def get_mdm_service() -> MDMService:
    """Get or create MDM service singleton"""
    global _mdm_service
    if _mdm_service is None:
        _mdm_service = MDMService()
    return _mdm_service
