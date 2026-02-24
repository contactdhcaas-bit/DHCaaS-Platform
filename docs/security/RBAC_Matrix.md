# Role-Based Access Control (RBAC) Matrix v1.0

**Status:** DRAFT (Approved)
**Date:** January 30, 2026
**Context:** DHCaaS Platform Security

---

## 1. Overview
This document defines access policies strictly separating duties between IT Administration and Compliance.

## 2. Role Definitions

### ORG_ADMIN (Administrator)
*   **Role:** Technical owner.
*   **Responsibilities:** Manage users, billing, integrations (AWS).
*   **Restrictions:** Cannot resolve compliance incidents (Separation of Duties).

### COMPLIANCE_OFFICER (DPO)
*   **Role:** Compliance owner.
*   **Responsibilities:** Run scans, view sensitive metadata, accept risks/incidents.

### VIEWER (Auditor)
*   **Role:** Oversight.
*   **Responsibilities:** Read-only access to dashboards and reports.

---

## 3. Permission Matrix

| Resource | Action | ADMIN | DPO | VIEWER |
| :--- | :--- | :---: | :---: | :---: |
| **Users** | Invite/Remove | ✅ | ❌ | ❌ |
| **Billing** | View/Pay | ✅ | ❌ | ❌ |
| **Scans** | Execute Scan | ✅ | ✅ | ❌ |
| **Incidents** | Resolve/Ignore | ❌ | ✅ | ❌ |
| **Reports** | Download | ✅ | ✅ | ✅ |

---

## 4. Implementation Scopes

| Scope Key | Role | Description |
| :--- | :--- | :--- |
| users:write | ADMIN | User management |
| scans:execute | ADMIN, DPO | Trigger scans |
| incidents:write | DPO | Resolve risks |
