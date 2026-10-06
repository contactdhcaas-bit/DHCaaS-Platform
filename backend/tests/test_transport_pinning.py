import socket
import struct
import threading

import psycopg2
import pytest

from app.core.postgres_pinned import (
    postgres_parameters,
    probe_postgres,
)
from app.core.ssrf_guard import ValidatedTarget


def test_parameters_preserve_tls_identity_and_pin_ip():
    target = ValidatedTarget(
        hostname="db.example.com",
        port=5432,
        addresses=("8.8.8.8", "1.1.1.1"),
    )
    params = postgres_parameters(
        target,
        username="canary",
        password="transport-test-only",
        database="canary",
    )

    assert params["host"] == "db.example.com"
    assert params["hostaddr"] == "8.8.8.8"
    assert params["sslmode"] == "verify-full"
    assert params["sslsni"] == "1"
    assert params["gssencmode"] == "disable"
    assert "service" not in params
    assert "dsn" not in params


@pytest.mark.parametrize("database", [
    "host=127.0.0.1 dbname=test",
    "postgresql://localhost/test",
    "postgres://localhost/test",
])
def test_database_cannot_be_a_connection_string(database):
    target = ValidatedTarget("db.example.com", 5432, ("8.8.8.8",))
    with pytest.raises(ValueError):
        postgres_parameters(
            target,
            username="canary",
            password="transport-test-only",
            database=database,
        )


def test_empty_target_rejected():
    target = ValidatedTarget("db.example.com", 5432, ())
    with pytest.raises(ValueError):
        postgres_parameters(
            target,
            username="canary",
            password="transport-test-only",
            database="canary",
        )


def _receive_exact(connection, size):
    data = b""
    while len(data) < size:
        chunk = connection.recv(size - len(data))
        if not chunk:
            raise AssertionError("Connection closed before SSLRequest")
        data += chunk
    return data


def test_real_libpq_uses_pinned_ip_and_refuses_tls_downgrade(monkeypatch):
    # Transport-only harness. Production validation still denies loopback.
    # No PostgreSQL credentials are exchanged: the listener refuses TLS.
    for name in (
        "PGSERVICE",
        "PGSERVICEFILE",
        "PGHOST",
        "PGHOSTADDR",
        "PGPORT",
        "PGSSLMODE",
    ):
        monkeypatch.delenv(name, raising=False)

    observed = {}
    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listener.bind(("127.0.0.1", 0))
    listener.listen(1)
    listener.settimeout(8)
    port = listener.getsockname()[1]

    def server():
        try:
            with listener:
                connection, _ = listener.accept()
                with connection:
                    connection.settimeout(5)
                    observed["destination"] = connection.getsockname()
                    observed["request"] = _receive_exact(connection, 8)
                    connection.sendall(b"N")
                    # verify-full must not proceed with plaintext startup.
                    observed["after_refusal"] = connection.recv(1)
        except Exception as exc:
            observed["error"] = type(exc).__name__

    worker = threading.Thread(target=server, daemon=True)
    worker.start()

    target = ValidatedTarget(
        hostname="rebind-canary.invalid",
        port=port,
        addresses=("127.0.0.1",),
    )

    try:
        with pytest.raises(psycopg2.OperationalError):
            probe_postgres(
                target,
                username="canary",
                password="transport-test-only",
                database="canary",
            )
    finally:
        worker.join(timeout=10)
        listener.close()

    assert not worker.is_alive()
    assert "error" not in observed, observed
    assert observed["destination"] == ("127.0.0.1", port)
    assert observed["request"] == struct.pack("!II", 8, 80877103)
    assert observed["after_refusal"] == b""