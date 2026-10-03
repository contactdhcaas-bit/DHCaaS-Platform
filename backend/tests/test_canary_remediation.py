"""DHC_TASK3_PASSWORD_ENVELOPE_V1.

Direct endpoint-function integration against a dedicated local MongoDB.
Authentication/RBAC and live PostgreSQL connectivity are not tested.
"""

from __future__ import annotations

import asyncio
import base64
import contextlib
import copy
import importlib
import inspect
import io
import json
import logging
import os
import subprocess
import sys
import uuid
from unittest.mock import AsyncMock, Mock, patch

from bson import json_util
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.uri_parser import parse_uri

from app.core.secret_store import SecretStore, SecretStoreError


CANARY = "CANARY-9e4b12-REMEDIATED"

CHECKS = [
    "envelope_roundtrip",
    "fresh_dek_and_nonces",
    "aad_mismatch_rejected",
    "ciphertext_tampering_rejected",
    "development_or_configured_key_persistence",
    "production_missing_key_rejected",
    "production_invalid_key_rejected",
    "endpoint_create",
    "raw_mongodb_ciphertext_only",
    "create_response_write_only",
    "list_response_write_only",
    "detail_response_write_only",
    "test_path_decrypts_in_memory",
    "captured_logging_canary_absent",
    "captured_stdout_stderr_canary_absent",
    "canary_document_deleted",
]


class Capture(logging.Handler):
    def __init__(self):
        super().__init__()
        self.messages = []

    def emit(self, record):
        self.messages.append(record.getMessage())


def plain(value):
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "dict"):
        return value.dict()
    return value


def assert_public(value):
    def walk(item):
        item = plain(item)
        if isinstance(item, dict):
            if "password" in item:
                raise AssertionError("Password key exposed")
            for child in item.values():
                walk(child)
        elif isinstance(item, (list, tuple)):
            for child in item:
                walk(child)
    walk(value)
    if CANARY in json_util.dumps(plain(value)):
        raise AssertionError("Canary exposed")


async def invoke(function, **supplied):
    arguments = {}
    for name, parameter in inspect.signature(function).parameters.items():
        if name in supplied:
            arguments[name] = supplied[name]
        elif (
            parameter.default is inspect.Parameter.empty
            or type(parameter.default).__name__ in {"Depends", "Security"}
        ):
            raise RuntimeError("Unresolved endpoint dependency")
        elif parameter.kind in {
            inspect.Parameter.VAR_POSITIONAL,
            inspect.Parameter.VAR_KEYWORD,
        }:
            raise RuntimeError("Unsupported endpoint signature")
    result = function(**arguments)
    return await result if inspect.isawaitable(result) else result


def request_model(module, name):
    model = module.ConnectorCreateRequest
    fields = getattr(model, "model_fields", None)
    if fields is None:
        fields = model.__fields__
    field = fields["type"]
    annotation = getattr(field, "annotation", None) or field.type_
    selected = next(
        (member.value for member in annotation
         if str(member.value).lower() in {"postgres", "postgresql"}),
        None,
    )
    if selected is None:
        raise RuntimeError("PostgreSQL connector enum not recognized")

    config = {
        "host": "127.0.0.1",
        "port": 5432,
        "database": "canary",
        "username": "canary",
        "password": CANARY,
    }
    config_model = getattr(
        fields["config"], "annotation", None
    ) or fields["config"].type_
    config_fields = getattr(
        config_model, "model_fields", None
    ) or getattr(config_model, "__fields__", {})
    aliases = {"user": "canary", "dbname": "canary"}
    for key, value in aliases.items():
        if key in config_fields:
            config[key] = value

    request = model(name=name, type=selected, config=config)
    if request.config.password != CANARY:
        raise AssertionError("Request did not retain canary password")
    return request


def crypto_checks(report):
    store = SecretStore()
    aad = b"canary-connector"
    first = store.encrypt_value(CANARY, aad)
    second = store.encrypt_value(CANARY, aad)

    assert store.decrypt_value(first, aad) == CANARY
    report["checks"]["envelope_roundtrip"] = "PASS"

    assert all(first[key] != second[key]
               for key in ("edek", "nonce", "edek_nonce"))
    report["checks"]["fresh_dek_and_nonces"] = "PASS"

    try:
        store.decrypt_value(first, b"wrong-context")
    except SecretStoreError:
        report["checks"]["aad_mismatch_rejected"] = "PASS"
    else:
        raise AssertionError("Wrong AAD accepted")

    altered = copy.deepcopy(first)
    data = bytearray(base64.b64decode(altered["ct"]))
    data[0] ^= 1
    altered["ct"] = base64.b64encode(data).decode("ascii")
    try:
        store.decrypt_value(altered, aad)
    except SecretStoreError:
        report["checks"]["ciphertext_tampering_rejected"] = "PASS"
    else:
        raise AssertionError("Tampered ciphertext accepted")

    environment = os.environ.copy()
    probe = (
        "import base64; "
        "from app.core.secret_store import SecretStore; "
        f"e={first!r}; "
        "assert SecretStore().decrypt_value(e,b'canary-connector')"
        "=='CANARY-9e4b12-REMEDIATED'"
    )
    result = subprocess.run(
        [sys.executable, "-c", probe],
        env=environment, capture_output=True, timeout=60
    )
    assert result.returncode == 0
    report["checks"]["development_or_configured_key_persistence"] = "PASS"

    failure_probe = (
        "from app.core.secret_store import SecretStore,SecretStoreError\n"
        "try:\n"
        " SecretStore()\n"
        "except SecretStoreError:\n"
        " raise SystemExit(23)\n"
        "raise SystemExit(0)\n"
    )
    environment["ENVIRONMENT"] = "production"
    environment.pop("DHC_MASTER_KEY", None)
    for key, value in (
        ("production_missing_key_rejected", None),
        ("production_invalid_key_rejected", "invalid"),
    ):
        if value is not None:
            environment["DHC_MASTER_KEY"] = value
        result = subprocess.run(
            [sys.executable, "-c", failure_probe],
            env=environment, capture_output=True, timeout=30
        )
        assert result.returncode == 23
        report["checks"][key] = "PASS"


