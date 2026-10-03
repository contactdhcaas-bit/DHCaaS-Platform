"""DHCaaS JCS serialization and domain-separated SHA-256 hashing.

Requires Python 3.12 and rfc8785==0.1.4.

Audit event format:
    {
        "sequence": 1,
        "prev_hash": "<lowercase SHA-256 hex>",
        ... application fields ...,
        "hash": "<lowercase SHA-256 hex>"
    }

All event fields except top-level "hash" participate in the audit hash.
No caller-owned object is modified.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
from datetime import datetime, timezone
from typing import Any

import rfc8785


AUDIT_DOMAIN = "dhcaas.audit.v1"
GENESIS_DOMAIN = "dhcaas.audit.genesis.v1"
EVIDENCE_DOMAIN = "dhcaas.evidence.v1"
RULE_DOMAIN = "dhcaas.rule.v1"

MAX_SAFE_INTEGER = (1 << 53) - 1
MAX_DEPTH = 64
MAX_JSON_BYTES = 2_000_000  # Exclusive bound.

_DIGEST_RE = re.compile(r"[0-9a-f]{64}\Z")
_PAYLOAD_DOMAINS = frozenset(
    {AUDIT_DOMAIN, EVIDENCE_DOMAIN, RULE_DOMAIN}
)


class HashingError(ValueError):
    """Invalid input for the DHCaaS hashing profile."""


def _validate_string(value: str) -> None:
    for char in value:
        cp = ord(char)
        if (
            0xD800 <= cp <= 0xDFFF
            or 0xFDD0 <= cp <= 0xFDEF
            or (cp & 0xFFFF) in (0xFFFE, 0xFFFF)
        ):
            raise HashingError("Surrogate or Unicode noncharacter")


def _validate_value(
    value: Any,
    depth: int,
    ancestors: set[int],
) -> None:
    if depth > MAX_DEPTH:
        raise HashingError("Maximum JSON nesting depth exceeded")

    kind = type(value)

    if value is None or kind is bool:
        return

    if kind is str:
        _validate_string(value)
        return

    if kind is int:
        if not -MAX_SAFE_INTEGER <= value <= MAX_SAFE_INTEGER:
            raise HashingError("Integer outside the safe binary64 range")
        return

    if kind is float:
        if not math.isfinite(value):
            raise HashingError("Non-finite float")
        return

    if kind not in (dict, list):
        raise HashingError(f"Unsupported JSON type: {kind.__name__}")

    identity = id(value)
    if identity in ancestors:
        raise HashingError("Cyclic JSON structure")

    ancestors.add(identity)
    try:
        if kind is dict:
            for key, item in value.items():
                if type(key) is not str:
                    raise HashingError("Object keys must be strings")
                _validate_string(key)
                _validate_value(item, depth + 1, ancestors)
        else:
            for item in value:
                _validate_value(item, depth + 1, ancestors)
    finally:
        ancestors.remove(identity)


def canonical_json(payload: Any) -> bytes:
    """Return JCS bytes under the stricter DHCaaS I-JSON profile."""
    try:
        _validate_value(payload, 0, set())
        encoded = rfc8785.dumps(payload)
    except (rfc8785.CanonicalizationError, RecursionError) as exc:
        raise HashingError("Canonicalization failed") from exc

    if len(encoded) >= MAX_JSON_BYTES:
        raise HashingError("Canonical JSON exceeds the payload bound")

    return encoded


def _object_pairs(pairs: list[tuple[str, Any]]) -> dict:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise HashingError("Duplicate JSON object key")
        result[key] = value
    return result


def _parse_integer(token: str) -> int:
    magnitude = token.removeprefix("-")
    if len(magnitude) > 16:
        raise HashingError("Integer outside the safe binary64 range")
    value = int(token)
    if not -MAX_SAFE_INTEGER <= value <= MAX_SAFE_INTEGER:
        raise HashingError("Integer outside the safe binary64 range")
    return value


def _reject_constant(token: str) -> Any:
    raise HashingError("Non-finite JSON number")


def parse_json(data: bytes | str) -> Any:
    """Parse UTF-8 JSON without BOM, duplicates or invalid I-JSON values."""
    if type(data) not in (bytes, str):
        raise HashingError("JSON input must be bytes or str")

    try:
        raw = data if type(data) is bytes else data.encode("utf-8")
        if len(raw) >= MAX_JSON_BYTES:
            raise HashingError("JSON input exceeds the payload bound")
        if raw.startswith(b"\xef\xbb\xbf"):
            raise HashingError("UTF-8 BOM is prohibited")

        text = raw.decode("utf-8", errors="strict")
        value = json.loads(
            text,
            object_pairs_hook=_object_pairs,
            parse_int=_parse_integer,
            parse_constant=_reject_constant,
        )
        canonical_json(value)
        return value
    except HashingError:
        raise
    except (UnicodeError, ValueError, RecursionError) as exc:
        raise HashingError("Invalid UTF-8 JSON") from exc


def format_datetime(value: datetime) -> str:
    """Convert an aware datetime to UTC with six fractional digits."""
    if type(value) is not datetime or value.utcoffset() is None:
        raise HashingError("An aware datetime is required")

    try:
        utc = value.astimezone(timezone.utc)
    except (ValueError, OverflowError) as exc:
        raise HashingError("Datetime cannot be represented in UTC") from exc

    return utc.isoformat(timespec="microseconds").removesuffix("+00:00") + "Z"


def _digest_bytes(value: str) -> bytes:
    if type(value) is not str or _DIGEST_RE.fullmatch(value) is None:
        raise HashingError("Expected lowercase 64-character SHA-256 hex")
    return bytes.fromhex(value)


def compute_genesis_hash(tenant_id: str) -> str:
    """SHA256(genesis domain + NUL + exact UTF-8 tenant identifier)."""
    if type(tenant_id) is not str or not tenant_id or "\0" in tenant_id:
        raise HashingError("Invalid tenant identifier")
    _validate_string(tenant_id)

    preimage = (
        GENESIS_DOMAIN.encode("ascii")
        + b"\0"
        + tenant_id.encode("utf-8")
    )
    return hashlib.sha256(preimage).hexdigest()


def compute_canonical_hash(
    domain_prefix: str,
    payload: dict,
    prev_hash: str | None = None,
) -> str:
    """Hash an object using an approved domain."""
    if type(domain_prefix) is not str or domain_prefix not in _PAYLOAD_DOMAINS:
        raise HashingError("Unsupported domain prefix")
    if type(payload) is not dict:
        raise HashingError("Hash payload must be a dict")

    if domain_prefix == AUDIT_DOMAIN:
        if prev_hash is None:
            raise HashingError("Audit hashing requires prev_hash")
        previous = _digest_bytes(prev_hash)
        if "hash" in payload:
            raise HashingError("Pass the audit body without top-level hash")
        if (
            "prev_hash" in payload
            and payload["prev_hash"] != prev_hash
        ):
            raise HashingError("Body prev_hash differs from chain input")
    else:
        if prev_hash is not None:
            raise HashingError("This domain does not accept prev_hash")
        previous = b""

    digest = hashlib.sha256()
    digest.update(domain_prefix.encode("ascii") + b"\0")
    digest.update(previous)
    digest.update(canonical_json(payload))
    return digest.hexdigest()


def verify_audit_chain(
    events: list[dict],
    genesis_hash: str,
) -> tuple[bool, int | None]:
    """Verify a complete genesis-rooted, sequence-1 audit chain."""
    if type(events) is not list:
        raise HashingError("events must be a list")
    _digest_bytes(genesis_hash)

    previous = genesis_hash

    for index, event in enumerate(events):
        try:
            if type(event) is not dict:
                return False, index

            sequence = event.get("sequence")
            if type(sequence) is not int or sequence != index + 1:
                return False, index

            link = event.get("prev_hash")
            stored_hash = event.get("hash")
            _digest_bytes(link)
            _digest_bytes(stored_hash)

            if not hmac.compare_digest(link, previous):
                return False, index

            body = {
                key: value
                for key, value in event.items()
                if key != "hash"
            }
            expected = compute_canonical_hash(
                AUDIT_DOMAIN, body, previous
            )

            if not hmac.compare_digest(stored_hash, expected):
                return False, index

            previous = stored_hash
        except HashingError:
            return False, index

    return True, None
