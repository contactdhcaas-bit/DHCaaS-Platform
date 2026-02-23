"""
Test Remediation Engine Integration with Report Builder
FIXED IMPORTS VERSION
"""

import sys
import os
from pathlib import Path

# Add backend root to Python path
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

import json
from datetime import datetime
from app.services.report_builder import ReportBuilder
from app.services.remediation_engine import SmartRemediationEngine


# Sample test incidents
test_incidents = [
    {
        "incident_id": "INC-2026-001",
        "severity": "critical",
        "title": "NULL Values Detected in User Email Column",
        "description": "Found 250 NULL values in users.email column",
        "source_id": "src_mysql_prod_001",
        "source_name": "MySQL Production Database",
        "category": "quality",
        "status": "open",
        "affected_tables": ["users"],
        "affected_rows": 250,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "incident_id": "INC-2026-002",
        "severity": "high",
        "title": "Duplicate Customer Records",
        "description": "Found 1,240 duplicate customer_id values in customers table",
        "source_id": "src_postgres_analytics",
        "source_name": "PostgreSQL Analytics Database",
        "category": "quality",
        "status": "open",
        "affected_tables": ["customers"],
        "affected_rows": 1240,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "incident_id": "INC-2026-003",
        "severity": "medium",
        "title": "Invalid Email Format",
        "description": "50 email addresses in contacts table do not match standard email pattern",
        "source_id": "src_mongodb_crm",
        "source_name": "MongoDB Atlas CRM Cluster",
        "category": "quality",
        "status": "open",
        "affected_tables": ["contacts"],
        "affected_rows": 50,
        "created_at": datetime.utcnow().isoformat()
    }
]


def main():
    print("\n")
    print("=" * 80)
    print("DHCaaS REMEDIATION ENGINE - INTEGRATION TEST")
    print("=" * 80)
    print()
    
    try:
        # Test Report Builder with Remediation
        print("📊 Building report with smart remediation recommendations...")
        builder = ReportBuilder(test_incidents, datasource_name="Test Multi-Database Environment")
        builder.set_total_records(50000)
        
        report_data = builder.build_report_data()
        
        print(f"✅ Report built successfully")
        print(f"✅ Datasource: {report_data['datasource_name']}")
        print(f"✅ Overall Score: {report_data['key_metrics'].get('overall_score', 0)}%")
        print(f"✅ Total Issues: {len(report_data['issues'])}")
        print(f"✅ Recommendations Generated: {len(report_data['recommendations'])}")
        print()
        
        print("🔧 Smart Remediation Recommendations:")
        print("-" * 80)
        
        for i, rec in enumerate(report_data['recommendations'][:5], 1):
            print(f"\n{i}. Priority: [{rec['priority']}]")
            print(f"   Category: {rec['category']}")
            print(f"   Action: {rec['action']}")
            print(f"   Impact: {rec['impact']}")
            print(f"   Effort: {rec['effort']}")
            
            # Show SQL if available
            full_rem = rec.get('_full_remediation')
            if full_rem:
                db_type = full_rem.get('database_type', 'N/A')
                print(f"   Database Type: {db_type.upper()}")
                
                sql = full_rem.get('sql_fix', '')
                if sql:
                    print(f"   SQL Fix Preview (first 200 chars):")
                    print(f"   {sql[:200].replace(chr(10), chr(10) + '   ')}...")
        
        print()
        print("=" * 80)
        print("✅ TEST COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        
        # Save full report
        output_file = backend_root / 'app' / 'services' / 'test_report_full.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, default=str, ensure_ascii=False)
        
        print(f"✅ Full report saved to: {output_file}")
        print()
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
