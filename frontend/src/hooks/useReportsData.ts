// frontend/src/hooks/useReportsData.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ComplianceBreakdown {
  pii: {
    score: number;
    weight: number;
    description: string;
  };
  financial: {
    score: number;
    weight: number;
    description: string;
  };
  security: {
    score: number;
    weight: number;
    description: string;
  };
}

export interface IncidentStats {
  total: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_status: {
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
  };
}

export interface ComplianceSummary {
  overall_score: number;
  compliance_status: string;
  breakdown: ComplianceBreakdown;
  incident_stats: IncidentStats;
  total_scans: number;
  date_range: {
    start: string;
    end: string;
    days: number;
  };
  last_updated: string;
}

export interface TrendDataPoint {
  date: string;
  score: number;
  scans: number;
  incidents: number;
}

export interface ComplianceTrend {
  trend: TrendDataPoint[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface AuditReport {
  report_id: string;
  generated_at: string;
  compliance: ComplianceSummary;
  trend: TrendDataPoint[];
  recent_incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    created_at: string;
    description: string;
  }>;
  recommendations: string[];
  report_period: {
    start: string;
    end: string;
    days: number;
  };
}

// ============================================================
// API FUNCTIONS
// ============================================================

const fetchComplianceSummary = async (days: number = 30): Promise<ComplianceSummary> => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/summary`, {
    params: { days },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};

const fetchComplianceTrend = async (days: number = 30): Promise<ComplianceTrend> => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/trend`, {
    params: { days },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};

const fetchAuditReport = async (days: number = 30): Promise<AuditReport> => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/audit`, {
    params: { days },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};

// ============================================================
// CUSTOM HOOKS
// ============================================================

export const useComplianceSummary = (days: number = 30) => {
  return useQuery<ComplianceSummary, Error>({
    queryKey: ['compliance-summary', days],
    queryFn: () => fetchComplianceSummary(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useComplianceTrend = (days: number = 30) => {
  return useQuery<ComplianceTrend, Error>({
    queryKey: ['compliance-trend', days],
    queryFn: () => fetchComplianceTrend(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useAuditReport = (days: number = 30) => {
  return useQuery<AuditReport, Error>({
    queryKey: ['audit-report', days],
    queryFn: () => fetchAuditReport(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export const downloadPDFReport = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/reports/summary-report/pdf`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DHCaaS-Compliance-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

export const getComplianceColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // green
  if (score >= 70) return '#f59e0b'; // yellow/orange
  if (score >= 50) return '#ef4444'; // red
  return '#991b1b'; // dark red
};

export const getComplianceStatus = (score: number): string => {
  if (score >= 90) return 'Compliant';
  if (score >= 70) return 'Partially Compliant';
  return 'Non-Compliant';
};
