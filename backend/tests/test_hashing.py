from __future__ import annotations
import copy
import hashlib
import json
import struct
import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.hashing import (
    AUDIT_DOMAIN,
    EVIDENCE_DOMAIN,
    RULE_DOMAIN,
    HashingError,
    MAX_JSON_BYTES,
    MAX_SAFE_INTEGER,
    canonical_json,
    compute_canonical_hash,
    compute_genesis_hash,
    format_datetime,
    parse_json,
    verify_audit_chain,
)

NUMBER_VECTORS = [
    ("0000000000000000", "0"),
    ("8000000000000000", "0"),
    ("0000000000000001", "5e-324"),
    ("8000000000000001", "-5e-324"),
    ("7fefffffffffffff", "1.7976931348623157e+308"),
    ("ffefffffffffffff", "-1.7976931348623157e+308"),
    ("4340000000000000", "9007199254740992"),
    ("c340000000000000", "-9007199254740992"),
    ("4430000000000000", "295147905179352830000"),
    ("44b52d02c7e14af5", "9.999999999999997e+22"),
    ("44b52d02c7e14af6", "1e+23"),
    ("44b52d02c7e14af7", "1.0000000000000001e+23"),
    ("444b1ae4d6e2ef4e", "999999999999999700000"),
    ("444b1ae4d6e2ef4f", "999999999999999900000"),
    ("444b1ae4d6e2ef50", "1e+21"),
    ("3eb0c6f7a0b5ed8c", "9.999999999999997e-7"),
    ("3eb0c6f7a0b5ed8d", "0.000001"),
    ("41b3de4355555553", "333333333.3333332"),
    ("41b3de4355555554", "333333333.33333325"),
    ("41b3de4355555555", "333333333.3333333"),
    ("41b3de4355555556", "333333333.3333334"),
    ("41b3de4355555557", "333333333.33333343"),
    ("becbf647612f3696", "-0.0000033333333333333333"),
    ("43143ff3c1cb0959", "1424953923781206.2"),
]

def make_chain() -> tuple[str, list[dict]]:
    genesis = compute_genesis_hash("tenant-001")
    previous = genesis
    events = []
    for sequence in range(1, 4):
        body = {
            "tenant_id": "tenant-001",
            "sequence": sequence,
            "prev_hash": previous,
            "action": "incident.transition",
            "details": {
                "incident_id": "incident-001",
                "state": ["open", "investigating", "resolved"][sequence - 1],
            },
        }
        digest = compute_canonical_hash(AUDIT_DOMAIN, body, previous)
        events.append({**body, "hash": digest})
        previous = digest
    return genesis, events

