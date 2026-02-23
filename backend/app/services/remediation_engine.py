"""
DHCaaS Platform - AI-Powered Remediation Recommendation Engine v2.0
Multi-Database Support: PostgreSQL, MySQL, SQL Server, MongoDB
Inspired by Informatica CLAIRE AI
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import re
from enum import Enum


class DatabaseDialect(Enum):
    """Supported database dialects"""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLSERVER = "sqlserver"
    MONGODB = "mongodb"
    UNKNOWN = "unknown"


class RemediationType(Enum):
    """Classification of remediation strategies"""
    DATA_UPDATE = "data_update"
    PROCESS_CHANGE = "process_change"
    VALIDATION_RULE = "validation_rule"
    REFERENCE_DATA = "reference_data"
    SCHEMA_CHANGE = "schema_change"
    INVESTIGATION = "investigation"


class RemediationPriority(Enum):
    """Priority levels for remediation actions"""
    IMMEDIATE = "immediate"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SmartRemediationEngine:
    """
    AI-powered remediation recommendation engine with multi-database support
    Analyzes data quality incidents and generates dialect-specific fixes
    """

    def __init__(self):
        """Initialize remediation engine with multi-database support"""
        
        # Map incident categories to handler functions
        self.category_handlers = {
            'quality': self._handle_quality_incident,
            'schema': self._handle_schema_incident,
            'security': self._handle_security_incident,
            'compliance': self._handle_compliance_incident,
            'pipeline': self._handle_pipeline_incident,
        }
        
        # Map common patterns in title/description to handlers
        self.pattern_handlers = {
            'null': self._handle_null_values,
            'missing': self._handle_null_values,
            'empty': self._handle_null_values,
            'duplicate': self._handle_duplicates,
            'email': self._handle_invalid_email,
            'phone': self._handle_invalid_phone,
            'format': self._handle_invalid_format,
            'pattern': self._handle_invalid_format,
            'range': self._handle_out_of_range,
            'drift': self._handle_schema_drift,
            'orphan': self._handle_referential_integrity,
            'foreign': self._handle_referential_integrity,
            'referential': self._handle_referential_integrity,
        }

    def generate_remediation_plan(self, incidents: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Generate comprehensive remediation plan for all incidents
        
        Args:
            incidents: List of incident dictionaries from MongoDB
            
        Returns:
            Dictionary mapping incident_id to remediation recommendation
        """
        remediation_plan = {}
        
        for incident in incidents:
            incident_id = incident.get('incident_id') or incident.get('_id')
            
            if not incident_id:
                continue
            
            # Generate remediation for this incident
            recommendation = self._generate_single_remediation(incident)
            
            if recommendation:
                remediation_plan[str(incident_id)] = recommendation
        
        return remediation_plan

    def _generate_single_remediation(self, incident: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generate remediation recommendation for a single incident"""
        
        # Extract incident fields
        incident_id = incident.get('incident_id', 'unknown')
        title = incident.get('title', '').lower()
        description = incident.get('description', '').lower()
        severity = incident.get('severity', 'medium').lower()
        category = incident.get('category', 'quality').lower()
        source_name = incident.get('source_name', '')
        source_id = incident.get('source_id', '')
        affected_tables = incident.get('affected_tables', [])
        affected_rows = incident.get('affected_rows', 0)
        
        # Detect database dialect
        db_dialect = self._detect_database_dialect(source_name)
        
        # Determine handler based on category first
        handler = self.category_handlers.get(category)
        
        # If no category handler, try pattern matching
        if not handler:
            handler = self._find_pattern_handler(title, description)
        
        # Fallback to generic handler
        if not handler:
            handler = self._handle_generic_issue
        
        try:
            # Execute handler
            remediation = handler(
                incident=incident,
                db_dialect=db_dialect,
                affected_tables=affected_tables,
                affected_rows=affected_rows,
                severity=severity
            )
            
            # Enrich with metadata
            remediation['incident_id'] = incident_id
            remediation['rule_name'] = incident.get('title', 'Unknown Rule')
            remediation['database_type'] = db_dialect.value
            remediation['generated_at'] = datetime.utcnow().isoformat()
            
            return remediation
            
        except Exception as e:
            # Fallback to generic handler
            return self._handle_generic_issue(
                incident=incident,
                db_dialect=db_dialect,
                affected_tables=affected_tables,
                affected_rows=affected_rows,
                severity=severity
            )

    def _detect_database_dialect(self, source_name: str) -> DatabaseDialect:
        """
        Detect database dialect from source_name
        
        Examples:
            "MySQL Production Database" → MYSQL
            "PostgreSQL Analytics DB" → POSTGRESQL
            "MongoDB Atlas Cluster" → MONGODB
            "SQL Server Warehouse" → SQLSERVER
        """
        source_lower = source_name.lower()
        
        if 'postgres' in source_lower or 'pg' in source_lower:
            return DatabaseDialect.POSTGRESQL
        elif 'mysql' in source_lower or 'maria' in source_lower:
            return DatabaseDialect.MYSQL
        elif 'sql server' in source_lower or 'mssql' in source_lower or 'sqlserver' in source_lower:
            return DatabaseDialect.SQLSERVER
        elif 'mongo' in source_lower or 'atlas' in source_lower:
            return DatabaseDialect.MONGODB
        else:
            return DatabaseDialect.UNKNOWN

    def _find_pattern_handler(self, title: str, description: str) -> Optional[callable]:
        """Find appropriate handler based on pattern matching"""
        
        search_text = f"{title} {description}".lower()
        
        for keyword, handler in self.pattern_handlers.items():
            if keyword in search_text:
                return handler
        
        return None

    # ═══════════════════════════════════════════════════════════════════════
    # CATEGORY HANDLERS
    # ═══════════════════════════════════════════════════════════════════════

    def _handle_quality_incident(self, incident: Dict, db_dialect: DatabaseDialect,
                                 affected_tables: List[str], affected_rows: int,
                                 severity: str) -> Dict[str, Any]:
        """Handle data quality incidents (nulls, duplicates, format issues)"""
        
        title = incident.get('title', '').lower()
        description = incident.get('description', '').lower()
        
        # Delegate to specific pattern handler
        handler = self._find_pattern_handler(title, description)
        
        if handler:
            return handler(incident, db_dialect, affected_tables, affected_rows, severity)
        
        # Default quality remediation
        return self._handle_generic_quality(incident, db_dialect, affected_tables, affected_rows, severity)

    def _handle_schema_incident(self, incident: Dict, db_dialect: DatabaseDialect,
                               affected_tables: List[str], affected_rows: int,
                               severity: str) -> Dict[str, Any]:
        """Handle schema drift and schema-related incidents"""
        
        table_name = affected_tables[0] if affected_tables else "unknown_table"
        
        sql_fix = self._generate_schema_fix_sql(db_dialect, table_name, incident)
        
        return {
            "suggested_action": f"Review and apply schema changes to table '{table_name}'",
            "remediation_type": RemediationType.SCHEMA_CHANGE.value,
            "priority": RemediationPriority.HIGH.value,
            "sql_fix": sql_fix,
            "manual_steps": [
                f"1. Review schema drift details in incident description",
                f"2. Backup table '{table_name}' before applying changes",
                f"3. Test schema changes in development environment",
                f"4. Apply ALTER TABLE statements during maintenance window",
                f"5. Update application code to match new schema",
                f"6. Monitor for errors after deployment"
            ],
            "expected_improvement": f"Schema consistency restored for {len(affected_tables)} table(s)",
            "estimated_effort": "4-8 hours",
            "impact_analysis": "Schema drift can cause application errors and data integrity issues. Immediate action recommended.",
            "prevention_strategy": "Implement schema version control and automated drift detection in CI/CD pipeline"
        }

    def _handle_security_incident(self, incident: Dict, db_dialect: DatabaseDialect,
                                  affected_tables: List[str], affected_rows: int,
                                  severity: str) -> Dict[str, Any]:
        """Handle security-related incidents"""
        
        return {
            "suggested_action": "Review and remediate security vulnerability immediately",
            "remediation_type": RemediationType.INVESTIGATION.value,
            "priority": RemediationPriority.IMMEDIATE.value,
            "sql_fix": "-- Security incidents require manual investigation\n-- Review incident details and apply security patches\n-- Consult security team for remediation strategy",
            "manual_steps": [
                "1. **IMMEDIATE:** Isolate affected systems if actively exploited",
                "2. Review incident details and affected data/systems",
                "3. Consult security team and follow incident response protocol",
                "4. Apply security patches or configuration changes",
                "5. Audit access logs for unauthorized access",
                "6. Implement additional security controls",
                "7. Document incident and remediation in security log"
            ],
            "expected_improvement": "Security vulnerability mitigated",
            "estimated_effort": "Varies by severity (2-24 hours)",
            "impact_analysis": f"CRITICAL: Security incident affects {affected_rows} records. Immediate action required to prevent data breach.",
            "prevention_strategy": "Implement continuous security scanning, access controls, and security training"
        }

    def _handle_compliance_incident(self, incident: Dict, db_dialect: DatabaseDialect,
                                    affected_tables: List[str], affected_rows: int,
                                    severity: str) -> Dict[str, Any]:
        """Handle compliance-related incidents (GDPR, HIPAA, etc.)"""
        
        return {
            "suggested_action": "Address compliance violation to meet regulatory requirements",
            "remediation_type": RemediationType.PROCESS_CHANGE.value,
            "priority": RemediationPriority.HIGH.value if severity == 'critical' else RemediationPriority.MEDIUM.value,
            "sql_fix": "-- Compliance fixes depend on specific regulation\n-- Common actions: data encryption, access controls, retention policies",
            "manual_steps": [
                "1. Review specific compliance requirement violated",
                "2. Consult legal/compliance team",
                "3. Implement required controls (encryption, masking, access restrictions)",
                "4. Update data retention and deletion policies",
                "5. Document compliance remediation",
                "6. Schedule compliance audit"
            ],
            "expected_improvement": f"Compliance violation resolved for {affected_rows} records",
            "estimated_effort": "4-16 hours depending on complexity",
            "impact_analysis": "Compliance violations can result in fines and legal action. Address promptly.",
            "prevention_strategy": "Implement automated compliance checks and regular audits"
        }

    def _handle_pipeline_incident(self, incident: Dict, db_dialect: DatabaseDialect,
                                  affected_tables: List[str], affected_rows: int,
                                  severity: str) -> Dict[str, Any]:
        """Handle data pipeline issues"""
        
        return {
            "suggested_action": "Debug and fix data pipeline to restore data flow",
            "remediation_type": RemediationType.PROCESS_CHANGE.value,
            "priority": RemediationPriority.HIGH.value,
            "sql_fix": "-- Pipeline fixes require ETL/pipeline code changes\n-- Review pipeline logs and error messages",
            "manual_steps": [
                "1. Review pipeline logs and identify failure point",
                "2. Check source and target connectivity",
                "3. Validate data transformations",
                "4. Fix pipeline code or configuration",
                "5. Test pipeline in development",
                "6. Re-run failed pipeline jobs",
                "7. Monitor pipeline for 24-48 hours"
            ],
            "expected_improvement": "Data pipeline restored, data flow resumed",
            "estimated_effort": "2-8 hours",
            "impact_analysis": "Pipeline failures cause data staleness and reporting delays. Fix within 24 hours.",
            "prevention_strategy": "Implement pipeline monitoring, alerting, and retry logic"
        }

    # ═══════════════════════════════════════════════════════════════════════
    # PATTERN-SPECIFIC HANDLERS
    # ═══════════════════════════════════════════════════════════════════════

    def _handle_null_values(self, incident: Dict, db_dialect: DatabaseDialect,
                           affected_tables: List[str], affected_rows: int,
                           severity: str) -> Dict[str, Any]:
        """Handle NULL/missing values"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        column_name = self._extract_column_from_description(incident.get('description', ''))
        
        sql_fix = self._generate_null_fix_sql(db_dialect, table_name, column_name)
        
        priority = RemediationPriority.IMMEDIATE.value if severity == 'critical' else RemediationPriority.HIGH.value
        
        return {
            "suggested_action": f"Populate NULL values in '{table_name}.{column_name}'",
            "remediation_type": RemediationType.DATA_UPDATE.value,
            "priority": priority,
            "sql_fix": sql_fix,
            "manual_steps": [
                f"1. Review business rules for '{column_name}' default values",
                f"2. Check upstream data source for root cause of NULLs",
                f"3. Execute SQL update with appropriate default value",
                f"4. Add NOT NULL constraint if column is required",
                f"5. Implement validation at data ingestion layer"
            ],
            "expected_improvement": f"Will fix {affected_rows} NULL values",
            "estimated_effort": self._estimate_effort(affected_rows),
            "impact_analysis": f"NULL values in '{column_name}' cause application errors. Immediate fix recommended.",
            "prevention_strategy": "Add NOT NULL constraint and implement default value logic in ETL"
        }

    def _handle_duplicates(self, incident: Dict, db_dialect: DatabaseDialect,
                          affected_tables: List[str], affected_rows: int,
                          severity: str) -> Dict[str, Any]:
        """Handle duplicate records"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        
        sql_fix = self._generate_duplicate_fix_sql(db_dialect, table_name)
        
        return {
            "suggested_action": f"Remove duplicate records from '{table_name}'",
            "remediation_type": RemediationType.DATA_UPDATE.value,
            "priority": RemediationPriority.HIGH.value,
            "sql_fix": sql_fix,
            "manual_steps": [
                f"1. Identify primary key or unique constraint for '{table_name}'",
                f"2. Review duplicates to determine which to keep",
                f"3. Backup table before deletion",
                f"4. Execute deduplication query",
                f"5. Add UNIQUE constraint to prevent future duplicates"
            ],
            "expected_improvement": f"Will remove approximately {affected_rows // 2} duplicate records",
            "estimated_effort": self._estimate_effort(affected_rows),
            "impact_analysis": f"Duplicates cause incorrect aggregations and inflate record counts",
            "prevention_strategy": "Add UNIQUE constraint and implement UPSERT logic in ETL"
        }

    def _handle_invalid_email(self, incident: Dict, db_dialect: DatabaseDialect,
                             affected_tables: List[str], affected_rows: int,
                             severity: str) -> Dict[str, Any]:
        """Handle invalid email formats"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        column_name = self._extract_column_from_description(incident.get('description', ''))
        
        sql_fix = self._generate_email_fix_sql(db_dialect, table_name, column_name)
        
        return {
            "suggested_action": f"Clean invalid email addresses in '{table_name}.{column_name}'",
            "remediation_type": RemediationType.VALIDATION_RULE.value,
            "priority": RemediationPriority.MEDIUM.value,
            "sql_fix": sql_fix,
            "manual_steps": [
                f"1. Review invalid email examples",
                f"2. Set invalid emails to NULL or placeholder",
                f"3. Contact users to obtain valid emails",
                f"4. Implement email validation: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{{2,}}$",
                f"5. Add email verification workflow"
            ],
            "expected_improvement": f"Will identify {affected_rows} invalid emails",
            "estimated_effort": self._estimate_effort(affected_rows, "medium"),
            "impact_analysis": "Invalid emails prevent communication. May impact marketing/notifications.",
            "prevention_strategy": "Add regex validation and email verification workflow"
        }

    def _handle_invalid_phone(self, incident: Dict, db_dialect: DatabaseDialect,
                             affected_tables: List[str], affected_rows: int,
                             severity: str) -> Dict[str, Any]:
        """Handle invalid phone numbers"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        column_name = self._extract_column_from_description(incident.get('description', ''))
        
        sql_fix = self._generate_phone_fix_sql(db_dialect, table_name, column_name)
        
        return {
            "suggested_action": f"Standardize phone numbers in '{table_name}.{column_name}'",
            "remediation_type": RemediationType.DATA_UPDATE.value,
            "priority": RemediationPriority.MEDIUM.value,
            "sql_fix": sql_fix,
            "manual_steps": [
                "1. Identify expected phone format (US: +1-XXX-XXX-XXXX)",
                "2. Use regex to standardize format",
                "3. Remove invalid characters",
                "4. Validate phone length",
                "5. Implement libphonenumber for validation"
            ],
            "expected_improvement": f"Will standardize {affected_rows} phone numbers",
            "estimated_effort": self._estimate_effort(affected_rows, "medium"),
            "impact_analysis": "Inconsistent formats prevent SMS delivery and call routing",
            "prevention_strategy": "Use libphonenumber library for validation at input"
        }

    def _handle_invalid_format(self, incident: Dict, db_dialect: DatabaseDialect,
                              affected_tables: List[str], affected_rows: int,
                              severity: str) -> Dict[str, Any]:
        """Handle format/pattern violations"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        column_name = self._extract_column_from_description(incident.get('description', ''))
        
        return {
            "suggested_action": f"Enforce format validation for '{table_name}.{column_name}'",
            "remediation_type": RemediationType.VALIDATION_RULE.value,
            "priority": RemediationPriority.MEDIUM.value,
            "sql_fix": f"-- Review and standardize format for {table_name}.{column_name}\n-- Add CHECK constraint or validation trigger",
            "manual_steps": [
                "1. Review expected format specification",
                "2. Create data cleansing script",
                "3. Add CHECK constraint or trigger",
                "4. Update application validation"
            ],
            "expected_improvement": f"Will validate {affected_rows} format violations",
            "estimated_effort": self._estimate_effort(affected_rows, "medium"),
            "impact_analysis": "Format inconsistencies cause parsing errors",
            "prevention_strategy": "Add regex validation and input masking"
        }

    def _handle_out_of_range(self, incident: Dict, db_dialect: DatabaseDialect,
                            affected_tables: List[str], affected_rows: int,
                            severity: str) -> Dict[str, Any]:
        """Handle out-of-range values"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        column_name = self._extract_column_from_description(incident.get('description', ''))
        
        return {
            "suggested_action": f"Correct out-of-range values in '{table_name}.{column_name}'",
            "remediation_type": RemediationType.DATA_UPDATE.value,
            "priority": RemediationPriority.HIGH.value,
            "sql_fix": f"-- Cap values at range boundaries or set to NULL\n-- UPDATE {table_name} SET {column_name} = ... WHERE {column_name} < min OR {column_name} > max",
            "manual_steps": [
                "1. Confirm acceptable range",
                "2. Review out-of-range values",
                "3. Determine correction strategy",
                "4. Execute correction query",
                "5. Add CHECK constraint"
            ],
            "expected_improvement": f"Will correct {affected_rows} out-of-range values",
            "estimated_effort": self._estimate_effort(affected_rows),
            "impact_analysis": "Out-of-range values cause calculation errors",
            "prevention_strategy": "Add CHECK constraint and input validation"
        }

    def _handle_schema_drift(self, incident: Dict, db_dialect: DatabaseDialect,
                            affected_tables: List[str], affected_rows: int,
                            severity: str) -> Dict[str, Any]:
        """Handle schema drift incidents"""
        return self._handle_schema_incident(incident, db_dialect, affected_tables, affected_rows, severity)

    def _handle_referential_integrity(self, incident: Dict, db_dialect: DatabaseDialect,
                                     affected_tables: List[str], affected_rows: int,
                                     severity: str) -> Dict[str, Any]:
        """Handle referential integrity violations"""
        
        table_name = affected_tables[0] if affected_tables else "table_name"
        
        sql_fix = self._generate_fk_fix_sql(db_dialect, table_name)
        
        return {
            "suggested_action": f"Resolve referential integrity violations in '{table_name}'",
            "remediation_type": RemediationType.REFERENCE_DATA.value,
            "priority": RemediationPriority.IMMEDIATE.value if severity == 'critical' else RemediationPriority.HIGH.value,
            "sql_fix": sql_fix,
            "manual_steps": [
                "1. Identify parent table and foreign key relationship",
                "2. Review orphaned records",
                "3. Determine strategy: delete orphans or create missing parents",
                "4. Backup affected tables",
                "5. Execute cleanup query",
                "6. Add FOREIGN KEY constraint if missing"
            ],
            "expected_improvement": f"Will resolve {affected_rows} orphaned records",
            "estimated_effort": self._estimate_effort(affected_rows, "high"),
            "impact_analysis": "Referential integrity violations cause JOIN failures and data inconsistency",
            "prevention_strategy": "Add FOREIGN KEY constraints and enable CASCADE rules"
        }

    def _handle_generic_quality(self, incident: Dict, db_dialect: DatabaseDialect,
                                affected_tables: List[str], affected_rows: int,
                                severity: str) -> Dict[str, Any]:
        """Generic quality incident handler"""
        
        table_name = affected_tables[0] if affected_tables else "unknown_table"
        
        return {
            "suggested_action": f"Manual investigation required for data quality issue in '{table_name}'",
            "remediation_type": RemediationType.INVESTIGATION.value,
            "priority": RemediationPriority.MEDIUM.value,
            "sql_fix": f"-- Generic investigation query for {table_name}\nSELECT * FROM {table_name} LIMIT 100;",
            "manual_steps": [
                "1. Review incident description and affected data",
                "2. Identify root cause",
                "3. Develop custom remediation strategy",
                "4. Test fix on sample data",
                "5. Execute fix and validate"
            ],
            "expected_improvement": f"Manual review required ({affected_rows} records affected)",
            "estimated_effort": "Unknown - requires investigation",
            "impact_analysis": f"Data quality issue affects {affected_rows} records. Manual investigation needed.",
            "prevention_strategy": "After analysis, implement appropriate validation rules"
        }

    def _handle_generic_issue(self, incident: Dict, db_dialect: DatabaseDialect,
                             affected_tables: List[str], affected_rows: int,
                             severity: str) -> Dict[str, Any]:
        """Fallback generic handler"""
        
        return {
            "suggested_action": "Manual investigation required for this incident",
            "remediation_type": RemediationType.INVESTIGATION.value,
            "priority": RemediationPriority.MEDIUM.value,
            "sql_fix": "-- Manual investigation required\n-- Review incident details and develop custom solution",
            "manual_steps": [
                "1. Review incident details thoroughly",
                "2. Identify root cause and impact",
                "3. Develop remediation strategy",
                "4. Test solution",
                "5. Execute and validate"
            ],
            "expected_improvement": "Requires manual assessment",
            "estimated_effort": "Unknown",
            "impact_analysis": "Manual investigation needed to determine impact",
            "prevention_strategy": "After resolution, implement preventive measures"
        }

    # ═══════════════════════════════════════════════════════════════════════
    # SQL GENERATION (MULTI-DATABASE)
    # ═══════════════════════════════════════════════════════════════════════

    def _generate_null_fix_sql(self, dialect: DatabaseDialect, table: str, column: str) -> str:
        """Generate dialect-specific NULL fix SQL"""
        
        if dialect == DatabaseDialect.MONGODB:
            return f"""// Fix NULL values in MongoDB
db.{table}.updateMany(
  {{ {column}: null }},
  {{ $set: {{ {column}: "DEFAULT_VALUE" }} }}
);

// Count NULL values
db.{table}.countDocuments({{ {column}: null }});
"""
        
        # SQL databases (Postgres, MySQL, SQL Server)
        return f"""-- Fix NULL values in {table}.{column}
-- Step 1: Count NULLs
SELECT COUNT(*) as null_count
FROM {table}
WHERE {column} IS NULL;

-- Step 2: Update with default value
UPDATE {table}
SET {column} = 'DEFAULT_VALUE'  -- Replace with appropriate default
WHERE {column} IS NULL;

-- Step 3: Add NOT NULL constraint (optional)
ALTER TABLE {table}
{"MODIFY COLUMN" if dialect == DatabaseDialect.MYSQL else "ALTER COLUMN"} {column} VARCHAR(255) NOT NULL;
"""

    def _generate_duplicate_fix_sql(self, dialect: DatabaseDialect, table: str) -> str:
        """Generate dialect-specific deduplication SQL"""
        
        if dialect == DatabaseDialect.MONGODB:
            return f"""// Remove duplicates from MongoDB
// Step 1: Find duplicates
db.{table}.aggregate([
  {{ $group: {{ _id: "$unique_field", count: {{ $sum: 1 }} }} }},
  {{ $match: {{ count: {{ $gt: 1 }} }} }}
]);

// Step 2: Delete duplicates (keep first occurrence)
// Manual cleanup required - review duplicates first
"""
        
        # SQL databases
        if dialect == DatabaseDialect.SQLSERVER:
            return f"""-- Remove duplicates (SQL Server)
WITH CTE AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY unique_column ORDER BY id) AS rn
  FROM {table}
)
DELETE FROM CTE WHERE rn > 1;
"""
        
        return f"""-- Remove duplicates
