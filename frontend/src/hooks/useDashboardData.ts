// src/hooks/useDashboardData.ts

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { BackendScan, BackendIncident, BackendSource } from "../lib/apiClient";
import {
  computeComplianceScore,
  computeRiskPosture,
  computeKPIs,
  computeInsights,
  getTrendData,
  getTopIncidents,
  type DashboardData,
} from "../utils/dashboardUtils";

export interface UseDashboardDataOptions {
  period?: "7d" | "30d";
  enabled?: boolean;
}

export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const { period = "7d", enabled = true } = options;

  return useQuery({
    queryKey: ["dashboard", period],
    queryFn: async (): Promise<DashboardData> => {
      // Parallel fetch all data (FIXED: removed /api prefix)
      const [scansResponse, incidentsResponse, sourcesResponse] = await Promise.all([
        apiClient.get("/scans"),
        apiClient.get("/incidents"),
        apiClient.get("/sources"),
      ]);

      // Handle both array and object responses
      const scans = Array.isArray(scansResponse.data) 
        ? scansResponse.data 
        : (scansResponse.data.scans || scansResponse.data.items || []);
      
      const incidents = Array.isArray(incidentsResponse.data)
        ? incidentsResponse.data
        : (incidentsResponse.data.incidents || incidentsResponse.data.items || []);
      
      const sources = Array.isArray(sourcesResponse.data)
        ? sourcesResponse.data
        : (sourcesResponse.data.sources || sourcesResponse.data.items || []);

      // Compute all dashboard metrics
      const complianceScore = computeComplianceScore(scans);
      const riskPosture = computeRiskPosture(incidents);
      const kpis = computeKPIs(scans, incidents, sources, period);
      const insights = computeInsights(scans, incidents, sources, complianceScore);
      const trendData = getTrendData(incidents, period === "7d" ? 7 : 30);
      const topIncidents = getTopIncidents(incidents);

      return {
        scans,
        incidents,
        sources,
        complianceScore,
        riskPosture,
        kpis,
        insights,
        trendData,
        topIncidents,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
