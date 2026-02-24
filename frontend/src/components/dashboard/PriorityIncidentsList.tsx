// src/components/dashboard/PriorityIncidentsList.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BackendIncident } from "../../lib/api-client";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PriorityIncidentsListProps {
  incidents: BackendIncident[];
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PriorityIncidentsList({
  incidents,
  className = "",
}: PriorityIncidentsListProps) {
  const navigate = useNavigate();

  // Empty state
  if (incidents.length === 0) {
    return (
      <div className={`rounded-xl border border-slate-700 bg-slate-800/50 p-6 ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Priority Incidents</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <AlertTriangle className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No incidents detected</h3>
          <p className="text-sm text-slate-400">
            Your data is clean and compliant ✅
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Priority Incidents</h2>
        <button
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Incidents list */}
      <div className="space-y-2">
        {incidents.map((incident) => (
          <IncidentItem key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT ITEM
// ─────────────────────────────────────────────────────────────────────────────

function IncidentItem({ incident }: { incident: BackendIncident }) {
  const navigate = useNavigate();
  const severityConfig = getSeverityConfig(incident.severity);

  return (
    <button
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="group w-full rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-left transition-all hover:border-slate-600 hover:bg-slate-700/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Severity + Content */}
        <div className="flex flex-1 items-start gap-3">
          {/* Severity badge */}
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${severityConfig.bgColor}`}
          >
            <AlertTriangle className={`h-4 w-4 ${severityConfig.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            {/* Title + Severity label */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white line-clamp-1">
                {incident.title || "Untitled incident"}
              </h3>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium uppercase ${severityConfig.badgeBgColor} ${severityConfig.badgeTextColor}`}
              >
                {incident.severity}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {/* Source */}
              {incident.source && (
                <>
                  <span className="font-medium">{incident.source}</span>
                  <span>•</span>
                </>
              )}
              {/* Time ago */}
              <span>
                {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
              </span>
              {/* Record count (if available) */}
              {incident.affected_records && (
                <>
                  <span>•</span>
                  <span>{incident.affected_records} records affected</span>
                </>
              )}
            </div>

            {/* Description (if available) */}
            {incident.description && (
              <p className="text-sm text-slate-400 line-clamp-1">{incident.description}</p>
            )}
          </div>
        </div>

        {/* Right: Arrow icon */}
        <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowRight className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getSeverityConfig(severity: BackendIncident["severity"]) {
  const configs = {
    critical: {
      bgColor: "bg-red-500/20",
      iconColor: "text-red-400",
      badgeBgColor: "bg-red-500/20",
      badgeTextColor: "text-red-400",
    },
    high: {
      bgColor: "bg-orange-500/20",
      iconColor: "text-orange-400",
      badgeBgColor: "bg-orange-500/20",
      badgeTextColor: "text-orange-400",
    },
    medium: {
      bgColor: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      badgeBgColor: "bg-yellow-500/20",
      badgeTextColor: "text-yellow-400",
    },
    low: {
      bgColor: "bg-blue-500/20",
      iconColor: "text-blue-400",
      badgeBgColor: "bg-blue-500/20",
      badgeTextColor: "text-blue-400",
    },
  };
  return configs[severity] || configs.medium;
}
