// src/components/dashboard/KpiCard.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import type { KPI } from "../../utils/dashboardUtils";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function KpiCard({ label, value, delta, trend, href, description }: KPI) {
  const navigate = useNavigate();

  // Trend configuration
  const trendConfig = getTrendConfig(trend);

  return (
    <button
      onClick={() => navigate(href)}
      className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-left transition-all hover:border-slate-600 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      {/* Hover indicator */}
      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Label */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400">{label}</h3>
        </div>

        {/* Value + Delta */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-white">{value}</span>
          
          {delta !== "0%" && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${trendConfig.bgColor} ${trendConfig.textColor}`}
            >
              {trendConfig.icon}
              <span>{delta}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2">{description}</p>
      </div>

      {/* Bottom gradient (visual enhancement) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getTrendConfig(trend: "up" | "down" | "neutral") {
  const configs = {
    up: {
      icon: <TrendingUp className="h-3 w-3" />,
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-400",
    },
    down: {
      icon: <TrendingDown className="h-3 w-3" />,
      bgColor: "bg-red-500/10",
      textColor: "text-red-400",
    },
    neutral: {
      icon: <Minus className="h-3 w-3" />,
      bgColor: "bg-slate-500/10",
      textColor: "text-slate-400",
    },
  };
  return configs[trend];
}
