"""
Email Service
Handles email notifications with PDF attachments
"""

from typing import List, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import logging
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Centralized email service for DHCaaS notifications"""
    
    def __init__(self):
        """Initialize FastMail with configuration"""
        try:
            self.conf = ConnectionConfig(
                MAIL_USERNAME=settings.MAIL_USERNAME,
                MAIL_PASSWORD=settings.MAIL_PASSWORD,
                MAIL_FROM=settings.MAIL_FROM,
                MAIL_PORT=settings.MAIL_PORT,
                MAIL_SERVER=settings.MAIL_SERVER,
                MAIL_STARTTLS=settings.MAIL_STARTTLS,
                MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
                USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
                VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS
            )
            
            self.fastmail = FastMail(self.conf)
            self.enabled = bool(settings.MAIL_PASSWORD)
            
            if self.enabled:
                logger.info(f"✅ Email service initialized - From: {settings.MAIL_FROM}")
            else:
                logger.warning("⚠️ Email service disabled - MAIL_PASSWORD not configured")
                
        except Exception as e:
            self.enabled = False
            logger.error(f"❌ Email service initialization failed: {str(e)}")
    
    async def send_email(
        self,
        email_to: List[str],
        subject: str,
        body: str,
        attachments: Optional[List[dict]] = None,
        subtype: str = "html"
    ) -> dict:
        """Send email with optional attachments"""
        
        if not self.enabled:
            logger.warning("📧 Email service disabled - MAIL_PASSWORD not configured")
            return {"success": False, "error": "Email service not configured"}
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=email_to,
                body=body,
                subtype=MessageType.html if subtype == "html" else MessageType.plain,
                attachments=attachments or []
            )
            
            await self.fastmail.send_message(message)
            
            logger.info(f"✅ Email sent successfully to {', '.join(email_to)}")
            
            return {
                "success": True,
                "recipients": email_to,
                "subject": subject,
                "sent_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_scan_report(
        self,
        email_to: str,
        pdf_bytes: bytes,
        filename: str,
        scan_name: str,
        quality_score: float,
        issues_found: int
    ) -> dict:
        """Send scan report with PDF attachment"""
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .score-badge {{ display: inline-block; padding: 10px 20px; background: {'#ef4444' if quality_score < 50 else '#f59e0b' if quality_score < 75 else '#10b981'}; color: white; font-size: 24px; font-weight: bold; border-radius: 8px; margin: 10px 0; }}
                .info-row {{ margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 DHCaaS Scan Report</h1>
                    <p>Data Health Check as a Service</p>
                </div>
                <div class="content">
                    <h2>Scan Completed Successfully</h2>
                    <p>Your data quality scan has been completed. Please find the detailed report attached.</p>
                    <div class="info-row"><strong>📊 Scan Name:</strong> {scan_name}</div>
                    <div class="info-row"><strong>📈 Quality Score:</strong> <span class="score-badge">{quality_score:.1f}%</span></div>
                    <div class="info-row"><strong>⚠️ Issues Found:</strong> {issues_found}</div>
                    <div class="info-row"><strong>📅 Generated:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</div>
                    <p style="margin-top: 20px;">The comprehensive PDF report is attached to this email.</p>
                </div>
                <div class="footer">
                    <p>DHCaaS - Data Health Check as a Service</p>
                    <p>Powered by Intercafe Innovation</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        attachments = [{"file": pdf_bytes, "filename": filename, "content_type": "application/pdf"}]
        
        return await self.send_email(
            email_to=[email_to],
            subject=f"DHCaaS Scan Report: {scan_name}",
            body=html_body,
            attachments=attachments,
            subtype="html"
        )
    
    async def send_test_email(self, email_to: str) -> dict:
        """Send test email without attachment"""
        
        html_body = """
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <div style="color: #10b981; font-size: 48px;">✅</div>
            <h1>Email Service is Working!</h1>
            <p>This is a test email from DHCaaS Platform.</p>
            <p>Your email notification system is configured correctly.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">DHCaaS - Data Health Check as a Service</p>
        </body>
        </html>
        """
        
        return await self.send_email(
            email_to=[email_to],
            subject="DHCaaS - Test Email Notification",
            body=html_body,
            subtype="html"
        )


_email_service = None

async def get_email_service() -> EmailService:
    """Get or create email service singleton"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

async def send_scan_report(email_to: str, pdf_bytes: bytes, filename: str, scan_name: str, quality_score: float, issues_found: int) -> dict:
    """Send scan report (convenience function)"""
    service = await get_email_service()
    return await service.send_scan_report(email_to, pdf_bytes, filename, scan_name, quality_score, issues_found)

async def send_test_email(email_to: str) -> dict:
    """Send test email (convenience function)"""
    service = await get_email_service()
    return await service.send_test_email(email_to)