class CanonicalJSONTests(unittest.TestCase):
    def test_rfc_appendix_b_numbers(self):
        for bits, expected in NUMBER_VECTORS:
            with self.subTest(bits=bits):
                value = struct.unpack(">d", bytes.fromhex(bits))[0]
                self.assertEqual(canonical_json(value), expected.encode("ascii"))

    def test_rfc_sample(self):
        payload = {
            "numbers": [333333333.33333329, 1e30, 4.50, 2e-3, 1e-27],
            "string": "€$\x0f\nA'B\"\\\\\"/",
            "literals": [None, True, False],
        }
        expected = (
            '{"literals":[null,true,false],'
            '"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],'
            '"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}'
        ).encode("utf-8")
        self.assertEqual(canonical_json(payload), expected)

    def test_rfc_utf16_key_order(self):
        payload = {
            "\u20ac": "Euro Sign",
            "\r": "Carriage Return",
            "\ufb33": "Hebrew Letter Dalet With Dagesh",
            "1": "One",
            "\U0001f600": "Emoji: Grinning Face",
            "\u0080": "Control",
            "\u00f6": "Latin Small Letter O With Diaeresis",
        }
        decoded = json.loads(canonical_json(payload))
        self.assertEqual(
            list(decoded.values()),
            [
                "Carriage Return",
                "One",
                "Control",
                "Latin Small Letter O With Diaeresis",
                "Euro Sign",
                "Emoji: Grinning Face",
                "Hebrew Letter Dalet With Dagesh",
            ],
        )

    def test_key_reordering_invariance(self):
        self.assertEqual(
            compute_canonical_hash(RULE_DOMAIN, {"a": 1, "b": 2}),
            compute_canonical_hash(RULE_DOMAIN, {"b": 2, "a": 1}),
        )
        self.assertEqual(
            canonical_json({"nested": {"b": 2, "a": 1}}),
            canonical_json({"nested": {"a": 1, "b": 2}}),
        )

    def test_arrays_preserve_order(self):
        self.assertNotEqual(canonical_json([1, 2]), canonical_json([2, 1]))

    def test_utf8_without_bom_and_no_normalization(self):
        self.assertEqual(canonical_json({"x": "é"}), b'{"x":"\xc3\xa9"}')
        self.assertNotEqual(canonical_json("é"), canonical_json("e\u0301"))

    def test_nonfinite_rejected(self):
        for value in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(value=value):
                with self.assertRaises(HashingError):
                    canonical_json({"x": value})

    def test_safe_integer_bounds(self):
        for value in (-MAX_SAFE_INTEGER, MAX_SAFE_INTEGER):
            self.assertEqual(canonical_json(value), str(value).encode())
        for value in (MAX_SAFE_INTEGER + 1, -MAX_SAFE_INTEGER - 1):
            with self.assertRaises(HashingError):
                canonical_json(value)
        self.assertEqual(canonical_json(str(MAX_SAFE_INTEGER + 1)), b'"9007199254740992"')

    def test_invalid_unicode_keys_and_values(self):
        for value in ("\ud800", "\udead", "\ufdd0", "\uffff", "\U0010ffff"):
            with self.subTest(value=repr(value)):
                with self.assertRaises(HashingError):
                    canonical_json({"x": value})
                with self.assertRaises(HashingError):
                    canonical_json({value: "x"})

    def test_duplicate_keys_and_invalid_wire_input(self):
        invalid = [
            b'{"a":1,"a":2}',
            b'{"a":1,"\\u0061":2}',
            b'{"nested":{"a":1,"a":2}}',
            b"\xef\xbb\xbf{}",
            b'{"x":"\xff"}',
            b'{"x":NaN}',
            b'{"x":Infinity}',
            b'{"x":1e400}',
            b'{"x":9007199254740992}',
            b'{"x":"\\udead"}',
            b'{"x":"\\uffff"}',
        ]
        for data in invalid:
            with self.subTest(data=data):
                with self.assertRaises(HashingError):
                    parse_json(data)

    def test_valid_surrogate_pair_in_wire_json(self):
        self.assertEqual(parse_json(b'{"x":"\\ud83d\\ude00"}'), {"x": "\U0001f600"})

    def test_datetime_conversion_is_explicit(self):
        value = datetime(2026, 10, 2, 21, 23, tzinfo=timezone(timedelta(hours=1)))
        self.assertEqual(format_datetime(value), "2026-10-02T20:23:00.000000Z")
        self.assertEqual(format_datetime(value.replace(microsecond=123456)), "2026-10-02T20:23:00.123456Z")
        with self.assertRaises(HashingError):
            format_datetime(datetime(2026, 10, 2))
        with self.assertRaises(HashingError):
            canonical_json({"timestamp": value})
        original = "2026-10-02T20:23:00Z"
        self.assertEqual(canonical_json(original), f'"{original}"'.encode())

    def test_unsupported_types_cycles_and_depth(self):
        for value in (Decimal("1.2"), (1, 2), b"data", {1: "x"}):
            with self.assertRaises(HashingError):
                canonical_json(value)
        cycle = []
        cycle.append(cycle)
        with self.assertRaises(HashingError):
            canonical_json(cycle)
        deep = None
        for _ in range(66):
            deep = [deep]
        with self.assertRaises(HashingError):
            canonical_json(deep)

    def test_payload_bound(self):
        with self.assertRaises(HashingError):
            canonical_json("x" * (MAX_JSON_BYTES - 2))
        with self.assertRaises(HashingError):
            parse_json(b" " * MAX_JSON_BYTES)

