"""DHC_TASK3_PASSWORD_ENVELOPE_V1.

Hierarchy: configured 256-bit KEK -> fresh per-secret 256-bit DEK -> payload.
Development KEK storage uses current-user Windows DPAPI and a restricted ACL.
AESGCM outputs include their 16-byte authentication tags.
ENVIRONMENT values other than production/development are rejected.
"""

from __future__ import annotations

import base64
import json
import os
import secrets
import subprocess
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class SecretStoreError(RuntimeError):
    pass


def _b64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def _decode(value: str, length: int | None = None) -> bytes:
    if type(value) is not str:
        raise SecretStoreError("Invalid encoded value")
    try:
        raw = base64.b64decode(value, validate=True)
    except (ValueError, UnicodeError) as exc:
        raise SecretStoreError("Invalid encoded value") from exc
    if length is not None and len(raw) != length:
        raise SecretStoreError("Invalid decoded length")
    return raw


def _powershell(script: str, data: str = "") -> str:
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive",
             "-Command", script],
            input=data,
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise SecretStoreError("Windows key protection failed") from exc
    if result.returncode != 0:
        raise SecretStoreError("Windows key protection failed")
    return result.stdout.strip()


def _dpapi(data: bytes, decrypt: bool = False) -> bytes:
    operation = "Unprotect" if decrypt else "Protect"
    script = (
        "$ErrorActionPreference='Stop';"
        "Add-Type -AssemblyName System.Security;"
        "$s=[Console]::In.ReadToEnd().Trim();"
        "$b=[Convert]::FromBase64String($s);"
        "$scope=[System.Security.Cryptography.DataProtectionScope]::CurrentUser;"
        f"$r=[System.Security.Cryptography.ProtectedData]::{operation}"
        "($b,$null,$scope);"
        "[Console]::Write([Convert]::ToBase64String($r));"
    )
    return _decode(_powershell(script, _b64(data)))


def _restrict_acl(path: Path) -> None:
    sid = _powershell(
        "[Console]::Write("
        "[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value)"
    )
    if not sid.startswith("S-1-") or any(c not in "S-0123456789" for c in sid):
        raise SecretStoreError("Unable to determine Windows identity")
    try:
        result = subprocess.run(
            ["icacls.exe", str(path), "/inheritance:r",
             "/grant:r", f"*{sid}:(F)"],
            capture_output=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise SecretStoreError("Development key ACL protection failed") from exc
    if result.returncode != 0:
        raise SecretStoreError("Development key ACL protection failed")


class SecretStore:
    def __init__(self):
        environment = os.getenv("ENVIRONMENT", "development").lower()
        configured = os.getenv("DHC_MASTER_KEY")

        if environment not in {"production", "development"}:
            raise SecretStoreError("Explicit supported environment required")

        if configured is not None:
            self._kek = _decode(configured, 32)
        elif environment == "production":
            raise SecretStoreError("Production DHC_MASTER_KEY is required")
        else:
            if os.name != "nt":
                raise SecretStoreError("Development fallback requires Windows")
            path = Path(__file__).resolve().parents[2] / ".dev_master_key"
            if path.is_symlink():
                raise SecretStoreError("Development key must not be a symlink")

            if not path.exists():
                protected = _dpapi(secrets.token_bytes(32))
                try:
                    descriptor = os.open(
                        path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600
                    )
                except FileExistsError:
                    pass
                else:
                    with os.fdopen(descriptor, "wb") as stream:
                        stream.write(protected)
                        stream.flush()
                        os.fsync(stream.fileno())

            _restrict_acl(path)
            try:
                self._kek = _dpapi(path.read_bytes(), decrypt=True)
            except OSError as exc:
                raise SecretStoreError("Development key unavailable") from exc
            if len(self._kek) != 32:
                raise SecretStoreError("Invalid development master key")

        self.key_id = "kek-v1"

    @staticmethod
    def _aad(aad: bytes, purpose: str) -> bytes:
        if type(aad) is not bytes or not aad or len(aad) > 4096:
            raise SecretStoreError("Invalid associated data")
        context = {
            "v": 1,
            "kid": "kek-v1",
            "field": "password",
            "purpose": purpose,
            "context": _b64(aad),
        }
        return json.dumps(
            context, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")

    def encrypt_value(self, plaintext: str, aad: bytes) -> dict:
        if type(plaintext) is not str:
            raise SecretStoreError("Secret must be a string")
        data = plaintext.encode("utf-8")
        if len(data) > 65536:
            raise SecretStoreError("Secret exceeds size bound")

        dek = secrets.token_bytes(32)
        nonce = secrets.token_bytes(12)
        wrapping_nonce = secrets.token_bytes(12)

        ciphertext = AESGCM(dek).encrypt(
            nonce, data, self._aad(aad, "payload")
        )
        wrapped = AESGCM(self._kek).encrypt(
            wrapping_nonce, dek, self._aad(aad, "dek-wrap")
        )
        return {
            "_encrypted": True,
            "v": 1,
            "kid": self.key_id,
            "edek": _b64(wrapped),
            "edek_nonce": _b64(wrapping_nonce),
            "ct": _b64(ciphertext),
            "nonce": _b64(nonce),
        }

    def decrypt_value(self, envelope: dict, aad: bytes) -> str:
        required = {
            "_encrypted", "v", "kid", "edek", "edek_nonce", "ct", "nonce"
        }
        if (
            type(envelope) is not dict
            or set(envelope) != required
            or envelope.get("_encrypted") is not True
            or type(envelope.get("v")) is not int
            or envelope["v"] != 1
            or envelope.get("kid") != self.key_id
        ):
            raise SecretStoreError("Invalid encrypted envelope")

        try:
            wrapped = _decode(envelope["edek"], 48)
            wrapping_nonce = _decode(envelope["edek_nonce"], 12)
            ciphertext = _decode(envelope["ct"])
            nonce = _decode(envelope["nonce"], 12)
            if not 16 <= len(ciphertext) <= 65552:
                raise SecretStoreError("Invalid ciphertext length")

            dek = AESGCM(self._kek).decrypt(
                wrapping_nonce, wrapped, self._aad(aad, "dek-wrap")
            )
            if len(dek) != 32:
                raise SecretStoreError("Invalid data key")
            return AESGCM(dek).decrypt(
                nonce, ciphertext, self._aad(aad, "payload")
            ).decode("utf-8")
        except SecretStoreError:
            raise
        except Exception as exc:
            raise SecretStoreError("Secret authentication failed") from exc
