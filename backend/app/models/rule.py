"""
Data Quality Rules Engine Models
Defines rule types, severity levels, and validation schemas
"""


from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
from bson import ObjectId



# ============================================================================
# PART 1: ENUMS 
# ============================================================================


class RuleType(str, Enum):
    """
    Supported data quality rule types
   
    """
    NOT_NULL = "NOT_NULL"           # Column cannot have null values
    UNIQUE = "UNIQUE"               # All values must be unique
    REGEX = "REGEX"                 # Values must match regex pattern
    RANGE = "RANGE"                 # Numeric values within min/max
    ENUM = "ENUM"                   # Value must be in allowed list
    EMAIL = "EMAIL"                 # Valid email format
    PHONE = "PHONE"                 # Valid phone number
    DATE_FORMAT = "DATE_FORMAT"     # Valid date format
    LENGTH = "LENGTH"               # String length constraints
    CUSTOM_SQL = "CUSTOM_SQL"       # Custom SQL expression
    MIN_VALUE = "MIN_VALUE"         # Minimum value check
    MAX_VALUE = "MAX_VALUE"         # Maximum value check



class Severity(str, Enum):
    """
    Rule violation severity levels
   
    """
    CRITICAL = "CRITICAL"   # Stops pipeline execution 
    HIGH = "HIGH"           # Sends alert, flags data 
    MEDIUM = "MEDIUM"       # Warning only 
    LOW = "LOW"             # Informational 



class RuleScope(str, Enum):
    """
    Scope of rule application
   
    """
    COLUMN = "COLUMN"       # Applied to single column 
    ROW = "ROW"             # Applied to entire row 
    DATASET = "DATASET"     # Applied to entire dataset 



class RuleStatus(str, Enum):
    """
    Rule execution status
   
    """
    ACTIVE = "ACTIVE"       # Rule is active and will be executed
    INACTIVE = "INACTIVE"   # Rule is disabled
    ARCHIVED = "ARCHIVED"   # Rule is archived (soft delete)



# ============================================================================
# PART 2: HELPER FUNCTIONS 
# ============================================================================


def generate_rule_id() -> str:
    """Generate unique rule ID"""
    return f"rule_{str(ObjectId())}"



def generate_violation_id() -> str:
    """Generate unique violation ID"""
    return f"viol_{str(ObjectId())}"



# ============================================================================
# PART 3: RULE MODEL 
# ============================================================================


class DataQualityRuleBase(BaseModel):
    """
    Base model for data quality rules
   
    """
    rule_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    
    # Association 
    job_id: str = Field(..., description="Scan job ID this rule applies to")
    dataset_name: Optional[str] = Field(None, description="Human-readable dataset name")
    
    # Rule Configuration 
    rule_type: RuleType
    scope: RuleScope = RuleScope.COLUMN
    column_name: Optional[str] = Field(None, description="Column name (required if scope=COLUMN)")
    
    # Rule Parameters 
    parameters: Dict[str, Any] = Field(default_factory=dict)
    """
    Examples of parameters:
    - REGEX:       {"pattern": "^[A-Z]{3}$"}
    - RANGE:       {"min": 0, "max": 100}
    - ENUM:        {"allowed_values": ["A", "B", "C"]}
    - LENGTH:      {"min_length": 5, "max_length": 50}
    - DATE_FORMAT: {"format": "%Y-%m-%d"}
    - CUSTOM_SQL:  {"expression": "column_a > column_b"}
    """
    
    # Severity & Action 
    severity: Severity = Severity.MEDIUM
    is_active: bool = True
    stop_on_failure: bool = Field(
        default=False,
        description="If True, halt scan execution on rule violation"
    )
    
    # Metadata 
    created_by: str = Field(..., description="User ID or email who created the rule")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    
    @validator('column_name')
    def validate_column_name_for_scope(cls, v, values):
        """
        Validate that column_name is provided when scope is COLUMN
       
        """
        if values.get('scope') == RuleScope.COLUMN and not v:
            raise ValueError("column_name is required when scope is COLUMN")
        return v
    
    @validator('parameters')
    def validate_parameters_for_rule_type(cls, v, values):
        """
        Validate that required parameters exist for each rule type
      
        """
        rule_type = values.get('rule_type')
        
        if rule_type == RuleType.REGEX and 'pattern' not in v:
            raise ValueError("REGEX rule requires 'pattern' parameter")
        
        if rule_type == RuleType.RANGE:
            if 'min' not in v and 'max' not in v:
                raise ValueError("RANGE rule requires at least 'min' or 'max' parameter")
        
        if rule_type == RuleType.ENUM and 'allowed_values' not in v:
            raise ValueError("ENUM rule requires 'allowed_values' parameter")
        
        if rule_type == RuleType.LENGTH:
            if 'min_length' not in v and 'max_length' not in v:
                raise ValueError("LENGTH rule requires 'min_length' or 'max_length' parameter")
        
        if rule_type == RuleType.DATE_FORMAT and 'format' not in v:
            raise ValueError("DATE_FORMAT rule requires 'format' parameter")
        
        if rule_type == RuleType.CUSTOM_SQL and 'expression' not in v:
            raise ValueError("CUSTOM_SQL rule requires 'expression' parameter")
        
        return v



