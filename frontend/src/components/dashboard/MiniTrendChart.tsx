// src/components/dashboard/MiniTrendChart.tsx

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface MiniTrendChartProps {
  data: { date: string; count: number }[];
  title?: string;
  period?: "7d" | "30d";
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MiniTrendChart({
  data,
  title = "Incidents Trend",
  period = "7d",
  className = "",
}: MiniTrendChartProps) {
  // Calculate trend
  const trend = calculateTrend(data);

  // Format data for chart (show only day of month)
  const chartData = data.map((item) => ({
    ...item,
    dateLabel: formatDateLabel(item.date, period),
  }));

  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-sm text-slate-400">
            Last {period === "7d" ? "7 days" : "30 days"}
          </p>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              trend.direction === "up"
                ? "bg-red-500/10 text-red-400"
                : trend.direction === "down"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-slate-500/10 text-slate-400"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : trend.direction === "down" ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            <span className="text-sm font-semibold">{trend.label}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="dateLabel"
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{
                  fill: "#3b82f6",
                  strokeWidth: 2,
                  r: 4,
                  stroke: "#1e293b",
                }}
                activeDot={{
                  r: 6,
                  fill: "#3b82f6",
                  stroke: "#1e293b",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 shadow-xl">
      <div className="text-xs text-slate-400">{formatFullDate(data.date)}</div>
      <div className="mt-1 text-sm font-semibold text-white">
        {data.count} incident{data.count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function calculateTrend(data: { date: string; count: number }[]) {
  if (data.length < 2) return null;

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

  if (firstAvg === 0 && secondAvg === 0) {
    return { direction: "neutral" as const, label: "No change" };
  }

  const change = firstAvg === 0 ? 100 : ((secondAvg - firstAvg) / firstAvg) * 100;

  if (Math.abs(change) < 5) {
    return { direction: "neutral" as const, label: "Stable" };
  }

  const direction = change > 0 ? "up" : "down";
  const label = `${Math.abs(Math.round(change))}% ${direction === "up" ? "increase" : "decrease"}`;

  return { direction, label };
}

function formatDateLabel(dateStr: string, period: "7d" | "30d"): string {
  const date = new Date(dateStr);
  
  if (period === "7d") {
    // For 7 days: show day name (Mon, Tue, etc.)
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    // For 30 days: show date (Jan 1, Jan 2, etc.)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
