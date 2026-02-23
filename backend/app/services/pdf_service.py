"""
DHCaaS PDF Service v3.1
HTML-to-PDF Conversion Engine with Multiple Library Support
Primary: pdfkit | Fallback 1: WeasyPrint | Fallback 2: xhtml2pdf
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from io import BytesIO

# Try importing WeasyPrint
try:
    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError, Exception) as e:
    WEASYPRINT_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.debug(f"WeasyPrint not available: {e}")

# Try importing xhtml2pdf
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False

# Try importing pdfkit
try:
    import pdfkit
    PDFKIT_AVAILABLE = True
    WKHTMLTOPDF_PATH = r"C:\Users\Data Health Check Intercafe\wkhtmltopdf\bin\wkhtmltopdf.exe"
except ImportError:
    PDFKIT_AVAILABLE = False
    WKHTMLTOPDF_PATH = None

from jinja2 import Environment, FileSystemLoader, TemplateNotFound

# Configure logging
logger = logging.getLogger(__name__)


class PDFGenerationError(Exception):
    """Custom exception for PDF generation failures"""
    pass


class PDFService:
    """
    Service for generating PDF reports from HTML templates
    Supports multiple PDF engines with automatic fallback:
    1. pdfkit (primary - Windows-friendly)
    2. WeasyPrint (fallback 1 - best quality)
    3. xhtml2pdf (fallback 2 - pure Python)
    """

    def __init__(self, preferred_engine: Optional[str] = None):
        """
        Initialize PDF service with template environment

        Args:
            preferred_engine: 'pdfkit', 'weasyprint', or 'xhtml2pdf' (None = auto-detect)
        """
        # Determine absolute path to templates directory
        self.base_dir = Path(__file__).resolve().parent.parent
        self.templates_dir = self.base_dir / "templates" / "reports"
        self.template_file = "report_template.html"
        self.css_file = "report_style.css"

        # Validate template directory exists
        if not self.templates_dir.exists():
            raise FileNotFoundError(
                f"Templates directory not found: {self.templates_dir}\n"
                f"Expected structure: backend/app/templates/reports/"
            )

        # Initialize Jinja2 environment
        try:
            self.jinja_env = Environment(
                loader=FileSystemLoader(str(self.templates_dir)),
                autoescape=True,
                trim_blocks=True,
                lstrip_blocks=True
            )
            logger.info(f"Jinja2 environment initialized: {self.templates_dir}")
        except Exception as e:
            raise PDFGenerationError(f"Failed to initialize Jinja2 environment: {e}")

        # Determine which PDF engine to use
        self.engine = self._select_engine(preferred_engine)
        logger.info(f"PDF Engine selected: {self.engine}")

    def _select_engine(self, preferred: Optional[str]) -> str:
        """
        Select PDF rendering engine based on availability

        Args:
            preferred: Preferred engine name or None for auto-detect

        Returns:
            Engine name ('pdfkit', 'weasyprint', or 'xhtml2pdf')

        Raises:
            PDFGenerationError: If no PDF engine is available
        """
        # If user specified preference, validate it
        if preferred:
            if preferred == 'pdfkit' and not PDFKIT_AVAILABLE:
                logger.warning("pdfkit requested but not available, trying alternatives...")
            elif preferred == 'weasyprint' and not WEASYPRINT_AVAILABLE:
                logger.warning("WeasyPrint requested but not available, trying alternatives...")
            elif preferred == 'xhtml2pdf' and not XHTML2PDF_AVAILABLE:
                logger.warning("xhtml2pdf requested but not available, trying alternatives...")
            else:
                return preferred

        # Auto-detect: Prefer pdfkit (most reliable on Windows)
        if PDFKIT_AVAILABLE:
            logger.info("pdfkit detected - using wkhtmltopdf PDF engine")
            return 'pdfkit'
        elif WEASYPRINT_AVAILABLE:
            logger.info("WeasyPrint detected - using high-quality PDF engine")
            return 'weasyprint'
        elif XHTML2PDF_AVAILABLE:
            logger.info("xhtml2pdf detected - using Windows-compatible PDF engine")
            return 'xhtml2pdf'
        else:
            raise PDFGenerationError(
                "No PDF rendering library available. Install one of:\n"
                "  - pip install pdfkit (recommended for Windows)\n"
                "  - pip install weasyprint (best quality)\n"
                "  - pip install xhtml2pdf (pure Python)"
            )

    def _validate_data(self, data: Dict[str, Any]) -> None:
        """
        Validate required fields in report data

        Args:
            data: Report data dictionary

        Raises:
            ValueError: If required fields are missing
        """
        required_fields = ['datasource_name', 'scan_date', 'organization']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            raise ValueError(
                f"Missing required fields in report data: {', '.join(missing_fields)}"
            )

    def _prepare_violations_data(self, violations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare violations data for HTML template rendering

        Args:
            violations: List of violation dictionaries

        Returns:
            Dictionary with violations summary and formatted data
        """
        if not violations:
            return {
                'has_violations': False,
                'total_violations': 0,
                'critical_count': 0,
                'warning_count': 0,
                'violations': []
            }

        critical_count = sum(1 for v in violations if v.get('severity') == 'critical')
        warning_count = sum(1 for v in violations if v.get('severity') == 'warning')

        # Format violations for template
        formatted_violations = []
        for violation in violations:
            formatted_violations.append({
                'severity': violation.get('severity', 'warning').upper(),
                'policy_name': violation.get('policy_name', 'Unknown Policy'),
                'message': violation.get('message', 'No details available'),
                'is_critical': violation.get('severity') == 'critical'
            })

        return {
            'has_violations': True,
            'total_violations': len(violations),
            'critical_count': critical_count,
            'warning_count': warning_count,
            'violations': formatted_violations
        }

    def _render_html(self, data: Dict[str, Any]) -> str:
        """
        Render HTML template with data using Jinja2

        Args:
            data: Report data dictionary

        Returns:
            Rendered HTML string

        Raises:
            PDFGenerationError: If template rendering fails
        """
        try:
            # Prepare violations data if present
            if 'violations' in data:
                violations_data = self._prepare_violations_data(data['violations'])
                data['compliance'] = violations_data

            template = self.jinja_env.get_template(self.template_file)
            html_content = template.render(**data)
            logger.info(f"Template rendered successfully: {self.template_file}")
            return html_content

        except TemplateNotFound as e:
            raise PDFGenerationError(
                f"Template not found: {e.name}\n"
                f"Expected location: {self.templates_dir / self.template_file}"
            )

        except Exception as e:
            raise PDFGenerationError(f"Template rendering failed: {str(e)}")

    def _get_css_content(self) -> str:
        """
        Read CSS file content

        Returns:
            CSS content as string

        Raises:
            FileNotFoundError: If CSS file doesn't exist
        """
        css_path = self.templates_dir / self.css_file

        if not css_path.exists():
            raise FileNotFoundError(
                f"CSS file not found: {css_path}\n"
                f"Expected location: {self.templates_dir / self.css_file}"
            )

        with open(css_path, 'r', encoding='utf-8') as f:
            return f.read()

    def _embed_css_in_html(self, html_content: str, css_content: str) -> str:
        """
        Embed CSS content into HTML for compatibility

        Args:
            html_content: Original HTML content
            css_content: CSS content to embed

        Returns:
            HTML with embedded CSS
        """
        # Find </head> tag and insert <style> before it
        if '</head>' in html_content:
            css_tag = f'<style type="text/css">\n{css_content}\n</style>\n</head>'
            html_content = html_content.replace('</head>', css_tag)
        else:
            # If no </head>, add style tag at the beginning
            css_tag = f'<style type="text/css">\n{css_content}\n</style>\n'
            html_content = css_tag + html_content

        return html_content

    def _generate_pdf_weasyprint(self, html_content: str) -> bytes:
        """
        Generate PDF using WeasyPrint

        Args:
            html_content: Rendered HTML content

        Returns:
            PDF bytes

        Raises:
            PDFGenerationError: If PDF generation fails
        """
        try:
            css_path = str(self.templates_dir / self.css_file)
            font_config = FontConfiguration()

            # Create HTML object with base_url for relative path resolution
            html_obj = HTML(
                string=html_content,
                base_url=str(self.templates_dir)
            )

            # Load CSS with font configuration
            css_obj = CSS(
                filename=css_path,
                font_config=font_config
            )

            # Generate PDF to BytesIO buffer
            pdf_buffer = BytesIO()
            html_obj.write_pdf(
                pdf_buffer,
                stylesheets=[css_obj],
                font_config=font_config
            )

            # Get PDF bytes
            pdf_bytes = pdf_buffer.getvalue()
            pdf_buffer.close()

            return pdf_bytes

        except Exception as e:
            raise PDFGenerationError(f"WeasyPrint PDF generation failed: {str(e)}")

    def _generate_pdf_xhtml2pdf(self, html_content: str) -> bytes:
        """
        Generate PDF using xhtml2pdf

        Args:
            html_content: Rendered HTML content

        Returns:
            PDF bytes

        Raises:
            PDFGenerationError: If PDF generation fails
        """
        try:
            # Read and embed CSS for xhtml2pdf compatibility
            css_content = self._get_css_content()
            html_with_css = self._embed_css_in_html(html_content, css_content)

            # Generate PDF to BytesIO buffer
            pdf_buffer = BytesIO()

            # Convert HTML to PDF
            pisa_status = pisa.CreatePDF(
                html_with_css,
                dest=pdf_buffer,
                encoding='utf-8'
            )

            if pisa_status.err:
                raise PDFGenerationError(
                    f"xhtml2pdf reported {pisa_status.err} errors during conversion"
                )

            # Get PDF bytes
            pdf_bytes = pdf_buffer.getvalue()
            pdf_buffer.close()

            return pdf_bytes

        except PDFGenerationError:
            raise
        except Exception as e:
            raise PDFGenerationError(f"xhtml2pdf PDF generation failed: {str(e)}")

    def _generate_pdf_pdfkit(self, html_content: str) -> bytes:
        """
        Generate PDF using pdfkit + wkhtmltopdf

        Args:
            html_content: Rendered HTML content

        Returns:
            PDF bytes

        Raises:
            PDFGenerationError: If PDF generation fails
        """
        try:
            # Read and embed CSS
            css_content = self._get_css_content()
            html_with_css = self._embed_css_in_html(html_content, css_content)

            # Configure pdfkit
            config = pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)
            
            options = {
                'page-size': 'A4',
                'encoding': 'UTF-8',
                'enable-local-file-access': None,
                'print-media-type': None,
                'no-outline': None,
                'quiet': None
            }

            # Generate PDF
            pdf_bytes = pdfkit.from_string(
                html_with_css,
                False,  # False means return bytes instead of saving to file
                configuration=config,
                options=options
            )

            return pdf_bytes

        except Exception as e:
            raise PDFGenerationError(f"pdfkit PDF generation failed: {str(e)}")

    def generate_pdf(self, data: Dict[str, Any]) -> bytes:
        """
        Generate PDF report from data dictionary

        Args:
            data: Report data dictionary matching report_builder.py schema

        Returns:
            PDF content as bytes

        Raises:
            PDFGenerationError: If PDF generation fails
            ValueError: If required data fields are missing
        """
        try:
            # Step 1: Validate input data
            self._validate_data(data)
            logger.info(f"Generating PDF for: {data.get('datasource_name')}")

            # Step 2: Render HTML template
            html_content = self._render_html(data)

            # Step 3: Generate PDF using selected engine
            if self.engine == 'pdfkit':
                pdf_bytes = self._generate_pdf_pdfkit(html_content)
                logger.info(f"PDF generated with pdfkit: {len(pdf_bytes)} bytes")
            elif self.engine == 'weasyprint':
                pdf_bytes = self._generate_pdf_weasyprint(html_content)
                logger.info(f"PDF generated with WeasyPrint: {len(pdf_bytes)} bytes")
            elif self.engine == 'xhtml2pdf':
                pdf_bytes = self._generate_pdf_xhtml2pdf(html_content)
                logger.info(f"PDF generated with xhtml2pdf: {len(pdf_bytes)} bytes")
            else:
                raise PDFGenerationError(f"Unknown PDF engine: {self.engine}")

            return pdf_bytes

        except (ValueError, FileNotFoundError) as e:
            # Re-raise validation errors as-is
            logger.error(f"PDF generation validation error: {e}")
            raise

        except PDFGenerationError as e:
            # Re-raise custom errors as-is
            logger.error(f"PDF generation error: {e}")
            raise

        except Exception as e:
            # Wrap unexpected errors
            error_msg = f"Unexpected error during PDF generation: {str(e)}"
            logger.exception(error_msg)
            raise PDFGenerationError(error_msg)

    def generate_pdf_file(
        self,
        data: Dict[str, Any],
        output_path: str
    ) -> str:
        """
        Generate PDF and save to file

        Args:
            data: Report data dictionary
            output_path: Output file path (e.g., '/tmp/report.pdf')

        Returns:
            Absolute path to generated PDF file

        Raises:
            PDFGenerationError: If PDF generation or file writing fails
        """
        try:
            # Generate PDF bytes
            pdf_bytes = self.generate_pdf(data)

            # Write to file
            output_path = Path(output_path).resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'wb') as f:
                f.write(pdf_bytes)

            logger.info(f"PDF saved to file: {output_path}")
            return str(output_path)

        except Exception as e:
            error_msg = f"Failed to save PDF to file: {str(e)}"
            logger.error(error_msg)
            raise PDFGenerationError(error_msg)

    def get_engine_info(self) -> Dict[str, Any]:
        """
        Get information about available PDF engines

        Returns:
            Dictionary with engine availability and current selection
        """
        return {
            'current_engine': self.engine,
            'engines_available': {
                'pdfkit': PDFKIT_AVAILABLE,
                'weasyprint': WEASYPRINT_AVAILABLE,
                'xhtml2pdf': XHTML2PDF_AVAILABLE
            }
        }


