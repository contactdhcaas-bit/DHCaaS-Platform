# backend/app/services/scan_engine.py
"""
Data Quality Scan Engine
Performs real data quality checks on databases and DataFrames using Pandas and SQLAlchemy.
"""

import pandas as pd
from sqlalchemy import create_engine, inspect, text, MetaData, Table
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, List, Any, Optional, Tuple
from functools import lru_cache
import logging
from datetime import datetime
import re
import tempfile
import sqlite3
import os
import io

# NEW IMPORTS FOR S3 + MX VALIDATION
import boto3
from botocore.exceptions import BotoCoreError, ClientError
import dns.resolver
import dns.exception

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: EMAIL MX VALIDATION WITH CACHING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@lru_cache(maxsize=1000)
def check_mx_record(domain: str, timeout: int = 5) -> Dict[str, Any]:
    """
    Check if domain has valid MX records (cached).
    
    Args:
        domain: Email domain (e.g., "gmail.com")
        timeout: DNS query timeout in seconds
        
    Returns:
        Dict with validation result
    """
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = timeout
        
        mx_records = resolver.resolve(domain, 'MX')
        mx_hosts = [str(record.exchange) for record in mx_records]
        
        if mx_hosts:
            return {
                "valid": True,
                "reason": "valid",
                "mx_hosts": mx_hosts
            }
        else:
            return {
                "valid": False,
                "reason": "no_mx_record",
                "mx_hosts": None
            }
            
    except dns.resolver.NXDOMAIN:
        return {
            "valid": False,
            "reason": "domain_not_found",
            "mx_hosts": None
        }
        
    except dns.resolver.NoAnswer:
        return {
            "valid": False,
            "reason": "no_mx_record",
            "mx_hosts": None
        }
        
    except dns.resolver.Timeout:
        logger.warning(f"⚠️ DNS timeout for domain: {domain}")
        return {
            "valid": None,
            "reason": "dns_timeout",
            "mx_hosts": None
        }
        
    except Exception as e:
        logger.warning(f"⚠️ DNS error for domain {domain}: {str(e)}")
        return {
            "valid": None,
            "reason": "dns_error",
            "mx_hosts": None
        }


