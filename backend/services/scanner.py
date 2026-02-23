# backend/services/scanner.py

from __future__ import annotations

import asyncio
import contextlib
import ipaddress
import socket
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse

import httpx


@dataclass
class HealthCheckResult:
    # Universal (top-level) fields
    status: str  # "Healthy" | "Unhealthy"
    latency_ms: int
    method: str  # "HTTP" | "TCP" | "UNKNOWN"
    checked_at: datetime
    target: str

    # Method-specific fields (must include "method" key for API consumers)
    details: Dict[str, Any]


def _is_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except Exception:
        return False


def _parse_host_port(target: str) -> Tuple[str, Optional[int]]:
    """
    Accepts:
    - "example.com"
    - "example.com:443"
    - "8.8.8.8"
    - "8.8.8.8:53"
    - "[2001:db8::1]:443"
    - "2001:db8::1" (IPv6 without brackets, no port parsing)
    """
    t = (target or "").strip()

    # Bracketed IPv6
    if t.startswith("[") and "]" in t:
        host = t[1 : t.index("]")]
        rest = t[t.index("]") + 1 :].strip()
        if rest.startswith(":"):
            try:
                return host, int(rest[1:])
            except Exception:
                return host, None
        return host, None

    # host:port (domain or IPv4). Avoid splitting raw IPv6 (contains many ":")
    if ":" in t and t.count(":") == 1:
        host, port_s = t.split(":", 1)
        host = host.strip()
        port_s = port_s.strip()
        try:
            return host, int(port_s)
        except Exception:
            return host, None

    return t, None


def _default_tcp_port(host: str) -> int:
    # Decision: keep 443 by default.
    return 443


def _is_explicit_http_target(target: str) -> bool:
    t = (target or "").strip().lower()
    return t.startswith("http://") or t.startswith("https://")


def _unhealthy(
    *,
    method: str,
    target: str,
    checked_at: datetime,
    latency_ms: int,
    error: str,
    step: str,
    extra_details: Optional[Dict[str, Any]] = None,
) -> HealthCheckResult:
    details: Dict[str, Any] = {"method": method, "error": error, "step": step}
    if extra_details:
        details.update(extra_details)

    return HealthCheckResult(
        status="Unhealthy",
        latency_ms=latency_ms,
        method=method,
        checked_at=checked_at,
        target=target,
        details=details,
    )


async def _http_head_check(target: str, timeout_s: float) -> HealthCheckResult:
    started = time.perf_counter()
    checked_at = datetime.utcnow()

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout_s) as client:
            resp = await client.head(target)
            latency_ms = int((time.perf_counter() - started) * 1000)

            ok = 200 <= resp.status_code < 400
            final_url = str(resp.url)
            redirected = final_url != target

            return HealthCheckResult(
                status="Healthy" if ok else "Unhealthy",
                latency_ms=latency_ms,
                method="HTTP",
                checked_at=checked_at,
                target=target,
                details={
                    "method": "HTTP",
                    "status_code": resp.status_code,
                    "final_url": final_url,
                    "redirected": redirected,
                },
            )
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        return _unhealthy(
            method="HTTP",
            target=target,
            checked_at=checked_at,
            latency_ms=latency_ms,
            error=str(exc),
            step="HTTP HEAD",
        )


async def _tcp_connect_check(target: str, host: str, port: int, timeout_s: float) -> HealthCheckResult:
    started = time.perf_counter()
    checked_at = datetime.utcnow()

    resolved_ip: Optional[str] = None
    try:
        if _is_ip(host):
            resolved_ip = host
        else:
            infos = socket.getaddrinfo(host, port)
            if infos:
                resolved_ip = infos[0][4][0]
    except Exception:
        resolved_ip = None

    try:
        fut = asyncio.open_connection(host=host, port=port)
        reader, writer = await asyncio.wait_for(fut, timeout=timeout_s)

        try:
            latency_ms = int((time.perf_counter() - started) * 1000)
            return HealthCheckResult(
                status="Healthy",
                latency_ms=latency_ms,
                method="TCP",
                checked_at=checked_at,
                target=target,
                details={
                    "method": "TCP",
                    "port": port,
                    "resolved_ip": resolved_ip,
                },
            )
        finally:
            writer.close()
            with contextlib.suppress(Exception):
                await writer.wait_closed()
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        return _unhealthy(
            method="TCP",
            target=target,
            checked_at=checked_at,
            latency_ms=latency_ms,
            error=str(exc),
            step="TCP Handshake",
            extra_details={"port": port, "resolved_ip": resolved_ip},
        )


async def perform_health_check(
    target: str,
    asset_type: str = "source",
    timeout_s: float = 4.0,
) -> HealthCheckResult:
    """
    Smart detection:
    - If target starts with http:// or https:// -> HTTP HEAD (follow redirects).
    - Else -> TCP connect (default port 443, or use host:port if provided).

    Return:
    - status: "Healthy" | "Unhealthy"
    - latency_ms: int
    - method: "HTTP" | "TCP" | "UNKNOWN"
    - checked_at: datetime (caller may isoformat it)
    - target: original target string
    - details: dict (MUST include "method" key)
    """
    target = (target or "").strip()
    checked_at = datetime.utcnow()

    if not target:
        return _unhealthy(
            method="UNKNOWN",
            target="",
            checked_at=checked_at,
            latency_ms=0,
            error="Empty target",
            step="Input validation",
        )

    if _is_explicit_http_target(target):
        parsed = urlparse(target)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return _unhealthy(
                method="HTTP",
                target=target,
                checked_at=checked_at,
                latency_ms=0,
                error="Invalid URL",
                step="URL parsing",
            )
        return await _http_head_check(target, timeout_s=timeout_s)

    host, port = _parse_host_port(target)
    if not host:
        return _unhealthy(
            method="TCP",
            target=target,
            checked_at=checked_at,
            latency_ms=0,
            error="Invalid host",
            step="Host parsing",
        )

    if port is None:
        port = _default_tcp_port(host)

    if not _is_ip(host):
        try:
            socket.getaddrinfo(host, port)
        except Exception as exc:
            return _unhealthy(
                method="TCP",
                target=target,
                checked_at=checked_at,
                latency_ms=0,
                error="DNS resolution failed",
                step="DNS resolution",
                extra_details={"port": port, "dns_error": str(exc)},
            )

    return await _tcp_connect_check(target=target, host=host, port=port, timeout_s=timeout_s)
