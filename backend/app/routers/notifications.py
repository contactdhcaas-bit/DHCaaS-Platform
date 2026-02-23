"""
Notifications Router
Handles SMS and Email notification testing and management
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

from app.services.notification_service import (
    get_notification_service,
    send_critical_alert,
    send_scan_failure_alert
)
from app.services.email_service import (
    get_email_service,
    send_test_email as send_test_email_func
)
from app.core.config import settings

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


class TestSMSRequest(BaseModel):
    """Request model for test SMS"""
    phone_number: Optional[str] = Field(
        None, 
        description="Phone number (optional, defaults to admin)"
    )
    message: Optional[str] = Field(
        None,
        description="Custom message (optional)"
    )


class TestEmailRequest(BaseModel):
    """Request model for test email"""
    email: EmailStr = Field(..., description="Recipient email address")


class NotificationResponse(BaseModel):
    """Response model for notification operations"""
    success: bool
    message: str
    details: Optional[dict] = None


class ConfigResponse(BaseModel):
    """Response model for configuration"""
    twilio_enabled: bool
    twilio_from: str
    admin_phone: str
    email_enabled: bool
    email_from: str
    critical_threshold: int
    app_name: str
    environment: str


# ============================================================================
# CONFIGURATION ENDPOINTS
# ============================================================================

@router.get(
    "/config",
    response_model=ConfigResponse,
    summary="Get Notification Configuration"
)
async def get_config():
    """Get notification system configuration (SMS + Email)"""
    
    sms_service = get_notification_service()
    email_service = await get_email_service()
    
    return ConfigResponse(
        twilio_enabled=sms_service.enabled,
        twilio_from=sms_service.twilio_phone,
        admin_phone=sms_service.admin_phone,
        email_enabled=email_service.enabled,
        email_from=settings.MAIL_FROM,
        critical_threshold=settings.CRITICAL_QUALITY_THRESHOLD,
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT
    )


# ============================================================================
# SMS ENDPOINTS
# ============================================================================

@router.post(
    "/test-sms",
    response_model=NotificationResponse,
    summary="Send Test SMS",
    description="Send test SMS to verify Twilio integration"
)
async def test_sms(request: TestSMSRequest = None):
    """Send a test SMS message"""
    
    service = get_notification_service()
    
    if not service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Twilio service is not initialized. Check configuration."
        )
    
    if request and request.message:
        result = service.send_sms(
            to_number=request.phone_number or service.admin_phone,
            message=request.message,
            alert_type="info"
        )
    else:
        result = service.send_test_message(
            phone_number=request.phone_number if request else None
        )
    
    if result.get("success"):
        return NotificationResponse(
            success=True,
            message=f"✅ Test SMS sent successfully to {result.get('to')}",
            details=result
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": f"Failed to send SMS: {result.get('error')}",
                "error": result
            }
        )


@router.post(
    "/test-critical-alert",
    response_model=NotificationResponse,
    summary="Test Critical Alert",
    description="Send a simulated critical alert"
)
async def test_critical_alert():
    """Send a test critical alert to admin phone"""
    
    service = get_notification_service()
    
    if not service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Twilio service is not initialized"
        )
    
    result = send_critical_alert(
        "DHCaaS Alert: This is a test message from Data Health Check Platform 🚀"
    )
    
    if result.get("success"):
        return NotificationResponse(
            success=True,
            message=f"✅ Critical alert sent to {service.admin_phone}",
            details=result
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": f"Failed: {result.get('error')}",
                "error": result
            }
        )


@router.post(
    "/simulate-scan-failure",
    response_model=NotificationResponse,
    summary="Simulate Scan Failure Alert"
)
async def simulate_scan_failure():
    """Simulate a data quality scan failure alert"""
    
    result = send_scan_failure_alert(
        scan_name="Customer Data Quality Check",
        job_id="test-scan-" + str(int(datetime.now().timestamp())),
        quality_score=35.7,
        issues_found=248
    )
    
    if result.get("success"):
        return NotificationResponse(
            success=True,
            message="✅ Scan failure simulation sent",
            details=result
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": f"Failed: {result.get('error')}",
                "error": result
            }
        )


# ============================================================================
# EMAIL ENDPOINTS
# ============================================================================

@router.post(
    "/test-email",
    response_model=NotificationResponse,
    summary="Send Test Email",
    description="Send a test email to verify email configuration"
)
async def test_email(request: TestEmailRequest):
    """
    Send a test email
    
    - **email**: Recipient email address
    """
    
    service = await get_email_service()
    
    if not service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured. Please set MAIL_PASSWORD in .env file."
        )
    
    result = await send_test_email_func(request.email)
    
    if result.get("success"):
        return NotificationResponse(
            success=True,
            message=f"✅ Test email sent successfully to {request.email}",
            details=result
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": f"Failed to send email: {result.get('error')}",
                "error": result
            }
        )
