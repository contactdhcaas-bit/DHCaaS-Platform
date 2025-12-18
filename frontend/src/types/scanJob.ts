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