class DataQualityRuleCreate(DataQualityRuleBase):
    """
    Model for creating a new rule
 
    """
    created_at: datetime = Field(default_factory=datetime.utcnow)



class DataQualityRuleInDB(DataQualityRuleBase):
    """
    Rule model as stored in MongoDB
   
    """
    rule_id: str = Field(default_factory=generate_rule_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Execution Statistics 
    last_executed: Optional[datetime] = None
    total_executions: int = 0
    total_violations: int = 0
    total_passed: int = 0
    
    # Status
    status: RuleStatus = RuleStatus.ACTIVE
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }



class DataQualityRuleUpdate(BaseModel):
    """
    Model for updating an existing rule
   
    """
    rule_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    rule_type: Optional[RuleType] = None
    scope: Optional[RuleScope] = None
    column_name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    severity: Optional[Severity] = None
    is_active: Optional[bool] = None
    stop_on_failure: Optional[bool] = None
    tags: Optional[List[str]] = None
    status: Optional[RuleStatus] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)



class DataQualityRuleResponse(BaseModel):
    """
    Rule response model for API
  
    """
    rule_id: str
    rule_name: str
    description: Optional[str]
    job_id: str
    dataset_name: Optional[str]
    rule_type: RuleType
    scope: RuleScope
    column_name: Optional[str]
    parameters: Dict[str, Any]
    severity: Severity
    is_active: bool
    stop_on_failure: bool
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    last_executed: Optional[datetime]
    total_executions: int
    total_violations: int
    total_passed: int
    status: RuleStatus
    tags: List[str]
    
    class Config:
        from_attributes = True



# ============================================================================
# PART 4: VIOLATION MODEL 
# ============================================================================


class RuleViolationBase(BaseModel):
    """
    Base model for rule violations
   
    """
    rule_id: str
    job_id: str
    
    # Violation Details 
    column_name: Optional[str] = None
    row_number: Optional[int] = Field(None, ge=0)
    invalid_value: Optional[Any] = None
    expected_value: Optional[str] = Field(None, description="What the value should be")
    
    # Context 
    violation_message: str
    severity: Severity
    rule_type: RuleType
    
    # Additional Context
    additional_info: Optional[Dict[str, Any]] = Field(default_factory=dict)



class RuleViolationCreate(RuleViolationBase):
    """Model for creating a violation record"""
    detected_at: datetime = Field(default_factory=datetime.utcnow)



class RuleViolationInDB(RuleViolationBase):
    """
    Violation model as stored in MongoDB
   
    """
    violation_id: str = Field(default_factory=generate_violation_id)
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Resolution 
    is_resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }



class RuleViolationResponse(BaseModel):
    """Violation response model for API"""
    violation_id: str
    rule_id: str
    job_id: str
    column_name: Optional[str]
    row_number: Optional[int] = None
    invalid_value: Optional[Any] = None
    expected_value: Optional[str] = None
    violation_message: str
    severity: Severity
    rule_type: RuleType
    detected_at: datetime
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    additional_info: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True



# ============================================================================
# PART 5: VALIDATION REPORT 
# ============================================================================


class ValidationReport(BaseModel):
    """
    Comprehensive validation report
 
    """
    job_id: str
    dataset_name: str
    validation_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Summary 
    total_rules_executed: int
    total_rules_passed: int
    total_rules_failed: int
    total_violations: int
    
    # Severity Breakdown 
    critical_violations: int = 0
    high_violations: int = 0
    medium_violations: int = 0
    low_violations: int = 0
    
    # Overall Status 
    overall_status: str  # "PASSED", "FAILED", "WARNING"
    quality_score: float = Field(ge=0.0, le=100.0)
    
    # Details
    rules_summary: List[Dict[str, Any]] = Field(default_factory=list)
    violations_summary: List[RuleViolationResponse] = Field(default_factory=list)
    
    class Config:
        from_attributes = True



# ============================================================================
# PART 6: BULK OPERATIONS 
# ============================================================================


class BulkRuleCreate(BaseModel):
    """
    Model for creating multiple rules at once
   
    """
    rules: List[DataQualityRuleCreate]



class BulkRuleResponse(BaseModel):
    """Response for bulk rule creation"""
    created_count: int
    failed_count: int
    created_rules: List[DataQualityRuleResponse]
    errors: List[Dict[str, str]] = Field(default_factory=list)
