import axios from "axios";

function getStoredToken(): string | null {
  // Support both legacy "token" and Zustand persist key "dhc_auth_store"
  const direct = localStorage.getItem("token");
  if (direct) return direct;

  const raw = localStorage.getItem("dhc_auth_store");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

const baseURL =
  (import.meta.env.VITE_API_URL?.trim() || "").replace(/\/+$/, "") || "/api";

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { apiClient };
