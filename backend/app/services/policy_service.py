"""
Data Governance Policy Service
Enforces compliance rules on scan results
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import logging

from app.models.policy import (
    Policy, PolicyCreate, PolicyUpdate, Violation, 
    EvaluationResult, PolicyRuleType, PolicySeverity, PolicyStatus
)

logger = logging.getLogger(__name__)


class PolicyService:
    """
    Policy management and evaluation engine
    Enforces data governance rules on scan results
    """
    
    def __init__(self):
        """Initialize policy service with in-memory storage"""
        self.policies: Dict[str, Policy] = {}
        self.violations: Dict[str, Violation] = {}
        logger.info("PolicyService initialized")
        
        # Create default policies
        self._create_default_policies()
    
    def _create_default_policies(self):
        """Create default governance policies"""
        default_policies = [
            PolicyCreate(
                name="High Quality Standard for PII",
                description="Tables containing PII must maintain quality score above 85%",
                rule_type=PolicyRuleType.MIN_QUALITY_SCORE,
                threshold=85.0,
                severity=PolicySeverity.CRITICAL,
                tags=["pii", "quality", "compliance"]
            ),
            PolicyCreate(
                name="PII Row Limit",
                description="Maximum 1000 rows with PII data without special approval",
                rule_type=PolicyRuleType.MAX_PII_ROWS,
                threshold=1000,
                severity=PolicySeverity.HIGH,
                tags=["pii", "privacy"]
            ),
            PolicyCreate(
                name="Duplicate Data Threshold",
                description="Duplicate rows should not exceed 5% of total dataset",
                rule_type=PolicyRuleType.MAX_DUPLICATES,
                threshold=5.0,
                severity=PolicySeverity.MEDIUM,
                tags=["quality", "duplicates"]
            ),
            PolicyCreate(
                name="Missing Data Limit",
                description="Missing values should not exceed 15% per column",
                rule_type=PolicyRuleType.MAX_MISSING_PERCENTAGE,
                threshold=15.0,
                severity=PolicySeverity.WARNING,
                tags=["quality", "completeness"]
            )
        ]
        
        for policy_create in default_policies:
            self.create_policy(policy_create)
        
        logger.info(f"Created {len(default_policies)} default policies")
    
    def create_policy(self, policy_create: PolicyCreate) -> Policy:
        """
        Create a new governance policy
        
        Args:
            policy_create: Policy creation data
            
        Returns:
            Created policy
        """
        policy_id = f"policy_{uuid.uuid4().hex[:12]}"
        
        policy = Policy(
            id=policy_id,
            name=policy_create.name,
            description=policy_create.description,
            rule_type=policy_create.rule_type,
            threshold=policy_create.threshold,
            enabled=policy_create.enabled,
            severity=policy_create.severity,
            status=PolicyStatus.ENABLED if policy_create.enabled else PolicyStatus.DISABLED,
            tags=policy_create.tags or [],
            target_tables=policy_create.target_tables or [],
            created_at=datetime.now(),
            updated_at=datetime.now(),
            violation_count=0
        )
        
        self.policies[policy_id] = policy
        logger.info(f"Created policy: {policy.name} (ID: {policy_id})")
        
        return policy
    
    def get_policy(self, policy_id: str) -> Optional[Policy]:
        """Get policy by ID"""
        return self.policies.get(policy_id)
    
    def list_policies(
        self, 
        enabled_only: bool = False,
        rule_type: Optional[PolicyRuleType] = None,
        severity: Optional[PolicySeverity] = None
    ) -> List[Policy]:
        """
        List all policies with optional filters
        
        Args:
            enabled_only: Only return enabled policies
            rule_type: Filter by rule type
            severity: Filter by severity
            
        Returns:
            List of policies
        """
        policies = list(self.policies.values())
        
        if enabled_only:
            policies = [p for p in policies if p.enabled]
        
        if rule_type:
            policies = [p for p in policies if p.rule_type == rule_type]
        
        if severity:
            policies = [p for p in policies if p.severity == severity]
        
        return policies
    
    def update_policy(self, policy_id: str, policy_update: PolicyUpdate) -> Optional[Policy]:
        """
        Update an existing policy
        
        Args:
            policy_id: Policy ID to update
            policy_update: Update data
            
        Returns:
            Updated policy or None if not found
        """
        policy = self.policies.get(policy_id)
        if not policy:
            return None
        
        # Update fields
        update_data = policy_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(policy, field, value)
        
        policy.updated_at = datetime.now()
        
        logger.info(f"Updated policy: {policy.name} (ID: {policy_id})")
        
        return policy
    
    def delete_policy(self, policy_id: str) -> bool:
        """
        Delete a policy
        
        Args:
            policy_id: Policy ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        if policy_id in self.policies:
            policy = self.policies[policy_id]
            del self.policies[policy_id]
            logger.info(f"Deleted policy: {policy.name} (ID: {policy_id})")
            return True
        return False
    
    def evaluate_policies(self, scan_result: Dict[str, Any]) -> EvaluationResult:
        """
        Evaluate all enabled policies against a scan result
        
        Args:
            scan_result: Completed scan result dictionary
            
        Returns:
            Evaluation result with violations
        """
        scan_id = scan_result.get('scan_id', 'unknown')
        table_name = scan_result.get('file_name', scan_result.get('table_name'))
        
        logger.info(f"Evaluating policies for scan: {scan_id}")
        
        # Get enabled policies
        enabled_policies = [p for p in self.policies.values() if p.enabled]
        
        violations: List[Violation] = []
        policies_passed = 0
        policies_failed = 0
        
        for policy in enabled_policies:
            # Check if policy applies to this table
            if policy.target_tables and table_name not in policy.target_tables:
                continue
            
            violation = self._evaluate_single_policy(policy, scan_result)
            
            if violation:
                violations.append(violation)
                policies_failed += 1
                
                # Update policy violation count
                policy.violation_count += 1
                policy.last_violation = datetime.now()
                
                # Store violation
                self.violations[violation.id] = violation
                
                logger.warning(f"Policy violation: {policy.name} - {violation.message}")
            else:
                policies_passed += 1
        
        # Determine overall status
        overall_status = self._determine_overall_status(violations)
        
        result = EvaluationResult(
            scan_id=scan_id,
            table_name=table_name,
            evaluated_at=datetime.now(),
            total_policies=len(enabled_policies),
            policies_passed=policies_passed,
            policies_failed=policies_failed,
            violations=violations,
            overall_status=overall_status
        )
        
        logger.info(
            f"Evaluation complete: {policies_passed} passed, {policies_failed} failed, "
            f"status: {overall_status}"
        )
        
        return result
    
    def _evaluate_single_policy(
        self, 
        policy: Policy, 
        scan_result: Dict[str, Any]
    ) -> Optional[Violation]:
        """
        Evaluate a single policy against scan result
        
        Args:
            policy: Policy to evaluate
            scan_result: Scan result data
            
        Returns:
            Violation if policy failed, None if passed
        """
        scan_id = scan_result.get('scan_id', 'unknown')
        table_name = scan_result.get('file_name', scan_result.get('table_name'))
        
        # Extract metrics from scan result
        quality_score = scan_result.get('quality_score', 100.0)
        pii_count = scan_result.get('pii_count', 0)
        total_rows = scan_result.get('total_rows', scan_result.get('row_count', 0))
        duplicate_percentage = scan_result.get('duplicate_percentage', 0.0)
        
        # Calculate missing percentage (average across columns)
        columns = scan_result.get('columns', [])
        missing_percentages = [col.get('null_percentage', 0) for col in columns if isinstance(col, dict)]
        avg_missing_percentage = sum(missing_percentages) / len(missing_percentages) if missing_percentages else 0
        
        # Evaluate based on rule type
        violation = None
        
        if policy.rule_type == PolicyRuleType.MIN_QUALITY_SCORE:
            if quality_score < policy.threshold:
                violation_percentage = ((policy.threshold - quality_score) / policy.threshold) * 100
                violation = Violation(
                    id=f"violation_{uuid.uuid4().hex[:12]}",
                    policy_id=policy.id,
                    policy_name=policy.name,
                    scan_id=scan_id,
                    table_name=table_name,
                    message=f"Quality score {quality_score:.1f}% is below required threshold of {policy.threshold:.1f}%",
                    severity=policy.severity,
                    rule_type=policy.rule_type,
                    threshold=policy.threshold,
                    actual_value=quality_score,
                    violation_percentage=violation_percentage,
                    detected_at=datetime.now()
                )
        
        elif policy.rule_type == PolicyRuleType.MAX_PII_ROWS:
            if pii_count > policy.threshold:
                violation_percentage = ((pii_count - policy.threshold) / policy.threshold) * 100
                violation = Violation(
                    id=f"violation_{uuid.uuid4().hex[:12]}",
                    policy_id=policy.id,
                    policy_name=policy.name,
                    scan_id=scan_id,
                    table_name=table_name,
                    message=f"PII row count {pii_count} exceeds maximum threshold of {policy.threshold:.0f}",
                    severity=policy.severity,
                    rule_type=policy.rule_type,
                    threshold=policy.threshold,
                    actual_value=float(pii_count),
                    violation_percentage=violation_percentage,
                    detected_at=datetime.now()
                )
        
        elif policy.rule_type == PolicyRuleType.MAX_DUPLICATES:
            if duplicate_percentage > policy.threshold:
                violation_percentage = ((duplicate_percentage - policy.threshold) / policy.threshold) * 100
                violation = Violation(
                    id=f"violation_{uuid.uuid4().hex[:12]}",
                    policy_id=policy.id,
                    policy_name=policy.name,
                    scan_id=scan_id,
                    table_name=table_name,
                    message=f"Duplicate percentage {duplicate_percentage:.1f}% exceeds threshold of {policy.threshold:.1f}%",
                    severity=policy.severity,
                    rule_type=policy.rule_type,
                    threshold=policy.threshold,
                    actual_value=duplicate_percentage,
                    violation_percentage=violation_percentage,
                    detected_at=datetime.now()
                )
        
        elif policy.rule_type == PolicyRuleType.MAX_MISSING_PERCENTAGE:
            if avg_missing_percentage > policy.threshold:
                violation_percentage = ((avg_missing_percentage - policy.threshold) / policy.threshold) * 100
                violation = Violation(
                    id=f"violation_{uuid.uuid4().hex[:12]}",
                    policy_id=policy.id,
                    policy_name=policy.name,
                    scan_id=scan_id,
                    table_name=table_name,
                    message=f"Average missing data {avg_missing_percentage:.1f}% exceeds threshold of {policy.threshold:.1f}%",
                    severity=policy.severity,
                    rule_type=policy.rule_type,
                    threshold=policy.threshold,
                    actual_value=avg_missing_percentage,
                    violation_percentage=violation_percentage,
                    detected_at=datetime.now()
                )
        
        return violation
    
    def _determine_overall_status(self, violations: List[Violation]) -> str:
        """
        Determine overall status based on violations
        
        Args:
            violations: List of violations
            
        Returns:
            Overall status: pass, warning, high, or critical
        """
        if not violations:
            return "pass"
        
        severities = [v.severity for v in violations]
        
        if PolicySeverity.CRITICAL in severities:
            return "critical"
        elif PolicySeverity.HIGH in severities:
            return "high"
        elif PolicySeverity.MEDIUM in severities:
            return "medium"
        else:
            return "warning"
    
    def get_violations(
        self, 
        scan_id: Optional[str] = None,
        policy_id: Optional[str] = None,
        resolved: Optional[bool] = None
    ) -> List[Violation]:
        """
        Get violations with optional filters
        
        Args:
            scan_id: Filter by scan ID
            policy_id: Filter by policy ID
            resolved: Filter by resolution status
            
        Returns:
            List of violations
        """
        violations = list(self.violations.values())
        
        if scan_id:
            violations = [v for v in violations if v.scan_id == scan_id]
        
        if policy_id:
            violations = [v for v in violations if v.policy_id == policy_id]
        
        if resolved is not None:
            violations = [v for v in violations if v.resolved == resolved]
        
        return violations

    def check_scan_compliance(
        self, 
        scan_data: dict, 
        policies: Optional[List[Policy]] = None
    ) -> List[Dict[str, Any]]:
        """
        Check if scan results violate any active policies
        
        Args:
            scan_data: Scan result data containing metrics
            policies: Optional list of policies to check (defaults to all active)
            
        Returns:
            List of violations with policy_id, scan_id, severity, message
        """
        violations = []
        
        # Use provided policies or get all active ones
        if policies is None:
            policies = self.list_policies(
                status=PolicyStatus.ACTIVE,
                limit=1000
            )
        
        scan_id = scan_data.get("id") or scan_data.get("scan_id")
        
        # Extract metrics from scan data
        score = scan_data.get("quality_score") or scan_data.get("score", 0)
        pii_count = scan_data.get("pii_count", 0)
        duplicate_count = scan_data.get("duplicate_count", 0)
        missing_percent = scan_data.get("missing_percent", 0)
        
        logger.info(f"Checking compliance for scan {scan_id} against {len(policies)} policies")
        
        for policy in policies:
            violation_detected = False
            message = ""
            
            # Check each rule type
            if policy.rule_type == PolicyRuleType.MIN_QUALITY_SCORE:
                if score < policy.threshold:
                    violation_detected = True
                    message = (
                        f"Quality score {score:.2f}% is below minimum threshold "
                        f"{policy.threshold}% required by policy '{policy.name}'"
                    )
            
            elif policy.rule_type == PolicyRuleType.MAX_PII_ROWS:
                if pii_count > policy.threshold:
                    violation_detected = True
                    message = (
                        f"PII row count {pii_count} exceeds maximum threshold "
                        f"{policy.threshold} allowed by policy '{policy.name}'"
                    )
            
            elif policy.rule_type == PolicyRuleType.MAX_DUPLICATES:
                if duplicate_count > policy.threshold:
                    violation_detected = True
                    message = (
                        f"Duplicate count {duplicate_count} exceeds maximum threshold "
                        f"{policy.threshold} allowed by policy '{policy.name}'"
                    )
            
            elif policy.rule_type == PolicyRuleType.MAX_MISSING_PERCENTAGE:
                if missing_percent > policy.threshold:
                    violation_detected = True
                    message = (
                        f"Missing data percentage {missing_percent:.2f}% exceeds maximum "
                        f"{policy.threshold}% allowed by policy '{policy.name}'"
                    )
            
            # Create violation record if detected
            if violation_detected:
                violation = {
                    "id": str(uuid.uuid4()),
                    "policy_id": policy.id,
                    "policy_name": policy.name,
                    "scan_id": scan_id,
                    "severity": policy.severity.value,
                    "message": message,
                    "detected_at": datetime.utcnow().isoformat(),
                    "resolved": False,
                    "rule_type": policy.rule_type.value,
                    "threshold": policy.threshold,
                    "actual_value": {
                        "score": score,
                        "pii_count": pii_count,
                        "duplicate_count": duplicate_count,
                        "missing_percent": missing_percent
                    }
                }
                violations.append(violation)
                
                logger.warning(
                    f"Policy violation detected: {policy.name} ({policy.severity.value}) - {message}"
                )
        
        logger.info(f"Compliance check complete: {len(violations)} violations found")
        return violations


# Singleton instance
_policy_service_instance = None


def get_policy_service() -> PolicyService:
    """Get singleton instance of PolicyService"""
    global _policy_service_instance
    if _policy_service_instance is None:
        _policy_service_instance = PolicyService()
    return _policy_service_instance
