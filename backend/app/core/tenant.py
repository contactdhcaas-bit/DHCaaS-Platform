"""ADR-001: TenantContext -- derived from JWT only, never from request body."""
from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class TenantContext:
    tenant_id: str
