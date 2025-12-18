from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Literal, Optional, Dict
import uuid
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ProcessingType = Literal["async"]
JobStatus = Literal["queued", "uploading", "running", "completed", "failed"]
GdprRiskLevel = Literal["low", "medium", "high"]


class ScanJobMeta(BaseModel):
    filename: str
    uploadtimestamp: str  # ISO string
    filesizebytes: int
    processingtype: ProcessingType = "async"


class QualityMetrics(BaseModel):
    completenessscore: float
    accuracyscore: float
    consistencyscore: float
    totalrows: int
    missingvaluescount: int


class ComplianceCheck(BaseModel):
    piidetected: bool
    sensitivefieldsfound: List[str]
    gdprrisklevel: GdprRiskLevel


class PredictiveAnalysis(BaseModel):
    healthscore: int
    anomalydetected: bool
    anomalies: List[str]


class ScanJob(BaseModel):
    jobid: str
    status: JobStatus
    meta: ScanJobMeta
    qualitymetrics: Optional[QualityMetrics] = None
    compliancecheck: Optional[ComplianceCheck] = None
    predictiveanalysis: Optional[PredictiveAnalysis] = None
    error: Optional[str] = None


class CreateScanJobRequest(BaseModel):
    filename: str
    filesizebytes: int


class CreateScanJobResponse(BaseModel):
    job: ScanJob
    uploadUrl: str


class ListScanJobsResponse(BaseModel):
    items: List[ScanJob]
    total: int
    limit: int
    offset: int


# in-memory "DB"
class _JobState(BaseModel):
    job: ScanJob
    stage: int = 0  # 0 queued, 1 uploading, 2 running, 3 completed


JOBS: Dict[str, _JobState] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _mock_presigned_url(jobid: str) -> str:
    # Later this becomes a real S3 presigned URL.
    return f"mock-presigned://upload/{jobid}"


def _advance(status: JobStatus) -> JobStatus:
    if status == "queued":
        return "uploading"
    if status == "uploading":
        return "running"
    if status == "running":
        return "completed"
    return status


def _attach_results(job: ScanJob) -> None:
    if job.qualitymetrics is not None:
        return

    job.qualitymetrics = QualityMetrics(
        completenessscore=98.5,
        accuracyscore=95.2,
        consistencyscore=99.0,
        totalrows=15000,
        missingvaluescount=25,
    )

    job.compliancecheck = ComplianceCheck(
        piidetected=True,
        sensitivefieldsfound=["email", "phone"],
        gdprrisklevel="high",
    )

    job.predictiveanalysis = PredictiveAnalysis(
        healthscore=88,
        anomalydetected=False,
        anomalies=[],
    )


app = FastAPI(title="DHCaaS Local Backend", version="0.1.0")

# CORS (allow only dev frontends)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/scan-jobs", response_model=ListScanJobsResponse)
def list_scan_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    # newest first by uploadtimestamp
    all_jobs = sorted(
        (state.job for state in JOBS.values()),
        key=lambda j: j.meta.uploadtimestamp,
        reverse=True,
    )
    total = len(all_jobs)
    items = all_jobs[offset : offset + limit]
    return ListScanJobsResponse(items=items, total=total, limit=limit, offset=offset)



@app.post("/scan-jobs", response_model=CreateScanJobResponse)
def create_scan_job(payload: CreateScanJobRequest):
    jobid = str(uuid.uuid4())
    job = ScanJob(
        jobid=jobid,
        status="queued",
        meta=ScanJobMeta(
            filename=payload.filename,
            uploadtimestamp=_now_iso(),
            filesizebytes=payload.filesizebytes,
            processingtype="async",
        ),
    )
    JOBS[jobid] = _JobState(job=job, stage=0)
    return CreateScanJobResponse(job=job, uploadUrl=_mock_presigned_url(jobid))


@app.get("/scan-jobs/{jobid}", response_model=ScanJob)
def get_scan_job(jobid: str):
    state = JOBS.get(jobid)
    if not state:
        return ScanJob(
            jobid=jobid,
            status="failed",
            meta=ScanJobMeta(
                filename="unknown",
                uploadtimestamp=_now_iso(),
                filesizebytes=0,
                processingtype="async",
            ),
            error="Job not found",
        )

    # Progress on each poll (simple local simulation)
    if state.stage < 3:
        state.stage += 1
        state.job.status = _advance(state.job.status)

    if state.job.status == "completed":
        _attach_results(state.job)

    JOBS[jobid] = state
    return state.job
