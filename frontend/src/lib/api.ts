// src/lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders,
} from "axios";

// 1) Configuration
const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").trim();

// LocalStorage keys (must match authStore.ts)
const TOKEN_KEY = "token";
const ACCESS_TOKEN_KEY = "access_token";
const AUTH_STORE_KEY = "dhc_auth_store";

// 2) Axios Instance Setup
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  // Do NOT set a global Content-Type here.
});

// Prevent redirect loops when multiple requests return 401 at the same time
let isRedirectingToLogin = false;

// Helpers
function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

function clearAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem(AUTH_STORE_KEY);
  } catch {
    // ignore
  }
}

function redirectToLoginPreserveFrom() {
  if (isRedirectingToLogin) return;

  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const from = encodeURIComponent(path);

  isRedirectingToLogin = true;

  // Full reload to reset app state cleanly after auth loss
  window.location.href = `/login?from=${from}`;
}

// 3) Request Interceptor: Add JWT token to every request
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();

    // Normalize headers object
    config.headers = (config.headers ?? {}) as RawAxiosRequestHeaders;

    // Always remove Authorization when there is no token (prevents stale header reuse)
    if (!token) {
      delete (config.headers as RawAxiosRequestHeaders).Authorization;
      return config;
    }

    (config.headers as RawAxiosRequestHeaders).Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 4) Response Interceptor: Handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error?.response?.status;

    if (status === 401) {
      const isAlreadyOnLogin = window.location.pathname.startsWith("/login");
      if (!isAlreadyOnLogin) {
        clearAuthStorage();
        redirectToLoginPreserveFrom();
      }
    }

    return Promise.reject(error);
  }
);

// --- Backend-aligned Interfaces ---
export type BackendIncidentStatus = "open" | "investigating" | "resolved";
export type BackendIncidentSeverity = "low" | "medium" | "high" | "critical";

export interface BackendIncident {
  id: string;
  severity: BackendIncidentSeverity;
  status: BackendIncidentStatus;
  type: string;
  description: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  scan_id?: string;
  owner?: string;

  resolution_code?: string;
  resolution_note?: string;

  // Optional / legacy / UI fields
  title?: string;
  count?: number;
  org?: string;
  files?: number;
  regulation?: string;
}

export type BackendScanStatus = "Compliant" | "Non-Compliant";

export interface BackendScan {
  id: string;
  filename: string;
  total_rows: number;
  pii_columns_found: string[];
  pii_total_exposure: number;
  compliance_score: number;
  status: BackendScanStatus;
  created_at?: string;
  owner?: string;

  // Optional / legacy fields
  score?: number;
}

export interface IncidentContextResponse {
  incident: BackendIncident;
  scan: BackendScan | null;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  connection_string: string;
  database_name: string;
  description?: string;
  created_at?: string;
  owner?: string;
}

export interface SourceCreatePayload {
  name: string;
  type?: string;
  connection_string: string;
  database_name: string;
  description?: string | null;
}

export interface SourceCreateResponse {
  id: string;
  message: string;
}

export interface SourceTestResponse {
  ok: boolean;
  source_id: string;
  db_name: string;
  collections_count: number;
  collections: string[];
  sample?: {
    collection: string;
    fields: string[];
  } | null;
  tested_at?: string;
}

// --- Catalog Interfaces (NEW) ---
export interface Asset {
  id: string;
  owner: string;
  asset_type: "file" | "source";
  name: string;
  source_id: string | null;
  latest_scan_id: string | null;
  tags: string[];
  sensitivity: "low" | "medium" | "high";
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  latest_scan_summary?: {
    scan_id: string;
    compliance_score: number;
    status: string;
    created_at: string | null;
  } | null;
}

export interface AssetListResponse {
  items: Asset[];
  page: number;
  limit: number;
  total: number;
}

export interface AssetCreatePayload {
  asset_type: "file" | "source";
  name: string;
  source_id?: string | null;
  tags?: string[];
  sensitivity?: "low" | "medium" | "high";
}

export interface AssetUpdatePayload {
  name?: string;
  tags?: string[];
  sensitivity?: "low" | "medium" | "high";
  status?: "active" | "archived";
}

export interface LinkAssetResponse {
  asset_id: string;
  scan_id: string;
  created: boolean;
}

export type ConnectivityHealthStatus = "Healthy" | "Unhealthy";

export interface ConnectivityScanResult {
  status: ConnectivityHealthStatus;
  latency_ms: number;
  checked_at: string;
  target: string;
  asset_id: string;
  scan_id: string;
  details: Record<string, any>;
}

// Unified scan row for Catalog History (Option 2)
export type CatalogScanType = "connectivity" | "metadata";

export type UnifiedScanStatus = "Healthy" | "Unhealthy" | "Compliant" | "Non-Compliant" | "Unknown";

export interface UnifiedScanRow {
  id: string;
  scan_type: CatalogScanType;

