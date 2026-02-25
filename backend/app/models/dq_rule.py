"""
Data Quality Rule Models
Pydantic schemas for DQ Rules CRUD operations and validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# ===== ENUMS =====

class RuleType(str, Enum):
    """Core rule types for MVP (Sprint 6)"""
    NOT_NULL = "not_null"
    REGEX_MATCH = "regex_match"
    NUMERIC_RANGE = "numeric_range"
    STRING_LENGTH = "string_length"
    ALLOWED_VALUES = "allowed_values"


class Severity(str, Enum):
    """Rule severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ExecutionStatus(str, Enum):
    """Rule execution status (for future use in Sprint 7)"""
    SUCCESS = "success"
    FAILED = "failed"
    ERROR = "error"


# ===== RULE CONFIG SCHEMAS =====

class NotNullConfig(BaseModel):
    """Configuration for not_null rule type (no config needed)"""
    pass


class RegexMatchConfig(BaseModel):
    """Configuration for regex_match rule type"""
    pattern: str = Field(..., min_length=1, max_length=500)
    case_sensitive: bool = Field(default=False)
    
    class Config:
        json_schema_extra = {
            "example": {
                "pattern": "^[A-Z]{3}\\d{6}$",
                "case_sensitive": True
            }
        }


class NumericRangeConfig(BaseModel):
    """Configuration for numeric_range rule type"""
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    inclusive: bool = Field(default=True)
    
    @validator('max_value')
    def validate_range(cls, v, values):
        if v is not None and 'min_value' in values and values['min_value'] is not None:
            if v <= values['min_value']:
                raise ValueError('max_value must be greater than min_value')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "min_value": 0,
                "max_value": 100,
                "inclusive": True
            }
        }


class StringLengthConfig(BaseModel):
    """Configuration for string_length rule type"""
    min_length: Optional[int] = Field(None, ge=0)
    max_length: Optional[int] = Field(None, ge=1)
    
    @validator('max_length')
    def validate_length(cls, v, values):
        if v is not None and 'min_length' in values and values['min_length'] is not None:
            if v < values['min_length']:
                raise ValueError('max_length must be greater than or equal to min_length')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "min_length": 3,
                "max_length": 50
            }
        }


class AllowedValuesConfig(BaseModel):
    """Configuration for allowed_values rule type"""
    values: List[str] = Field(..., min_items=1, max_items=1000)
    case_sensitive: bool = Field(default=False)
    
    class Config:
        json_schema_extra = {
            "example": {
                "values": ["active", "inactive", "pending"],
                "case_sensitive": False
            }
        }


# ===== REQUEST MODELS =====

class DQRuleCreate(BaseModel):
    """Request model for creating a new DQ rule"""
    rule_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    
    # Target
    connector_id: str = Field(..., min_length=24, max_length=24)
    table_name: str = Field(..., min_length=1, max_length=200)
    column_name: str = Field(..., min_length=1, max_length=200)
    
    # Rule definition
    rule_type: RuleType
    rule_config: Dict[str, Any] = Field(default_factory=dict)
    
    # Execution settings
    severity: Severity = Field(default=Severity.MEDIUM)
    enabled: bool = Field(default=True)
    sample_size: Optional[int] = Field(None, ge=1, le=1000000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "rule_name": "Email Must Be Valid",
                "description": "Validates email format in users table",
                "connector_id": "67b9e8f5a1234567890abcde",
                "table_name": "users",
                "column_name": "email",
                "rule_type": "regex_match",
                "rule_config": {
                    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    "case_sensitive": False
                },
                "severity": "critical",
                "enabled": True,
                "sample_size": None
            }
        }


class DQRuleUpdate(BaseModel):
    """Request model for updating an existing DQ rule"""
    rule_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    rule_config: Optional[Dict[str, Any]] = None
    severity: Optional[Severity] = None
    enabled: Optional[bool] = None
    sample_size: Optional[int] = Field(None, ge=1, le=1000000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "rule_name": "Email Must Be Valid - Updated",
                "severity": "high",
                "enabled": False
            }
        }


# ===== RESPONSE MODELS =====

class DQRuleResponse(BaseModel):
    """Response model for DQ rule"""
    id: str
    rule_name: str
    description: Optional[str]
    
    # Target
    connector_id: str
    connector_name: str
    table_name: str
    column_name: str
    data_type: Optional[str]
    
    # Rule definition
    rule_type: str
    rule_config: Dict[str, Any]
    
    # Execution settings
    severity: str
    enabled: bool
    sample_size: Optional[int]
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    
    # Execution stats (populated by execution engine in Sprint 7)
    last_executed_at: Optional[datetime] = None
    last_execution_status: Optional[str] = None
    last_pass_count: Optional[int] = None
    last_fail_count: Optional[int] = None
    last_pass_rate: Optional[float] = None


class DQRuleListResponse(BaseModel):
    """Response model for list of DQ rules"""
    total: int
    rules: List[DQRuleResponse]


class DQRuleDeleteResponse(BaseModel):
    """Response model for rule deletion"""
    message: str
    id: str