# ============================= CONVENIENCE FUNCTIONS ============================= #

def generate_pdf_report(data: Dict[str, Any], engine: Optional[str] = None) -> bytes:
    """
    Convenience function to generate PDF report

    Args:
        data: Report data dictionary from ReportBuilder.build_report_data()
        engine: Preferred PDF engine ('pdfkit', 'weasyprint', or 'xhtml2pdf', None = auto)

    Returns:
        PDF content as bytes

    Raises:
        PDFGenerationError: If PDF generation fails

    Example:
        >>> from app.services.report_builder import build_incident_report
        >>> report_data = build_incident_report(incidents, "Production DB", 10000)
        >>> pdf_bytes = generate_pdf_report(report_data)
    """
    service = PDFService(preferred_engine=engine)
    return service.generate_pdf(data)


def save_pdf_report(
    data: Dict[str, Any],
    output_path: str,
    engine: Optional[str] = None
) -> str:
    """
    Convenience function to generate and save PDF report

    Args:
        data: Report data dictionary
        output_path: Output file path
        engine: Preferred PDF engine (None = auto)

    Returns:
        Absolute path to saved PDF file

    Raises:
        PDFGenerationError: If PDF generation fails

    Example:
        >>> report_data = build_incident_report(incidents)
        >>> file_path = save_pdf_report(report_data, "/tmp/report.pdf")
        >>> print(f"Report saved: {file_path}")
    """
    service = PDFService(preferred_engine=engine)
    return service.generate_pdf_file(data, output_path)


