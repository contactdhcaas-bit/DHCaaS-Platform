<div align="center">

# 🛡️ DHCaaS - Data Health Check as a Service

**Enterprise Data Observability, Quality & Governance Platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

*Competing globally with enterprise platforms like Informatica IDMC, Collibra, and Atlan*

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 🎯 Introduction

**DHCaaS** is a next-generation **SaaS platform** for enterprise data teams to monitor, govern, and improve data quality across their entire data ecosystem. Built with modern web technologies, DHCaaS provides real-time insights, automated quality checks, and compliance management in a beautiful, intuitive interface.

### Why DHCaaS?

- **🚀 Fast & Modern**: Built on React 18 + Vite for lightning-fast performance
- **🎨 Beautiful UI**: Enterprise-grade design with Tailwind CSS
- **🧠 AI-Powered**: Context-aware copilot for intelligent recommendations
- **🔒 Security-First**: Built-in PII detection and GDPR compliance
- **📊 Real-Time**: Live dashboards with global state management
- **🌐 Scalable**: Production-ready architecture supporting millions of records

---

## ✨ Key Features

### ✅ Core Platform Capabilities

- [x] **📊 Executive Dashboard** - Real-time data trust score, active pipelines, and critical incidents tracking with global Zustand state management
- [x] **🛡️ Trust Center** - Comprehensive security monitoring with PII detection, GDPR/CCPA compliance tracking, and encryption status
- [x] **🔍 Data Quality Engine** - Multi-dimensional quality scoring (Completeness, Validity, Consistency, Accuracy) with real-time scanning simulation
- [x] **⚙️ Workflow Automation Studio** - Visual pipeline orchestration with 50+ pre-built templates and drag-and-drop interface
- [x] **🚨 Incident Command Center** - Kanban-style incident management with severity tracking, assignee management, and MTTR analytics
- [x] **📜 Policy Management Center** - Define and enforce data quality rules with category-based organization and impact analysis
- [x] **🕸️ Active Data Lineage** - Health-aware lineage visualization showing data flow across systems with quality indicators
- [x] **📍 Data Enrichment** - Geo-coding, address validation, and data augmentation with 3rd-party API integrations
- [x] **📈 Analytics Hub** - Customizable reports with export to PDF/Excel/CSV and scheduled delivery
- [x] **🛒 Integration Marketplace** - 50+ pre-built connectors for databases, cloud storage, and SaaS applications
- [x] **🤖 AI Pilot** - Context-aware intelligent assistant for data governance recommendations
- [x] **🗂️ Business Glossary** - Centralized metadata catalog with searchable data dictionary
- [x] **⚙️ Admin Control Panel** - User management, API keys, audit logs, and system configuration

### 🎯 Advanced Features

- **Real-time Scanning**: 8-stage data quality scan with progress tracking
- **Global State**: Zustand-powered state management for cross-page synchronization
- **Dynamic Stats**: Live incident count, trust score, and pipeline metrics
- **Toast Notifications**: User-friendly feedback for all actions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Theme**: Modern dark UI for reduced eye strain
- **Type Safety**: Full TypeScript coverage for robust development

---

## 🛠️ Tech Stack

### Frontend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI Framework with Hooks & Concurrent Features |
| **TypeScript** | 5.5.3 | Type-safe JavaScript with IntelliSense |
| **Vite** | 5.4.2 | Next-gen build tool with HMR |
| **React Router** | 6.26.2 | Client-side routing & navigation |

### State & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 4.5.5 | Lightweight global state management |
| **Axios** | 1.7+ | HTTP client for API requests (ready) |

### Styling & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **Lucide React** | 0.446.0 | Beautiful open-source icons (500+) |

### Backend (Separate Repo)
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115+ | High-performance Python API framework |
| **MongoDB** | 6.0+ | NoSQL database for flexibility |
| **Pydantic** | 2.9+ | Data validation & serialization |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org))
- **npm** >= 9.x or **yarn** >= 1.22.x
- **Git** ([Download](https://git-scm.com))

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/dhcaas.git
cd dhcaas/frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
