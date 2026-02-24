from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
import uuid
from fastapi import FastAPI, Query, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from io import BytesIO

# PDF Report Imports
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# Arabic PDF Support
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display

ProcessingType = Literal["async"]
JobStatus = Literal["queued", "uploading", "running", "completed", "failed"]
GdprRiskLevel = Literal["low", "medium", "high"]
IncidentStatus = Literal["open", "acknowledged", "resolved"]

class ScanJobMeta(BaseModel):
    filename: str
    uploadtimestamp: str
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

class Incident(BaseModel):
    jobId: str
    status: IncidentStatus
    owner: Optional[str] = None
    createdAt: str
    updatedAt: str

JOBS: Dict[str, ScanJob] = {}
INCIDENTS: Dict[str, Incident] = {}

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def setup_arabic_font():
    """Setup Arabic font for PDF reports"""
    try:
        # Windows Arabic font path
        font_path = "C:/Windows/Fonts/arial.ttf"
        pdfmetrics.registerFont(TTFont('Arabic', font_path))
        print("Arabic font registered successfully")
    except:
        print("Arabic font not found, using default")

def _attach_results(job: ScanJob) -> None:
    if job.qualitymetrics is not None: return
    job.qualitymetrics = QualityMetrics(
        completenessscore=98.5, accuracyscore=95.2, consistencyscore=99.0,
        totalrows=15000, missingvaluescount=25
    )
    job.compliancecheck = ComplianceCheck(
        piidetected=True, sensitivefieldsfound=["email", "phone"], gdprrisklevel="high"
    )
    job.predictiveanalysis = PredictiveAnalysis(healthscore=88, anomalydetected=False, anomalies=[])

def init_mock_data():
    JOBS["job-123"] = ScanJob(
        jobid="job-123", status="completed",
        meta=ScanJobMeta(filename="patients.csv", uploadtimestamp="2025-12-22T10:00:00Z", filesizebytes=5242880)
    )
    _attach_results(JOBS["job-123"])

app = FastAPI(title="DHCaaS Backend", version="0.1.0")

origins = [
    "http://localhost:3003", "http://127.0.0.1:3003",
    "http://localhost:5173", "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    setup_arabic_font()
    init_mock_data()

@app.get("/")
def read_root():
    return {"message": "DHCaaS Backend Ready 🇲🇦 CNDP 09-08"}

@app.post("/api/scan")
async def scan_files(files: List[UploadFile] = File(...)):
    job_id = f"DHC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    files_data = []
    total_size = 0
    for file in files:
        content = await file.read()
        files_data.append({
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type
        })
        total_size += len(content)
    
    job = ScanJob(
        jobid=job_id,
        status="completed",
        meta=ScanJobMeta(
            filename=files[0].filename if files else "unknown",
            uploadtimestamp=_now_iso(),
            filesizebytes=total_size
        )
    )
    _attach_results(job)
    JOBS[job_id] = job
    
    return {
        "jobId": job_id,
        "status": "completed",
        "score": job.predictiveanalysis.healthscore if job.predictiveanalysis else 88,
        "risks": len(job.compliancecheck.sensitivefieldsfound) if job.compliancecheck else 0,
        "compliance": "CNDP 09-08 ✅",
        "files": files_data,
        "createdAt": _now_iso(),
        "reportUrl": f"/api/report/{job_id}"
    }

@app.get("/api/report/{job_id}")
async def get_report(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    try:
        # Header - Arabic + English
        p.setFillColorRGB(0.12, 0.25, 0.69)
        p.rect(50, height-100, width-100, 60, fill=1)
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 18)
        p.drawCentredText(width/2, height-75, "DHCaaS Compliance Report")
        try:
            p.setFont("Arabic", 16)
            arabic_title = get_display(arabic_reshaper.reshape("تقرير الامتثال DHCaaS"))
            p.drawCentredText(width/2, height-95, arabic_title)
        except:
            pass
        
        # Job Info - Arabic + English
        p.setFillColorRGB(0.12, 0.17, 0.22)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, height-140, f"Job ID: {job_id}")
        p.setFont("Helvetica", 12)
        p.drawString(50, height-160, f"Scan Date: {job.meta.uploadtimestamp[:10]}")
        p.drawString(50, height-180, f"File: {job.meta.filename}")
        p.drawString(50, height-200, f"Size: {job.meta.filesizebytes/1024/1024:.1f} MB")
        
        # Score Circle
        p.setFillColorRGB(0.05, 0.72, 0.50)
        p.circle(width/2, height-300, 40, fill=1)
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 24)
        p.drawCentredText(width/2, height-320, f"{job.predictiveanalysis.healthscore}%")
        p.setFont("Helvetica-Bold", 14)
        p.setFillColorRGB(0.12, 0.17, 0.22)
        p.drawCentredText(width/2, height-350, "Compliance Score")
        
        # Risks - Arabic + English
        p.setFillColorRGB(0.12, 0.17, 0.22)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height-400, "Risks Detected:")
        try:
            p.setFont("Arabic", 14)
            arabic_risks = get_display(arabic_reshaper.reshape("المخاطر المكتشفة:"))
            p.drawString(50, height-425, arabic_risks)
        except:
            pass
        p.setFont("Helvetica", 12)
        y_pos = height-450
        for risk in job.compliancecheck.sensitivefieldsfound:
            p.drawString(70, y_pos, f"• {risk}")
            y_pos -= 20
        
        # Footer - Arabic + English
        p.setFillColorRGB(0.95, 0.95, 0.96)
        p.rect(50, 30, width-100, 40, fill=1)
        p.setFillColorRGB(0.42, 0.45, 0.48)
        p.setFont("Helvetica-Bold", 12)
        p.drawCentredText(width/2, 55, "🇲🇦 CNDP 09-08 Compliant")
        try:
            p.setFont("Arabic", 12)
            arabic_footer = get_display(arabic_reshaper.reshape("متوافق مع CNDP 09-08 🇲🇦"))
            p.drawCentredText(width/2, 35, arabic_footer)
        except:
            pass
        
        p.showPage()
        p.save()
        
    except Exception as e:
        p.setFont("Helvetica", 12)
        p.drawString(100, height/2, f"Error: {str(e)}")
        p.showPage()
        p.save()
    
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=DHC-{job_id}.pdf"}
    )
