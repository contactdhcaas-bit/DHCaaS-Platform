import { apiFileUrl, apiPostForm } from "./http";

export async function scanFiles(files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  return apiPostForm<{
    jobId: string;
    status: string;
    score: number;
    risks: number;
    files: { filename: string; size: number; contentType: string }[];
    reportUrl: string;
  }>("/api/scan", form);
}

export function reportLink(reportUrl: string) {
  return apiFileUrl(reportUrl);
}

// Fetch violations for a specific scan
export async function getScanViolations(scanId: string) {
  const response = await fetch(`/api/v1/scan-jobs/violations/${scanId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch violations: ${response.statusText}`);
  }
  
  return response.json();
}
