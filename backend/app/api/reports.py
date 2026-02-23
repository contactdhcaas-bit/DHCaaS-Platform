"""
FastAPI Reports Router
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.utils.reporting import generate_pdf_report
from datetime import datetime
import logging

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


@router.post("/test/pdf")
async def test_pdf_generation():
    """
    Test endpoint - Generate sample PDF report
    """
    try:
        test_data = {
            "data_source_name": "test_database",
            "quality_score": 87.5,
            "total_rows": 10000,
            "scan_date": datetime.now().strftime("%Y-%m-%d"),
            "pii_detected": False,
            "processing_time": 2.34,
            "columns_with_issues": 5,
            "total_tables": 3,
            "total_columns": 25,
            "issues": [
                {"column": "email", "type": "Invalid Format", "severity": "High"},
                {"column": "phone", "type": "Missing", "severity": "Medium"}
            ],
            "critical_issues": [
                "10 invalid emails detected",
                "5 duplicate records found"
            ],
            "advanced_metrics": {
                "summary": {
                    "invalid_emails": 10,
                    "negative_values": 3,
                    "duplicate_rows": 5,
                    "missing_critical": 2,
                    "invalid_dates": 1
                },
                "scores": {
                    "completeness": 92.0,
                    "accuracy": 85.0,
                    "validity": 88.0,
                    "consistency": 90.0,
                    "uniqueness": 95.0
                }
            }
        }
        
        pdf_buffer = generate_pdf_report(test_data)
        
        filename = f"DHCaaS_Test_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in test PDF generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate test PDF: {str(e)}")
