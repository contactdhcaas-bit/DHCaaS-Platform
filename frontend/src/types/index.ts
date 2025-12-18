export type User = {
  id?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export type Organization = {
  id?: string;
  name?: string;
};

export type HealthStatus = "GOOD" | "WARNING" | "CRITICAL";
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Incident = {
  id?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
};

export type FilterOptions = Record<string, unknown>;

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type AIDiagnosisResponse = Record<string, unknown>;