async def integration_checks(report):
    uri = os.environ["DHC_CANARY_MONGO_URI"]
    database_name = os.environ["DHC_CANARY_DB"]
    if not any(word in database_name.lower() for word in ("test", "canary")):
        raise RuntimeError("Dedicated test database name required")

    parsed = parse_uri(uri)
    if (
        parsed.get("database") not in (None, database_name)
        or not parsed["nodelist"]
        or any(
            host.lower() not in {"localhost", "127.0.0.1", "::1"}
            for host, _ in parsed["nodelist"]
        )
    ):
        raise RuntimeError("Only a localhost-only test URI is allowed")

    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=15000)
    database = client[database_name]
    name = "dhc-canary-" + uuid.uuid4().hex
    module = importlib.import_module("app.api.v1.endpoints.connectors")
    capture = Capture()
    loggers = {logging.getLogger()}
    loggers.update(
        logger for logger in logging.Logger.manager.loggerDict.values()
        if isinstance(logger, logging.Logger)
    )
    for logger in loggers:
        logger.addHandler(capture)

    output = io.StringIO()
    try:
        await client.admin.command("ping")
        request = request_model(module, name)

        with (
            patch.object(module, "get_database", return_value=database),
            contextlib.redirect_stdout(output),
            contextlib.redirect_stderr(output),
        ):
            created = await invoke(module.create_connector, request=request)
            report["checks"]["endpoint_create"] = "PASS"

            document = await database.data_sources.find_one({"name": name})
            if document is None:
                raise AssertionError("Endpoint did not use the test database")
            if CANARY in json_util.dumps(document):
                raise AssertionError("Plaintext stored in MongoDB")
            envelope = document["config"]["password"]
            assert envelope["_encrypted"] is True
            assert envelope["v"] == 1
            assert module._dhc_secret_store.decrypt_value(
                envelope, name.encode("utf-8")
            ) == CANARY
            report["checks"]["raw_mongodb_ciphertext_only"] = "PASS"

            assert_public(created)
            report["checks"]["create_response_write_only"] = "PASS"

            listed = await invoke(module.list_connectors)
            assert_public(listed)
            report["checks"]["list_response_write_only"] = "PASS"

            detail_function = getattr(module, "get_connector", None)
            if detail_function is None:
                report["checks"]["detail_response_write_only"] = "SKIPPED_NOT_IMPLEMENTED"
                report.setdefault("skipped_reasons", {})["detail_response_write_only"] = (
                    "No get_connector detail endpoint exists in the router."
                )
            else:
                detail = await invoke(
                    detail_function, connector_id=str(document["_id"])
                )
                assert_public(detail)
                report["checks"]["detail_response_write_only"] = "PASS"

            observed = []

            def inspect_config(config):
                if config["password"] != CANARY:
                    raise AssertionError("Tester did not receive decrypted secret")
                observed.append(True)
                result = {
                    "status": "success",
                    "latency_ms": 1.0,
                    "message": "Instrumented canary test",
                }
                validated = module.TestConnectionResponse(**result)
                return plain(validated)

            original = module.ConnectionTester.test_postgres
            mocked = (
                AsyncMock(side_effect=inspect_config)
                if inspect.iscoroutinefunction(original)
                else Mock(side_effect=inspect_config)
            )
            with patch.object(
                module.ConnectionTester, "test_postgres", new=mocked
            ):
                await invoke(
                    module.test_connector,
                    connector_id=str(document["_id"]),
                )
            assert observed == [True]
            report["checks"]["test_path_decrypts_in_memory"] = "PASS"

    finally:
        try:
            result = await database.data_sources.delete_many({"name": name})
            remaining = await database.data_sources.count_documents({"name": name})
            if result.deleted_count == 1 and remaining == 0:
                report["checks"]["canary_document_deleted"] = "PASS"
        finally:
            for logger in loggers:
                logger.removeHandler(capture)
            client.close()

        report["checks"]["captured_logging_canary_absent"] = (
            "FAIL" if any(CANARY in message for message in capture.messages)
            else "PASS"
        )
        report["checks"]["captured_stdout_stderr_canary_absent"] = (
            "FAIL" if CANARY in output.getvalue() else "PASS"
        )


def main():
    report = {
        "task": "Task 3 connector password remediation",
        "mode": "DIRECT_ENDPOINT_FUNCTIONS_LOCAL_TEST_DATABASE",
        "checks": {name: "NOT_RUN" for name in CHECKS},
        "limitations": [
            "HTTP authentication and RBAC were not exercised.",
            "PostgreSQL connectivity was mocked.",
            "Historical logs and external log sinks were not scanned.",
            "Schema execution decryption was patched but not integration-tested.",
            "AAD is connector name only, as requested.",
            "Legacy production or development documents were not deleted.",
            "Application startup wiring was not separately exercised.",
        ],
    }
    try:
        crypto_checks(report)
        asyncio.run(integration_checks(report))
    except Exception as exc:
        report["failure_type"] = type(exc).__name__

    passed = all(
        value == "PASS"
        or (
            name == "detail_response_write_only"
            and value == "SKIPPED_NOT_IMPLEMENTED"
        )
        for name, value in report["checks"].items()
    )
    report["status"] = "PASS" if passed else "FAIL"
    print(json.dumps(report, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
