\# DHCaaS User Guide



Welcome to DHCaaS - Your Data Compliance Partner



\## Getting Started



\### System Requirements



Browser:

\- Chrome 120+ (Recommended)

\- Firefox 121+

\- Safari 17+

\- Edge 120+



Internet Connection:

\- Minimum: 5 Mbps

\- Recommended: 10+ Mbps



\## Step 1: Account Setup



\### Registration



1\. Navigate to: https://dhcaas.com/register

2\. Fill in your details:

&nbsp;  - Full Name

&nbsp;  - Email Address

&nbsp;  - Password (minimum 8 characters)

3\. Click "Create Account"

4\. Check your email for verification (if enabled)



\### Login



1\. Go to: https://dhcaas.com/login

2\. Enter your credentials:

&nbsp;  - Email

&nbsp;  - Password

3\. Click "Sign In"

4\. You will be redirected to the Dashboard



\## Step 2: Dashboard Overview



After logging in, you will see the main dashboard with:



\### Key Metrics Cards



1\. Overall Compliance Score

&nbsp;  - Shows your current compliance percentage (0-100%)

&nbsp;  - Color-coded: Green (90%+), Yellow (70-89%), Red (<70%)



2\. Total Scans

&nbsp;  - Number of data scans performed

&nbsp;  - Click to view scan history



3\. Active Incidents

&nbsp;  - Open security incidents requiring attention

&nbsp;  - Color-coded by severity



4\. Reports Available

&nbsp;  - Number of downloadable compliance reports



\### Compliance Breakdown



Visual breakdown of your compliance score across three categories:



\- PII Protection (40% weight)

&nbsp; Email addresses, phone numbers, names

&nbsp; 

\- Financial Security (30% weight)

&nbsp; Credit cards, bank accounts



\- Security Posture (30% weight)

&nbsp; Passwords, access keys, SSNs



\## Step 3: Running Your First Scan



\### Quick Scan Feature



1\. Navigate to Quick Scan

&nbsp;  - Click "Quick Scan" in the left sidebar

&nbsp;  - Or use keyboard shortcut: Ctrl + K



2\. Prepare Your Data

&nbsp;  - DHCaaS currently supports CSV files only

&nbsp;  - Ensure your file contains column headers

&nbsp;  - Maximum file size: 50 MB

&nbsp;  - Recommended: <10,000 rows for optimal performance



3\. Upload File

&nbsp;  - Click "Choose File" or drag \& drop

&nbsp;  - Select your CSV file

&nbsp;  - Click "Upload \& Scan"



4\. Wait for Analysis

&nbsp;  - Scan typically takes 5-30 seconds

&nbsp;  - Progress indicator shows status

&nbsp;  - Do not close the browser during scan



5\. Review Results

&nbsp;  - Compliance Score: Overall score (0-100%)

&nbsp;  - PII Detected: List of sensitive data types found

&nbsp;  - Severity: Critical, High, Medium, or Low

&nbsp;  - Status: Compliant, Partially Compliant, or Non-Compliant



\### Example Scan Result



Scan Completed Successfully!



File: customer\_data.csv

Rows Scanned: 1,250

Columns: 12



PII Detected:

\- Email Addresses: 3 columns (1,250 values)

\- Phone Numbers: 2 columns (1,180 values)

\- Credit Cards: 1 column (856 values)

\- SSN: 1 column (623 values)



Compliance Score: 45%

Status: Non-Compliant

Severity: CRITICAL



An incident has been created automatically.



\## Step 4: Managing Incidents



\### Viewing Incidents



1\. Click "Incidents" in the sidebar

2\. You will see a list of all security incidents



\### Incident Details



Each incident shows:

\- Title: Brief description (e.g., "PII Detected in customer\_data.csv")

\- Severity: Critical (red), High (orange), Medium (yellow), Low (blue)

\- Status: Open, Investigating, Resolved, Closed

\- Created Date: When the incident was detected

\- Affected File: Source of the issue



\### Managing an Incident



1\. Click on an incident to view details



2\. Update Status:

&nbsp;  - Open → Investigating (when you start working on it)

&nbsp;  - Investigating → Resolved (when fixed)

&nbsp;  - Resolved → Closed (after verification)



3\. Add Notes (optional):

&nbsp;  - Document remediation steps

