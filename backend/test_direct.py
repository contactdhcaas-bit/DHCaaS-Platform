import sys
sys.path.insert(0, ".")
import asyncio
import logging

logging.basicConfig(level=logging.INFO)

from app.services.rule_validator import RuleValidator

async def test():
    job_id = "8090c654-2983-41fb-98c8-7ae9d7329635"
    
    print(f"\nTesting RuleValidator for job: {job_id}\n")
    
    validator = RuleValidator(job_id)
    
    print("1. Loading data...")
    loaded = await validator.load_scan_data()
    print(f"   Loaded: {loaded}")
    
    if validator.df is not None:
        print(f"\n2. DataFrame:")
        print(f"   Shape: {validator.df.shape}")
        print(f"   Columns: {list(validator.df.columns)}")
        print(f"\n{validator.df}\n")
    else:
        print("\nERROR: DataFrame is None!")
        return
    
    print("3. Running validation...")
    report = await validator.validate_all_rules()
    
    print(f"\n4. Results:")
    print(f"   Rules Executed: {report.total_rules_executed}")
    print(f"   Violations: {report.total_violations}")
    print(f"   Violations List: {len(validator.violations)}")
    
    for v in validator.violations:
        print(f"\n   - {v['rule_type']}: {v['violation_message']}")

asyncio.run(test())
