"""
DHCaaS Scan Service - UPGRADED WITH SMART TAGGING + CATALOG INTEGRATION
Single source of truth for all data quality scanning
Now powered by enterprise-grade validation rules, AI classification, catalog auto-update, and multi-tenancy
"""

from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timezone
from io import BytesIO
import pandas as pd
import re
import logging

# Import the advanced scanner
from app.services.data_quality_scanner import scan_dataframe

# Import AI Classification (if available)
try:
    from app.services.ai_classifier import classify_schema, get_classifier
    AI_CLASSIFIER_AVAILABLE = True
except ImportError:
    AI_CLASSIFIER_AVAILABLE = False
    logging.warning("AI Classifier not available - smart tagging will use rule-based only")

# Import database connection
from app.core.database import get_database

# Import catalog models
from app.models.catalog import CatalogItem, ColumnMetadata

logger = logging.getLogger(__name__)


class ScanService:
    """
    Unified scan service using advanced data quality engine with smart tagging and catalog integration
    """
    
    def __init__(self):
        self.scan_count = 0
        logger.info("ScanService initialized with Smart Tagging + Catalog Integration + Multi-Tenancy")
    
    def _generate_tags(self, df: pd.DataFrame) -> List[str]:
        """
        Generate smart tags based on column names and content
        
        Args:
            df: Pandas DataFrame to analyze
            
        Returns:
            List of auto-generated tags
        """
        tags = set()
        
        # Get all column names (lowercase for matching)
        columns_lower = [col.lower() for col in df.columns]
        
        # PII Detection
        pii_patterns = [
            'email', 'mail', 'e-mail',
            'phone', 'tel', 'mobile', 'cell',
            'ssn', 'social_security',
            'passport', 'license', 'id_number',
            'date_of_birth', 'dob', 'birthdate',
            'address', 'zip', 'postal'
        ]
        
        for pattern in pii_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("PII")
                tags.add("Sensitive")
                break
        
        # Contact Information
        contact_patterns = ['email', 'phone', 'mobile', 'tel', 'fax', 'contact']
        if any(any(p in col for p in contact_patterns) for col in columns_lower):
            tags.add("Contact")
        
        # Financial Data
        financial_patterns = [
            'price', 'cost', 'amount', 'salary', 'wage', 'payment',
            'revenue', 'income', 'expense', 'balance', 'credit',
            'debit', 'invoice', 'billing', 'account_number'
        ]
        
        for pattern in financial_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("Financial")
                tags.add("Sensitive")
                break
        
        # Product/Inventory
        product_patterns = ['sku', 'product', 'item', 'inventory', 'stock', 'catalog']
        if any(any(p in col for p in product_patterns) for col in columns_lower):
            tags.add("Product")
            tags.add("Inventory")
        
        # Location Data
        location_patterns = [
            'address', 'street', 'city', 'state', 'country',
            'zip', 'postal', 'location', 'latitude', 'longitude',
            'region', 'district', 'province'
        ]
        
        for pattern in location_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("Location")
                tags.add("Geographic")
                break
        
        # Customer/User Data
        customer_patterns = [
            'customer', 'client', 'user', 'account', 'member',
            'subscriber', 'buyer', 'purchaser'
        ]
        
        for pattern in customer_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("Customer")
                tags.add("CRM")
                break
        
        # Temporal Data
        temporal_patterns = ['date', 'time', 'timestamp', 'created', 'updated', 'modified']
        if any(any(p in col for p in temporal_patterns) for col in columns_lower):
            tags.add("Temporal")
        
        # Transactional Data
        transaction_patterns = [
            'transaction', 'order', 'purchase', 'sale',
            'checkout', 'cart', 'invoice'
        ]
        
        for pattern in transaction_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("Transactional")
                tags.add("Sales")
                break
        
        # HR/Employee Data
        hr_patterns = [
            'employee', 'staff', 'worker', 'department',
            'salary', 'wage', 'position', 'title', 'hire_date'
        ]
        
        for pattern in hr_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("HR")
                tags.add("Employee")
                tags.add("Sensitive")
                break
        
        # Healthcare
        healthcare_patterns = [
            'patient', 'diagnosis', 'prescription', 'medical',
            'health', 'insurance', 'treatment', 'symptom'
        ]
        
        for pattern in healthcare_patterns:
            if any(pattern in col for col in columns_lower):
                tags.add("Healthcare")
                tags.add("HIPAA")
                tags.add("Sensitive")
                break
        
        return sorted(list(tags))
    
    def _extract_column_metadata(
        self, 
        df: pd.DataFrame, 
        max_samples: int = 5
    ) -> List[ColumnMetadata]:
        """
        Extract detailed column metadata from DataFrame
        
        Args:
            df: Pandas DataFrame
            max_samples: Maximum number of sample values to extract
            
        Returns:
            List of ColumnMetadata objects
        """
        columns_metadata = []
        
        for col in df.columns:
            # Get basic stats
            null_count = int(df[col].isnull().sum())
            unique_count = int(df[col].nunique())
            
            # Get sample values (non-null)
            sample_values = df[col].dropna().head(max_samples).astype(str).tolist()
            
            # Detect column-level tags
            col_tags = []
            col_lower = col.lower()
            
            if any(p in col_lower for p in ['email', 'mail']):
                col_tags.append("Email")
            if any(p in col_lower for p in ['phone', 'tel', 'mobile']):
                col_tags.append("Phone")
            if any(p in col_lower for p in ['address', 'street']):
                col_tags.append("Address")
            if any(p in col_lower for p in ['price', 'amount', 'cost']):
                col_tags.append("Currency")
            
            columns_metadata.append(ColumnMetadata(
                name=col,
                data_type=str(df[col].dtype),
                sample_values=sample_values if sample_values else None,
                null_count=null_count,
                unique_count=unique_count,
                tags=col_tags
            ))
        
        return columns_metadata
    
    def _generate_description(
        self, 
        name: str, 
        df: pd.DataFrame, 
        tags: List[str]
    ) -> str:
        """
        Auto-generate dataset description
        
        Args:
            name: Dataset name
            df: DataFrame
            tags: Generated tags
            
        Returns:
            Auto-generated description
        """
        tag_str = ", ".join(tags[:3]) if tags else "General Data"
        
        return (
            f"{name} contains {len(df)} records with {len(df.columns)} columns. "
            f"Primary tags: {tag_str}. "
            f"Auto-discovered during data quality scan."
        )
    
    async def _create_or_update_catalog_item(
        self,
        datasource_name: str,
        df: pd.DataFrame,
        scan_id: str,
        quality_score: float,
        total_incidents: int,
        critical_incidents: int,
        owner_id: Optional[str] = None
    ) -> str:
        """
        Create or update catalog item for scanned dataset
        
        Args:
            datasource_name: Name of the dataset
            df: Pandas DataFrame with data
            scan_id: ID of the scan that generated this data
            quality_score: Overall quality score
            total_incidents: Total number of incidents found
            critical_incidents: Number of critical incidents
            owner_id: Optional user ID who owns this dataset
            
        Returns:
            Catalog item ID
        """
        # Generate smart tags
        tags = self._generate_tags(df)
        
        # Extract column metadata
        columns = self._extract_column_metadata(df)
        
        # Generate auto-description
        description = self._generate_description(datasource_name, df, tags)
        
        # Check if catalog item exists
        db = await get_database()
        catalog_collection = db["catalog"]
        existing_item = await catalog_collection.find_one({"name": datasource_name})
        
        now = datetime.now(timezone.utc)
        
        if existing_item:
            # Update existing item
            update_data = {
                "tags": tags,
                "columns": [col.dict() for col in columns],
                "row_count": len(df),
                "quality_score": quality_score,
                "total_incidents": total_incidents,
                "critical_incidents": critical_incidents,
                "scan_id": scan_id,
                "updated_at": now,
                "last_scanned_at": now
            }
            
            await catalog_collection.update_one(
                {"_id": existing_item["_id"]},
                {"$set": update_data}
            )
            
            catalog_id = str(existing_item["_id"])
            logger.info(f"Updated catalog item: {catalog_id}")
            
        else:
            # Create new item
            catalog_item = {
                "name": datasource_name,
                "description": description,
                "tags": tags,
                "columns": [col.dict() for col in columns],
                "row_count": len(df),
                "quality_score": quality_score,
                "owner_id": owner_id,
                "scan_id": scan_id,
                "total_incidents": total_incidents,
                "critical_incidents": critical_incidents,
                "created_at": now,
                "updated_at": now,
                "last_scanned_at": now
            }
            
            result = await catalog_collection.insert_one(catalog_item)
            catalog_id = str(result.inserted_id)
            logger.info(f"Created new catalog item: {catalog_id}")
        
        return catalog_id
    
    async def scan_file(
        self, 
        file_content: bytes, 
        filename: str,
        user_id: str,
        job_id: Optional[str] = None,
        datasource_name: Optional[str] = None,
        owner: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform advanced data quality scan on uploaded file with smart tagging and catalog integration
        
        Args:
            file_content: Raw file content
            filename: Name of the file
            user_id: ID of the user performing the scan (for multi-tenancy)
            job_id: Associated scan job ID
            datasource_name: Name of data source
            owner: Owner/creator of the scan
        
        Returns:
            Comprehensive scan results with smart tags and catalog integration
        """
        
        try:
            logger.info(f"Starting scan with smart tagging for file: {filename} (user: {user_id})")
            start_time = datetime.now()
            
            # Load file into DataFrame
            df = self._load_file(file_content, filename)
            
            # Use the advanced scanner
            scan_results = scan_dataframe(df, filename)
            
            # Generate smart tags
            smart_tags = self._generate_tags(df)
            scan_results['tags'] = smart_tags
            
            # AI Classification (if available)
            if AI_CLASSIFIER_AVAILABLE:
                try:
                    columns_for_classification = []
                    for col in df.columns:
                        columns_for_classification.append({
                            'name': col,
                            'data_type': str(df[col].dtype),
                            'null_count': int(df[col].isnull().sum()),
                            'null_percentage': float((df[col].isnull().sum() / len(df)) * 100) if len(df) > 0 else 0,
                            'unique_count': int(df[col].nunique())
                        })
                    
                    sample_data = df.head(10).to_dict('records') if not df.empty else []
                    ai_tags = classify_schema(columns_for_classification, sample_data)
                    
                    classifier = get_classifier()
                    classification_summary = classifier.get_classification_summary(ai_tags)
                    
                    scan_results['ai_tags'] = ai_tags
                    scan_results['classification_summary'] = classification_summary
                    
                    logger.info(f"AI Classification completed: {classification_summary['total_columns_classified']} columns")
                except Exception as e:
                    logger.warning(f"AI classification failed: {str(e)}")
            
            # Multi-tenancy: Add owner_id
            scan_results['owner_id'] = user_id
            scan_results['job_id'] = job_id
            scan_results['datasource_name'] = datasource_name or filename
            scan_results['owner'] = owner or 'System'
            scan_results['created_at'] = datetime.now(timezone.utc).isoformat()
            
            # Legacy field mappings
            scan_results['dq_score'] = scan_results['score']
            scan_results['compliance_score'] = scan_results['score']
            scan_results['total_rows'] = scan_results['rows']
            scan_results['total_columns'] = scan_results['columns']
            scan_results['has_pii'] = scan_results['pii_detected']
            
            # Quality dimensions breakdown
            scan_results['quality_dimensions'] = {
                'completeness': scan_results['score_breakdown']['completeness'],
                'accuracy': scan_results['score_breakdown']['accuracy'],
                'validity': scan_results['score_breakdown']['validity'],
                'consistency': scan_results['score_breakdown']['consistency'],
                'uniqueness': scan_results['score_breakdown']['uniqueness']
            }
            
            # Count critical issues
            critical_keywords = ['duplicate id', 'invalid email', 'negative', 'missing']
            critical_issues = [
                issue for issue in scan_results['issues'] 
                if any(keyword in issue.lower() for keyword in critical_keywords)
            ]
            scan_results['critical_issues_count'] = len(critical_issues)
            
            # Status determination
            sensitive_data_detected = 'Sensitive' in smart_tags or 'PII' in smart_tags
            
            if scan_results['score'] >= 80 and not sensitive_data_detected:
                scan_results['status'] = 'completed'
                scan_results['health_status'] = 'healthy'
            elif scan_results['score'] >= 80 and sensitive_data_detected:
                scan_results['status'] = 'completed_with_warnings'
                scan_results['health_status'] = 'healthy_with_sensitive_data'
            elif scan_results['score'] >= 60:
                scan_results['status'] = 'completed_with_warnings'
                scan_results['health_status'] = 'warning'
            else:
                scan_results['status'] = 'completed_with_errors'
                scan_results['health_status'] = 'critical'
            
            # Add sensitive data warning
            if sensitive_data_detected:
                scan_results['issues'].append(
                    f"Warning: Sensitive Data Detected - Dataset contains: {', '.join([t for t in smart_tags if t in ['PII', 'Sensitive', 'Financial']])}"
                )
            
            elapsed = (datetime.now() - start_time).total_seconds()
            scan_results['processing_time'] = f"{elapsed:.2f}s"
            
            logger.info(
                f"Scan completed: {filename} | User: {user_id} | "
                f"Score: {scan_results['score']}/100 | Issues: {len(scan_results['issues'])} | "
                f"Tags: {', '.join(smart_tags[:3])} | Time: {elapsed:.2f}s"
            )
            
            self.scan_count += 1
            return scan_results
            
        except Exception as e:
            logger.error(f"Error during scan of {filename}: {str(e)}")
            raise Exception(f"Scan failed: {str(e)}")
    
    async def save_scan_results(
        self,
        datasource_name: str,
        scan_result: Dict[str, Any],
        df: pd.DataFrame,
        user_id: str
    ) -> str:
        """
        Save scan results and create/update catalog item
        
        Args:
            datasource_name: Name of the dataset
            scan_result: Scan result data
            df: Original DataFrame
            user_id: User ID who owns this scan
            
        Returns:
            Scan ID
        """
        try:
            # Calculate stats
            total_incidents = len(scan_result.get('issues', []))
            critical_incidents = scan_result.get('critical_issues_count', 0)
            quality_score = scan_result.get('score', 0)
            
            # Ensure owner_id is set
            scan_result['owner_id'] = user_id
            
            # Save scan
            db = await get_database()
            scans_collection = db["scans"]
            result = await scans_collection.insert_one(scan_result)
            scan_id = str(result.inserted_id)
            
            logger.info(f"Scan saved: {scan_id} (owner: {user_id})")
            
            # Create/update catalog item
            await self._create_or_update_catalog_item(
                datasource_name=datasource_name,
                df=df,
                scan_id=scan_id,
                quality_score=quality_score,
                total_incidents=total_incidents,
                critical_incidents=critical_incidents,
                owner_id=user_id
            )
            
            return scan_id
            
        except Exception as e:
            logger.error(f"Failed to save scan results: {str(e)}")
            raise
    
    async def get_user_scans(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all scans for a specific user"""
        try:
            db = await get_database()
            scans_collection = db["scans"]
            
            cursor = scans_collection.find(
                {"owner_id": user_id}
            ).sort("created_at", -1).limit(limit)
            
            scans = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for scan in scans:
                scan['_id'] = str(scan['_id'])
            
            logger.info(f"Retrieved {len(scans)} scans for user: {user_id}")
            return scans
            
        except Exception as e:
            logger.error(f"Failed to retrieve user scans: {str(e)}")
            raise
    
    def _load_file(self, file_content: bytes, filename: str) -> pd.DataFrame:
        """Load file content into pandas DataFrame"""
        buffer = BytesIO(file_content)
        
        if filename.endswith('.csv'):
            return pd.read_csv(buffer)
        elif filename.endswith(('.xlsx', '.xls')):
            return pd.read_excel(buffer)
        elif filename.endswith('.json'):
            return pd.read_json(buffer)
        elif filename.endswith('.parquet'):
            return pd.read_parquet(buffer)
        else:
            raise ValueError(f"Unsupported file type: {filename}")


# Singleton instance
_scan_service_instance = None


def get_scan_service() -> ScanService:
    """Get singleton instance of ScanService"""
    global _scan_service_instance
    if _scan_service_instance is None:
        _scan_service_instance = ScanService()
    return _scan_service_instance


# Legacy function for backward compatibility
async def execute_scan(
    file_content: bytes,
    filename: str,
    user_id: str,
    job_id: Optional[str] = None,
    datasource_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Legacy scan function - redirects to smart tagging engine
    
    DEPRECATED: Use get_scan_service().scan_file() instead
    """
    service = get_scan_service()
    return await service.scan_file(
        file_content=file_content,
        filename=filename,
        user_id=user_id,
        job_id=job_id,
        datasource_name=datasource_name
    )

