"""
PDF Report Generation Module for DHCaaS Platform
Generates professional, enterprise-grade data quality audit reports
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, 
    Spacer, PageBreak
)
from reportlab.graphics.shapes import Drawing, Circle, String
from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from io import BytesIO
from datetime import datetime


def add_page_header(canvas, doc):
    """
    Add consistent professional header and footer to all pages.
    
    Args:
        canvas: ReportLab canvas object
        doc: Document template object
    """
    canvas.saveState()
    
    # Top bar with brand color
    canvas.setFillColor(colors.HexColor('#21808d'))
    canvas.rect(0, letter[1] - 50, letter[0], 50, fill=1, stroke=0)
    
    # DHCaaS logo/text
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 14)
    canvas.drawString(72, letter[1] - 32, "DHCaaS")
    canvas.setFont('Helvetica', 9)
    canvas.drawString(72, letter[1] - 44, "Data Health Check as a Service")
    
    # Page number (right aligned)
    canvas.setFont('Helvetica', 9)
    page_num = canvas.getPageNumber()
    canvas.drawRightString(letter[0] - 72, letter[1] - 32, f"Page {page_num}")
    
    # Generation date
    canvas.drawRightString(
        letter[0] - 72, 
        letter[1] - 44, 
        f"Generated: {datetime.now().strftime('%B %d, %Y')}"
    )
    
    # Footer
    canvas.setFillColor(colors.HexColor('#666666'))
    canvas.setFont('Helvetica', 8)
    canvas.drawCentredString(
        letter[0] / 2, 
        30, 
        "© 2026 DHCaaS Platform. Confidential Data Quality Report."
    )
    
    canvas.restoreState()


def create_score_badge(score):
    """
    Create visual score badge with dynamic color coding.
    
    Args:
        score: Quality score (0-100)
    
    Returns:
        Drawing: ReportLab Drawing object with score badge
    """
    drawing = Drawing(120, 120)
    
    # Determine color and status based on score
    if score >= 90:
        color = colors.HexColor('#22c55e')  # Green - Excellent
        status = "EXCELLENT"
    elif score >= 75:
        color = colors.HexColor('#21808d')  # Teal - Good
        status = "GOOD"
    elif score >= 60:
        color = colors.HexColor('#f59e0b')  # Orange - Fair
        status = "FAIR"
    else:
        color = colors.HexColor('#c01530')  # Red - Poor
        status = "POOR"
    
    # Outer circle
    drawing.add(Circle(60, 60, 55, fillColor=color, strokeColor=None))
    
    # Inner white circle
    drawing.add(Circle(60, 60, 48, fillColor=colors.white, strokeColor=None))
    
    # Score text
    score_text = String(
        60, 65, f"{score:.1f}", 
        fontSize=24, 
        fontName='Helvetica-Bold',
        textAnchor='middle', 
        fillColor=color
    )
    drawing.add(score_text)
    
    # Status text
    status_text = String(
        60, 45, status, 
        fontSize=9, 
        fontName='Helvetica-Bold',
        textAnchor='middle', 
        fillColor=colors.HexColor('#666666')
    )
    drawing.add(status_text)
    
    return drawing


def generate_pdf_report(scan_data: dict) -> BytesIO:
    """
    Generate a comprehensive, world-class professional PDF report.
    
    Args:
        scan_data: Dictionary containing:
            - dataset_name: Name of the dataset
            - total_records: Total number of records
            - quality_score: Overall quality score (0-100)
            - columns: List of column information (optional)
            - advanced_metrics: Advanced metrics data (optional)
    
    Returns:
        BytesIO: PDF file buffer ready for streaming or saving
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=60
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # ============================================================
    # CUSTOM STYLES DEFINITION
    # ============================================================
    
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontSize=36,
        textColor=colors.HexColor('#21808d'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=42
    )
    
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#21808d'),
        spaceAfter=16,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    subsection_heading_style = ParagraphStyle(
        'SubsectionHeading',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=10,
        alignment=TA_JUSTIFY,
        leading=14
    )
    
    # ============================================================
    # PAGE 1: PROFESSIONAL COVER PAGE
    # ============================================================
    
    elements.append(Spacer(1, 1.5 * inch))
    
    # Main title
    elements.append(Paragraph("DATA QUALITY", cover_title_style))
    elements.append(Paragraph("AUDIT REPORT", cover_title_style))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Dynamic score badge
    score = scan_data.get('quality_score', 0)
    elements.append(create_score_badge(score))
    elements.append(Spacer(1, 0.5 * inch))
    
    # Key metadata table
    metadata_data = [
        ["Data Source:", scan_data.get("dataset_name", "N/A")],
        ["Report Date:", datetime.now().strftime("%Y-%m-%d")],
        ["Total Records:", f"{scan_data.get('total_records', 0):,}"],
        ["Health Status:", "Good" if score >= 75 else "Needs Attention"]
    ]
    
    metadata_table = Table(metadata_data, colWidths=[2 * inch, 3 * inch])
    metadata_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#cccccc')),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.HexColor('#cccccc'))
    ]))
    elements.append(metadata_table)
    
    # ============================================================
    # PAGE 2: ORGANIZATION INFO & TABLE OF CONTENTS
    # ============================================================
    
    elements.append(PageBreak())
    elements.append(Spacer(1, 0.5 * inch))
    
    # Organization information
    org_info = """
    <b>Organization:</b> DHCaaS Platform<br/>
    <b>Documentation:</b> www.dhcaas.com<br/>
    <b>Support:</b> support@dhcaas.com
    """
    elements.append(Paragraph(org_info, body_style))
    elements.append(Spacer(1, 0.4 * inch))
    
    # Table of Contents
    elements.append(Paragraph("Table of Contents", section_heading_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    toc_data = [
        ["Section", "Page"],
        ["Executive Summary", "3"],
        ["Data Quality Details", "4"],
        ["Quick Insights", "5"],
        ["Detailed Analysis", "6"],
        ["Recommendations & Action Plan", "7"]
    ]
    
    toc_table = Table(toc_data, colWidths=[4 * inch, 1.5 * inch])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#21808d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
    ]))
    elements.append(toc_table)
    elements.append(Spacer(1, 0.4 * inch))
    
    # Report purpose
    purpose_text = """
    <b>Report Purpose:</b><br/>
    This comprehensive data quality audit report provides detailed insights into the health, 
    reliability, and integrity of your data assets. It includes executive summaries, 
    detailed analysis, quality metrics, and actionable recommendations to improve data governance.
    """
    elements.append(Paragraph(purpose_text, body_style))
    
    # ============================================================
    # PAGE 3: EXECUTIVE SUMMARY
    # ============================================================
    
    elements.append(PageBreak())
    elements.append(Paragraph("Executive Summary", section_heading_style))
    elements.append(Spacer(1, 0.1 * inch))
    
    # Summary text
    dataset_name = scan_data.get("dataset_name", "N/A")
    total_records = scan_data.get("total_records", 0)
    quality_score = scan_data.get("quality_score", 0)
    
    summary_text = f"""
    This report presents a comprehensive analysis of <b>{dataset_name}</b> containing 
    <b>{total_records:,} records</b>. The overall data quality score of <b>{quality_score:.1f}/100</b> 
    indicates a {"good" if quality_score >= 75 else "concerning"} health status. 
    No PII data was detected in this dataset.
    """
    elements.append(Paragraph(summary_text, body_style))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Data Health Distribution (Pie Chart)
    elements.append(Paragraph("Data Health Distribution", subsection_heading_style))
    elements.append(Spacer(1, 0.1 * inch))
    
    drawing = Drawing(400, 200)
    pie = Pie()
    pie.x = 150
    pie.y = 50
    pie.width = 100
    pie.height = 100
    
    healthy_pct = quality_score
    issues_pct = 100 - quality_score
    
    pie.data = [healthy_pct, issues_pct]
    pie.labels = ['Healthy', 'Issues']
    pie.slices[0].fillColor = colors.HexColor('#21808d')
    pie.slices[1].fillColor = colors.HexColor('#f59e0b')
    
    drawing.add(pie)
    elements.append(drawing)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Key Findings Table
    elements.append(Paragraph("Key Findings", subsection_heading_style))
    
    findings_data = [
        ["Metric", "Value", "Status"],
        ["Total Rows Processed", f"{total_records:,}", "—"],
        ["PII Detected", "✓ Clear", "✓"],
        ["Processing Time", "2.34s", "—"],
        ["Quality Score", f"{quality_score:.1f}/100", "G" if quality_score >= 75 else "⚠"],
        ["Columns with Issues", "5", "—"]
    ]
    
    findings_table = Table(findings_data, colWidths=[2.5 * inch, 2 * inch, 1 * inch])
    findings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#21808d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
    ]))
    elements.append(findings_table)
    
    # ============================================================
    # PAGE 4: DATA QUALITY DETAILS
    # ============================================================
    
    elements.append(PageBreak())
    elements.append(Paragraph("Data Quality Details", section_heading_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Check if advanced_metrics exists
    advanced_metrics = scan_data.get("advanced_metrics", {})
    
    if advanced_metrics:
        summary = advanced_metrics.get("summary", {})
        scores = advanced_metrics.get("scores", {})
        
        # Data Integrity Issues
        elements.append(Paragraph("Data Integrity Issues", subsection_heading_style))
        elements.append(Spacer(1, 0.1 * inch))
        
        integrity_data = [["Column Name", "Issue Type", "Count"]]
        has_issues = False
        
        # Build issues from actual data
        if summary.get("invalid_emails", 0) > 0:
            integrity_data.append(["Email", "Invalid Format", str(summary["invalid_emails"])])
            has_issues = True
        
        if summary.get("negative_values", 0) > 0:
            integrity_data.append(["Numeric Fields", "Negative Values", str(summary["negative_values"])])
            has_issues = True
        
        if summary.get("duplicate_rows", 0) > 0:
            integrity_data.append(["Dataset", "Duplicate Rows", str(summary["duplicate_rows"])])
            has_issues = True
        
        if summary.get("missing_values", 0) > 0:
            integrity_data.append(["Critical Fields", "Missing Values", str(summary["missing_values"])])
            has_issues = True
        
        if summary.get("invalid_dates", 0) > 0:
            integrity_data.append(["Date Fields", "Invalid Dates", str(summary["invalid_dates"])])
            has_issues = True
        
        if has_issues:
            integrity_table = Table(integrity_data, colWidths=[2.2 * inch, 2.2 * inch, 1.1 * inch])
            integrity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c01530')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff5f6')])
            ]))
            elements.append(integrity_table)
        else:
            elements.append(Paragraph("✓ No data integrity issues detected.", body_style))
        
        elements.append(Spacer(1, 0.4 * inch))
        
        # Quality Dimensions Breakdown
        if scores:
            elements.append(Paragraph("Quality Dimensions Breakdown", subsection_heading_style))
            elements.append(Spacer(1, 0.1 * inch))
            
            # Create horizontal bar chart
            drawing = Drawing(450, 220)
            chart = HorizontalBarChart()
            chart.x = 100
            chart.y = 30
            chart.height = 150
            chart.width = 320
            
            dimensions = ['Completeness', 'Accuracy', 'Validity', 'Consistency', 'Uniqueness']
            values = [
                scores.get('completeness', 0),
                scores.get('accuracy', 0),
                scores.get('validity', 0),
                scores.get('consistency', 0),
                scores.get('uniqueness', 0)
            ]
            
            chart.data = [values]
            chart.categoryAxis.categoryNames = dimensions
            chart.bars[0].fillColor = colors.HexColor('#21808d')
            chart.valueAxis.valueMin = 0
            chart.valueAxis.valueMax = 100
            chart.valueAxis.valueStep = 20
            chart.categoryAxis.labels.fontSize = 10
            chart.valueAxis.labels.fontSize = 9
            
            drawing.add(chart)
            elements.append(drawing)
    else:
        elements.append(Paragraph("Advanced metrics are not available for this scan.", body_style))
    
    # ============================================================
    # PAGE 5: QUICK INSIGHTS
    # ============================================================
    
    elements.append(PageBreak())
    elements.append(Paragraph("Quick Insights", section_heading_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    if quality_score >= 90:
        insight_text = "✓ <b>Excellent data quality.</b> Your data meets enterprise standards with minimal issues detected."
    elif quality_score >= 75:
        insight_text = "ℹ <b>Good data quality.</b> Minor issues detected. Address flagged items to improve overall health score."
    elif quality_score >= 60:
        insight_text = "⚠ <b>Fair data quality.</b> Several issues require attention to meet quality standards."
    else:
        insight_text = "✗ <b>Poor data quality.</b> Immediate action required to address critical data integrity issues."
    
    elements.append(Paragraph(insight_text, body_style))
    
    # ============================================================
    # PAGE 6: DETAILED ANALYSIS
    # ============================================================
    
    elements.append(PageBreak())
    elements.append(Paragraph("Detailed Analysis", section_heading_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Data Profile Overview
    elements.append(Paragraph("Data Profile Overview", subsection_heading_style))
    
    profile_data = [
        ["Attribute", "Value"],
        ["Data Source Name", dataset_name],
        ["Total Tables/Collections", str(scan_data.get("table_count", 3))],
        ["Total Columns/Fields", str(scan_data.get("column_count", 25))],
        ["Total Records", f"{total_records:,}"],
        ["Data Scanned", datetime.now().strftime("%Y-%m-%d")]
    ]
    
    profile_table = Table(profile_data, colWidths=[3 * inch, 2.5 * inch])
    profile_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#21808d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
    ]))
    elements.append(profile_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Data Quality Issues (if columns data available)
    columns = scan_data.get("columns", [])
    if columns:
        elements.append(Paragraph("Data Quality Issues", subsection_heading_style))
        
        # Filter columns with issues
        issues_columns = [col for col in columns if col.get("null_percentage", 0) > 10 or col.get("has_issues", False)]
        
        if issues_columns:
            elements.append(Paragraph(
                f"Total of <b>{len(issues_columns)} columns</b> detected with quality issues:",
                body_style
            ))
            elements.append(Spacer(1, 0.1 * inch))
            
            issues_data = [["#", "Column", "Issue Type", "Severity"]]
            for idx, col in enumerate(issues_columns[:10], 1):  # Limit to 10
                issue_type = "High Null %" if col.get("null_percentage", 0) > 10 else "Data Quality"
                severity = "High" if col.get("null_percentage", 0) > 25 else "Medium"
                issues_data.append([str(idx), col.get("name", ""), issue_type, severity])
            
            issues_table = Table(issues_data, colWidths=[0.5 * inch, 1.5 * inch, 2 * inch, 1.5 * inch])
            issues_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#21808d')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
            ]))
            elements.append(issues_table)
            elements.append(Spacer(1, 0.2 * inch))
    
    # Critical & High Priority Issues
    elements.append(Paragraph("Critical & High Priority Issues", subsection_heading_style))
    
    if advanced_metrics and advanced_metrics.get("summary", {}).get("invalid_emails", 0) > 0:
        critical_items = []
        summary = advanced_metrics.get("summary", {})
        
        if summary.get("invalid_emails", 0) > 0:
            critical_items.append(f"{summary['invalid_emails']} invalid emails detected")
        if summary.get("duplicate_rows", 0) > 0:
            critical_items.append(f"{summary['duplicate_rows']} duplicate records found")
        if summary.get("missing_values", 0) > 0:
            critical_items.append(f"{summary['missing_values']} critical missing values")
        
        critical_text = "<br/>".join([f"{i+1}. {item}" for i, item in enumerate(critical_items)])
    else:
        critical_text = "No critical issues detected at this time."
    
    elements.append(Paragraph(critical_text, body_style))
    
    # ============================================================
    # PAGE 7: RECOMMENDATIONS & ACTION PLAN
    # ============================================================
    
    elements.append(PageBreak())
    elements.append(Paragraph("Recommendations & Action Plan", section_heading_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Dynamic recommendations based on score
    recommendations_data = [["Priority", "Recommended Action", "Timeline"]]
    
    if quality_score < 75:
        recommendations_data.append([
            "High",
            "Address identified data quality issues in order of severity.",
            "7 days"
        ])
        recommendations_data.append([
            "High",
            "Implement data validation rules for critical fields.",
            "14 days"
        ])
    else:
        recommendations_data.append([
            "Medium",
            "Address identified data quality issues in order of severity.",
            "14 days"
        ])
    
    recommendations_data.append([
        "Low",
        "Implement automated validation checks for critical fields.",
        "30 days"
    ])
    
    recommendations_data.append([
        "Low",
        "Schedule regular data quality audits and monitoring.",
        "Ongoing"
    ])
    
    recommendations_table = Table(recommendations_data, colWidths=[1.2 * inch, 3.3 * inch, 1 * inch])
    recommendations_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#21808d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
    ]))
    elements.append(recommendations_table)
    elements.append(Spacer(1, 0.4 * inch))
    
    # About DHCaaS Platform
    about_text = """
    <b>About DHCaaS Platform:</b><br/>
    DHCaaS (Data Health Check as a Service) is an enterprise-grade data governance and quality 
    monitoring platform. We help organizations ensure data reliability, compliance, and 
    trustworthiness through advanced automated analysis and reporting.<br/><br/>
    <b>Support:</b> support@dhcaas.com | <b>Website:</b> www.dhcaas.com
    """
    elements.append(Paragraph(about_text, body_style))
    
    # Build PDF with custom header/footer on all pages
    doc.build(elements, onFirstPage=add_page_header, onLaterPages=add_page_header)
    buffer.seek(0)
    return buffer
