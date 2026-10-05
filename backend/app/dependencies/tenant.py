"""ADR-001: get_tenant dependency."""
from __future__ import annotations
from fastapi import Depends
from app.core.tenant import TenantContext
from app.dependencies.auth import get_current_active_user

async def get_tenant(current_user=Depends(get_current_active_user)) -> TenantContext:
    company_id = getattr(current_user, "company_id", None)
    tenant_id = str(company_id) if company_id else str(current_user.id)
    return TenantContext(tenant_id=tenant_id)
