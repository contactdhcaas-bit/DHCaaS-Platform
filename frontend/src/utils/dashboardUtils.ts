// src/utils/dashboardUtils.ts

import { BackendScan, BackendIncident, BackendSource } from "../lib/api-client";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RiskPosture = "low" | "medium" | "high" | "critical";

export interface KPI {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "neutral";
  href: string;
  description: string;
}

export interface Insight {
  id: string;
  title: string;
  reason: string;
  severity: "critical" | "high" | "medium" | "low";
  ctaLabel: string;
  ctaHref: string;
  icon?: string;
}

export interface DashboardData {
  scans: BackendScan[];
  incidents: BackendIncident[];
  sources: BackendSource[];
  complianceScore: number;
  riskPosture: RiskPosture;
  kpis: KPI[];
  insights: Insight[];
  trendData: number[];
  topIncidents: BackendIncident[];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE SCORE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes compliance score (0-100) based on recent scans
 * Algorithm: (clean_records / total_records) * 100
 */
export function computeComplianceScore(scans: BackendScan[]): number {
  if (!scans || scans.length === 0) return 0;

  // Get last 10 completed scans
  const completedScans = scans
    .filter((s) => s.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  if (completedScans.length === 0) return 0;

  // Calculate average compliance from recent scans
  let totalRecords = 0;
  let totalIncidents = 0;

  completedScans.forEach((scan) => {
    const records = scan.total_records || 0;
    const incidents = scan.incidents_detected || 0;
    totalRecords += records;
    totalIncidents += incidents;
  });

  if (totalRecords === 0) return 100; // No records = 100% compliant

  const cleanRecords = totalRecords - totalIncidents;
  const score = (cleanRecords / totalRecords) * 100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK POSTURE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes risk posture based on open incidents
 */
export function computeRiskPosture(incidents: BackendIncident[]): RiskPosture {
  const openIncidents = incidents.filter((i) => i.status === "open");

  const criticalCount = openIncidents.filter((i) => i.severity === "critical").length;
  const highCount = openIncidents.filter((i) => i.severity === "high").length;
  const mediumCount = openIncidents.filter((i) => i.severity === "medium").length;

  // Risk logic
  if (criticalCount >= 5) return "critical";
  if (criticalCount >= 1 || highCount >= 10) return "high";
  if (highCount >= 1 || mediumCount >= 15) return "medium";
  return "low";
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes KPIs with delta (comparison to previous period)
 */
export function computeKPIs(
  scans: BackendScan[],
  incidents: BackendIncident[],
  sources: BackendSource[],
  period: "7d" | "30d" = "7d"
): KPI[] {
  const daysAgo = period === "7d" ? 7 : 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  // Active scans (last X days)
  const activeScans = scans.filter((s) => new Date(s.created_at) >= cutoffDate);
  const previousScans = scans.filter((s) => {
    const date = new Date(s.created_at);
    const previousCutoff = new Date(cutoffDate);
    previousCutoff.setDate(previousCutoff.getDate() - daysAgo);
    return date >= previousCutoff && date < cutoffDate;
  });
  const scansDelta = calculateDelta(activeScans.length, previousScans.length);

  // Open incidents
  const openIncidents = incidents.filter((i) => i.status === "open");
  const previousOpenCount = incidents.filter((i) => {
    const date = new Date(i.created_at);
    return date < cutoffDate && i.status === "open";
  }).length;
  const incidentsDelta = calculateDelta(openIncidents.length, previousOpenCount);

  // Connected sources
  const connectedSources = sources.filter((s) => s.status === "connected");
  const sourcesDelta = { value: "0%", trend: "neutral" as const };

  // Total exposure (total incidents detected across all scans)
  const totalExposure = scans.reduce((sum, s) => sum + (s.incidents_detected || 0), 0);
  const previousExposure = scans
    .filter((s) => new Date(s.created_at) < cutoffDate)
    .reduce((sum, s) => sum + (s.incidents_detected || 0), 0);
  const exposureDelta = calculateDelta(totalExposure, previousExposure);

  return [
    {
      label: "Active Scans",
      value: activeScans.length.toString(),
      delta: scansDelta.value,
      trend: scansDelta.trend,
      href: "/jobs",
      description: `Scans completed in the last ${daysAgo} days`,
    },
    {
      label: "Open Incidents",
      value: openIncidents.length.toString(),
      delta: incidentsDelta.value,
      trend: incidentsDelta.trend,
      href: "/incidents?status=open",
      description: "Incidents requiring immediate attention",
    },
    {
      label: "Connected Sources",
      value: connectedSources.length.toString(),
      delta: sourcesDelta.value,
      trend: sourcesDelta.trend,
      href: "/settings",
      description: "Active data sources being monitored",
    },
    {
      label: "Total Exposure",
      value: formatNumber(totalExposure),
      delta: exposureDelta.value,
      trend: exposureDelta.trend,
      href: "/incidents",
      description: "Total incidents detected across all scans",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART INSIGHTS COMPUTATION ⭐
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates actionable insights based on data patterns
 * This is the KEY DIFFERENTIATOR of DHCaaS
 */
export function computeInsights(
  scans: BackendScan[],
  incidents: BackendIncident[],
  sources: BackendSource[],
  complianceScore: number
): Insight[] {
  const insights: Insight[] = [];

  // 1. No recent scans (CRITICAL)
  const lastScan = scans
    .filter((s) => s.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (lastScan) {
    const daysSinceLastScan = Math.floor(
      (Date.now() - new Date(lastScan.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastScan > 7) {
      insights.push({
        id: "no-recent-scans",
        title: `No scans in ${daysSinceLastScan} days`,
        reason: "Run a scan to maintain compliance visibility and stay up to date",
        severity: "high",
        ctaLabel: "Run Scan Now",
        ctaHref: "/upload",
        icon: "alert-triangle",
      });
    }
  } else {
    insights.push({
      id: "no-scans-ever",
      title: "No scans yet",
      reason: "Upload your first dataset to start monitoring compliance",
      severity: "critical",
      ctaLabel: "Upload Data",
      ctaHref: "/upload",
      icon: "upload",
    });
  }

  // 2. Incident spike (HIGH)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const previous7Days = new Date();
  previous7Days.setDate(previous7Days.getDate() - 14);

  const recentIncidents = incidents.filter((i) => new Date(i.created_at) >= last7Days).length;
  const previousIncidents = incidents.filter(
    (i) => new Date(i.created_at) >= previous7Days && new Date(i.created_at) < last7Days
  ).length;

  if (previousIncidents > 0) {
    const incidentChange = ((recentIncidents - previousIncidents) / previousIncidents) * 100;
    if (incidentChange > 20) {
      insights.push({
        id: "incident-spike",
        title: `Incidents spiked +${Math.round(incidentChange)}%`,
        reason: "Review priority incidents immediately to prevent data breaches",
        severity: "high",
        ctaLabel: "View Incidents",
        ctaHref: "/incidents",
        icon: "trending-up",
      });
    }
  }

  // 3. Low compliance (MEDIUM/HIGH)
  if (complianceScore < 80) {
    insights.push({
      id: "low-compliance",
      title: `Compliance at ${complianceScore}% (below target)`,
      reason: "Target is 90%+ - investigate recent violations and remediate",
      severity: complianceScore < 70 ? "high" : "medium",
      ctaLabel: "View Report",
      ctaHref: "/reports",
      icon: "shield-alert",
    });
  }

  // 4. Disconnected sources (MEDIUM)
  const failedSources = sources.filter((s) => s.status === "error" || s.status === "disconnected");
  if (failedSources.length > 0) {
    insights.push({
      id: "disconnected-sources",
      title: `${failedSources.length} source(s) disconnected`,
      reason: "Test connections to resume automated monitoring",
      severity: "medium",
      ctaLabel: "Check Sources",
      ctaHref: "/settings",
      icon: "unplug",
    });
  }

  // 5. Critical incidents open (CRITICAL)
  const criticalIncidents = incidents.filter(
    (i) => i.severity === "critical" && i.status === "open"
  );
  if (criticalIncidents.length > 0) {
    insights.push({
      id: "critical-incidents",
      title: `${criticalIncidents.length} critical incident(s) open`,
      reason: "Immediate action required - potential CNDP 09-08 violations",
      severity: "critical",
      ctaLabel: "Resolve Now",
      ctaHref: "/incidents?severity=critical&status=open",
      icon: "alert-octagon",
    });
  }

  // 6. Good performance (LOW)
  if (complianceScore >= 95 && insights.length === 0) {
    insights.push({
      id: "excellent-compliance",
      title: "Excellent compliance posture!",
      reason: `Maintaining ${complianceScore}% compliance - keep up the great work`,
      severity: "low",
      ctaLabel: "View Dashboard",
      ctaHref: "/dashboard",
      icon: "check-circle",
    });
  }

  // Sort by severity and return top 6
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND DATA COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates trend data for charts (last 7 or 30 days)
 */
export function getTrendData(
  incidents: BackendIncident[],
  days: 7 | 30 = 7
): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = incidents.filter((incident) => {
      const incidentDate = new Date(incident.created_at);
      return incidentDate >= date && incidentDate < nextDate;
    }).length;

    result.push({
      date: date.toISOString().split("T")[0],
      count,
    });
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP INCIDENTS (for Priority List)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns top 5 priority incidents (by severity + recency)
 */
export function getTopIncidents(incidents: BackendIncident[]): BackendIncident[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return incidents
    .filter((i) => i.status === "open")
    .sort((a, b) => {
      // First by severity
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by recency
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function calculateDelta(
  current: number,
  previous: number
): { value: string; trend: "up" | "down" | "neutral" } {
  if (previous === 0) {
    return { value: current > 0 ? "+100%" : "0%", trend: current > 0 ? "up" : "neutral" };
  }

  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(Math.round(change));

  if (absChange < 1) {
    return { value: "0%", trend: "neutral" };
  }

  return {
    value: `${change > 0 ? "+" : "-"}${absChange}%`,
    trend: change > 0 ? "up" : "down",
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
