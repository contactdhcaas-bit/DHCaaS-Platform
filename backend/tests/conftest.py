import base64
import os
import secrets
import uuid

import pytest

# Runs before any app import. No literal secrets: a fresh key per session.
os.environ["ENVIRONMENT"] = "development"
os.environ.setdefault("DHC_MASTER_KEY", base64.b64encode(secrets.token_bytes(32)).decode())
os.environ.setdefault("MONGODB_URI", "mongodb://127.0.0.1:27017/?replicaSet=rs0")
os.environ["DATABASE_NAME"] = f"dhcaas_test_{uuid.uuid4().hex[:8]}"
os.environ["CONNECTOR_TEST_ENABLED"] = "true"


@pytest.fixture(scope="session", autouse=True)
def _drop_test_database():
    yield
    name = os.environ["DATABASE_NAME"]
    if name.startswith("dhcaas_test_"):  # safety guard: never drop a real database
        from pymongo import MongoClient
        MongoClient(os.environ["MONGODB_URI"]).drop_database(name)