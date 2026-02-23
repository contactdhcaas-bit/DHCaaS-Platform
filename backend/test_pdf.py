from app.services.pdf_generator import DHCaaSPDFGenerator

try:
    print("Testing PDF generation...")
    generator = DHCaaSPDFGenerator()
    pdf_bytes = generator.generate_report(output_path="test_report.pdf")
    print(f"✅ SUCCESS! PDF saved to: {pdf_bytes}")
except Exception as e:
    print(f"❌ FAILED: {str(e)}")
    import traceback
    traceback.print_exc()
