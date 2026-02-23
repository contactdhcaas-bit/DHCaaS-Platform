import sys
sys.path.insert(0, ".")
import asyncio
import logging

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)

from app.services.rule_validator import RuleValidator
from app.core.database import get_database

async def test_validation():
    job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"
    
    print(f"\n🔍 Testing validation for job: {job_id}\n")
    
    validator = RuleValidator(job_id)
    
    # Load data
    print("1. Loading scan data...")
    loaded = await validator.load_scan_data()
    print(f"   Result: {loaded}")
    
    if validator.df is not None:
        print(f"\n2. DataFrame loaded:")
        print(f"   Shape: {validator.df.shape}")
        print(f"   Columns: {list(validator.df.columns)}")
        print(f"\n   Data:\n{validator.df}")
    else:
        print("\n❌ DataFrame is None!")
        return
    
    # Validate
    print(f"\n3. Running validation...")
    report = await validator.validate_all_rules()
    
    print(f"\n📊 Validation Report:")
    print(f"   Rules Executed: {report.total_rules_executed}")
    print(f"   Rules Passed: {report.total_rules_passed}")
    print(f"   Rules Failed: {report.total_rules_failed}")
    print(f"   Total Violations: {report.total_violations}")
    print(f"\n   Violations found: {len(validator.violations)}")
    
    for v in validator.violations:
        print(f"\n   - {v.get('rule_type')}: {v.get('violation_message')}")

asyncio.run(test_validation())