def extract_domain_from_email(email: str) -> Optional[str]:
    """Extract domain from email address."""
    try:
        if '@' in email:
            return email.split('@')[1].strip().lower()
        return None
    except:
        return None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: S3 FILE LOADING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def load_dataframe_from_s3(
    bucket: str,
    key: str,
    aws_access_key_id: Optional[str] = None,
    aws_secret_access_key: Optional[str] = None,
    region: Optional[str] = None,
    file_format: str = "csv"
) -> pd.DataFrame:
    """
    Load DataFrame from S3 file.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key (file path)
        aws_access_key_id: AWS access key (optional)
        aws_secret_access_key: AWS secret key (optional)
        region: AWS region
        file_format: File format ("csv" or "json")
        
    Returns:
        Pandas DataFrame
    """
    logger.info(f"📥 Loading file from S3: s3://{bucket}/{key}")
    
    try:
        s3_config = {}
        if aws_access_key_id and aws_secret_access_key:
            s3_config['aws_access_key_id'] = aws_access_key_id
            s3_config['aws_secret_access_key'] = aws_secret_access_key
        if region:
            s3_config['region_name'] = region
            
        s3_client = boto3.client('s3', **s3_config)
        
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = response['Body'].read()
        
        if file_format.lower() == "csv":
            df = pd.read_csv(io.BytesIO(file_content))
            logger.info(f"✅ Loaded CSV: {len(df)} rows, {len(df.columns)} columns")
            
        elif file_format.lower() == "json":
            df = pd.read_json(io.BytesIO(file_content))
            logger.info(f"✅ Loaded JSON: {len(df)} rows, {len(df.columns)} columns")
            
        else:
            raise ValueError(f"Unsupported file format: {file_format}")
        
        return df
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        logger.error(f"❌ S3 access error [{error_code}]: {error_msg}")
        raise
        
    except Exception as e:
        logger.error(f"❌ Failed to load S3 file: {str(e)}")
        raise


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN SCAN ENGINE CLASS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ScanEngine:
    """
    Core scanning engine for data quality checks.
    Supports PostgreSQL, MySQL, SQLite databases, CSV/JSON files, and S3.
    """

    def __init__(
        self,
        connection_string: Optional[str] = None,
        source_type: str = "database",
        dataframe: Optional[pd.DataFrame] = None,
        table_name: str = "data_table",
        s3_config: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the scan engine.

        Args:
            connection_string: SQLAlchemy database URL
            source_type: "database", "dataframe", or "s3"
            dataframe: Pandas DataFrame (for dataframe mode)
            table_name: Table name to use
            s3_config: S3 configuration dict (for s3 mode)
        """
        self.source_type = source_type
        self.table_name = table_name
        self.engine = None
        self.inspector = None
        self.temp_db_path = None
        self.df = dataframe

        if source_type == "s3":
            if s3_config is None:
                raise ValueError("s3_config must be provided for s3 source type")
            
            df = load_dataframe_from_s3(
                bucket=s3_config.get("bucket"),
                key=s3_config.get("key"),
                aws_access_key_id=s3_config.get("aws_access_key_id"),
                aws_secret_access_key=s3_config.get("aws_secret_access_key"),
                region=s3_config.get("region"),
                file_format=s3_config.get("file_format", "csv")
            )
            
            self.df = df
            self._setup_dataframe_source(df, table_name)
            
        elif source_type == "dataframe":
            if dataframe is None:
                raise ValueError("DataFrame must be provided for dataframe source type")
            self._setup_dataframe_source(dataframe, table_name)
            
        elif source_type == "database":
            if connection_string is None:
                raise ValueError("Connection string must be provided for database source type")
            self.db_url = connection_string
            self._connect()
            
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

    def _setup_dataframe_source(self, df: pd.DataFrame, table_name: str):
        """
        Setup a temporary SQLite database from a DataFrame.
        
        Args:
            df: Pandas DataFrame to load
            table_name: Name for the table in temporary database
        """
        try:
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.db', delete=False)
            self.temp_db_path = temp_file.name
            temp_file.close()
            
            self.db_url = f"sqlite:///{self.temp_db_path}"
            self.engine = create_engine(self.db_url, echo=False)
            
            df.to_sql(table_name, self.engine, if_exists='replace', index=False)
            
            self.inspector = inspect(self.engine)
            self.table_name = table_name
            
            logger.info(f"✅ DataFrame loaded into temporary database: {table_name}")
            logger.info(f"📊 Rows: {len(df)}, Columns: {len(df.columns)}")
            
        except Exception as e:
            logger.error(f"❌ Failed to setup DataFrame source: {str(e)}")
            raise

    def _connect(self):
        """Establish database connection."""
        try:
            self.engine = create_engine(self.db_url, echo=False)
            
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            self.inspector = inspect(self.engine)
            
            logger.info(f"✅ Database connected: {self.db_url.split('@')[-1]}")
            
        except SQLAlchemyError as e:
            logger.error(f"❌ Database connection failed: {str(e)}")
            raise

    def get_table_stats(self, table_name: str, schema: Optional[str] = None) -> Dict[str, Any]:
        """Get basic statistics about a table."""
        try:
            if schema:
                full_table_name = f"{schema}.{table_name}"
            else:
                full_table_name = table_name

            with self.engine.connect() as conn:
                count_query = f"SELECT COUNT(*) as row_count FROM {full_table_name}"
                result = conn.execute(text(count_query))
                row_count = result.scalar()

            columns = self.inspector.get_columns(table_name, schema=schema)
            column_names = [col["name"] for col in columns]

            return {
                "table_name": table_name,
                "row_count": row_count,
                "column_count": len(column_names),
                "columns": column_names,
            }

        except Exception as e:
            logger.error(f"❌ Failed to get table stats: {str(e)}")
            raise

    def check_completeness(
        self, table_name: str, column_name: str, schema: Optional[str] = None
    ) -> Dict[str, Any]:
        """Check data completeness (null values)."""
        try:
            if schema:
                full_table_name = f"{schema}.{table_name}"
            else:
                full_table_name = table_name

            with self.engine.connect() as conn:
                query = f"""
                    SELECT 
                        COUNT(*) as total_count,
                        COUNT({column_name}) as non_null_count,
                        COUNT(*) - COUNT({column_name}) as null_count
                    FROM {full_table_name}
                """
                result = conn.execute(text(query))
                row = result.fetchone()

            total = row[0]
            non_null = row[1]
            null_count = row[2]

            completeness = (non_null / total * 100) if total > 0 else 0

            return {
                "column": column_name,
                "completeness_score": round(completeness, 2),
                "total_rows": total,
                "non_null_count": non_null,
                "null_count": null_count,
            }

        except Exception as e:
            logger.error(f"❌ Completeness check failed: {str(e)}")
            raise

    def check_uniqueness(
        self, table_name: str, column_name: str, schema: Optional[str] = None
    ) -> Dict[str, Any]:
        """Check data uniqueness."""
        try:
            if schema:
                full_table_name = f"{schema}.{table_name}"
            else:
                full_table_name = table_name

            with self.engine.connect() as conn:
                query = f"""
                    SELECT 
                        COUNT(*) as total_count,
                        COUNT(DISTINCT {column_name}) as distinct_count
                    FROM {full_table_name}
                    WHERE {column_name} IS NOT NULL
                """
                result = conn.execute(text(query))
                row = result.fetchone()

            total = row[0]
            distinct = row[1]
            duplicate_count = total - distinct

            uniqueness = (distinct / total * 100) if total > 0 else 0

            return {
                "column": column_name,
                "uniqueness_score": round(uniqueness, 2),
                "total_values": total,
                "distinct_values": distinct,
                "duplicate_count": duplicate_count,
            }

        except Exception as e:
            logger.error(f"❌ Uniqueness check failed: {str(e)}")
            raise

    def check_validity(
        self, 
        table_name: str, 
        column_name: str, 
        pattern: str, 
        schema: Optional[str] = None,
        enable_mx_validation: bool = False,
        mx_timeout: int = 5
    ) -> Dict[str, Any]:
        """
        Check data validity using regex pattern matching and optional MX validation.
        """
        try:
            if schema:
                full_table_name = f"{schema}.{table_name}"
            else:
                full_table_name = table_name

            query = f"SELECT {column_name} FROM {full_table_name} WHERE {column_name} IS NOT NULL"
            df = pd.read_sql(query, self.engine)

            if len(df) == 0:
                return {
                    "column": column_name,
                    "validity_score": 0,
                    "total_values": 0,
                    "valid_count": 0,
                    "invalid_count": 0,
                    "pattern": pattern,
                }

            df["is_valid_format"] = df[column_name].astype(str).str.match(pattern, na=False)

            mx_validation_results = {}
            if enable_mx_validation:
                logger.info(f"🔍 Performing MX validation on {column_name}")
                
                valid_emails = df[df["is_valid_format"]][column_name].astype(str)
                unique_domains = set()
                
                for email in valid_emails:
                    domain = extract_domain_from_email(email)
                    if domain:
                        unique_domains.add(domain)
                
                logger.info(f"📧 Checking MX records for {len(unique_domains)} unique domains")
                for domain in unique_domains:
                    mx_validation_results[domain] = check_mx_record(domain, mx_timeout)
                
                def validate_email_mx(email):
                    domain = extract_domain_from_email(str(email))
                    if not domain:
                        return False
                    
                    mx_result = mx_validation_results.get(domain, {})
                    
                    if mx_result.get("valid") is None:
                        return True
                    
                    return mx_result.get("valid", False)
                
                df["is_valid_mx"] = df[column_name].apply(validate_email_mx)
                df["is_valid"] = df["is_valid_format"] & df["is_valid_mx"]
                
                format_valid = df["is_valid_format"].sum()
                format_invalid = len(df) - format_valid
                mx_valid = df["is_valid_mx"].sum()
                mx_invalid = len(df) - mx_valid
                both_valid = df["is_valid"].sum()
                
            else:
                df["is_valid"] = df["is_valid_format"]
                format_valid = df["is_valid"].sum()
                format_invalid = len(df) - format_valid

            valid_count = df["is_valid"].sum()
            total_count = len(df)
            invalid_count = total_count - valid_count

            validity = (valid_count / total_count * 100) if total_count > 0 else 0

            result = {
                "column": column_name,
                "validity_score": round(validity, 2),
                "total_values": total_count,
                "valid_count": int(valid_count),
                "invalid_count": invalid_count,
                "pattern": pattern,
            }
            
            if enable_mx_validation:
                result["mx_validation_enabled"] = True
                result["mx_breakdown"] = {
                    "format_valid": int(format_valid),
                    "format_invalid": int(format_invalid),
                    "mx_valid": int(mx_valid),
                    "mx_invalid": int(mx_invalid),
                    "both_valid": int(both_valid),
                    "domains_checked": len(unique_domains)
                }
            else:
                result["mx_validation_enabled"] = False

            return result

        except Exception as e:
            logger.error(f"❌ Validity check failed for {table_name}.{column_name}: {str(e)}")
            raise

    def detect_duplicates(
        self, table_name: str, columns: List[str], schema: Optional[str] = None
    ) -> Dict[str, Any]:
        """Detect duplicate rows based on specified columns."""
        try:
            if schema:
                full_table_name = f"{schema}.{table_name}"
            else:
                full_table_name = table_name

            columns_str = ", ".join(columns)
            
            with self.engine.connect() as conn:
                query = f"""
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT(*) - COUNT(DISTINCT {columns_str}) as duplicate_rows
                    FROM {full_table_name}
                """
                result = conn.execute(text(query))
                row = result.fetchone()

            total_rows = row[0]
            duplicate_rows = row[1]

            duplicate_percentage = (duplicate_rows / total_rows * 100) if total_rows > 0 else 0

            return {
                "columns": columns,
                "total_rows": total_rows,
                "duplicate_rows": duplicate_rows,
                "duplicate_percentage": round(duplicate_percentage, 2),
            }

        except Exception as e:
            logger.error(f"❌ Duplicate detection failed: {str(e)}")
            raise

    def check_data_type_consistency(
        self, table_name: str, column_name: str, expected_type: str, schema: Optional[str] = None
    ) -> Dict[str, Any]:
        """Check if column values match expected data type."""
        try:
            if schema:
                full_table_name = f"{schema}.{table_name}"
            else:
                full_table_name = table_name

            query = f"SELECT {column_name} FROM {full_table_name} WHERE {column_name} IS NOT NULL"
            df = pd.read_sql(query, self.engine)

            if len(df) == 0:
                return {
                    "column": column_name,
                    "consistency_score": 0,
                    "total_values": 0,
                    "valid_count": 0,
                    "invalid_count": 0,
                }

            type_checks = {
                "integer": lambda x: str(x).replace('-', '').isdigit(),
                "float": lambda x: self._is_float(str(x)),
                "date": lambda x: self._is_date(str(x)),
                "boolean": lambda x: str(x).lower() in ['true', 'false', '1', '0', 'yes', 'no'],
            }

            check_func = type_checks.get(expected_type.lower())
            if not check_func:
                raise ValueError(f"Unsupported type: {expected_type}")

            df["is_valid_type"] = df[column_name].astype(str).apply(check_func)

            valid_count = df["is_valid_type"].sum()
            total_count = len(df)
            invalid_count = total_count - valid_count

            consistency = (valid_count / total_count * 100) if total_count > 0 else 0

            return {
                "column": column_name,
                "expected_type": expected_type,
                "consistency_score": round(consistency, 2),
                "total_values": total_count,
                "valid_count": int(valid_count),
                "invalid_count": invalid_count,
            }

        except Exception as e:
            logger.error(f"❌ Type consistency check failed: {str(e)}")
            raise

    @staticmethod
    def _is_float(value: str) -> bool:
        """Check if string is a valid float."""
        try:
            float(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def _is_date(value: str) -> bool:
        """Check if string is a valid date."""
        try:
            pd.to_datetime(value)
            return True
        except:
            return False

    def _generate_key_findings(
        self, overall_score: float, issues: List[Dict], table_stats: Dict
    ) -> List[str]:
        """Generate key findings summary."""
        findings = []
        
        findings.append(f"Overall data quality score: {overall_score}%")
        findings.append(f"Total records analyzed: {table_stats['row_count']:,}")
        findings.append(f"Total issues detected: {len(issues)}")
        
        critical_issues = [i for i in issues if i.get('severity') == 'critical']
        high_issues = [i for i in issues if i.get('severity') == 'high']
        
        if critical_issues:
            findings.append(f"⚠️ {len(critical_issues)} critical issues require immediate attention")
        if high_issues:
            findings.append(f"⚠️ {len(high_issues)} high priority issues found")
        
        return findings

    async def scan(self, enable_mx_validation: bool = False) -> Dict[str, Any]:
        """
        Execute a complete automatic data quality scan.
        
        Args:
            enable_mx_validation: Enable MX record validation for email columns
            
        Returns:
            Dictionary with scan results
        """
        try:
            table_stats = self.get_table_stats(self.table_name)
            columns = table_stats["columns"]

            checks = []

            for column in columns:
                checks.append({
                    "type": "completeness",
                    "column": column
                })

                if "id" in column.lower() or "code" in column.lower():
                    checks.append({
                        "type": "uniqueness",
                        "column": column,
                        "expect_unique": True
                    })

                if "email" in column.lower():
                    checks.append({
                        "type": "validity",
                        "column": column,
                        "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                        "enable_mx_validation": enable_mx_validation
                    })

            if len(columns) > 0:
                checks.append({
                    "type": "duplicates",
                    "columns": columns
                })

            config = {
                "table": self.table_name,
                "checks": checks
            }

            result = self.run_scan(config)

            return result

        except Exception as e:
            logger.error(f"❌ Scan failed: {str(e)}")
            raise

    def run_scan(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a complete data quality scan based on configuration.
        
        Args:
            config: Scan configuration dictionary
            
        Returns:
            Dictionary with scan results compatible with MongoDB schema
        """
        scan_start_time = datetime.utcnow()
        table_name = config.get("table")
        schema = config.get("schema")
        checks = config.get("checks", [])

        logger.info(f"🔍 Starting scan for table: {table_name}")

        try:
            table_stats = self.get_table_stats(table_name, schema)

            issues = []
            column_scores = {}

            for check in checks:
                check_type = check.get("type")
                column = check.get("column")

                try:
                    if check_type == "completeness":
                        result = self.check_completeness(table_name, column, schema)
                        column_scores[column] = column_scores.get(column, [])
                        column_scores[column].append(result["completeness_score"])

                        if result["completeness_score"] < 90:
                            issues.append({
                                "type": "completeness",
                                "severity": "high" if result["completeness_score"] < 70 else "medium",
                                "description": f"Column '{column}' has {result['null_count']} null values ({100 - result['completeness_score']:.1f}% missing)",
                                "column": column,
                                "count": result["null_count"],
                            })

                    elif check_type == "uniqueness":
                        result = self.check_uniqueness(table_name, column, schema)
                        column_scores[column] = column_scores.get(column, [])
                        column_scores[column].append(result["uniqueness_score"])

                        if result["duplicate_count"] > 0 and check.get("expect_unique", False):
                            issues.append({
                                "type": "uniqueness",
                                "severity": "medium",
                                "description": f"Column '{column}' has {result['duplicate_count']} duplicate values",
                                "column": column,
                                "count": result["duplicate_count"],
                            })

                    elif check_type == "validity":
                        pattern = check.get("pattern")
                        enable_mx = check.get("enable_mx_validation", False)
                        mx_timeout = check.get("mx_timeout", 5)
                        
                        result = self.check_validity(
                            table_name, 
                            column, 
                            pattern, 
                            schema,
                            enable_mx_validation=enable_mx,
                            mx_timeout=mx_timeout
                        )
                        
                        column_scores[column] = column_scores.get(column, [])
                        column_scores[column].append(result["validity_score"])

                        if result["validity_score"] < 95:
                            description = f"Column '{column}' has {result['invalid_count']} invalid values"
                            
                            if result.get("mx_validation_enabled"):
                                mx_breakdown = result.get("mx_breakdown", {})
                                format_invalid = mx_breakdown.get("format_invalid", 0)
                                mx_invalid = mx_breakdown.get("mx_invalid", 0)
                                
                                if format_invalid > 0 and mx_invalid > 0:
                                    description += f" ({format_invalid} format errors, {mx_invalid} invalid domains)"
                                elif format_invalid > 0:
                                    description += f" ({format_invalid} format errors)"
                                elif mx_invalid > 0:
                                    description += f" ({mx_invalid} domains without valid MX records)"
                            
                            issues.append({
                                "type": "validity",
                                "severity": "high" if result["validity_score"] < 80 else "medium",
                                "description": description,
                                "column": column,
                                "count": result["invalid_count"],
                            })

                    elif check_type == "duplicates":
                        columns = check.get("columns", [])
                        result = self.detect_duplicates(table_name, columns, schema)

                        if result["duplicate_rows"] > 0:
                            issues.append({
                                "type": "duplicates",
                                "severity": "high" if result["duplicate_percentage"] > 10 else "medium",
                                "description": f"Found {result['duplicate_rows']} duplicate rows across columns {', '.join(columns)}",
                                "columns": columns,
                                "count": result["duplicate_rows"],
                            })

                    elif check_type == "consistency":
                        expected_type = check.get("expected_type")
                        result = self.check_data_type_consistency(table_name, column, expected_type, schema)
                        column_scores[column] = column_scores.get(column, [])
                        column_scores[column].append(result["consistency_score"])

                        if result["consistency_score"] < 95:
                            issues.append({
                                "type": "consistency",
                                "severity": "medium",
                                "description": f"Column '{column}' has {result['invalid_count']} values not matching expected type '{expected_type}'",
                                "column": column,
                                "count": result["invalid_count"],
                            })

                except Exception as e:
                    logger.error(f"❌ Check failed: {check_type} on {column}: {str(e)}")
                    issues.append({
                        "type": "error",
                        "severity": "critical",
                        "description": f"Failed to execute {check_type} check on column '{column}': {str(e)}",
                        "column": column,
                    })

            all_scores = [score for scores in column_scores.values() for score in scores]
            overall_score = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0

            if overall_score >= 95:
                grade = "A+"
            elif overall_score >= 90:
                grade = "A"
            elif overall_score >= 85:
                grade = "B+"
            elif overall_score >= 80:
                grade = "B"
            elif overall_score >= 70:
                grade = "C"
            elif overall_score >= 60:
                grade = "D"
            else:
                grade = "F"

            breakdown = {}
            for column, scores in column_scores.items():
                avg_score = round(sum(scores) / len(scores), 2) if scores else 0
                breakdown[column] = avg_score

            scan_end_time = datetime.utcnow()
            scan_duration = (scan_end_time - scan_start_time).total_seconds()

            result = {
                "overall_score": overall_score,
                "grade": grade,
                "total_records": table_stats["row_count"],
                "rows_scanned": table_stats["row_count"],
                "columns_scanned": table_stats["column_count"],
                "issues_found": len(issues),
                "issues": issues,
                "breakdown": breakdown,
                "key_findings": self._generate_key_findings(overall_score, issues, table_stats),
                "scan_duration_seconds": round(scan_duration, 2),
            }

            logger.info(f"✅ Scan completed: Score={overall_score}%, Grade={grade}, Issues={len(issues)}")
            return result

        except Exception as e:
            logger.error(f"❌ Scan failed: {str(e)}")
            raise

    def close(self):
        """Clean up resources."""
        if self.engine:
            self.engine.dispose()
            logger.info("✅ Database connection closed")
        
        if self.temp_db_path and os.path.exists(self.temp_db_path):
            try:
                os.remove(self.temp_db_path)
                logger.info("✅ Temporary database cleaned up")
            except Exception as e:
                logger.warning(f"⚠️ Failed to remove temporary database: {str(e)}")

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
