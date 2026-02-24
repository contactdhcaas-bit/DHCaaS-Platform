from __future__ import annotations

import csv
import io
import re
from typing import List

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel


app = FastAPI(title="DHCaaS CSV Profiler", version="0.4.0")


# -------------------------
# Models
# -------------------------
class CsvProfileRequest(BaseModel):
    path: str  # Dev-only: local path on server machine


class ColumnProfile(BaseModel):
    name: str
    detected_type: str  # "text" | "number" | "date" | "datetime"
    non_null: int
    nulls: int
    unique: int
    pii_types: List[str] = []
    masked_samples: List[str] = []


class CsvDqFinding(BaseModel):
    type: str  # e.g. "nulls_present"
    column: str
    nulls: int


class CsvProfileResponse(BaseModel):
    row_count: int
    columns: List[ColumnProfile]
    pii_detected: bool
    dq_findings: List[CsvDqFinding] = []
    source: str  # "path" | "upload"
    filename: str | None = None
    path: str | None = None


# -------------------------
# Simple detectors (MVP)
# -------------------------
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?\d{9,15}$")

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
DATETIME_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$"
)


def _detect_type(values: List[str]) -> str:
    if not values:
        return "text"
    if all(v.isdigit() for v in values):
        return "number"
    if all(DATE_RE.match(v) for v in values):
        return "date"
    if all(DATETIME_RE.match(v) for v in values):
        return "datetime"
    return "text"


def _mask_email(value: str) -> str:
    value = value.strip()
    if "@" not in value:
        return "***"
    local, domain = value.split("@", 1)
    if len(local) <= 1:
        local_masked = "*"
    elif len(local) == 2:
        local_masked = local[0] + "*"
    else:
        local_masked = local[0] + "***" + local[-1]
    return f"{local_masked}@{domain}"


def _mask_phone(value: str) -> str:
    digits = re.sub(r"\D+", "", value)
    if not digits:
        return "***"
    if len(digits) <= 4:
        return "*" * len(digits)
    prefix = digits[:3]
    suffix = digits[-4:]
    middle_len = max(0, len(digits) - 7)
    return f"+{prefix}{'*' * middle_len}{suffix}"


def _profile_rows(rows: List[dict], fields: List[str]) -> tuple[List[ColumnProfile], bool, List[CsvDqFinding]]:
    columns: List[ColumnProfile] = []
    dq_findings: List[CsvDqFinding] = []
    pii_detected = False

    for col in fields:
        values = [(r.get(col) or "").strip() for r in rows]
        nulls = sum(1 for v in values if v == "")
        non_null_vals = [v for v in values if v != ""]
        unique = len(set(non_null_vals))

        detected_type = _detect_type(non_null_vals)

        pii_types: List[str] = []
        if non_null_vals and all(EMAIL_RE.match(v) for v in non_null_vals):
            pii_types.append("email")
        if non_null_vals and all(PHONE_RE.match(v.replace(" ", "")) for v in non_null_vals):
            pii_types.append("phone")

        if pii_types:
            pii_detected = True

        masked_samples: List[str] = []
        if "email" in pii_types:
            masked_samples = [_mask_email(v) for v in non_null_vals[:3]]
        elif "phone" in pii_types:
            masked_samples = [_mask_phone(v) for v in non_null_vals[:3]]

        if nulls > 0:
            dq_findings.append(CsvDqFinding(type="nulls_present", column=col, nulls=nulls))

        columns.append(
            ColumnProfile(
                name=col,
                detected_type=detected_type,
                non_null=len(non_null_vals),
                nulls=nulls,
                unique=unique,
                pii_types=pii_types,
                masked_samples=masked_samples,
            )
        )

    return columns, pii_detected, dq_findings


def _read_csv_from_path(path: str) -> tuple[List[dict], List[str]]:
    try:
        with open(path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                raise HTTPException(status_code=400, detail="CSV must include a header row")
            fields = list(reader.fieldnames)
            rows = list(reader)
        return rows, fields
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 (or UTF-8 with BOM)")


def _read_csv_from_upload(file_bytes: bytes) -> tuple[List[dict], List[str]]:
    # Handle UTF-8 BOM with "utf-8-sig"
    text = file_bytes.decode("utf-8-sig", errors="strict")
    f = io.StringIO(text, newline="")
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must include a header row")
    fields = list(reader.fieldnames)
    rows = list(reader)
    return rows, fields


# -------------------------
# Routes
# -------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/profile/csv", response_model=CsvProfileResponse)
def profile_csv_by_path(payload: CsvProfileRequest):
    """
    Dev-only: profile a CSV by local path on the server machine.
    """
    rows, fields = _read_csv_from_path(payload.path)
    columns, pii_detected, dq_findings = _profile_rows(rows, fields)
    return CsvProfileResponse(
        source="path",
        path=payload.path,
        filename=None,
        row_count=len(rows),
        columns=columns,
        pii_detected=pii_detected,
        dq_findings=dq_findings,
    )


@app.post("/profile/csv/upload", response_model=CsvProfileResponse)
async def profile_csv_upload(file: UploadFile = File(...)):
    """
    Production-friendly: upload a CSV file and return the profiling report.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    rows, fields = _read_csv_from_upload(file_bytes)
    columns, pii_detected, dq_findings = _profile_rows(rows, fields)

    return CsvProfileResponse(
        source="upload",
        path=None,
        filename=file.filename,
        row_count=len(rows),
        columns=columns,
        pii_detected=pii_detected,
        dq_findings=dq_findings,
    )
