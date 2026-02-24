// src/components/dashboard/DashboardSkeleton.tsx

import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Hero Skeleton */}
      <div className="rounded-xl bg-slate-800/50 p-8">
        <div className="space-y-6">
          {/* Top section */}
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-16 w-32 rounded-lg" />
          </div>

          {/* Compliance score */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-16 w-48" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-baseline gap-3">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout for Insights + Incidents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Smart Insights Skeleton */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-4"
              >
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-9 w-32 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Incidents Skeleton */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-4"
              >
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Chart Skeleton */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON PRIMITIVE
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-700/50 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// Add shimmer animation to global CSS or index.css
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
