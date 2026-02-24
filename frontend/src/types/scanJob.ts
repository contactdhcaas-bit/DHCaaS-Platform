export type ProcessingType = "async";

export type JobStatus = "queued" | "uploading" | "running" | "completed" | "failed";

export type GdprRiskLevel = "low" | "medium" | "high";

export interface ScanJobMeta {
  filename: string;
  uploadtimestamp: string; // ISO
  filesizebytes: number;
  processingtype: ProcessingType;
}

export interface QualityMetrics {
  completenessscore: number;
  accuracyscore: number;
  consistencyscore: number;
  totalrows: number;
  missingvaluescount: number;
}

export interface ComplianceCheck {
  piidetected: boolean;
  sensitivefieldsfound: string[];
  gdprrisklevel: GdprRiskLevel;
}

export interface PredictiveAnalysis {
  healthscore: number;
  anomalydetected: boolean;
  anomalies: string[];
}

export interface ScanJob {
  jobid: string;
  status: JobStatus;
  meta: ScanJobMeta;
  qualitymetrics?: QualityMetrics;
  compliancecheck?: ComplianceCheck;
  predictiveanalysis?: PredictiveAnalysis;
  error?: string;
}

export interface CreateScanJobResponse {
  job: ScanJob;
  uploadUrl: string;
}
// Add to src/types/scanJob.ts

export type ViolationSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Violation {
  id: string;
  policy_id: string;
  policy_name: string;
  scan_id: string;
  severity: ViolationSeverity;
  message: string;
  detected_at: string;
  resolved: boolean;
  rule_type: string;
  threshold: number;
  actual_value: {
    score?: number;
    pii_count?: number;
    duplicate_count?: number;
    missing_percent?: number;
  };
}