&nbsp;  - Track progress



4\. View Associated Scan:

&nbsp;  - Click "View Scan Details" to see full PII breakdown



\### Incident Workflow Example



1\. Incident Created (Automated)

2\. Status: Open

&nbsp;  - Review the affected file

&nbsp;  - Identify PII exposure

3\. Status: Investigating

&nbsp;  - Implement data masking

&nbsp;  - Update access controls

&nbsp;  - Remove unnecessary PII

4\. Status: Resolved

&nbsp;  - Re-scan the file to verify

&nbsp;  - Document changes

5\. Status: Closed

&nbsp;  - Archive incident

&nbsp;  - Update compliance procedures



\## Step 5: Compliance Reports



\### Viewing Reports



1\. Click "Reports" in the sidebar

2\. Select a time period:

&nbsp;  - Last 7 Days

&nbsp;  - Last 30 Days (default)

&nbsp;  - Last 90 Days

&nbsp;  - Last Year



\### Report Sections



Summary Section:

\- Overall Compliance Score

\- Total Scans Performed

\- Total Incidents Detected

\- Available Reports Count



Compliance Breakdown:

\- PII Protection Score with percentage

\- Financial Security Score with percentage

\- Security Posture Score with percentage



Recent Incidents:

\- Table of recent security incidents

\- Severity, status, and creation date



Compliance Trend:

\- Line chart showing score over time

\- Visual representation of improvements/declines



\### Downloading PDF Report



1\. Click "Download PDF Report" button

2\. Report generates in 5-10 seconds

3\. PDF downloads automatically

4\. Filename format: DHCaaS-Compliance-Report-YYYY-MM-DD.pdf



\### PDF Report Contents



The PDF includes:

\- Executive Summary

\- Compliance Score Breakdown

\- Detailed PII Findings

\- Incident History

\- Trend Analysis

\- Recommendations for Improvement

\- Company Branding (customizable)



\## Step 6: Settings \& Configuration



\### Profile Settings



1\. Click "Settings" in the sidebar

2\. Navigate to "Profile" tab



Editable Fields:

\- Full Name

\- Email Address

\- Phone Number (optional)

\- Company Name

\- Job Title



\### Security Settings



Change Password:

1\. Go to "Security" tab

2\. Enter current password

3\. Enter new password (min 8 characters)

4\. Confirm new password

5\. Click "Update Password"



Two-Factor Authentication (Coming Soon):

\- SMS verification

\- Authenticator app support



\### Team Management (Enterprise Plan)



1\. Go to "Team" tab

2\. Click "Invite User"

3\. Enter email address

4\. Select role:

&nbsp;  - Admin (full access)

&nbsp;  - Analyst (view + scan)

&nbsp;  - Viewer (read-only)

5\. Click "Send Invitation"



\### API Keys (Advanced)



For programmatic access:



1\. Go to "API Keys" tab

2\. Click "Generate New Key"

3\. Copy and save the key securely

4\. Use in API requests: Authorization: Bearer YOUR\_API\_KEY



\## Best Practices



\### Data Preparation



DO:

\- Use clean CSV files with headers

\- Ensure consistent data formats

\- Remove test/dummy data before scanning

\- Keep files under 10,000 rows for best performance



DON'T:

\- Upload files with missing headers

\- Mix data types in columns

\- Include binary/encoded data

\- Upload extremely large files (>50MB)



\### Incident Management



DO:

\- Address critical incidents within 24 hours

\- Document all remediation steps

\- Re-scan after making changes

\- Close incidents only after verification



DON'T:

\- Ignore low-severity incidents

\- Close incidents without resolution

\- Skip documentation

\- Delay high-priority incidents



\### Compliance Monitoring



DO:

\- Run weekly scans for active data sources

\- Monitor compliance trends

\- Download quarterly reports

\- Review PII exposure regularly



DON'T:

\- Scan only once and forget

\- Ignore declining scores

\- Skip report reviews

\- Assume compliance without verification



\## Common Use Cases



\### Use Case 1: Onboarding New Data Source



Scenario: You have a new customer database



Steps:

1\. Export database to CSV

2\. Run Quick Scan

3\. Review PII findings

4\. Implement data masking for sensitive columns

5\. Re-scan to verify

6\. Download compliance report



