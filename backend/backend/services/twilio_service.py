from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass
from typing import Optional

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from backend.core.config import settings


E164_RE = re.compile(r"^\+[1-9]\d{7,14}$")
OTP_RE = re.compile(r"^\d{6}$")


class TwilioServiceError(RuntimeError):
    pass


@dataclass
class TwilioSendResult:
    ok: bool
    sid: Optional[str] = None
    error: Optional[str] = None


class TwilioService:
    """
    Async wrapper around Twilio (sync SDK) using asyncio.to_thread.

    Sender priority:
    1) TWILIO_MESSAGING_SERVICE_SID
    2) TWILIO_FROM_NUMBER

    OTP template (compliance / parent-company branding):
    "Your verification code is {code}. Service: {product}. Provided by {parent}."
    """

    def __init__(self) -> None:
        if not settings.TWILIO_ENABLED:
            self._client: Optional[Client] = None
            return

        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            raise TwilioServiceError("Twilio is enabled but credentials are missing")

        self._client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    def _ensure_can_send(self) -> None:
        if not settings.TWILIO_ENABLED:
            raise TwilioServiceError("Twilio is disabled (TWILIO_ENABLED=false)")
        if self._client is None:
            raise TwilioServiceError("Twilio client is not initialized")

        if settings.TWILIO_MESSAGING_SERVICE_SID.strip():
            return
        if settings.TWILIO_FROM_NUMBER.strip():
            return

        raise TwilioServiceError(
            "Twilio sender is not configured. Provide TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER."
        )

    @staticmethod
    def _validate_phone(to: str) -> str:
        to = (to or "").strip()
        if not E164_RE.match(to):
            raise TwilioServiceError("Invalid phone number format. Expected E.164 like +2126XXXXXXXX")
        return to

    @staticmethod
    def _validate_otp(code: str) -> str:
        code = (code or "").strip()
        if not OTP_RE.match(code):
            raise TwilioServiceError("Invalid OTP code. Expected exactly 6 digits.")
        return code

    def _build_sender_kwargs(self) -> dict:
        # Priority: Messaging Service SID -> From Number
        if settings.TWILIO_MESSAGING_SERVICE_SID.strip():
            return {"messaging_service_sid": settings.TWILIO_MESSAGING_SERVICE_SID.strip()}
        return {"from_": settings.TWILIO_FROM_NUMBER.strip()}

    async def send_sms(self, to: str, body: str) -> TwilioSendResult:
        """
        Low-level SMS sender with error handling.
        """
        self._ensure_can_send()
        assert self._client is not None

        to = self._validate_phone(to)
        body = (body or "").strip()
        if not body:
            raise TwilioServiceError("SMS body cannot be empty")

        sender_kwargs = self._build_sender_kwargs()

        def _send_sync() -> str:
            msg = self._client.messages.create(
                to=to,
                body=body,
                **sender_kwargs,
            )
            return msg.sid

        try:
            sid = await asyncio.to_thread(_send_sync)
            return TwilioSendResult(ok=True, sid=sid)
        except TwilioRestException as exc:
            return TwilioSendResult(ok=False, error=f"TwilioRestException: {exc.msg}")
        except Exception as exc:
            return TwilioSendResult(ok=False, error=str(exc))

    async def send_otp(self, to: str, code: str) -> TwilioSendResult:
        """
        OTP Verification message with Parent Company compliance template.
        """
        to = self._validate_phone(to)
        code = self._validate_otp(code)

        product = (settings.PRODUCT_NAME or "Service").strip()
        parent = (settings.PARENT_COMPANY_NAME or "Provider").strip()

        body = f"Your verification code is {code}. Service: {product}. Provided by {parent}."
        return await self.send_sms(to=to, body=body)

    async def send_alert(self, to: str, asset_name: str, issue: str) -> TwilioSendResult:
        """
        Critical alert SMS (High Sensitivity asset down).
        Kept concise to reduce carrier filtering risk.
        """
        to = self._validate_phone(to)

        product = (settings.PRODUCT_NAME or "Service").strip()
        parent = (settings.PARENT_COMPANY_NAME or "Provider").strip()

        asset_name = (asset_name or "").strip()[:80] or "Unknown Asset"
        issue = (issue or "").strip()[:160] or "Unknown issue"

        body = f"CRITICAL ALERT: {asset_name} - {issue}. Service: {product}. Provided by {parent}."
        return await self.send_sms(to=to, body=body)