class HashChainTests(unittest.TestCase):
    def test_exact_preimages(self):
        tenant = "tenant-001"
        genesis = hashlib.sha256(b"dhcaas.audit.genesis.v1\0" + tenant.encode("utf-8")).hexdigest()
        self.assertEqual(compute_genesis_hash(tenant), genesis)
        payload = {"a": 1}
        for domain in (EVIDENCE_DOMAIN, RULE_DOMAIN):
            expected = hashlib.sha256(domain.encode("ascii") + b"\0" + b'{"a":1}').hexdigest()
            self.assertEqual(compute_canonical_hash(domain, payload), expected)
        previous = "01" * 32
        expected = hashlib.sha256(b"dhcaas.audit.v1\0" + bytes.fromhex(previous) + b'{"a":1}').hexdigest()
        self.assertEqual(compute_canonical_hash(AUDIT_DOMAIN, payload, previous), expected)

    def test_domain_separation(self):
        self.assertNotEqual(compute_canonical_hash(EVIDENCE_DOMAIN, {"a": 1}), compute_canonical_hash(RULE_DOMAIN, {"a": 1}))

    def test_valid_chain_and_no_mutation(self):
        genesis, events = make_chain()
        before = copy.deepcopy(events)
        self.assertEqual(verify_audit_chain(events, genesis), (True, None))
        self.assertEqual(events, before)
        self.assertEqual(verify_audit_chain([], genesis), (True, None))

    def test_sequence_gap(self):
        genesis, events = make_chain()
        self.assertEqual(verify_audit_chain([events[0], events[2]], genesis), (False, 1))

    def test_nested_payload_tamper(self):
        genesis, events = make_chain()
        events[1]["details"]["state"] = "resolved"
        self.assertEqual(verify_audit_chain(events, genesis), (False, 1))

    def test_broken_link(self):
        genesis, events = make_chain()
        events[1]["prev_hash"] = "00" * 32
        self.assertEqual(verify_audit_chain(events, genesis), (False, 1))

    def test_wrong_genesis(self):
        _, events = make_chain()
        self.assertEqual(verify_audit_chain(events, compute_genesis_hash("other")), (False, 0))

    def test_reordered_events_and_boolean_sequence(self):
        genesis, events = make_chain()
        self.assertEqual(verify_audit_chain([events[1], events[0]], genesis), (False, 0))
        events[0]["sequence"] = True
        self.assertEqual(verify_audit_chain(events, genesis), (False, 0))

    def test_malformed_event(self):
        genesis, events = make_chain()
        del events[1]["hash"]
        self.assertEqual(verify_audit_chain(events, genesis), (False, 1))

    def test_invalid_hash_api_arguments(self):
        invalid = [
            (AUDIT_DOMAIN, {}, None),
            (AUDIT_DOMAIN, {}, "AB" * 32),
            (AUDIT_DOMAIN, {"hash": "x"}, "00" * 32),
            (AUDIT_DOMAIN, {"prev_hash": "11" * 32}, "00" * 32),
            (RULE_DOMAIN, {}, "00" * 32),
            ("dhcaas.rule.v1\0", {}, None),
        ]
        for domain, payload, previous in invalid:
            with self.subTest(domain=domain, payload=payload):
                with self.assertRaises(HashingError):
                    compute_canonical_hash(domain, payload, previous)

    def test_invalid_verifier_arguments(self):
        with self.assertRaises(HashingError):
            verify_audit_chain([], "invalid")
        with self.assertRaises(HashingError):
            verify_audit_chain({}, "00" * 32)

    def test_valid_prefix_does_not_detect_tail_deletion(self):
        genesis, events = make_chain()
        self.assertEqual(verify_audit_chain(events[:-1], genesis), (True, None))

if __name__ == "__main__":
    unittest.main()
