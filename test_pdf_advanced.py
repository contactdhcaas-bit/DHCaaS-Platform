"""
Test PDF Report Generation with Advanced Metrics
"""

from app.utils.reporting import generate_pdf_report
from datetime import datetime

# Test data with advanced metrics
test_scan_data = {
    "data_source_name": "customer_leads_db",
    "quality_score": 87.5,
    "total_rows": 15000,
    "scan_date": datetime.now().strftime("%Y-%m-%d"),
    "pii_detected": True,
    "processing_time": 3.45,
    "columns_with_issues": 8,
    "total_tables": 5,
    "total_columns": 42,
    "issues": [
        {"column": "email_address", "type": "Invalid Format", "severity": "High"},
        {"column": "phone_number", "type": "Missing Values", "severity": "High"},
        {"column": "age", "type": "Negative Values", "severity": "High"},
        {"column": "postal_code", "type": "Invalid Format", "severity": "Medium"},
        {"column": "customer_id", "type": "Duplicates", "severity": "Medium"},
        {"column": "transaction_date", "type": "Invalid Date", "severity": "Low"},
    ],
    "critical_issues": [
        "Missing values in 'email_address' column (23 rows - 0.15%)",
        "Invalid phone format in 'phone_number' column (12 rows - 0.08%)",
        "Negative values in 'age' column (15 rows - 0.10%)",
        "Duplicate customer_id values detected (12 duplicates)",
        "Invalid date format in 'transaction_date' (5 rows)"
    ],
    "advanced_metrics": {
        "summary": {
            "invalid_emails": 23,
            "negative_values": 15,
            "duplicate_rows": 12,
            "missing_critical": 8,
            "invalid_dates": 5
        },
        "scores": {
            "completeness": 95.0,
            "accuracy": 88.0,
            "validity": 82.0,
            "consistency": 90.0,
            "uniqueness": 92.0
        }
    }
}

def test_generate_pdf():
    """Test PDF generation with advanced metrics"""
    try:
        print("🚀 Starting PDF generation test...")
        
        pdf_buffer = generate_pdf_report(test_scan_data)
        
        output_filename = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        with open(output_filename, "wb") as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"✅ PDF generated successfully: {output_filename}")
        print(f"📄 File size: {len(pdf_buffer.getvalue()) / 1024:.2f} KB")
        return True
        
    except Exception as e:
        print(f"❌ Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_generate_pdf()