-- Step 1: Identify duplicates
SELECT unique_column, COUNT(*) as count
FROM {table}
GROUP BY unique_column
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates (keep first occurrence)
DELETE FROM {table}
WHERE id NOT IN (
  SELECT MIN(id)
  FROM {table}
  GROUP BY unique_column
);

-- Step 3: Add UNIQUE constraint
ALTER TABLE {table}
ADD CONSTRAINT unique_constraint UNIQUE (unique_column);
"""

    def _generate_email_fix_sql(self, dialect: DatabaseDialect, table: str, column: str) -> str:
        """Generate email validation SQL"""
        
        if dialect == DatabaseDialect.MONGODB:
            return f"""// Fix invalid emails in MongoDB
// Set invalid emails to null
db.{table}.updateMany(
  {{ {column}: {{ $not: {{ $regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{{2,}}$/ }} }} }},
  {{ $set: {{ {column}: null }} }}
);
"""
        
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        
        if dialect == DatabaseDialect.SQLSERVER:
            return f"""-- Fix invalid emails (SQL Server)
UPDATE {table}
SET {column} = NULL
WHERE {column} NOT LIKE '%_@__%.__%';
"""
        
        return f"""-- Fix invalid emails
-- Step 1: Clean emails (lowercase, trim)
UPDATE {table}
SET {column} = LOWER(TRIM({column}))
WHERE {column} IS NOT NULL;

