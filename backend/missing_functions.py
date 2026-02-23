# Add these functions to app/core/database.py

async def get_scan_by_job_id(job_id: str):
    """Get scan job by job_id"""
    db = get_database()
    if db is None:
        return None
    return await db.scan_jobs.find_one({"job_id": job_id})

async def get_rules_by_job_id(job_id: str, active_only: bool = False):
    """Get all rules for a job_id"""
    db = get_database()
    if db is None:
        return []
    
    query = {"job_id": job_id}
    if active_only:
        query["is_active"] = True
    
    return await db.data_quality_rules.find(query).to_list(length=None)

async def create_violations_bulk(violations: list):
    """Create multiple violations at once"""
    db = get_database()
    if db is None or not violations:
        return
    
    await db.violations.insert_many(violations)

async def update_rule_stats(rule_id: str, violations_count: int, passed: bool):
    """Update rule statistics"""
    db = get_database()
    if db is None:
        return
    
    await db.data_quality_rules.update_one(
        {"rule_id": rule_id},
        {
            "$set": {
                "last_executed": datetime.utcnow()
            },
            "$inc": {
                "total_executions": 1,
                "total_violations": violations_count,
                "total_passed": 1 if passed else 0
            }
        }
    )

async def save_rule_execution(execution_data: dict):
    """Save rule execution history"""
    db = get_database()
    if db is None:
        return
    
    # Optional: Create rule_executions collection if needed
    # await db.rule_executions.insert_one(execution_data)
    pass

async def get_violations_summary(job_id: str):
    """Get violations summary for a job"""
    db = get_database()
    if db is None:
        return {"total": 0, "by_severity": {}}
    
    violations = await db.violations.find({"job_id": job_id}).to_list(length=None)
    
    summary = {
        "total": len(violations),
        "by_severity": {}
    }
    
    for v in violations:
        severity = v.get("severity", "UNKNOWN")
        if severity not in summary["by_severity"]:
            summary["by_severity"][severity] = {"total": 0, "unresolved": 0}
        
        summary["by_severity"][severity]["total"] += 1
        if not v.get("is_resolved", False):
            summary["by_severity"][severity]["unresolved"] += 1
    
    return summary

async def get_rule_by_id(rule_id: str):
    """Get rule by rule_id"""
    db = get_database()
    if db is None:
        return None
    return await db.data_quality_rules.find_one({"rule_id": rule_id})

async def create_violation(violation: dict):
    """Create a single violation"""
    db = get_database()
    if db is None:
        return None
    return await db.violations.insert_one(violation)

print("✅ Copy these functions to the end of app/core/database.py")
