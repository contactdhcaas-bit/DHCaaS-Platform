# Audit Log Specifications v1.0

**Status:** APPROVED
**Date:** January 30, 2026
**Requirement:** Mandatory for CNDP/GDPR compliance.

---

## 1. Objective
To provide an immutable record of all sensitive actions within the platform for security investigations and compliance auditing.

## 2. JSON Data Schema (MongoDB)
All audit logs must strictly follow this schema:

\\\json
{
  "_id": "ObjectId",
  "organization_id": "uuid",
  "actor": {
    "user_id": "uuid",
    "email": "user@company.com",
    "role": "ORG_ADMIN",
    "ip_address": "192.168.x.x",
    "user_agent": "Mozilla/5.0..."
  },
  "event": {
    "category": "SECURITY",       // Enum: SECURITY, DATA, CONFIG, BILLING
    "action": "USER_LOGIN",       // Specific action code
    "status": "SUCCESS",          // SUCCESS or FAILURE
    "resource_id": "doc-123",     // Optional: ID of affected item
    "details": { "reason": "..." } // Optional context
  },
  "timestamp": "ISO-8601 UTC",
  "hash": "sha256_checksum"       // For tamper-evidence (Future proofing)
}
\\\

## 3. Trigger Policies (What to Log)

| Category | Actions to Log | Severity |
| :--- | :--- | :--- |
| **Security** | Login (Success/Fail), Password Change, MFA Toggle | High 🔴 |
| **User Mgmt** | Invite User, Remove User, Change Role | High 🔴 |
| **Data Ops** | Start Scan, Download Report, Delete Source | Medium 🟠 |
| **Config** | Change Billing, Rotate API Keys | Medium 🟠 |

## 4. Retention Policy
1.  **Hot Storage (MongoDB):** 90 Days (Immediate access).
2.  **Cold Storage (S3 Glacier):** 1 Year (Archived for compliance).

## 5. Developer Notes
*   **Performance:** Logging must be asynchronous (do not block the user).
*   **Privacy:** NEVER log passwords or file contents in the audit payload.
