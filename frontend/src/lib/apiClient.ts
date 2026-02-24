// src/lib/apiClient.ts

import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface BackendScan {
  id: string;
  filename: string;
  status: "pending" | "running" | "completed" | "failed";
  total_records?: number;
  incidents_detected?: number;
  created_at: string;
  updated_at: string;
}

export interface BackendIncident {
  id: string;
  title: string;
  description?: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "closed";
  source?: string;
  affected_records?: number;
  created_at: string;
  updated_at: string;
}

export interface BackendSource {
  id: string;
  name: string;
  type: "database" | "api" | "file";
  status: "connected" | "disconnected" | "error";
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper function to retrieve the stored auth token from localStorage.
 * Supports both:
 * - Direct "token" key (legacy)
 * - Zustand persist key "dhc_auth_store" (current)
 */
function getStoredToken(): string | null {
  // Try direct token first
  const direct = localStorage.getItem("token");
  if (direct) return direct;

  // Try Zustand persist store
  const raw = localStorage.getItem("dhc_auth_store");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base URL configuration:
 * - In dev: points directly to backend on port 8000
 * - In prod: uses VITE_API_URL environment variable
 */
const baseURL =
  (import.meta.env.VITE_API_URL?.trim() || "").replace(/\/+$/, "") || "http://localhost:8000/api";

/**
 * Axios client instance with automatic Bearer token injection
 */
const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: Automatically attach Authorization header
 * if a valid token exists in localStorage
 */
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor for global error handling
 * (e.g., redirect to /login on 401)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: clear token and redirect
      // localStorage.removeItem("token");
      // localStorage.removeItem("dhc_auth_store");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { apiClient };
