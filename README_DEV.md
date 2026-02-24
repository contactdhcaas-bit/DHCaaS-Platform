# DHCaaS - Developer Documentation 🛡️

**Data Health Check as a Service**  
**Version:** 1.0.0 (Production-Ready Alpha)  
**Last Updated:** February 10, 2026

---

## 📖 Overview

DHCaaS is an enterprise-grade **Data Quality & Governance Platform** competing with Informatica IDMC. This repository contains the full-stack implementation featuring a FastAPI backend for data scanning engines and PDF report generation, and a React frontend for dashboarding and management.

**Core Mission:** Enable organizations to ensure data reliability, compliance, and trustworthiness through advanced AI-powered analysis and monitoring.

---

## 🏗️ Architecture Stack

### Backend (`/backend`)
- **Framework:** FastAPI (Python 3.10+)
- **Database:** MongoDB Atlas (Motor async driver)
- **Report Engine:** ReportLab + WeasyPrint (PDF Generation)
- **Validation:** Pydantic V2
- **CORS:** Configured for local development
- **Server:** Uvicorn ASGI

**Key Technologies:**
```python
fastapi>=0.104.1
motor>=3.3.2
pydantic>=2.5.0
reportlab>=4.0.7
weasyprint>=60.1
python-multipart>=0.0.6