-- Step 2: Set invalid emails to NULL
UPDATE {table}
SET {column} = NULL
WHERE {column} NOT {"REGEXP" if dialect == DatabaseDialect.MYSQL else "~"} '{email_regex}';
"""

    def _generate_phone_fix_sql(self, dialect: DatabaseDialect, table: str, column: str) -> str:
        """Generate phone standardization SQL"""
        
        if dialect == DatabaseDialect.MONGODB:
            return f"""// Standardize phone numbers in MongoDB
// Requires application-level processing with library like libphonenumber
// Example: Remove non-numeric characters
db.{table}.find().forEach(function(doc) {{
  if (doc.{column}) {{
    var cleaned = doc.{column}.replace(/[^0-9+]/g, '');
    db.{table}.updateOne(
      {{ _id: doc._id }},
      {{ $set: {{ {column}: cleaned }} }}
    );
  }}
}});
"""
        
        return f"""-- Standardize phone numbers
-- Step 1: Remove non-numeric characters (except +)
UPDATE {table}
SET {column} = REGEXP_REPLACE({column}, '[^0-9+]', '')
WHERE {column} IS NOT NULL;

-- Step 2: Validate phone length
UPDATE {table}
SET {column} = NULL
WHERE LENGTH(REGEXP_REPLACE({column}, '[^0-9]', '')) < 10
   OR LENGTH(REGEXP_REPLACE({column}, '[^0-9]', '')) > 15;
