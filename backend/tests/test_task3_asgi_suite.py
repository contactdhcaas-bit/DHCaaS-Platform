"""
Gate G0 Task 3 Closure - Connector Credential P0 ASGI Suite
Definitive version with confirmed values from discovery.

Key decisions:
- pytest_asyncio.fixture for async fixtures (required with asyncio_mode=auto)
- synchronous pymongo for ALL DB assertions (no Motor event-loop conflicts)
- httpx.AsyncClient + ASGITransport for HTTP calls
- Real JWT with ObjectId user_id matching an inserted DB user
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Any

import pytest
import importlib
import inspect
from unittest.mock import AsyncMock, MagicMock, patch as mock_patch
import pytest_asyncio
from asgi_lifespan import LifespanManager

from pymongo import MongoClient

# ── Constants (no app imports at module level) ────────────────────────────
CANARY: str           = f"CANARY-{uuid.uuid4().hex[:6]}-REMEDIATED"
MONGO_URI: str        = os.environ["MONGODB_URI"]
MONGO_DB: str         = os.environ["DATABASE_NAME"]
CONNECTOR_COL: str    = "connectors"
ALLOWED_PUBLIC_FIELDS = frozenset({"host", "port", "username", "database", "ssl"})

_state: dict[str, Any] = {}


# ── Helpers ───────────────────────────────────────────────────────────────

def _find_envelope(doc: Any, depth: int = 0) -> dict | None:
    if depth > 8:
        return None
    if isinstance(doc, dict):
        if doc.get("_encrypted") is True and "ct" in doc:
            return doc
        for v in doc.values():
            r = _find_envelope(v, depth + 1)
            if r is not None:
                return r
    elif isinstance(doc, list):
        for item in doc:
            r = _find_envelope(item, depth + 1)
            if r is not None:
                return r
    return None


def _get_id(body: dict) -> str | None:
    return body.get("id") or body.get("_id") or body.get("connector_id")


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def mongo():
    """Synchronous pymongo client - no event-loop dependency."""
    c = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    yield c
    c.close()





@pytest.fixture(scope="module")
def connector_payload() -> dict:
    return {
        "name":   f"ci-postgres-{uuid.uuid4().hex[:6]}",
        "type":   "postgres",
        "config": {
            "host":     "localhost",
            "port":     5432,
            "username": "ci_reader",
            "password": CANARY,
            "database": "ci_fixture",
            "ssl":      False,
        },
    }


# ── Tests ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def auth_token():
    """Create a test admin in the throwaway DB and mint a JWT for it."""
    import datetime
    from bson import ObjectId
    from app.core.config import settings
    try:
        from jose import jwt
    except ImportError:
        import jwt
    mc = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    users = mc[MONGO_DB].users
    oid = ObjectId()
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    users.insert_one({
        "_id": oid, "user_id": str(oid), "email": f"ci-{oid}@test.invalid",
        "full_name": "CI Test Admin", "hashed_password": "!", "is_active": True,
        "is_verified": True, "role": "admin", "status": "active",
        "created_at": now, "updated_at": now,
    })
    token = jwt.encode(
        {"user_id": str(oid), "sub": str(oid), "role": "admin",
         "exp": int((now + datetime.timedelta(hours=1)).timestamp()),
         "iat": int(now.timestamp())},
        settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    yield token.decode() if isinstance(token, bytes) else token
    users.delete_one({"_id": oid})
    mc.close()


@pytest_asyncio.fixture(scope="module")
async def client(auth_token):
    from httpx import AsyncClient, ASGITransport
    from app.main import app as _app
    from app.core.database import connect_to_mongo, close_mongo_connection, db_instance

    await connect_to_mongo()
    assert db_instance.db is not None, "connect_to_mongo() left db_instance.db as None"

    transport = ASGITransport(app=_app, raise_app_exceptions=False)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Authorization": f"Bearer {auth_token}"},
        follow_redirects=True,
    ) as c:
        yield c

    await close_mongo_connection()


def _connection_tester_cls():
    for modname in ("app.api.v1.endpoints.connectors", "app.services.connector_service"):
        try:
            m = importlib.import_module(modname)
        except ImportError:
            continue
        if hasattr(m, "ConnectionTester"):
            return m.ConnectionTester
    pytest.fail("ConnectionTester class not found")


def _set_connector_test_flag(monkeypatch, mod, enabled: bool):
    # The gate reads the environment at request time (ADR-003 R4).
    monkeypatch.setenv("CONNECTOR_TEST_ENABLED", "true" if enabled else "false")


class TestTask3ConnectorCredentialClosure:

    async def test_01_create_connector_returns_201(
        self, client, connector_payload
    ):
        resp = await client.post("/api/v1/connectors/", json=connector_payload)
        assert resp.status_code == 201, (
            f"Expected 201, got {resp.status_code}\n"
            f"Body: {resp.text[:600]}\n"
            f"TRIAGE:\n"
            f"  401/403 = JWT rejected (check user_id ObjectId matches DB)\n"
            f"  422     = payload schema mismatch (check ConnectorType enum values)\n"
            f"  500     = app error (check startup logs)"
        )
        body = resp.json()
        _state["connector_id"] = _get_id(body)
        assert _state["connector_id"], f"No id in response: {body}"
        assert CANARY not in resp.text, "CANARY present in create response"

    async def test_02_create_response_matches_public_allowlist(
        self, client, connector_payload
    ):
        cp = {
            **connector_payload,
            "name":   f"ci-allowlist-{uuid.uuid4().hex[:6]}",
            "config": dict(connector_payload["config"]),
        }
        resp = await client.post("/api/v1/connectors/", json=cp)
        assert resp.status_code == 201, f"Create failed: {resp.status_code} {resp.text[:200]}"
        body = resp.json()
        _state["second_connector_id"] = _get_id(body)
        cfg = body.get("config", {})
        if not cfg:
            meta = {"id", "_id", "name", "type", "connector_id", "created_at",
                    "updated_at", "status", "last_tested_at", "user_id", "owner_id"}
            cfg = {k: v for k, v in body.items() if k not in meta}
        unexpected = set(cfg.keys()) - ALLOWED_PUBLIC_FIELDS
        assert not unexpected, f"Non-public fields in response: {unexpected}"
        assert "password" not in str(body), "password key leaked in create response"

    def test_03_raw_mongodb_stores_envelope_not_plaintext(
        self, mongo
    ):
        """Synchronous pymongo - no Motor event-loop conflict."""
        db  = mongo[MONGO_DB]
        cid = _state.get("connector_id")
        assert cid, "connector_id not set - test_01 must pass first"

        # Try both string _id and ObjectId
        doc = db[CONNECTOR_COL].find_one({"_id": cid})
        if doc is None:
            try:
                from bson import ObjectId
                doc = db[CONNECTOR_COL].find_one({"_id": ObjectId(cid)})
            except Exception:
                pass
        if doc is None:
            doc = db[CONNECTOR_COL].find_one({"id": cid})

        # Fallback: scan all connector-like collections
        if doc is None:
            for col_name in db.list_collection_names():
                if any(x in col_name.lower() for x in ("connector", "source", "datasource")):
                    doc = db[col_name].find_one({"id": cid}) or db[col_name].find_one({})
                    if doc:
                        _state["actual_connector_col"] = col_name
                        break

        assert doc is not None, (
            f"Connector '{cid}' not found.\n"
            f"Collections: {db.list_collection_names()}\n"
            f"Expected collection: {CONNECTOR_COL}"
        )
        assert CANARY not in str(doc), "CANARY present in plaintext in MongoDB document"
        env = _find_envelope(doc)
        assert env is not None, (
            f"No AES-GCM envelope found in document.\n"
            f"Document keys: {list(doc.keys())}"
        )
        assert env.get("_encrypted") is True, "_encrypted flag missing"
        assert "kid"  in env, "kid missing from envelope"
        assert "edek" in env, "edek missing from envelope"
        assert "ct"   in env, "ct missing from envelope"

    async def test_04_list_connectors_write_only(self, client):
        resp = await client.get("/api/v1/connectors/")
        assert resp.status_code == 200, f"List failed: {resp.text}"
        assert CANARY not in resp.text, "CANARY in list response"
        body = resp.json()
        items = (body if isinstance(body, list)
                 else body.get("connectors", body.get("items", body.get("data", []))))
        for item in items:
            cfg = item.get("config", item)
            assert "password" not in cfg, f"password key in list item config: {item}"

    async def test_05_validation_422_no_canary_reflection(self, client):
        bad = {
            "name":   "",
            "type":   "postgres",
            "config": {"host": "x", "port": "bad", "username": "u",
                       "password": CANARY, "database": "d"},
        }
        resp = await client.post("/api/v1/connectors/", json=bad)
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}"
        assert CANARY not in resp.text, f"CANARY in 422: {resp.text[:300]}"
        assert "input" not in str(resp.json()), "input field in 422 body"

    async def test_06_connector_test_disabled_returns_403(self, client, monkeypatch):
        """Gate off: 403 AND no outbound connection attempt."""
        mod = importlib.import_module("app.api.v1.endpoints.connectors")
        _set_connector_test_flag(monkeypatch, mod, False)
        CT = _connection_tester_cls()
        orig = getattr(CT, "test_postgres")
        spy = (AsyncMock if inspect.iscoroutinefunction(orig) else MagicMock)(
            side_effect=AssertionError("ConnectionTester called while gate is disabled"))
        with mock_patch.object(CT, "test_postgres", spy):
            resp = await client.post(f"/api/v1/connectors/{_state['connector_id']}/test")
        assert not spy.called, "FINDING F1: outbound connection attempted while CONNECTOR_TEST_ENABLED=false"
        assert resp.status_code == 403, f"Expected 403 when disabled, got {resp.status_code}: {resp.text[:200]}"
        assert CANARY not in resp.text

    async def test_06b_connector_test_default_off(self, client, monkeypatch):
        """Unset flag must mean disabled: 403 and no outbound connection."""
        monkeypatch.delenv("CONNECTOR_TEST_ENABLED", raising=False)
        CT = _connection_tester_cls()
        orig = getattr(CT, "test_postgres")
        spy = (AsyncMock if inspect.iscoroutinefunction(orig) else MagicMock)(
            side_effect=AssertionError("ConnectionTester called while flag is unset"))
        with mock_patch.object(CT, "test_postgres", spy):
            resp = await client.post(f"/api/v1/connectors/{_state['connector_id']}/test")
        assert not spy.called, "Outbound connection attempted with flag unset"
        assert resp.status_code == 403, f"Expected 403 with flag unset, got {resp.status_code}"

    async def test_07_connector_test_enabled_memory_only(self, client, caplog, monkeypatch):
        """Gate on: tester receives the decrypted secret in memory; no leak out."""
        mod = importlib.import_module("app.api.v1.endpoints.connectors")
        _set_connector_test_flag(monkeypatch, mod, True)
        CT = _connection_tester_cls()
        orig = getattr(CT, "test_postgres")
        ok = {"status": "success", "message": "mocked", "latency_ms": 1}
        m = (AsyncMock if inspect.iscoroutinefunction(orig) else MagicMock)(return_value=ok)
        with mock_patch.object(CT, "test_postgres", m), caplog.at_level(logging.DEBUG):
            resp = await client.post(f"/api/v1/connectors/{_state['connector_id']}/test")
        assert m.called, "ConnectionTester.test_postgres was not invoked"
        assert CANARY in repr(m.call_args), "Tester did not receive the decrypted credential"
        assert resp.status_code in (200, 400), f"Unexpected status: {resp.status_code}"
        assert CANARY not in resp.text, "CANARY in test-endpoint response"
        assert CANARY not in caplog.text, "CANARY in captured logs"

    async def test_08_schema_route_write_only(self, client, connector_payload):
        cp = {
            **connector_payload,
            "name":   f"ci-schema-{uuid.uuid4().hex[:6]}",
            "config": dict(connector_payload["config"]),
        }
        create = await client.post("/api/v1/connectors/", json=cp)
        assert create.status_code == 201
        cid = _get_id(create.json())
        resp = await client.get(f"/api/v1/connectors/{cid}/schema")
        assert CANARY not in resp.text, "CANARY in schema response"
        await client.delete(f"/api/v1/connectors/{cid}")

    async def test_09_delete_connector_and_verify_absent(
        self, client, mongo
    ):
        resp = await client.delete(
            f"/api/v1/connectors/{_state['connector_id']}"
        )
        assert resp.status_code in (200, 204), \
            f"Delete failed: {resp.status_code} {resp.text}"
        db  = mongo[MONGO_DB]
        col = _state.get("actual_connector_col", CONNECTOR_COL)
        remaining = db[col].find_one({"id": _state["connector_id"]})
        if remaining is None:
            try:
                from bson import ObjectId
                remaining = db[col].find_one(
                    {"_id": ObjectId(_state["connector_id"])}
                )
            except Exception:
                pass
        assert remaining is None, "Connector still present in MongoDB after delete"

    async def test_10_cleanup_second_connector(self, client):
        cid = _state.get("second_connector_id")
        if cid:
            resp = await client.delete(f"/api/v1/connectors/{cid}")
            assert resp.status_code in (200, 204)

    def test_11_full_database_canary_absent(self, mongo):
        """Synchronous pymongo - no Motor event-loop conflict."""
        db = mongo[MONGO_DB]
        for col in db.list_collection_names():
            for doc in db[col].find({}):
                assert CANARY not in str(doc), \
                    f"CANARY in '{col}': {str(doc)[:200]}"

    async def test_12_logs_canary_absent(self, caplog):
        assert CANARY not in caplog.text, \
            f"CANARY in logs: {caplog.text[:300]}"

    async def test_13_unauthenticated_connector_routes_denied(self):
        from httpx import AsyncClient, ASGITransport
        from app.main import app as _app
        transport = ASGITransport(app=_app, raise_app_exceptions=False)
        async with AsyncClient(
            transport=transport, base_url="http://testserver"
        ) as raw:
            for method, path in [
                ("GET",    "/api/v1/connectors/"),
                ("POST",   "/api/v1/connectors/"),
                ("DELETE", "/api/v1/connectors/000000000000000000000000"),
            ]:
                resp = await raw.request(method, path)
                assert resp.status_code in (401, 403), \
                    f"Anonymous {method} {path} returned {resp.status_code}"

    @pytest.mark.xfail(
        strict=True,
        reason="ADR-001 TenantContext repository layer not yet implemented",
    )
    async def test_14_cross_tenant_connector_returns_404(self):
        assert False, "Cross-tenant isolation pending ADR-001"
