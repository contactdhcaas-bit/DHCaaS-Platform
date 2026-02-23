import json
import os
from app.services.pdf_generator import generate_audit_report

def test_pdf_generation():
    with open('test_data.json', 'r', encoding='utf-8') as f:
        report_data = json.load(f)
    
    output_path = "DHCaaS_Morocco_Enterprise_Edition.pdf"
    result_path = generate_audit_report(output_path, report_data)
    
    print(f"PDF Generated Successfully: {result_path}")
    file_size = os.path.getsize(result_path) / 1024
    print(f"File size: {file_size:.2f} KB")

if __name__ == "__main__":
    test_pdf_generation()
