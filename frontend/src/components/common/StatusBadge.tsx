import React from "react";
import { cn } from "@/utils/cn";
import { HealthStatus, IncidentStatus, IncidentSeverity } from "@/types";

interface StatusBadgeProps {
  status: HealthStatus | IncidentStatus | IncidentSeverity | string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const statusClasses: Record<string, string> = {
    // Health Status
    HEALTHY:
      "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
    WARNING:
      "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
    CRITICAL:
      "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400",
    UNKNOWN: "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-400",

    // Incident Status
    OPEN: "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400",
    ACKNOWLEDGED:
      "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
    INVESTIGATING:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    RESOLVED:
      "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
    CLOSED: "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-400",

    // Incident Severity (avoid duplicate key name "CRITICAL")
    SEVERITY_CRITICAL:
      "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400",
    HIGH: "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
    MEDIUM:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    LOW: "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-400",
  };

  const lookupKey = status === "CRITICAL" ? "SEVERITY_CRITICAL" : status;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        sizeClasses[size],
        statusClasses[lookupKey] || statusClasses.UNKNOWN
      )}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
};
