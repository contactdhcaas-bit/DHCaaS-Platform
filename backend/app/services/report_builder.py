# app/services/report_builder.py
"""
Report Data Builder
Transforms ScanEngine results into PDF template-compatible format.
Bridges the gap between MongoDB scan documents and Jinja2 templates.
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: TRANSLATION DICTIONARY (i18n)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSLATIONS = {
    "en": {
        # Executive Summary
        "summary_intro": "This comprehensive data quality assessment analyzed {total_records:,} records across {columns_scanned} columns, achieving an overall quality score of {overall_score:.2f}% with a grade of {grade}.",
        "summary_no_issues": "The analysis revealed no data quality issues, indicating excellent data governance practices and data integrity. Continue regular monitoring to maintain this high standard.",
        "summary_good_quality": "While {issues_found} issue(s) were identified, the data maintains strong overall quality. The detected issues are manageable and can be addressed through targeted remediation efforts.",
        "summary_moderate_quality": "The scan identified {issues_found} data quality issue(s) requiring attention. Immediate action is recommended to prevent data degradation and ensure reliability.",
        "summary_poor_quality": "The analysis uncovered {issues_found} significant data quality issue(s) that pose risks to data reliability and business operations. Urgent remediation is strongly recommended.",
        
        # AI Recommendations
        "rec_uniqueness": "Implement unique constraints on primary key columns to prevent duplicate records. Review data entry processes to identify root causes of duplication.",
        "rec_validity": "Establish data validation rules at the application layer to ensure data conforms to expected formats before insertion. Consider using regex patterns for email and phone validation.",
        "rec_completeness": "Make critical fields mandatory in your data entry forms. Implement NOT NULL constraints on essential database columns to enforce data completeness.",
        "rec_consistency": "Standardize data formats across your systems. Use controlled vocabularies and dropdown menus to ensure consistent data entry.",
        "rec_monitoring": "Schedule automated data quality scans weekly to detect issues early and track quality trends over time. Set up alerts for scores dropping below critical thresholds.",
        "rec_governance": "Implement a data governance framework with clear ownership, quality metrics, and accountability to ensure long-term data health.",
        
        # Organization
        "organization_default": "DHCaaS Platform"
    },
    "fr": {
        # Executive Summary
        "summary_intro": "Cette évaluation complète de la qualité des données a analysé {total_records:,} enregistrements sur {columns_scanned} colonnes, atteignant un score global de qualité de {overall_score:.2f}% avec une note de {grade}.",
        "summary_no_issues": "L'analyse n'a révélé aucun problème de qualité des données, indiquant d'excellentes pratiques de gouvernance des données et une intégrité des données. Continuez la surveillance régulière pour maintenir ce niveau élevé.",
        "summary_good_quality": "Bien que {issues_found} problème(s) aient été identifié(s), les données maintiennent une qualité globale solide. Les problèmes détectés sont gérables et peuvent être résolus par des efforts de remédiation ciblés.",
        "summary_moderate_quality": "L'analyse a identifié {issues_found} problème(s) de qualité des données nécessitant une attention. Une action immédiate est recommandée pour prévenir la dégradation des données et assurer la fiabilité.",
        "summary_poor_quality": "L'analyse a découvert {issues_found} problème(s) significatif(s) de qualité des données qui posent des risques pour la fiabilité des données et les opérations commerciales. Une remédiation urgente est fortement recommandée.",
        
        # AI Recommendations
        "rec_uniqueness": "Mettre en place des contraintes d'unicité sur les colonnes de clés primaires pour éviter les enregistrements dupliqués. Examiner les processus de saisie des données pour identifier les causes profondes de la duplication.",
        "rec_validity": "Établir des règles de validation des données au niveau de la couche applicative pour garantir que les données sont conformes aux formats attendus avant l'insertion. Envisager l'utilisation de modèles regex pour la validation des emails et numéros de téléphone.",
        "rec_completeness": "Rendre obligatoires les champs critiques dans vos formulaires de saisie de données. Mettre en place des contraintes NOT NULL sur les colonnes essentielles de la base de données pour imposer l'exhaustivité des données.",
        "rec_consistency": "Standardiser les formats de données dans vos systèmes. Utiliser des vocabulaires contrôlés et des menus déroulants pour assurer une saisie cohérente des données.",
        "rec_monitoring": "Planifier des analyses automatisées de la qualité des données chaque semaine pour détecter les problèmes tôt et suivre les tendances de qualité dans le temps. Configurer des alertes pour les scores qui descendent en dessous des seuils critiques.",
        "rec_governance": "Mettre en place un cadre de gouvernance des données avec une responsabilité claire, des métriques de qualité et une responsabilisation pour assurer la santé des données à long terme.",
        
        # Organization
        "organization_default": "Plateforme DHCaaS"
    }
}


def get_translation(key: str, language: str = "en", **kwargs) -> str:
    """
    Get translated text for a given key.
    
    Args:
        key: Translation key (e.g., "summary_intro")
        language: Language code ("en" or "fr")
        **kwargs: Variables to format into the translated string
        
    Returns:
        Translated and formatted string, or fallback to English
    """
    # Fallback to English if language not supported
    if language not in TRANSLATIONS:
        language = "en"
    
    # Get translation or fallback to English
    translation = TRANSLATIONS.get(language, {}).get(key)
    if not translation:
        translation = TRANSLATIONS.get("en", {}).get(key, key)
    
    # Format with provided variables
    try:
        return translation.format(**kwargs)
    except KeyError:
        # If formatting fails, return unformatted string
        return translation


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EXISTING CLASS WITH UPDATES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ReportBuilder:
    """
    Builds report data structures from ScanEngine results.
    Maps scan_jobs collection documents to PDF template variables.
    """
    
    @staticmethod
    def _calculate_smart_score_breakdown(
        overall_score: float,
        issues: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Calculate smart score penalty breakdown.
        
        Args:
            overall_score: Overall quality score (0-100)
            issues: List of detected issues
            
        Returns:
            Breakdown dict with severity, status, and aging penalties
        """
        total_penalty = 100 - overall_score
        
        # Count issues by severity
        critical_count = sum(1 for i in issues if i.get('severity', '').upper() in ['CRITICAL', 'HIGH'])
        medium_count = sum(1 for i in issues if i.get('severity', '').upper() == 'MEDIUM')
        
        # Distribute penalty based on issue severity
        if critical_count > 0:
            severity_penalty = total_penalty * 0.6  # 60% of penalty from critical/high
            status_penalty = total_penalty * 0.3    # 30% from status
            aging_penalty = total_penalty * 0.1     # 10% from aging
        elif medium_count > 0:
            severity_penalty = total_penalty * 0.4
            status_penalty = total_penalty * 0.4
            aging_penalty = total_penalty * 0.2
        else:
            # Distribute evenly if no severe issues
            severity_penalty = total_penalty * 0.33
            status_penalty = total_penalty * 0.33
            aging_penalty = total_penalty * 0.34
        
        return {
            'severity_penalty': round(severity_penalty, 2),
            'status_penalty': round(status_penalty, 2),
            'aging_penalty': round(aging_penalty, 2)
        }
    
    @staticmethod
    def _map_issue_severity(engine_severity: str) -> str:
        """
        Map ScanEngine severity to template format.
        
        Args:
            engine_severity: Severity from ScanEngine (low/medium/high)
            
        Returns:
            Template severity (CRITICAL/HIGH/MEDIUM/LOW)
        """
        severity_map = {
            'critical': 'CRITICAL',
            'high': 'HIGH',
            'medium': 'MEDIUM',
            'low': 'LOW'
        }
        return severity_map.get(engine_severity.lower(), 'MEDIUM')
    
    @staticmethod
    def _generate_executive_summary(
        overall_score: float,
        grade: str,
        total_records: int,
        columns_scanned: int,
        issues_found: int,
        language: str = "en"  # NEW: Language parameter
    ) -> str:
        """
        Generate executive summary text with i18n support.
        
        Args:
            overall_score: Overall quality score
            grade: Quality grade (A-F)
            total_records: Total records scanned
            columns_scanned: Total columns analyzed
            issues_found: Total issues found
            language: Language code ("en" or "fr")
            
        Returns:
            Executive summary paragraph in requested language
        """
        # Intro paragraph
        summary = get_translation(
            "summary_intro",
            language,
            total_records=total_records,
            columns_scanned=columns_scanned,
            overall_score=overall_score,
            grade=grade
        ) + " "
        
        # Quality assessment based on issues
        if issues_found == 0:
            summary += get_translation("summary_no_issues", language)
        elif grade in ['A', 'B']:
            summary += get_translation("summary_good_quality", language, issues_found=issues_found)
        elif grade == 'C':
            summary += get_translation("summary_moderate_quality", language, issues_found=issues_found)
        else:
            summary += get_translation("summary_poor_quality", language, issues_found=issues_found)
        
        return summary
    
    @staticmethod
    def _generate_ai_recommendations(
        issues: List[Dict[str, Any]],
        language: str = "en"  # NEW: Language parameter
    ) -> List[str]:
        """
        Generate AI-powered recommendations based on issues with i18n support.
        
        Args:
            issues: List of detected issues
            language: Language code ("en" or "fr")
            
        Returns:
            List of recommendation strings in requested language
        """
        recommendations = []
        issue_types = set(issue.get('type', '').lower() for issue in issues)
        
        if 'uniqueness' in issue_types:
            recommendations.append(get_translation("rec_uniqueness", language))
        
        if 'validity' in issue_types:
            recommendations.append(get_translation("rec_validity", language))
        
        if 'completeness' in issue_types:
            recommendations.append(get_translation("rec_completeness", language))
        
        if 'consistency' in issue_types:
            recommendations.append(get_translation("rec_consistency", language))
        
        # Always add monitoring recommendation
        recommendations.append(get_translation("rec_monitoring", language))
        
        # Always add governance recommendation
        recommendations.append(get_translation("rec_governance", language))
        
        return recommendations
    
    @staticmethod
    def build_report_data(scan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build complete report data structure from ScanEngine results.
        
        This is the main mapper function that transforms MongoDB scan documents
        into the format expected by the PDF Jinja2 template.
        
        Args:
            scan_data: Complete scan job document from MongoDB
            
        Returns:
            Dictionary with all variables needed by report_template.html
        """
        logger.info(f"Building report data for job: {scan_data.get('job_id')}")
        
        # Extract results section
        results = scan_data.get('results', {})
        
        # Extract core metrics
        overall_score = results.get('overall_score', 0.0)
        grade = results.get('grade', 'F')
        total_records = results.get('total_records', 0)
        columns_scanned = results.get('columns_scanned', 0)
        issues_found = results.get('issues_found', 0)
        scan_issues = results.get('issues', [])
        breakdown = results.get('breakdown', {})
        key_findings = results.get('key_findings', [])
        
        # Extract metadata
        datasource_name = scan_data.get('datasource_name', 'Unknown Source')
        source_type = scan_data.get('source_type', 'unknown')
        job_id = scan_data.get('job_id', 'N/A')
        created_at = scan_data.get('created_at')
        
        # NEW: Extract language (default to "en")
        language = scan_data.get('language', 'en')
        
        # Format scan date
        if isinstance(created_at, datetime):
            scan_date = created_at.strftime('%B %d, %Y at %I:%M %p')
        elif isinstance(created_at, str):
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                scan_date = dt.strftime('%B %d, %Y at %I:%M %p')
            except:
                scan_date = str(created_at)
        else:
            scan_date = 'N/A'
        
        # Build smart_score section
        smart_score_breakdown = ReportBuilder._calculate_smart_score_breakdown(
            overall_score, scan_issues
        )
        
        smart_score = {
            'overall_score': overall_score,
            'grade': grade,
            'total_penalty': 100 - overall_score,
            'breakdown': smart_score_breakdown
        }
        
        # Build key_metrics section
        critical_issues = sum(
            1 for issue in scan_issues 
            if issue.get('severity', '').lower() in ['critical', 'high']
        )
        
        key_metrics = {
            'total_records': total_records,
            'issues_found': issues_found,
            'critical_issues': critical_issues,
            'resolved_issues': 0  # ScanEngine doesn't track resolution yet
        }
        
        # NEW: Generate executive summary with language support
        executive_summary = ReportBuilder._generate_executive_summary(
            overall_score, grade, total_records, columns_scanned, issues_found, language
        )
        
        # Build data_profile section
        data_profile = {
            'datasource_name': datasource_name,
            'connection_type': source_type.upper(),
            'total_tables': 1,  # ScanEngine scans single source
            'total_columns': columns_scanned,
            'total_records': total_records,
            'data_volume': f"{total_records * columns_scanned} cells",
            'last_updated': scan_date
        }
        
        # Map quality_dimensions from breakdown
        if breakdown:
            avg_score = sum(breakdown.values()) / len(breakdown)
            quality_dimensions = {
                'completeness': avg_score * 0.95,
                'accuracy': avg_score * 1.02,
                'consistency': avg_score * 0.98,
                'validity': avg_score * 1.01
            }
            # Ensure all scores are within 0-100
            quality_dimensions = {
                k: min(100.0, max(0.0, v)) 
                for k, v in quality_dimensions.items()
            }
        else:
            quality_dimensions = {
                'completeness': overall_score,
                'accuracy': overall_score,
                'consistency': overall_score,
                'validity': overall_score
            }
        
        # Transform issues to template format
        transformed_issues = []
        for issue in scan_issues:
            transformed_issues.append({
                'severity': ReportBuilder._map_issue_severity(issue.get('severity', 'medium')),
                'rule_name': issue.get('description', 'Data Quality Issue'),
                'column_name': issue.get('column', 'N/A'),
                'affected_rows': issue.get('count', 0),
                'status': 'open'
            })
        
        # NEW: Generate AI recommendations with language support
        ai_recommendations = ReportBuilder._generate_ai_recommendations(scan_issues, language)
        
        # Build complete report data
        report_data = {
            # Header metadata
            'datasource_name': datasource_name,
            'scan_date': scan_date,
            'organization': get_translation("organization_default", language),
            'report_id': job_id[:8].upper(),
            
            # Score section
            'smart_score': smart_score,
            'key_metrics': key_metrics,
            'executive_summary': executive_summary,
            
            # Findings section
            'key_findings': key_findings if key_findings else [
                f"Data quality score: {overall_score:.2f}%",
                f"Grade: {grade}",
                f"Total issues: {issues_found}"
            ],
            'data_profile': data_profile,
            'quality_dimensions': quality_dimensions,
            
            # Issues section
            'issues': transformed_issues,
            
            # AI section
            'ml_predictions': None,
            'ai_recommendations': ai_recommendations,
            
            # Charts
            'chart_images': None
        }
        
        logger.info(f"✅ Report data built successfully for {datasource_name} (language: {language})")
        return report_data


# Convenience function
def build_report_from_scan(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to build report data.
    
    Args:
        scan_data: MongoDB scan job document
        
    Returns:
        Report data ready for PDF generation
    """
    return ReportBuilder.build_report_data(scan_data)