  // Shared columns
  scanned_at: string | null;
  status: UnifiedScanStatus;

  // Connectivity-only columns
  latency_ms?: number | null;
  method?: string | null; // "HTTP" | "Ping" | etc

  // Metadata/CSV-only columns
  filename?: string | null;
  completeness_pct?: number | null;
  issue_count?: number | null;
}

// --- UI Interfaces kept for compatibility ---
export interface ScanJob {
  id: string;
  name?: string;
  filename?: string;

  status?: "queued" | "running" | "completed" | "failed";

  total_rows?: number;
  pii_columns_found?: string[];
  pii_total_exposure?: number;
  compliance_score?: number;
  created_at?: string;
  owner?: string;

  progress?: number;
  files?: number;
  health?: number;
  incidents?: number;
  started?: string;
  org?: string;
  score?: number;
}

export interface DashboardMetrics {
  total_scans?: number;
  avg_score?: number;
  high_risk?: number;
  datasets?: number;
  last_scan?: string;

  // Optional / legacy fields
  health?: number;
  activeJobs?: number;
  highRisk?: number;
  filesScanned?: number;
}

// --- Incident Resolution (enterprise-grade) ---
export type IncidentResolutionCode =
  | "Fixed"
  | "Mitigated"
  | "False Positive"
  | "Accepted Risk"
  | "Duplicate"
  | "Won't Fix"
  | "Other";

export interface ResolveIncidentPayload {
  resolution_code: IncidentResolutionCode;
  resolution_note: string;
}