def get_pdf_engine_status() -> Dict[str, Any]:
    """
    Get status of available PDF rendering engines

    Returns:
        Dictionary with engine availability information

    Example:
        >>> status = get_pdf_engine_status()
        >>> print(f"Current engine: {status['current_engine']}")
    """
    service = PDFService()
    return service.get_engine_info()


# ============================= TESTING UTILITY ============================= #

def test_pdf_generation():
    """
    Test function to validate PDF generation with sample data
    Run with: python -m app.services.pdf_service
    """
    sample_data = {
        "datasource_name": "Test Database",
        "scan_date": "February 10, 2026",
        "organization": "DHCaaS Platform",
        "report_id": "TEST-001",
        "smart_score": {
            "overall_score": 94.7,
            "grade": "A",
            "total_penalty": 5.3,
            "breakdown": {
                "severity_penalty": 3.0,
                "status_penalty": 1.5,
                "aging_penalty": 0.8
            }
        },
        "key_metrics": {
            "total_records": 10000,
            "issues_found": 15,
            "critical_issues": 3,
            "resolved_issues": 5
        },
        "executive_summary": "This is a test report for PDF generation validation.",
        "key_findings": [
            "Test finding 1: Overall data quality exceeds standards",
            "Test finding 2: Critical incidents require attention",
            "Test finding 3: Monitoring recommendations"
        ],
        "data_profile": {
            "datasource_name": "Test Database",
            "connection_type": "PostgreSQL",
            "total_tables": 25,
            "total_columns": "N/A",
            "total_records": 10000,
            "data_volume": "1.2 GB",
            "last_updated": "February 10, 2026 12:00 PM"
        },
        "quality_dimensions": {
            "completeness": {"score": 98.5, "status": "Excellent", "description": "Non-null values in required fields"},
            "accuracy": {"score": 92.0, "status": "Good", "description": "Data conforms to expected formats"},
            "consistency": {"score": 88.5, "status": "Fair", "description": "Data consistent across fields"},
            "validity": {"score": 99.0, "status": "Excellent", "description": "Data meets validation rules"}
        },
        "issues": [
            {
                "severity": "critical",
                "rule_name": "Null Email Test",
                "column_name": "user_email",
                "affected_rows": 150,
                "status": "open"
            },
            {
                "severity": "high",
                "rule_name": "Invalid Phone Format",
                "column_name": "phone_number",
                "affected_rows": 45,
                "status": "acknowledged"
            }
        ],
        "violations": [
            {
                "severity": "critical",
                "policy_name": "GDPR Email Retention Policy",
                "message": "User emails stored beyond allowed retention period (>90 days)"
            },
            {
                "severity": "warning",
                "policy_name": "Data Lineage Tracking",
                "message": "Missing lineage metadata for 3 critical data transformations"
            }
        ],
        "remediation_plan": [
            {
                "summary": "Fix Null Emails",
                "suggested_fix": "UPDATE users SET email = 'missing@example.com' WHERE email IS NULL;",
                "impact": "High",
                "effort": "Low"
            }
        ]
    }

    try:
        print("🧪 Testing PDF generation...")
        print(f"📊 Engine Status: {get_pdf_engine_status()}")
        
        pdf_bytes = generate_pdf_report(sample_data)
        print(f"✅ PDF generated successfully: {len(pdf_bytes):,} bytes")

        # Save test PDF
        test_output = "test_report.pdf"
        save_pdf_report(sample_data, test_output)
        print(f"✅ Test PDF saved to: {Path(test_output).resolve()}")
        print(f"\n🎉 PDF generation test PASSED!")

    except Exception as e:
        print(f"❌ PDF generation test FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    # Run test when executed directly
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    test_pdf_generation()
