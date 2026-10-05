"""
tests/test_task4_jwt_hardening.py

Verifies Task 4 -- JWT claims hardening:
  RFC 7519 claim enforcement (iss, aud, nbf, exp, sub),
  fail-closed key safety guard, algorithm pinning.
"""
import base64
import json
import time
from bson import ObjectId

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.core.config import settings, _assert_jwt_key_safe

try:
    from jose import jwt
except ImportError:
    import jwt

_t4: dict = {}


@pytest_asyncio.fixture(scope="module")
async def t4_client():
    """Seed a fresh user, provide a configured client and a token-minting helper."""
    import datetime
    from app.core.database import connect_to_mongo, close_mongo_connection, db_instance
    from app.main import app as _app

    await connect_to_mongo()
    assert db_instance.db is not None, "connect_to_mongo left db_instance.db as None"

    oid = ObjectId()
    now_dt = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    try:
        from app.core.security import get_password_hash
        pw = get_password_hash("ci-t4-unused")
    except Exception:
        import bcrypt
        pw = bcrypt.hashpw(b"ci-t4-unused", bcrypt.gensalt()).decode()

    await db_instance.db.users.insert_one({
        "_id": oid, "user_id": str(oid),
        "email": f"t4-{oid}@tenant-a.example",
        "full_name": "CI Task4 User", "hashed_password": pw,
        "is_active": True, "is_superadmin": False, "is_verified": True,
        "role": "admin", "status": "active", "subscription_status": "active",
        "created_at": now_dt, "updated_at": now_dt,
    })
    _t4["oid"] = oid
    _t4["db"]  = db_instance.db

    def mint(overrides=None, exclude=None):
        now = int(time.time())
        base = {
            "user_id": str(oid), "sub": str(oid), "role": "admin",
            "iss": settings.JWT_ISSUER, "aud": settings.JWT_AUDIENCE,
            "tenant_id": str(oid), "nbf": now, "exp": now + 3600, "iat": now,
        }
        if overrides:
            base.update(overrides)
        if exclude:
            for k in exclude:
                base.pop(k, None)
        tok = jwt.encode(base, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return tok.decode() if isinstance(tok, bytes) else tok

    _t4["mint"] = mint
    transport = ASGITransport(app=_app, raise_app_exceptions=False)
    async with AsyncClient(
        transport=transport, base_url="http://testserver",
        headers={"Authorization": f"Bearer {mint()}"},
        follow_redirects=True,
    ) as c:
        yield c

    await db_instance.db.users.delete_one({"_id": oid})
    await close_mongo_connection()


class TestTask4JWTHardening:

    # ---- 01: sanity --------------------------------------------------
    async def test_01_valid_full_claims_token_accepted(self, t4_client):
        """A correctly formed RFC 7519 token reaches the protected endpoint."""
        r = await t4_client.get("/api/v1/auth/me")
        assert r.status_code == 200, f"Valid token rejected: {r.status_code} {r.text[:200]}"

    # ---- 02: wrong iss -----------------------------------------------
    async def test_02_wrong_iss_rejected(self, t4_client):
        """Forged issuer must return 401."""
        tok = _t4["mint"]({"iss": "evil-site.example"})
        r = await t4_client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 401, f"Wrong iss accepted: {r.status_code}"

    # ---- 03: wrong aud -----------------------------------------------
    async def test_03_wrong_aud_rejected(self, t4_client):
        """Wrong audience must return 401 (python-jose audience validation)."""
        tok = _t4["mint"]({"aud": "other-service"})
        r = await t4_client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 401, f"Wrong aud accepted: {r.status_code}"

    # ---- 04: alg=none ------------------------------------------------
    async def test_04_alg_none_rejected(self, t4_client):
        """Hand-crafted alg=none unsigned token must be rejected."""
        oid = _t4["oid"]
        hdr = base64.urlsafe_b64encode(
            json.dumps({"alg": "none", "typ": "JWT"}).encode()
        ).rstrip(b"=").decode()
        pld = base64.urlsafe_b64encode(json.dumps({
            "user_id": str(oid), "sub": str(oid),
            "iss": settings.JWT_ISSUER, "aud": settings.JWT_AUDIENCE,
            "exp": int(time.time()) + 3600,
            "nbf": int(time.time()), "iat": int(time.time()),
        }).encode()).rstrip(b"=").decode()
        none_tok = f"{hdr}.{pld}."
        r = await t4_client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {none_tok}"})
        assert r.status_code == 401, f"alg=none accepted: {r.status_code}"

    # ---- 05: expired -------------------------------------------------
    async def test_05_expired_token_rejected(self, t4_client):
        """Token with exp in the past must return 401."""
        now = int(time.time())
        tok = _t4["mint"]({"exp": now - 60, "nbf": now - 120, "iat": now - 120})
        r = await t4_client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 401, f"Expired token accepted: {r.status_code}"

    # ---- 06: nbf in future -------------------------------------------
    async def test_06_nbf_future_rejected(self, t4_client):
        """Token not yet valid (nbf in future) must return 401."""
        tok = _t4["mint"]({"nbf": int(time.time()) + 3600})
        r = await t4_client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 401, f"Future nbf accepted: {r.status_code}"

    # ---- 07: missing subject ----------------------------------------
    async def test_07_missing_subject_rejected(self, t4_client):
        """Token with neither user_id nor sub must return 401."""
        tok = _t4["mint"](exclude=["user_id", "sub"])
        r = await t4_client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 401, f"Missing subject accepted: {r.status_code}"

    # ---- 08: deactivated user ----------------------------------------
    async def test_08_deactivated_user_rejected(self, t4_client):
        """Valid token for an is_active=False user must be rejected."""
        db, oid = _t4["db"], _t4["oid"]
        await db.users.update_one({"_id": oid}, {"$set": {"is_active": False}})
        try:
            tok = _t4["mint"]()
            r = await t4_client.get("/api/v1/auth/me",
                                    headers={"Authorization": f"Bearer {tok}"})
            assert r.status_code in (400, 401, 403), (
                f"Deactivated user not rejected: {r.status_code} {r.text[:200]}"
            )
        finally:
            await db.users.update_one({"_id": oid}, {"$set": {"is_active": True}})

    # ---- 09: key safety guard ----------------------------------------
    async def test_09_key_safety_guard(self, t4_client):
        """_assert_jwt_key_safe: no-op in dev, raises on weak/placeholder key in prod."""
        # Development: any value passes
        _assert_jwt_key_safe("any-key", "development")
        _assert_jwt_key_safe("", "development")

        # Production: known placeholder raises
        with pytest.raises(RuntimeError, match="placeholder"):
            _assert_jwt_key_safe(
                "temporary-secret-key-change-in-production-min-32-chars",
                "production"
            )
        # Production: key shorter than 32 bytes raises
        with pytest.raises(RuntimeError, match="32 bytes"):
            _assert_jwt_key_safe("short-key", "production")

        # Production: strong key passes
        _assert_jwt_key_safe("a" * 32, "production")
        _assert_jwt_key_safe("a" * 64, "production")