"""

    def _generate_schema_fix_sql(self, dialect: DatabaseDialect, table: str, incident: Dict) -> str:
        """Generate schema change SQL"""
        
        if dialect == DatabaseDialect.MONGODB:
            return f"""// Schema changes in MongoDB
// MongoDB is schema-less, but you may need to:
// 1. Add missing fields with default values
db.{table}.updateMany(
  {{ new_field: {{ $exists: false }} }},
  {{ $set: {{ new_field: "default_value" }} }}
);

// 2. Rename fields
db.{table}.updateMany(
  {{}},
  {{ $rename: {{ old_field: "new_field" }} }}
);
"""
        
        return f"""-- Schema drift remediation for {table}
-- Review incident description for specific changes required
-- Common actions:

-- Add missing column
ALTER TABLE {table}
ADD COLUMN new_column VARCHAR(255);

-- Modify column type
ALTER TABLE {table}
{"MODIFY COLUMN" if dialect == DatabaseDialect.MYSQL else "ALTER COLUMN"} existing_column VARCHAR(500);

-- Drop column (if needed)
-- ALTER TABLE {table}
-- DROP COLUMN deprecated_column;
"""

    def _generate_fk_fix_sql(self, dialect: DatabaseDialect, table: str) -> str:
        """Generate foreign key violation fix SQL"""
        
        if dialect == DatabaseDialect.MONGODB:
            return f"""// Fix referential integrity in MongoDB