// --- API Methods Object ---
export const api = {
  // Scans - FIXED: removed /api prefix
  getScans: async (): Promise<BackendScan[]> => {
    const { data } = await axiosInstance.get("/scans");
    if (Array.isArray(data)) return data as BackendScan[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as BackendScan[];
    if (Array.isArray((data as any)?.scans)) return (data as any).scans as BackendScan[];
    return [];
  },

  getJobs: async (limit: number = 20, offset: number = 0): Promise<ScanJob[]> => {
    const { data } = await axiosInstance.get(
      `/scans/scan-jobs?limit=${limit}&offset=${offset}`
    );
    if (Array.isArray(data)) return data as ScanJob[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as ScanJob[];
    return [];
  },

  getScan: async (scanId: string): Promise<BackendScan> => {
    const { data } = await axiosInstance.get(`/scans/${encodeURIComponent(scanId)}`);
    return data as BackendScan;
  },

  createScanJob: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosInstance.post("/scans/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },

  getJob: async (jobId: string): Promise<ScanJob> => {
    const data = await api.getScan(jobId);
    return data as any;
  },

  // Incidents - FIXED: removed /api prefix
  getIncidents: async (): Promise<BackendIncident[]> => {
    const { data } = await axiosInstance.get("/incidents");
    if (Array.isArray(data)) return data as BackendIncident[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as BackendIncident[];
    if (Array.isArray((data as any)?.incidents)) return (data as any).incidents as BackendIncident[];
    return [];
  },

  getIncident: async (incidentId: string): Promise<BackendIncident> => {
    const { data } = await axiosInstance.get(`/incidents/${encodeURIComponent(incidentId)}`);
    return data as BackendIncident;
  },

  getIncidentContext: async (incidentId: string): Promise<IncidentContextResponse> => {
    const { data } = await axiosInstance.get(
      `/incidents/${encodeURIComponent(incidentId)}/context`
    );
    return data as IncidentContextResponse;
  },

  acknowledgeIncident: async (incidentId: string): Promise<BackendIncident> => {
    const { data } = await axiosInstance.post(
      `/incidents/${encodeURIComponent(incidentId)}/acknowledge`
    );
    return data as BackendIncident;
  },

  resolveIncident: async (
    incidentId: string,
    payload: ResolveIncidentPayload
  ): Promise<BackendIncident> => {
    const { data } = await axiosInstance.post(
      `/incidents/${encodeURIComponent(incidentId)}/resolve`,
      payload
    );
    return data as BackendIncident;
  },

  reopenIncident: async (incidentId: string): Promise<BackendIncident> => {
    const { data } = await axiosInstance.post(
      `/incidents/${encodeURIComponent(incidentId)}/reopen`
    );
    return data as BackendIncident;
  },

  // Sources - FIXED: removed /api prefix
  getSources: async (): Promise<Source[]> => {
    const { data } = await axiosInstance.get("/sources");
    if (Array.isArray(data)) return data as Source[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as Source[];
    if (Array.isArray((data as any)?.sources)) return (data as any).sources as Source[];
    return [];
  },

  createSource: async (payload: SourceCreatePayload): Promise<SourceCreateResponse> => {
    const { data } = await axiosInstance.post("/sources", payload);
    return data as SourceCreateResponse;
  },

  deleteSource: async (sourceId: string): Promise<{ message: string }> => {
    const { data } = await axiosInstance.delete(`/sources/${encodeURIComponent(sourceId)}`);
    return data as { message: string };
  },

  testSourceConnection: async (sourceId: string): Promise<SourceTestResponse> => {
    const { data } = await axiosInstance.post(`/sources/${encodeURIComponent(sourceId)}/test`);
    return data as SourceTestResponse;
  },

  // Catalog (NEW) - FIXED: removed /api prefix
  getAssets: async (params?: {
    q?: string;
    asset_type?: "file" | "source";
    tag?: string;
    sensitivity?: "low" | "medium" | "high";
    status?: "active" | "archived";
    page?: number;
    limit?: number;
  }): Promise<AssetListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.asset_type) searchParams.set("asset_type", params.asset_type);
    if (params?.tag) searchParams.set("tag", params.tag);
    if (params?.sensitivity) searchParams.set("sensitivity", params.sensitivity);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const { data } = await axiosInstance.get(`/catalog/assets?${searchParams.toString()}`);
    return data as AssetListResponse;
  },

  createAsset: async (payload: AssetCreatePayload): Promise<Asset> => {
    const { data } = await axiosInstance.post("/catalog/assets", payload);
    return data as Asset;
  },

  getAsset: async (assetId: string): Promise<Asset> => {
    const { data } = await axiosInstance.get(`/catalog/assets/${encodeURIComponent(assetId)}`);
    return data as Asset;
  },

  updateAsset: async (assetId: string, payload: AssetUpdatePayload): Promise<Asset> => {
    const { data } = await axiosInstance.patch(
      `/catalog/assets/${encodeURIComponent(assetId)}`,
      payload
    );
    return data as Asset;
  },

  // Raw scans (returns documents from db.scans for this asset, mixed kinds)
  getAssetScansRaw: async (assetId: string): Promise<any[]> => {
    const { data } = await axiosInstance.get(
      `/catalog/assets/${encodeURIComponent(assetId)}/scans`
    );
    if (Array.isArray(data)) return data as any[];
    if (Array.isArray((data as any)?.scans)) return (data as any).scans as any[];
    return [];
  },

  // Backwards compatible helper (kept)
  getAssetScans: async (assetId: string): Promise<BackendScan[]> => {
    const raw = await api.getAssetScansRaw(assetId);
    // Keep only CSV-like scans
    return raw
      .filter((x: any) => typeof x?.filename === "string" && typeof x?.compliance_score === "number")
      .map((x: any) => x as BackendScan);
  },

  scanAssetConnectivity: async (assetId: string): Promise<ConnectivityScanResult> => {
    const { data } = await axiosInstance.post(
      `/catalog/assets/${encodeURIComponent(assetId)}/scan`
    );
    return data as ConnectivityScanResult;
  },

  linkAssetFromScan: async (scanId: string): Promise<LinkAssetResponse> => {
    const { data } = await axiosInstance.post(
      `/catalog/assets/from-scan/${encodeURIComponent(scanId)}`
    );
    return data as LinkAssetResponse;
  },

  // Dashboard (computed fallback) - FIXED: removed /api prefix
  getDashboard: async (): Promise<DashboardMetrics> => {
    try {
      const [scansRes, incidentsRes] = await Promise.allSettled([
        axiosInstance.get("/scans"),
        axiosInstance.get("/incidents"),
      ]);

      const scansData = scansRes.status === "fulfilled" ? scansRes.value.data : [];
      const incidentsData = incidentsRes.status === "fulfilled" ? incidentsRes.value.data : [];

      const scans: any[] = Array.isArray(scansData)
        ? scansData
        : (scansData as any)?.items || (scansData as any)?.scans || [];

      const incidents: any[] = Array.isArray(incidentsData)
        ? incidentsData
        : (incidentsData as any)?.items || (incidentsData as any)?.incidents || [];

      const totalScans = scans.length;

      const avgScore =
        totalScans > 0
          ? Math.round(
              scans.reduce(
                (sum: number, s: any) => sum + Number(s.compliance_score ?? s.score ?? 0),
                0
              ) / totalScans
            )
          : 0;

      const highRisk = incidents.filter(
        (i: any) => i.severity === "high" || i.severity === "critical"
      ).length;

      const datasets = new Set(scans.map((s: any) => s.filename).filter(Boolean)).size;

      return {
        total_scans: totalScans,
        avg_score: avgScore,
        high_risk: highRisk,
        datasets,
        last_scan: scans[0]?.created_at || new Date().toISOString(),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Dashboard fetch error:", error);
      return {
        total_scans: 0,
        avg_score: 0,
        high_risk: 0,
        datasets: 0,
        last_scan: new Date().toISOString(),
      };
    }
  },

  // Generic helpers
  get: async (url: string) => axiosInstance.get(url),
  post: async (url: string, body?: any) => axiosInstance.post(url, body),

  // Expose baseURL for debugging / UI display
  getBaseUrl: (): string => API_BASE,
};

export default api;
export { axiosInstance, API_BASE };
