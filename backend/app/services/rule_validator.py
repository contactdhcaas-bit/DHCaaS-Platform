"""
Data Quality Rules Validator Service
Core validation engine that executes rules and detects violations
"""

import re
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import logging
import os

from app.models.rule import (
    RuleType,
    Severity,
    RuleScope,
    DataQualityRuleInDB,
    RuleViolationCreate,
    ValidationReport
)
from app.core.database import (
    get_scan_by_job_id,
    get_rules_by_job_id,
    create_violation,
    create_violations_bulk,
    update_rule_stats,
    save_rule_execution,
    get_violations_summary
)

logger = logging.getLogger(__name__)

# ============================================================================
# RULE VALIDATOR ENGINE
# ============================================================================

class RuleValidator:
    """
    Core validation engine for data quality rules.
    
    Executes rules against dataset and records violations.
    Supports: NOT_NULL, UNIQUE, REGEX, RANGE, ENUM, EMAIL, PHONE, etc.
    """
    
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.scan_data = None
        self.df = None
        self.violations = []
        
    async def load_scan_data(self) -> bool:
        """
        Load scan results from database and CSV data.
        
        Returns:
            True if data loaded successfully
        """
        try:
            self.scan_data = await get_scan_by_job_id(self.job_id)
            
            if not self.scan_data:
                logger.error(f"Scan not found: {self.job_id}")
                return False
            
            # Load CSV data into dataframe
            # Try to load from file_path if exists
            if "file_path" in self.scan_data and self.scan_data["file_path"]:
                file_path = self.scan_data["file_path"]
                if os.path.exists(file_path):
                    logger.info(f"Loading data from file: {file_path}")
                    self.df = pd.read_csv(file_path)
                    logger.info(f"Loaded {len(self.df)} rows from CSV")
                    return True
            
            # Fallback: Load from scan_results.sample_data
            if "scan_results" in self.scan_data and "sample_data" in self.scan_data["scan_results"]:
                sample_data = self.scan_data["scan_results"]["sample_data"]
                if sample_data:
                    logger.info(f"Loading data from scan_results.sample_data")
                    self.df = pd.DataFrame(sample_data)
                    logger.info(f"Loaded {len(self.df)} rows from sample_data")
                    return True
            
            logger.warning(f"No data found for job: {self.job_id}")
            return False
            
        except Exception as e:
            logger.error(f"Error loading scan data: {e}")
            return False
    
    async def validate_all_rules(self) -> ValidationReport:
        """
        Execute all active rules for this dataset.
        
        Returns:
            ValidationReport with results and violations
        """
        try:
            # Load scan data
            if not await self.load_scan_data():
                raise Exception("Failed to load scan data")
            
            # Get all active rules for this job
            rules = await get_rules_by_job_id(self.job_id, active_only=True)
            
            if not rules:
                logger.warning(f"No active rules found for job: {self.job_id}")
                return self._generate_empty_report()
            
            logger.info(f"Validating {len(rules)} rules for job: {self.job_id}")
            
            # Execute each rule
            rules_passed = 0
            rules_failed = 0
            
            for rule in rules:
                try:
                    passed = await self._execute_rule(rule)
                    
                    if passed:
                        rules_passed += 1
                    else:
                        rules_failed += 1
                        
                except Exception as e:
                    logger.error(f"Error executing rule {rule.get('rule_id')}: {e}")
                    rules_failed += 1
            
            # Save all violations in bulk
            if self.violations:
                await create_violations_bulk(self.violations)
                logger.info(f"Recorded {len(self.violations)} violations")
            
            # Generate report
            report = await self._generate_report(
                total_rules=len(rules),
                rules_passed=rules_passed,
                rules_failed=rules_failed
            )
            
            logger.info(
                f"Validation complete | "
                f"Rules: {len(rules)} | "
                f"Passed: {rules_passed} | "
                f"Failed: {rules_failed} | "
                f"Violations: {len(self.violations)}"
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Error during validation: {e}")
            raise
    
    async def _execute_rule(self, rule: Dict[str, Any]) -> bool:
        """
        Execute a single rule.
        
        Args:
            rule: Rule definition from database
        
        Returns:
            True if rule passed (no violations)
        """
        rule_id = rule.get("rule_id")
        rule_type = rule.get("rule_type")
        column_name = rule.get("column_name")
        parameters = rule.get("parameters", {})
        
        logger.debug(f"Executing rule: {rule.get('rule_name')} ({rule_type})")
        
        violations_before = len(self.violations)
        
        try:
            # Route to appropriate validator
            if rule_type == RuleType.NOT_NULL:
                await self._validate_not_null(rule)
            
            elif rule_type == RuleType.UNIQUE:
                await self._validate_unique(rule)
            
            elif rule_type == RuleType.REGEX:
                await self._validate_regex(rule)
            
            elif rule_type == RuleType.RANGE:
                await self._validate_range(rule)
            
            elif rule_type == RuleType.ENUM:
                await self._validate_enum(rule)
            
            elif rule_type == RuleType.EMAIL:
                await self._validate_email(rule)
            
            elif rule_type == RuleType.PHONE:
                await self._validate_phone(rule)
            
            elif rule_type == RuleType.DATE_FORMAT:
                await self._validate_date_format(rule)
            
            elif rule_type == RuleType.LENGTH:
                await self._validate_length(rule)
            
            elif rule_type == RuleType.MIN_VALUE:
                await self._validate_min_value(rule)
            
            elif rule_type == RuleType.MAX_VALUE:
                await self._validate_max_value(rule)
            
            else:
                logger.warning(f"Unsupported rule type: {rule_type}")
            
            # Check if violations were added
            violations_count = len(self.violations) - violations_before
            passed = violations_count == 0
            
            # Update rule statistics
            await update_rule_stats(
                rule_id=rule_id,
                violations_count=violations_count,
                passed=passed
            )
            
            # Log execution history
            await save_rule_execution({
                "rule_id": rule_id,
                "job_id": self.job_id,
                "passed": passed,
                "violations_count": violations_count,
                "executed_at": datetime.utcnow()
            })
            
            return passed
            
        except Exception as e:
            logger.error(f"Error executing rule {rule_id}: {e}")
            return False
    
    # ========================================================================
    # VALIDATION METHODS FOR EACH RULE TYPE
    # ========================================================================
    
    async def _validate_not_null(self, rule: Dict[str, Any]):
        """Validate that column has no null values"""
        column_name = rule.get("column_name")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Count null values in dataframe
        null_count = self.df[column_name].isnull().sum()
        
        if null_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "invalid_value": None,
                "violation_message": f"Column '{column_name}' contains {null_count} null values",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"null_count": int(null_count)}
            })
    
    async def _validate_unique(self, rule: Dict[str, Any]):
        """Validate that column values are unique"""
        column_name = rule.get("column_name")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Count duplicates in dataframe
        duplicate_count = self.df[column_name].duplicated().sum()
        
        if duplicate_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {duplicate_count} duplicate values",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"duplicate_count": int(duplicate_count)}
            })
    
    async def _validate_regex(self, rule: Dict[str, Any]):
        """Validate that values match regex pattern"""
        column_name = rule.get("column_name")
        pattern = rule.get("parameters", {}).get("pattern")
        
        if not pattern:
            logger.warning(f"REGEX rule missing pattern parameter: {rule.get('rule_id')}")
            return
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Validate regex pattern
        invalid_count = (~self.df[column_name].astype(str).str.match(pattern)).sum()
        
        if invalid_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {invalid_count} values not matching pattern",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"invalid_count": int(invalid_count), "pattern": pattern}
            })
    
    async def _validate_range(self, rule: Dict[str, Any]):
        """Validate that numeric values are within range"""
        column_name = rule.get("column_name")
        params = rule.get("parameters", {})
        min_val = params.get("min")
        max_val = params.get("max")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Convert to numeric
        numeric_col = pd.to_numeric(self.df[column_name], errors='coerce')
        
        violations_count = 0
        if min_val is not None:
            violations_count += (numeric_col < min_val).sum()
        if max_val is not None:
            violations_count += (numeric_col > max_val).sum()
        
        if violations_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {violations_count} values outside range [{min_val}, {max_val}]",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"violations_count": int(violations_count), "min": min_val, "max": max_val}
            })
    
    async def _validate_enum(self, rule: Dict[str, Any]):
        """Validate that values are in allowed list"""
        column_name = rule.get("column_name")
        allowed_values = rule.get("parameters", {}).get("allowed_values", [])
        
        if not allowed_values:
            logger.warning(f"ENUM rule missing allowed_values: {rule.get('rule_id')}")
            return
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Count values not in allowed list
        invalid_count = (~self.df[column_name].isin(allowed_values)).sum()
        
        if invalid_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {invalid_count} values not in allowed list",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"invalid_count": int(invalid_count), "allowed_values": allowed_values}
            })
    
    async def _validate_email(self, rule: Dict[str, Any]):
        """Validate email format"""
        column_name = rule.get("column_name")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Email regex pattern
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        # Count invalid emails
        invalid_count = (~self.df[column_name].astype(str).str.match(email_pattern, na=False)).sum()
        
        if invalid_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {invalid_count} invalid email addresses",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"invalid_count": int(invalid_count)}
            })
    
    async def _validate_phone(self, rule: Dict[str, Any]):
        """Validate phone number format"""
        column_name = rule.get("column_name")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Phone regex pattern (international format)
        phone_pattern = r'^\+?[1-9]\d{1,14}$'
        
        # Count invalid phones
        invalid_count = (~self.df[column_name].astype(str).str.match(phone_pattern, na=False)).sum()
        
        if invalid_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {invalid_count} invalid phone numbers",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"invalid_count": int(invalid_count)}
            })
    
    async def _validate_date_format(self, rule: Dict[str, Any]):
        """Validate date format"""
        column_name = rule.get("column_name")
        date_format = rule.get("parameters", {}).get("format", "%Y-%m-%d")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Try to parse dates
        try:
            pd.to_datetime(self.df[column_name], format=date_format, errors='raise')
        except:
            invalid_count = pd.to_datetime(self.df[column_name], format=date_format, errors='coerce').isnull().sum()
            
            if invalid_count > 0:
                self.violations.append({
                    "rule_id": rule.get("rule_id"),
                    "job_id": self.job_id,
                    "column_name": column_name,
                    "violation_message": f"Column '{column_name}' contains {invalid_count} invalid dates",
                    "severity": rule.get("severity"),
                    "rule_type": rule.get("rule_type"),
                    "detected_at": datetime.utcnow(),
                    "is_resolved": False,
                    "additional_info": {"invalid_count": int(invalid_count), "format": date_format}
                })
    
    async def _validate_length(self, rule: Dict[str, Any]):
        """Validate string length"""
        column_name = rule.get("column_name")
        params = rule.get("parameters", {})
        min_length = params.get("min_length")
        max_length = params.get("max_length")
        
        if self.df is None or column_name not in self.df.columns:
            logger.warning(f"Column not found: {column_name}")
            return
        
        # Get string lengths
        lengths = self.df[column_name].astype(str).str.len()
        
        violations_count = 0
        if min_length is not None:
            violations_count += (lengths < min_length).sum()
        if max_length is not None:
            violations_count += (lengths > max_length).sum()
        
        if violations_count > 0:
            self.violations.append({
                "rule_id": rule.get("rule_id"),
                "job_id": self.job_id,
                "column_name": column_name,
                "violation_message": f"Column '{column_name}' contains {violations_count} values with invalid length",
                "severity": rule.get("severity"),
                "rule_type": rule.get("rule_type"),
                "detected_at": datetime.utcnow(),
                "is_resolved": False,
                "additional_info": {"violations_count": int(violations_count), "min_length": min_length, "max_length": max_length}
            })
    
    async def _validate_min_value(self, rule: Dict[str, Any]):
        """Validate minimum value"""
        await self._validate_range(rule)
    
    async def _validate_max_value(self, rule: Dict[str, Any]):
        """Validate maximum value"""
        await self._validate_range(rule)
    
    # ========================================================================
    # REPORT GENERATION
    # ========================================================================
    
    async def _generate_report(
        self,
        total_rules: int,
        rules_passed: int,
        rules_failed: int
    ) -> ValidationReport:
        """
        Generate comprehensive validation report.
        
        Args:
            total_rules: Total rules executed
            rules_passed: Number of rules that passed
            rules_failed: Number of rules that failed
        
        Returns:
            ValidationReport object
        """
        # Get violations summary
        summary = await get_violations_summary(self.job_id)
        
        # Calculate quality score
        quality_score = (rules_passed / max(total_rules, 1)) * 100
        
        # Determine overall status
        critical_count = summary.get("by_severity", {}).get("CRITICAL", {}).get("unresolved", 0)
        high_count = summary.get("by_severity", {}).get("HIGH", {}).get("unresolved", 0)
        
        if critical_count > 0:
            overall_status = "FAILED"
        elif high_count > 0:
            overall_status = "WARNING"
        else:
            overall_status = "PASSED"
        
        return ValidationReport(
            job_id=self.job_id,
            dataset_name=self.scan_data.get("datasource_name", "Unknown"),
            validation_date=datetime.utcnow(),
            total_rules_executed=total_rules,
            total_rules_passed=rules_passed,
            total_rules_failed=rules_failed,
            total_violations=summary.get("total", 0),
            critical_violations=summary.get("by_severity", {}).get("CRITICAL", {}).get("total", 0),
            high_violations=summary.get("by_severity", {}).get("HIGH", {}).get("total", 0),
            medium_violations=summary.get("by_severity", {}).get("MEDIUM", {}).get("total", 0),
            low_violations=summary.get("by_severity", {}).get("LOW", {}).get("total", 0),
            overall_status=overall_status,
            quality_score=round(quality_score, 2)
        )
    
    def _generate_empty_report(self) -> ValidationReport:
        """Generate empty report when no rules exist"""
        return ValidationReport(
            job_id=self.job_id,
            dataset_name=self.scan_data.get("datasource_name", "Unknown") if self.scan_data else "Unknown",
            validation_date=datetime.utcnow(),
            total_rules_executed=0,
            total_rules_passed=0,
            total_rules_failed=0,
            total_violations=0,
            critical_violations=0,
            high_violations=0,
            medium_violations=0,
            low_violations=0,
            overall_status="NO_RULES",
            quality_score=0.0
        )

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def validate_dataset(job_id: str) -> ValidationReport:
    """
    Convenience function to validate a dataset.
    
    Args:
        job_id: Scan job identifier
    
    Returns:
        ValidationReport with results
    
    Usage:
        report = await validate_dataset("scan_123")
    """
    validator = RuleValidator(job_id)
    return await validator.validate_all_rules()

async def validate_single_rule(rule_id: str, job_id: str) -> Tuple[bool, int]:
    """
    Validate a single rule.
    
    Args:
        rule_id: Rule identifier
        job_id: Scan job identifier
    
    Returns:
        Tuple of (passed: bool, violations_count: int)
    """
    from app.core.database import get_rule_by_id
    
    validator = RuleValidator(job_id)
    await validator.load_scan_data()
    
    rule = await get_rule_by_id(rule_id)
    if not rule:
        raise ValueError(f"Rule not found: {rule_id}")
    
    violations_before = len(validator.violations)
    passed = await validator._execute_rule(rule)
    violations_count = len(validator.violations) - violations_before
    
    # Save violations
    if validator.violations:
        await create_violations_bulk(validator.violations)
    
    return passed, violations_count