// Step 1: Find orphaned documents
db.{table}.find({{
  foreign_key_field: {{
    $nin: db.parent_collection.distinct("_id")
  }}
}});

// Step 2: Delete orphaned documents
db.{table}.deleteMany({{
  foreign_key_field: {{
    $nin: db.parent_collection.distinct("_id")
  }}
}});
"""
        
        return f"""-- Fix referential integrity violations
-- Step 1: Find orphaned records
SELECT t1.*
FROM {table} t1
LEFT JOIN parent_table t2 ON t1.foreign_key = t2.id
WHERE t2.id IS NULL;

-- Step 2: Delete orphaned records (OR update to valid FK)
DELETE FROM {table}
WHERE foreign_key NOT IN (SELECT id FROM parent_table);

-- Step 3: Add FOREIGN KEY constraint
ALTER TABLE {table}
ADD CONSTRAINT fk_{table}_parent
FOREIGN KEY (foreign_key) REFERENCES parent_table(id)
ON DELETE CASCADE;
"""

    # ═══════════════════════════════════════════════════════════════════════
    # UTILITY METHODS
    # ═══════════════════════════════════════════════════════════════════════

    def _extract_column_from_description(self, description: str) -> str:
        """Extract column name from incident description"""
        
        # Common patterns: "column_name", "table.column", "field 'column_name'"
        patterns = [
            r"'([a-zA-Z_][a-zA-Z0-9_]*)'",  # 'column_name'
            r'"([a-zA-Z_][a-zA-Z0-9_]*)"',  # "column_name"
            r'\b([a-zA-Z_][a-zA-Z0-9_]*)\b\s+column',  # column_name column
            r'column\s+([a-zA-Z_][a-zA-Z0-9_]*)',  # column column_name
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return "column_name"  # Default fallback

    def _estimate_effort(self, affected_rows: int, complexity: str = "low") -> str:
        """Estimate effort required for remediation"""
        
        complexity_multiplier = {
            "low": 1,
            "medium": 2,
            "high": 3
        }
        
        multiplier = complexity_multiplier.get(complexity, 1)
        
        if affected_rows < 100:
            base_time = 0.5
        elif affected_rows < 1000:
            base_time = 2
        elif affected_rows < 10000:
            base_time = 4
        elif affected_rows < 100000:
            base_time = 8
        else:
            base_time = 16
        
        estimated_hours = base_time * multiplier
        
        if estimated_hours < 1:
            return "< 1 hour"
        elif estimated_hours < 8:
            return f"{int(estimated_hours)} hours"
        else:
            return f"{int(estimated_hours / 8)} days"


# ═══════════════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

def generate_remediation_report(incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate comprehensive remediation report
    
    Args:
        incidents: List of incident dictionaries from MongoDB
        
    Returns:
        Complete remediation report with prioritized actions
    """
    engine = SmartRemediationEngine()
    remediation_plan = engine.generate_remediation_plan(incidents)
    
    # Generate summary statistics
    total_incidents = len(incidents)
    total_remediations = len(remediation_plan)
    
    priority_breakdown = {'immediate': 0, 'high': 0, 'medium': 0, 'low': 0}
    type_breakdown = {}
    
    for remediation in remediation_plan.values():
        priority = remediation.get('priority', 'medium')
        rem_type = remediation.get('remediation_type', 'investigation')
        
        priority_breakdown[priority] = priority_breakdown.get(priority, 0) + 1
        type_breakdown[rem_type] = type_breakdown.get(rem_type, 0) + 1
    
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "total_incidents": total_incidents,
        "total_remediations": total_remediations,
        "priority_breakdown": priority_breakdown,
        "type_breakdown": type_breakdown,
        "remediation_plan": remediation_plan,
        "summary": {
            "immediate_actions": priority_breakdown.get('immediate', 0),
            "high_priority_actions": priority_breakdown.get('high', 0),
            "estimated_total_effort": f"{total_remediations * 2} hours (estimated)",
            "recommendation": "Prioritize immediate and high-priority actions within 7 days"
        }
    }
