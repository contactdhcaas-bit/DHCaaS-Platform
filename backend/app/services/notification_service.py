"""
Notification Service
Handles SMS, Email, and In-App notifications for critical alerts
"""

from typing import Optional, Dict
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import logging
from datetime import datetime

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationService:
    """Centralized notification service for DHCaaS alerts"""
    
    def __init__(self):
        """Initialize Twilio client with configuration"""
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.twilio_phone = settings.TWILIO_FROM_NUMBER
        self.admin_phone = settings.ADMIN_PHONE_NUMBER
        
        try:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
            logger.info(f"✅ Twilio SMS service initialized - From: {self.twilio_phone}")
        except Exception as e:
            self.client = None
            self.enabled = False
            logger.error(f"❌ Twilio initialization failed: {str(e)}")
    
    def send_sms(self, to_number: str, message: str, alert_type: str = "critical") -> Dict[str, any]:
        """Send SMS via Twilio"""
        
        if not self.enabled:
            return {"success": False, "error": "Twilio service not initialized"}
        
        try:
            if not to_number.startswith('+'):
                to_number = f"+{to_number}"
            
            emoji_map = {"critical": "🚨", "warning": "⚠️", "info": "ℹ️", "success": "✅"}
            emoji = emoji_map.get(alert_type, "📢")
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
            
            full_message = f"{emoji} DHCaaS Alert\n\n{message}\n\n⏰ {timestamp}"
            
            response = self.client.messages.create(
                body=full_message,
                from_=self.twilio_phone,
                to=to_number
            )
            
            logger.info(f"✅ SMS sent to {to_number} | SID: {response.sid}")
            
            return {
                "success": True,
                "message_sid": response.sid,
                "status": response.status,
                "to": to_number,
                "from": self.twilio_phone,
                "sent_at": timestamp
            }
            
        except TwilioRestException as e:
            logger.error(f"❌ Twilio error {e.code}: {e.msg}")
            return {"success": False, "error": f"Twilio error: {e.msg}", "error_code": e.code}
        except Exception as e:
            logger.error(f"❌ SMS failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_critical_alert(self, message: str) -> Dict[str, any]:
        """Send critical alert to admin phone"""
        if not self.admin_phone:
            return {"success": False, "error": "Admin phone not configured"}
        
        logger.info(f"🚨 Sending critical alert to admin: {self.admin_phone}")
        return self.send_sms(self.admin_phone, message, "critical")
    
    def send_scan_failure_alert(self, scan_name: str, job_id: str, quality_score: float, issues_found: int) -> Dict[str, any]:
        """Send alert for failed data quality scan"""
        message = (
            f"CRITICAL: Data Quality Failure\n\n"
            f"📊 Scan: {scan_name}\n"
            f"🆔 Job: {job_id}\n"
            f"📉 Score: {quality_score:.1f}%\n"
            f"⚠️ Issues: {issues_found}\n\n"
            f"Action required immediately!"
        )
        return self.send_critical_alert(message)
    
    def send_test_message(self, phone_number: Optional[str] = None) -> Dict[str, any]:
        """Send test message"""
        to_number = phone_number or self.admin_phone
        message = (
            "DHCaaS Alert: This is a test message from Data Health Check Platform 🚀\n\n"
            "Your notification system is working correctly!\n\n"
            "✓ Twilio integration active\n"
            "✓ SMS alerts enabled\n"
            "✓ Ready for production use"
        )
        return self.send_sms(to_number, message, "info")


_notification_service = None

def get_notification_service() -> NotificationService:
    """Get or create notification service singleton"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service

def send_sms(to_number: str, message: str, alert_type: str = "info") -> Dict:
    """Send SMS (convenience function)"""
    return get_notification_service().send_sms(to_number, message, alert_type)

def send_critical_alert(message: str) -> Dict:
    """Send critical alert to admin"""
    return get_notification_service().send_critical_alert(message)

def send_scan_failure_alert(scan_name: str, job_id: str, quality_score: float, issues_found: int) -> Dict:
    """Send scan failure alert"""
    return get_notification_service().send_scan_failure_alert(scan_name, job_id, quality_score, issues_found)
