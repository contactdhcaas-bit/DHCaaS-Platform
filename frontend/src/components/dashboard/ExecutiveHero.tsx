// src/components/dashboard/ExecutiveHero.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Download, TrendingUp, TrendingDown } from "lucide-react";
import type { RiskPosture } from "../../utils/dashboardUtils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ExecutiveHeroProps {
  complianceScore: number;
  riskPosture: RiskPosture;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number;
  };
  isLive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ExecutiveHero({
  complianceScore,
  riskPosture,
  trend,
  isLive = true,
}: ExecutiveHeroProps) {
  const navigate = useNavigate();

  // Risk badge styling
  const riskConfig = getRiskConfig(riskPosture);

  // Compliance color
  const complianceColor = getComplianceColor(complianceScore);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            {/* Live indicator */}
            {isLive && (
              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-medium text-emerald-400">
                  Live monitoring
                </span>
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight">
              DHCaaS Compliance Overview
            </h1>
            <p className="mt-2 text-slate-300">
              Monitor Law 09-08 exposure in real-time across all data sources
            </p>
          </div>

          {/* Risk badge */}
          <div
            className={`rounded-lg px-4 py-2 font-semibold ${riskConfig.bgColor} ${riskConfig.textColor}`}
          >
            <div className="text-xs uppercase tracking-wide opacity-80">
              Risk Posture
            </div>
            <div className="mt-1 text-lg">{riskConfig.label}</div>
          </div>
        </div>

        {/* Compliance score */}
        <div className="mb-6 flex items-end gap-6">
          <div>
            <div className="text-sm font-medium text-slate-400">
              Compliance Score
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className={`text-6xl font-bold ${complianceColor}`}>
                {complianceScore}%
              </span>
              {trend && trend.direction !== "neutral" && (
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    trend.direction === "up"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Visual bar */}
          <div className="mb-3 flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${complianceColor.replace(
                  "text",
                  "bg"
                )}`}
                style={{ width: `${complianceScore}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span className="font-medium">Target: 90%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <ArrowUpRight className="h-4 w-4" />
            Run New Scan
          </button>
          <button
            onClick={() => {
              // TODO: Implement PDF download
              console.log("Download report");
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-5 py-2.5 font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getRiskConfig(risk: RiskPosture) {
  const configs = {
    low: {
      label: "Low",
      bgColor: "bg-emerald-500/20",
      textColor: "text-emerald-400",
    },
    medium: {
      label: "Medium",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400",
    },
    high: {
      label: "High",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-400",
    },
    critical: {
      label: "Critical",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400",
    },
  };
  return configs[risk];
}

function getComplianceColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
}
