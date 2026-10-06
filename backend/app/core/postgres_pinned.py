from __future__ import annotations

import ipaddress
from pathlib import Path

import psycopg2

from app.core.ssrf_guard import ValidatedTarget


def _required_text(value: str, field: str) -> str:
    if not isinstance(value, str) or not value or "\x00" in value:
        raise ValueError(f"Invalid {field}")
    return value


def postgres_parameters(
    target: ValidatedTarget,
    *,
    username: str,
    password: str,
    database: str,
    ca_file: str | None = None,
) -> dict:
    if not isinstance(target, ValidatedTarget) or not target.addresses:
        raise ValueError("A validated target is required")

    if type(target.port) is not int or not 1 <= target.port <= 65535:
        raise ValueError("Invalid port")

    hostname = _required_text(target.hostname, "hostname")
    if any(c.isspace() or c in "/\\,@?#%" for c in hostname):
        raise ValueError("Invalid hostname")

    address = ipaddress.ip_address(target.addresses[0])
    if "%" in target.addresses[0]:
        raise ValueError("Scoped addresses are unsupported")

    database = _required_text(database, "database")
    # Avoid libpq connection-string expansion through dbname.
    if "=" in database or database.lower().startswith(
        ("postgres://", "postgresql://")
    ):
        raise ValueError("Database must be a database name, not a DSN")

    parameters = {
        "host": hostname,
        "hostaddr": str(address),
        "port": target.port,
        "user": _required_text(username, "username"),
        "password": _required_text(password, "password"),
        "dbname": database,
        "sslmode": "verify-full",
        "sslsni": "1",
        "gssencmode": "disable",
        "connect_timeout": 5,
        "application_name": "dhcaas-connector-test",
        "options": "-csearch_path=",
    }

    if ca_file is not None:
        path = Path(ca_file)
        if not path.is_file():
            raise ValueError("Configured CA file does not exist")
        parameters["sslrootcert"] = str(path.resolve())

    return parameters


def probe_postgres(
    target: ValidatedTarget,
    *,
    username: str,
    password: str,
    database: str,
    ca_file: str | None = None,
) -> dict:
    parameters = postgres_parameters(
        target,
        username=username,
        password=password,
        database=database,
        ca_file=ca_file,
    )

    connection = None
    try:
        connection = psycopg2.connect(**parameters)
        connection.autocommit = True
        with connection.cursor() as cursor:
            cursor.execute("SET statement_timeout = 5000")
            cursor.execute("SELECT version();")
            version_result = cursor.fetchone()
            server_version = version_result[0] if version_result else "Unknown"

            cursor.execute("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
            """)
            table_count = cursor.fetchone()[0]

        return {
            "server_version": server_version.split(",")[0],
            "database": database,
            "tables_count": table_count,
            "connection_type": "PostgreSQL",
        }
    finally:
        if connection is not None:
            connection.close()