Expected Outcome: Compliance score improves from 40% to 85%



\### Use Case 2: Pre-Audit Compliance Check



Scenario: Annual compliance audit approaching



Steps:

1\. Navigate to Reports page

2\. Select "Last Year" period

3\. Review compliance trends

4\. Download PDF report for auditors

5\. Address any open incidents

6\. Generate final report



Expected Outcome: Audit-ready documentation package



\### Use Case 3: Incident Response



Scenario: Critical PII exposure detected



Steps:

1\. Receive email notification (if enabled)

2\. Check Incidents page

3\. Review affected file details

4\. Implement immediate remediation:

&nbsp;  - Restrict access to file

&nbsp;  - Enable encryption

&nbsp;  - Mask sensitive columns

5\. Update incident status to "Resolved"

6\. Re-scan to verify

7\. Document in incident notes



Expected Outcome: Risk mitigated within SLA



\## Troubleshooting



\### Issue: Scan Failed



Symptoms: Error message during upload



Solutions:

1\. Check file format (must be CSV)

2\. Verify file size (<50MB)

3\. Ensure file has headers

4\. Try re-uploading

5\. Contact support if persistent



\### Issue: Low Compliance Score



Symptoms: Score below 70%



Solutions:

1\. Review PII breakdown in scan results

2\. Identify unnecessary PII exposure

3\. Implement data minimization:

&nbsp;  - Remove unneeded columns

&nbsp;  - Mask sensitive data

&nbsp;  - Use tokenization for IDs

4\. Re-scan to verify improvements



\### Issue: Can't Download Report



Symptoms: PDF download fails



Solutions:

1\. Check internet connection

2\. Disable popup blockers

3\. Clear browser cache

4\. Try different browser

5\. Contact support if persistent



\## Getting Help



\### Support Channels



\- Email: support@dhcaas.com

\- Response Time: 24-48 hours

\- Emergency: For critical incidents, use emergency contact



\### Documentation



\- API Docs: https://api.dhcaas.com/docs

\- Knowledge Base: https://dhcaas.com/docs

\- Video Tutorials: https://dhcaas.com/tutorials



\### Feature Requests



Submit ideas at: https://dhcaas.com/feedback



\## Tips \& Tricks



\### Keyboard Shortcuts



\- Ctrl + K - Quick Scan

\- Ctrl + D - Dashboard

\- Ctrl + R - Reports

\- Ctrl + I - Incidents

\- Ctrl + , - Settings



\### Power User Features



1\. Batch Scanning (Coming Soon)

&nbsp;  - Upload multiple files at once

&nbsp;  - Schedule recurring scans



2\. Custom Alerts

&nbsp;  - Set threshold alerts (e.g., score < 60%)

&nbsp;  - Email notifications for critical incidents



3\. Data Masking Templates

&nbsp;  - Save common masking patterns

&nbsp;  - Apply with one click



\## Understanding Your Score



\### Scoring Algorithm



Overall Score = (PII × 40%) + (Financial × 30%) + (Security × 30%)



Where:

\- PII Score = Based on email, phone, name detection

\- Financial Score = Based on credit card, bank account detection

\- Security Score = Based on password, SSN, keys detection



\### Score Ranges



\- 90-100%: Excellent (Compliant)

\- 70-89%: Good (Partially Compliant)

\- 50-69%: Fair (Non-Compliant)

\- 0-49%: Poor (Critical Non-Compliance)



\### Improvement Strategies



To reach 90%+:

1\. Remove all unnecessary PII

2\. Implement column-level encryption

3\. Use data masking for sensitive fields

4\. Apply role-based access controls

5\. Enable audit logging



\## Frequently Asked Questions



Q: How long does a scan take?

A: Typically 5-30 seconds depending on file size.



Q: What file formats are supported?

A: Currently CSV only. Excel and JSON support coming soon.



Q: Is my data stored?

A: Only scan metadata is stored. Actual data is not retained.



Q: Can I delete old scans?

A: Yes, click the delete icon next to any scan in the history.



Q: How often should I scan?

A: Weekly for active data sources, monthly for archived data.



Q: What happens to critical incidents?

A: Automatic Zoho ticket is created and stakeholders are notified.



Happy Scanning!



Last Updated: January 31, 2026

Version: 1.0.0



