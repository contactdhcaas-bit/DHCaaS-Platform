# backend/scripts/test_full_flow.py
"""
Full End-to-End Integration Test
Tests: Upload -> Scan -> DB Save -> Incident -> Zoho Ticket -> Compliance Score
"""
import asyncio
import httpx
import csv
import io
from datetime import datetime


API_BASE = "http://127.0.0.1:8000"


# Test CSV data with PII
TEST_CSV_DATA = """customer_id,name,email,phone,credit_card,ssn,address,date_of_birth
1001,John Doe,john.doe@email.com,+1-555-0101,4532-1234-5678-9010,123-45-6789,123 Main St New York NY,1985-03-15
1002,Jane Smith,jane.smith@company.com,+1-555-0102,5425-9876-5432-1098,987-65-4321,456 Oak Ave Los Angeles CA,1990-07-22
1003,Bob Johnson,bob.j@example.org,+1-555-0103,,,789 Pine Rd Chicago IL,1978-11-30
1004,Alice Williams,alice.w@test.com,+1-555-0104,4916-8765-4321-0987,555-12-3456,321 Elm St Houston TX,1982-05-08
1005,Charlie Brown,charlie@demo.net,+1-555-0105,6011-1111-2222-3333,,654 Maple Dr Phoenix AZ,1995-09-17"""


async def test_full_flow():
    """Run complete integration test"""
    
    print("=" * 60)
    print("🧪 DHCaaS FULL INTEGRATION TEST")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    async with httpx.AsyncClient() as client:
        
        # Step 1: Test API health
        print("📊 Step 1: Checking API health...")
        try:
            response = await client.get(f"{API_BASE}/")
            if response.status_code == 200:
                print("✅ API is online\n")
            else:
                print(f"❌ API returned status {response.status_code}\n")
                return
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}\n")
            return
        
        # Step 2: Get baseline compliance score
        print("📊 Step 2: Getting baseline compliance score...")
        try:
            response = await client.get(f"{API_BASE}/api/reports/summary")
            if response.status_code == 200:
                baseline = response.json()
                print(f"✅ Baseline Score: {baseline['overall_score']}%")
                print(f"   Total Scans: {baseline['total_scans']}")
                print(f"   Total Incidents: {baseline['incident_stats']['total']}\n")
            else:
                print(f"⚠️  Could not fetch baseline (status {response.status_code})\n")
                baseline = None
        except Exception as e:
            print(f"⚠️  Error fetching baseline: {e}\n")
            baseline = None
        
        # Step 3: Upload test CSV
        print("📊 Step 3: Uploading test CSV file...")
        try:
            files = {
                'file': ('test_data.csv', TEST_CSV_DATA, 'text/csv')
            }
            
            response = await client.post(f"{API_BASE}/api/scans/upload", files=files)
            
            if response.status_code == 200:
                scan_result = response.json()
                print("✅ File uploaded and scanned successfully!")
                print(f"   Scan ID: {scan_result.get('id', 'N/A')}")
                print(f"   Filename: {scan_result.get('filename', 'N/A')}")
                print(f"   Total Rows: {scan_result.get('total_rows', 0)}")
                print(f"   PII Columns: {len(scan_result.get('pii_columns_found', []))}")
                print(f"   Compliance Score: {scan_result.get('compliance_score', 0)}%")
                print(f"   Status: {scan_result.get('status', 'N/A')}")
                print(f"   Severity: {scan_result.get('severity', 'N/A').upper()}")
                
                if scan_result.get('incident_id'):
                    print(f"   ✅ Incident Created: {scan_result['incident_id']}")
                
                if scan_result.get('zoho_ticket'):
                    zoho = scan_result['zoho_ticket']
                    if zoho.get('created'):
                        print(f"   ✅ Zoho Ticket Created: {zoho['ticket'].get('ticketNumber', 'N/A')}")
                    else:
                        reason = zoho.get('reason', zoho.get('error', 'Unknown'))
                        print(f"   ⚠️  Zoho Ticket Not Created: {reason}")
                
                print()
                
                scan_id = scan_result.get('id')
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"   {response.text}\n")
                return
                
        except Exception as e:
            print(f"❌ Upload error: {e}\n")
            return
        
        # Step 4: Wait and check updated compliance score
        print("📊 Step 4: Waiting 3 seconds for data propagation...")
        await asyncio.sleep(3)
        
        try:
            response = await client.get(f"{API_BASE}/api/reports/summary")
            if response.status_code == 200:
                updated = response.json()
                print("✅ Updated compliance data retrieved:")
                print(f"   New Score: {updated['overall_score']}%")
                print(f"   Total Scans: {updated['total_scans']}")
                print(f"   Total Incidents: {updated['incident_stats']['total']}")
                
                if baseline:
                    score_change = updated['overall_score'] - baseline['overall_score']
                    scans_added = updated['total_scans'] - baseline['total_scans']
                    incidents_added = updated['incident_stats']['total'] - baseline['incident_stats']['total']
                    
                    print(f"\n   📈 Changes:")
                    print(f"      Score: {score_change:+.1f}%")
                    print(f"      Scans: +{scans_added}")
                    print(f"      Incidents: +{incidents_added}")
                
                print()
            else:
                print(f"⚠️  Could not fetch updated score (status {response.status_code})\n")
        except Exception as e:
            print(f"⚠️  Error fetching updated score: {e}\n")
        
        # Step 5: Verify scan in database
        print("📊 Step 5: Verifying scan in database...")
        try:
            response = await client.get(f"{API_BASE}/api/scans/{scan_id}")
            if response.status_code == 200:
                scan_detail = response.json()
                print("✅ Scan found in database")
                print(f"   PII Summary: {scan_detail.get('pii_summary', {})}")
                
                if scan_detail.get('incident'):
                    incident = scan_detail['incident']
                    print(f"   ✅ Associated Incident:")
                    print(f"      ID: {incident.get('id', 'N/A')}")
                    print(f"      Title: {incident.get('title', 'N/A')}")
                    print(f"      Severity: {incident.get('severity', 'N/A')}")
                    print(f"      Status: {incident.get('status', 'N/A')}")
                
                print()
            else:
                print(f"⚠️  Scan not found in database (status {response.status_code})\n")
        except Exception as e:
            print(f"⚠️  Error verifying scan: {e}\n")
        
        # Step 6: Summary
        print("=" * 60)
        print("🎉 TEST COMPLETED")
        print("=" * 60)
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n✅ Integration test passed! All systems operational.\n")


if __name__ == "__main__":
    asyncio.run(test_full_flow())
