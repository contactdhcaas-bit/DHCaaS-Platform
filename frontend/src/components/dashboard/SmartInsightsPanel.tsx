// src/components/dashboard/SmartInsightsPanel.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  TrendingUp,
  Upload,
  ShieldAlert,
  Unplug,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import type { Insight } from "../../utils/dashboardUtils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SmartInsightsPanelProps {
  insights: Insight[];
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SmartInsightsPanel({ insights, className = "" }: SmartInsightsPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <Lightbulb className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Smart Insights</h2>
          <p className="text-sm text-slate-400">
            AI-powered recommendations based on your data
          </p>
        </div>
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT CARD
// ─────────────────────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();
  const config = getSeverityConfig(insight.severity);
  const Icon = getIcon(insight.icon);

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border p-4 transition-all ${config.borderColor} ${config.bgColor}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${config.accentColor}`} />

      <div className="flex items-start gap-4 pl-3">
        {/* Icon */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${config.iconBgColor}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Title + Severity badge */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-white">{insight.title}</h3>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${config.badgeBgColor} ${config.badgeTextColor}`}
            >
              {insight.severity}
            </span>
          </div>

          {/* Reason */}
          <p className="text-sm text-slate-300">{insight.reason}</p>

          {/* CTA Button */}
          <button
            onClick={() => navigate(insight.ctaHref)}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${config.ctaBgColor} ${config.ctaTextColor} ${config.ctaHoverColor} ${config.ctaRingColor}`}
          >
            {insight.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getSeverityConfig(severity: Insight["severity"]) {
  const configs = {
    critical: {
      borderColor: "border-red-500/30",
      bgColor: "bg-red-500/5",
      accentColor: "bg-red-500",
      iconBgColor: "bg-red-500/20",
      iconColor: "text-red-400",
      badgeBgColor: "bg-red-500/20",
      badgeTextColor: "text-red-400",
      ctaBgColor: "bg-red-600",
      ctaTextColor: "text-white",
      ctaHoverColor: "hover:bg-red-700",
      ctaRingColor: "focus:ring-red-500",
    },
    high: {
      borderColor: "border-orange-500/30",
      bgColor: "bg-orange-500/5",
      accentColor: "bg-orange-500",
      iconBgColor: "bg-orange-500/20",
      iconColor: "text-orange-400",
      badgeBgColor: "bg-orange-500/20",
      badgeTextColor: "text-orange-400",
      ctaBgColor: "bg-orange-600",
      ctaTextColor: "text-white",
      ctaHoverColor: "hover:bg-orange-700",
      ctaRingColor: "focus:ring-orange-500",
    },
    medium: {
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/5",
      accentColor: "bg-yellow-500",
      iconBgColor: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      badgeBgColor: "bg-yellow-500/20",
      badgeTextColor: "text-yellow-400",
      ctaBgColor: "bg-yellow-600",
      ctaTextColor: "text-white",
      ctaHoverColor: "hover:bg-yellow-700",
      ctaRingColor: "focus:ring-yellow-500",
    },
    low: {
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/5",
      accentColor: "bg-emerald-500",
      iconBgColor: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      badgeBgColor: "bg-emerald-500/20",
      badgeTextColor: "text-emerald-400",
      ctaBgColor: "bg-emerald-600",
      ctaTextColor: "text-white",
      ctaHoverColor: "hover:bg-emerald-700",
      ctaRingColor: "focus:ring-emerald-500",
    },
  };
  return configs[severity];
}

function getIcon(iconName?: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    "alert-triangle": AlertTriangle,
    "trending-up": TrendingUp,
    upload: Upload,
    "shield-alert": ShieldAlert,
    unplug: Unplug,
    "check-circle": CheckCircle,
    "alert-octagon": AlertOctagon,
  };
  return icons[iconName || "alert-triangle"] || AlertTriangle;
}
