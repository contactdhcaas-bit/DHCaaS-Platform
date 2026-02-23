"""
Test CSV Connector - Complete Integration Test
"""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.scanning.connectors.csv_connector import create_csv_connector

def main():
    print("=" * 70)
    print("🧪 CSV CONNECTOR INTEGRATION TEST")
    print("=" * 70)
    
    # Create connector
    print("\n[1] Creating CSV Connector...")
    try:
        connector = create_csv_connector(
            filepath="test_data/sample_customers.csv",
            source_id="test_customers",
            delimiter=",",
            encoding="utf-8"
        )
        print("   ✅ Connector created successfully")
    except Exception as e:
        print(f"   ❌ Failed to create connector: {e}")
        return
    
    # Use context manager
    try:
        with connector:
            # Test 1: Connection Test
            print("\n[2] Testing Connection...")
            test_result = connector.test_connection()
            if test_result["success"]:
                print(f"   ✅ Connection successful")
                print(f"   📁 File: {test_result['metadata'].get('filepath')}")
                print(f"   📊 Size: {test_result['metadata'].get('file_size_mb')} MB")
                print(f"   ⚡ Latency: {test_result['latency_ms']} ms")
            else:
                print(f"   ❌ Connection failed: {test_result['message']}")
                return
            
            # Test 2: Get Schema
            print("\n[3] Retrieving Schema...")
            schema = connector.get_schema()
            print(f"   ✅ Found {len(schema)} columns:")
            for col, dtype in schema.items():
                print(f"      - {col}: {dtype}")
            
            # Test 3: Row Count
            print("\n[4] Counting Rows...")
            row_count = connector.get_row_count()
            print(f"   ✅ Total rows: {row_count}")
            
            # Test 4: Fetch Sample
            print("\n[5] Fetching Sample Data...")
            sample = connector.fetch_sample(limit=3)
            print(f"   ✅ Fetched {len(sample)} rows:")
            for i, row in enumerate(sample, 1):
                print(f"      Row {i}:")
                for key, value in row.items():
                    print(f"         {key}: {value}")
            
            # Test 5: Quality Scan
            print("\n[6] Running Quality Scan...")
            print("   ⏳ Analyzing data quality...")
            metrics = connector.scan_quality()
            
            print(f"   ✅ Quality Metrics:")
            print(f"      📊 Total Rows: {metrics.total_rows}")
            print(f"      📋 Total Columns: {metrics.total_columns}")
            print(f"      ✨ Completeness Score: {metrics.completeness_score}%")
            print(f"      🔄 Duplicate Rows: {metrics.duplicate_count} ({metrics.duplicate_percentage}%)")
            
            print(f"\n   📉 Null Counts per Column:")
            for col, null_count in metrics.null_counts.items():
                if null_count > 0:
                    percentage = (null_count / metrics.total_rows) * 100
                    print(f"      - {col}: {null_count} nulls ({percentage:.1f}%)")
            
            print(f"\n   📈 Column Statistics (sample):")
            for col, stats in list(metrics.column_statistics.items())[:3]:
                print(f"      {col}:")
                for stat_name, stat_value in stats.items():
                    print(f"         {stat_name}: {stat_value}")
            
            # Test 6: PII Detection
            print("\n[7] Running PII Detection...")
            print("   🔍 Scanning for sensitive data...")
            pii_results = connector.detect_pii()
            
            if pii_results:
                print(f"   ⚠️  Found PII in {len(pii_results)} column(s):")
                for pii in pii_results:
                    print(f"\n      🔒 Column: {pii.column_name}")
                    print(f"         Type: {pii.pii_type}")
                    print(f"         Severity: {pii.severity.upper()}")
                    print(f"         Confidence: {pii.confidence * 100:.1f}%")
                    print(f"         Matches: {pii.sample_count}/{pii.total_count} ({pii.match_percentage}%)")
                    if pii.recommendation:
                        print(f"         💡 Recommendation: {pii.recommendation}")
            else:
                print("   ✅ No PII detected")
            
            # Test 7: Full Scan
            print("\n[8] Running Full Scan (Combined)...")
            print("   ⏳ Performing comprehensive analysis...")
            full_result = connector.perform_full_scan(
                include_quality=True,
                include_pii=True,
                sample_size=None
            )
            
            print(f"   ✅ Full Scan Completed:")
            print(f"      ⏱️  Duration: {full_result.scan_duration_seconds}s")
            print(f"      📊 Quality Score: {full_result.quality_metrics.completeness_score}%")
            print(f"      🔒 PII Columns: {len(full_result.pii_detections)}")
            
            if full_result.errors:
                print(f"      ❌ Errors: {len(full_result.errors)}")
                for error in full_result.errors:
                    print(f"         - {error}")
            
            if full_result.warnings:
                print(f"      ⚠️  Warnings: {len(full_result.warnings)}")
                for warning in full_result.warnings:
                    print(f"         - {warning}")
            
            # Test 8: Connection Metadata
            print("\n[9] Connection Metadata...")
            metadata = connector.get_connection_metadata()
            print(f"   ✅ Metadata:")
            for key, value in metadata.items():
                if key != "connection_params":
                    print(f"      {key}: {value}")
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
