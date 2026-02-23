"""
DHCaaS PDF Report Generation Module
app/utils/reporting.py
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.charts.piecharts import Pie
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List, Optional
import os


# Color Palette
PRIMARY_COLOR = colors.HexColor("#2563eb")  # Blue
SUCCESS_COLOR = colors.HexColor("#16a34a")  # Green
WARNING_COLOR = colors.HexColor("#ea580c")  # Orange
DANGER_COLOR = colors.HexColor("#dc2626")   # Red
GRAY_COLOR = colors.HexColor("#6b7280")     # Gray
LIGHT_GRAY = colors.HexColor("#f3f4f6")     # Light Gray


def get_status_color(score: float) -> colors.Color:
    """Determine color based on quality score"""
    if score >= 90:
        return SUCCESS_COLOR
    elif score >= 70:
        return WARNING_COLOR
    else:
        return DANGER_COLOR


def get_health_status_text(score: float) -> str:
    """Convert score to health status text"""
    if score >= 90:
        return "Excellent"
    elif score >= 80:
        return "Good"
    elif score >= 70:
        return "Fair"
    elif score >= 60:
        return "Poor"
    else:
        return "Critical"


def add_header_footer(canvas, doc):
    """Add header and footer to each page"""
    canvas.saveState()
    
    # Header
    canvas.setFillColor(PRIMARY_COLOR)
    canvas.rect(0, letter[1] - 0.75*inch, letter[0], 0.75*inch, fill=1, stroke=0)
    
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 16)
    canvas.drawString(0.5*inch, letter[1] - 0.45*inch, "DHCaaS")
    
    canvas.setFont('Helvetica', 10)
    canvas.drawString(0.5*inch, letter[1] - 0.6*inch, "Data Health Check as a Service")
    
    # Page number
    canvas.setFont('Helvetica', 9)
    canvas.drawRightString(letter[0] - 0.5*inch, letter[1] - 0.45*inch, f"Page {doc.page}")
    
    # Generation date
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(letter[0] - 0.5*inch, letter[1] - 0.6*inch, 
                          f"Generated: {datetime.now().strftime('%B %d, %Y')}")
    
    # Footer
    canvas.setFillColor(GRAY_COLOR)
    canvas.setFont('Helvetica', 8)
    canvas.drawCentredString(letter[0]/2, 0.5*inch, 
                            "© 2026 DHCaaS Platform. Confidential Data Quality Report.")
    
    canvas.restoreState()


def create_cover_page(styles: Dict, scan_data: Dict) -> List:
    """Generate cover page elements"""
    elements = []
    
    # Add spacing from header
    elements.append(Spacer(1, 0.5*inch))
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=36,
        textColor=PRIMARY_COLOR,
        alignment=TA_CENTER,
        spaceAfter=30,
        fontName='Helvetica-Bold'
    )
    elements.append(Paragraph("DATA QUALITY<br/>AUDIT REPORT", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Quality Score (Large Circle)
    score = scan_data.get("quality_score", 0)
    status = get_health_status_text(score)
    
    score_style = ParagraphStyle(
        'ScoreStyle',
        parent=styles['Normal'],
        fontSize=72,
        textColor=get_status_color(score),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    elements.append(Paragraph(f"{score:.1f}", score_style))
    
    status_style = ParagraphStyle(
        'StatusStyle',
        parent=styles['Normal'],
        fontSize=24,
        textColor=get_status_color(score),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=40
    )
    elements.append(Paragraph(status.upper(), status_style))
    elements.append(Spacer(1, 0.5*inch))
    
    # Key Information Table
    info_data = [
        ["Data Source:", scan_data.get("data_source_name", "N/A")],
        ["Report Date:", scan_data.get("scan_date", datetime.now().strftime("%Y-%m-%d"))],
        ["Total Records:", f"{scan_data.get('total_rows', 0):,}"],
        ["Health Status:", status]
    ]
    
    info_table = Table(info_data, colWidths=[2.5*inch, 3.5*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('TEXTCOLOR', (0, 0), (0, -1), GRAY_COLOR),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(info_table)
    elements.append(PageBreak())
    
    return elements


def create_disclaimer_page(styles: Dict) -> List:
    """Generate disclaimer/information page"""
    elements = []
    
    elements.append(Spacer(1, 2*inch))
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=GRAY_COLOR,
        alignment=TA_CENTER,
        leading=14
    )
    
    elements.append(Paragraph("<b>Organization:</b> DHCaaS Platform", disclaimer_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>Documentation:</b> www.dhcaas.com", disclaimer_style))
    
    elements.append(PageBreak())
    
    return elements


def create_executive_summary(styles: Dict, scan_data: Dict) -> List:
    """Generate executive summary page"""
    elements = []
    
    # Section Title
    title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=PRIMARY_COLOR,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    elements.append(Paragraph("Executive Summary", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Summary Text
    score = scan_data.get("quality_score", 0)
    status = get_health_status_text(score).lower()
    total_rows = scan_data.get("total_rows", 0)
    data_source = scan_data.get("data_source_name", "N/A")
    pii_detected = scan_data.get("pii_detected", False)
    
    summary_text = f"""This report presents a comprehensive analysis of {data_source} containing {total_rows:,} 
    records. The overall data quality score of {score:.1f}/100 indicates a {status} health status. 
    {"PII data was detected and flagged for review." if pii_detected else "No PII data was detected in this dataset."}"""
    
    summary_style = ParagraphStyle(
        'Summary',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        alignment=TA_LEFT
    )
    elements.append(Paragraph(summary_text, summary_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Pie Chart - Data Health Distribution
    elements.append(Paragraph("Data Health Distribution", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    healthy_percent = score
    issues_percent = 100 - score
    
    drawing = Drawing(400, 200)
    pie = Pie()
    pie.x = 150
    pie.y = 50
    pie.width = 100
    pie.height = 100
    pie.data = [healthy_percent, issues_percent]
    pie.labels = ['Healthy', 'Issues']
    pie.slices[0].fillColor = SUCCESS_COLOR
    pie.slices[1].fillColor = DANGER_COLOR
    
    drawing.add(pie)
    elements.append(drawing)
    elements.append(Spacer(1, 0.3*inch))
    
    # Key Findings Table
    elements.append(Paragraph("Key Findings", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    findings_data = [
        ["Metric", "Value", "Status"],
        ["Total Rows Processed", f"{total_rows:,}", "—"],
        ["PII Detected", "⚠ Alert" if pii_detected else "✓ Clear", "⚠" if pii_detected else "✓"],
        ["Processing Time", f"{scan_data.get('processing_time', 0):.2f}s", "—"],
        ["Quality Score", f"{score:.1f}/100", "G" if score >= 80 else "W"],
        ["Columns with Issues", str(scan_data.get("columns_with_issues", 0)), "—"]
    ]
    
    findings_table = Table(findings_data, colWidths=[2.5*inch, 2*inch, 1*inch])
    findings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(findings_table)
    elements.append(PageBreak())
    
    return elements


def create_quality_details_page(styles: Dict, scan_data: Dict) -> List:
    """
    NEW PAGE: Data Quality Details with Advanced Metrics
    Shows integrity issues table and quality breakdown chart
    """
    elements = []
    
    # Check if advanced metrics exist
    advanced_metrics = scan_data.get("advanced_metrics")
    if not advanced_metrics:
        return elements  # Skip this page if no advanced metrics
    
    summary = advanced_metrics.get("summary", {})
    scores = advanced_metrics.get("scores", {})
    
    # Section Title
    title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=PRIMARY_COLOR,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    elements.append(Paragraph("Data Quality Details", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # --- 1. Data Integrity Issues Table ---
    integrity_data = [["Column Name", "Issue Type", "Count"]]
    has_issues = False
    
    if summary.get("invalid_emails", 0) > 0:
        integrity_data.append(["Email", "Invalid Format", str(summary["invalid_emails"])])
        has_issues = True
    
    if summary.get("negative_values", 0) > 0:
        integrity_data.append(["Numeric Fields", "Negative Values", str(summary["negative_values"])])
        has_issues = True
    
    if summary.get("duplicate_rows", 0) > 0:
        integrity_data.append(["Dataset", "Duplicate Rows", str(summary["duplicate_rows"])])
        has_issues = True
    
    if summary.get("missing_critical", 0) > 0:
        integrity_data.append(["Critical Fields", "Missing Values", str(summary["missing_critical"])])
        has_issues = True
    
    if summary.get("invalid_dates", 0) > 0:
        integrity_data.append(["Date Fields", "Invalid Dates", str(summary["invalid_dates"])])
        has_issues = True
    
    if has_issues:
        elements.append(Paragraph("Data Integrity Issues", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        integrity_table = Table(integrity_data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
        integrity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), DANGER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(integrity_table)
        elements.append(Spacer(1, 0.4*inch))
    else:
        no_issues_style = ParagraphStyle(
            'NoIssues',
            parent=styles['Normal'],
            fontSize=11,
            textColor=SUCCESS_COLOR,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        )
        elements.append(Paragraph("✓ No Data Integrity Issues Detected", no_issues_style))
        elements.append(Spacer(1, 0.3*inch))
    
    # --- 2. Quality Breakdown Chart ---
    if scores:
        elements.append(Paragraph("Quality Dimensions Breakdown", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        # Prepare data for horizontal bar chart
        dimensions = []
        values = []
        
        dimension_map = {
            "completeness": "Completeness",
            "accuracy": "Accuracy",
            "validity": "Validity",
            "consistency": "Consistency",
            "uniqueness": "Uniqueness"
        }
        
        for key, label in dimension_map.items():
            if key in scores:
                dimensions.append(label)
                values.append(scores[key])
        
        if dimensions and values:
            drawing = Drawing(500, 250)
            
            bc = HorizontalBarChart()
            bc.x = 50
            bc.y = 50
            bc.height = 150
            bc.width = 400
            bc.data = [values]
            bc.categoryAxis.categoryNames = dimensions
            bc.valueAxis.valueMin = 0
            bc.valueAxis.valueMax = 100
            bc.valueAxis.valueStep = 20
            
            # Color bars based on score
            for i, value in enumerate(values):
                bc.bars[0][i].fillColor = get_status_color(value)
            
            bc.categoryAxis.labels.fontSize = 10
            bc.valueAxis.labels.fontSize = 9
            bc.barWidth = 15
            bc.barSpacing = 5
            
            drawing.add(bc)
            elements.append(drawing)
        else:
            elements.append(Paragraph("No quality dimension scores available.", styles['Normal']))
    
    elements.append(PageBreak())
    
    return elements


def create_insights_page(styles: Dict, scan_data: Dict) -> List:
    """Generate quick insights page"""
    elements = []
    
    elements.append(Paragraph("Quick Insights", styles['Heading1']))
    elements.append(Spacer(1, 0.2*inch))
    
    score = scan_data.get("quality_score", 0)
    
    # Generate insight based on score
    if score >= 90:
        insight = "✓ <b>Excellent data quality.</b> Your dataset demonstrates strong consistency and reliability. Continue monitoring to maintain these high standards."
        color = SUCCESS_COLOR
    elif score >= 80:
        insight = "◉ <b>Good data quality.</b> Minor issues detected. Address flagged items to improve overall health score."
        color = PRIMARY_COLOR
    elif score >= 70:
        insight = "⚠ <b>Fair data quality.</b> Several issues require attention. Prioritize high-severity items in the detailed analysis section."
        color = WARNING_COLOR
    else:
        insight = "✖ <b>Poor data quality.</b> Immediate action required. Review critical issues and implement data validation processes."
        color = DANGER_COLOR
    
    insight_style = ParagraphStyle(
        'Insight',
        parent=styles['Normal'],
        fontSize=12,
        textColor=color,
        leading=18,
        leftIndent=20
    )
    
    elements.append(Paragraph(insight, insight_style))
    elements.append(PageBreak())
    
    return elements


def create_detailed_analysis(styles: Dict, scan_data: Dict) -> List:
    """Generate detailed analysis page"""
    elements = []
    
    elements.append(Paragraph("Detailed Analysis", styles['Heading1']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Data Profile Overview
    elements.append(Paragraph("Data Profile Overview", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    profile_data = [
        ["Attribute", "Value"],
        ["Data Source Name", scan_data.get("data_source_name", "N/A")],
        ["Total Tables/Collections", str(scan_data.get("total_tables", "N/A"))],
        ["Total Columns/Fields", str(scan_data.get("total_columns", "N/A"))],
        ["Total Records", f"{scan_data.get('total_rows', 0):,}"],
        ["Data Scanned", scan_data.get("scan_date", "N/A")]
    ]
    
    profile_table = Table(profile_data, colWidths=[3*inch, 3*inch])
    profile_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(profile_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Data Quality Issues
    issues = scan_data.get("issues", [])
    if issues:
        elements.append(Paragraph(f"Data Quality Issues", styles['Heading2']))
        elements.append(Spacer(1, 0.05*inch))
        elements.append(Paragraph(f"Total of {len(issues)} columns detected with quality issues:", styles['Normal']))
        elements.append(Spacer(1, 0.1*inch))
        
        issues_data = [["#", "Column", "Issue Type", "Severity"]]
        for idx, issue in enumerate(issues[:10], 1):  # Limit to first 10
            issues_data.append([
                str(idx),
                issue.get("column", "N/A"),
                issue.get("type", "Data Quality"),
                issue.get("severity", "Medium")
            ])
        
        issues_table = Table(issues_data, colWidths=[0.5*inch, 2*inch, 2*inch, 1.5*inch])
        issues_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), WARNING_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(issues_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Critical Issues List
    critical_issues = scan_data.get("critical_issues", [])
    if critical_issues:
        elements.append(Paragraph("Critical & High Priority Issues", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        for idx, issue in enumerate(critical_issues, 1):
            issue_text = f"{idx}. {issue}"
            elements.append(Paragraph(issue_text, styles['Normal']))
            elements.append(Spacer(1, 0.05*inch))
    
    elements.append(PageBreak())
    
    return elements


def create_recommendations(styles: Dict, scan_data: Dict) -> List:
    """Generate recommendations page"""
    elements = []
    
    elements.append(Paragraph("Recommendations & Action Plan", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    score = scan_data.get("quality_score", 0)
    recommendations = []
    
    if score >= 90:
        recommendations = [
            ("Low", "Maintain current data quality standards through regular monitoring.", "30 days"),
            ("Low", "Continue validation processes and document best practices.", "30 days")
        ]
    elif score >= 80:
        recommendations = [
            ("Medium", "Address identified data quality issues in order of severity.", "14 days"),
            ("Low", "Implement automated validation checks for critical fields.", "30 days")
        ]
    elif score >= 70:
        recommendations = [
            ("High", "Prioritize fixing high-severity issues immediately.", "7 days"),
            ("Medium", "Review and update data entry procedures.", "14 days"),
            ("Medium", "Schedule data quality training for team members.", "21 days")
        ]
    else:
        recommendations = [
            ("Critical", "Immediate review of all critical issues required.", "3 days"),
            ("High", "Implement data validation at source systems.", "7 days"),
            ("High", "Establish data governance policies and procedures.", "14 days")
        ]
    
    rec_data = [["Priority", "Recommended Action", "Timeline"]]
    rec_data.extend(recommendations)
    
    rec_table = Table(rec_data, colWidths=[1.2*inch, 3.8*inch, 1*inch])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(rec_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Footer About Section
    about_style = ParagraphStyle(
        'About',
        parent=styles['Normal'],
        fontSize=9,
        textColor=GRAY_COLOR,
        leading=13,
        alignment=TA_LEFT
    )
    
    about_text = """<b>About DHCaaS Platform:</b><br/>
    DHCaaS (Data Health Check as a Service) is an enterprise-grade data governance and 
    quality monitoring platform. We help organizations ensure data reliability, compliance, 
    and trustworthiness through advanced automated analysis and reporting.<br/><br/>
    <b>Support:</b> support@dhcaas.com | <b>Website:</b> www.dhcaas.com"""
    
    elements.append(Paragraph(about_text, about_style))
    
    return elements


def generate_pdf_report(scan_data: Dict[str, Any]) -> BytesIO:
    """
    Main function to generate complete PDF report
    
    Args:
        scan_data: Dictionary containing scan results with structure:
            {
                "data_source_name": str,
                "quality_score": float,
                "total_rows": int,
                "scan_date": str,
                "pii_detected": bool,
                "processing_time": float,
                "columns_with_issues": int,
                "issues": List[Dict],
                "critical_issues": List[str],
                "advanced_metrics": {  # NEW
                    "summary": {
                        "invalid_emails": int,
                        "negative_values": int,
                        "duplicate_rows": int,
                        "missing_critical": int,
                        "invalid_dates": int
                    },
                    "scores": {
                        "completeness": float,
                        "accuracy": float,
                        "validity": float,
                        "consistency": float,
                        "uniqueness": float
                    }
                }
            }
    
    Returns:
        BytesIO: PDF file in memory buffer
    """
    buffer = BytesIO()
    
    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.75*inch
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Build document elements
    elements = []
    
    # Page 1: Cover
    elements.extend(create_cover_page(styles, scan_data))
    
    # Page 2: Disclaimer
    elements.extend(create_disclaimer_page(styles))
    
    # Page 3: Executive Summary
    elements.extend(create_executive_summary(styles, scan_data))
    
    # Page 3.5: NEW - Data Quality Details (Advanced Metrics)
    elements.extend(create_quality_details_page(styles, scan_data))
    
    # Page 4: Quick Insights
    elements.extend(create_insights_page(styles, scan_data))
    
    # Page 5: Detailed Analysis
    elements.extend(create_detailed_analysis(styles, scan_data))
    
    # Page 6: Recommendations
    elements.extend(create_recommendations(styles, scan_data))
    
    # Build PDF
    doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    
    buffer.seek(0)
    return buffer


# Example usage for testing
if __name__ == "__main__":
    # Sample data with advanced metrics
    sample_data = {
        "data_source_name": "customer_database",
        "quality_score": 87.5,
        "total_rows": 15000,
        "scan_date": "2026-02-12",
        "pii_detected": True,
        "processing_time": 3.45,
        "columns_with_issues": 8,
        "total_tables": 5,
        "total_columns": 42,
        "issues": [
            {"column": "email", "type": "Invalid Format", "severity": "High"},
            {"column": "phone", "type": "Missing Values", "severity": "Medium"},
            {"column": "age", "type": "Negative Values", "severity": "High"},
            {"column": "zip_code", "type": "Invalid Format", "severity": "Low"},
        ],
        "critical_issues": [
            "23 invalid email addresses detected in 'email' column",
            "15 negative values found in 'age' column",
            "12 duplicate customer records identified"
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
    
    # Generate PDF
    pdf_buffer = generate_pdf_report(sample_data)
    
    # Save to file for testing
    with open("test_report.pdf", "wb") as f:
        f.write(pdf_buffer.getvalue())
    
    print("✓ PDF report generated successfully: test_report.pdf")
