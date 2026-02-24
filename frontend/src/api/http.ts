const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const TOKEN_KEY = "token";

/**
 * Custom API error that keeps HTTP status + raw body text (useful for debugging).
 */
export class ApiError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, status: number, bodyText: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Global logout event (optional but useful to avoid importing router in this layer).
 * App can listen to it and navigate to /login.
 */
function emitAuthLogout(nextPath: string): void {
  try {
    window.dispatchEvent(new CustomEvent("dhc:logout", { detail: { next: nextPath } }));
  } catch {
    // ignore
  }
}

function buildUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("Missing VITE_API_BASE_URL. Check .env.local and restart the dev server.");
  }
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function buildNextPath(): string {
  try {
    const p = window.location?.pathname ?? "/dashboard";
    const s = window.location?.search ?? "";
    const next = `${p}${s}` || "/dashboard";
    return encodeURIComponent(next);
  } catch {
    return encodeURIComponent("/dashboard");
  }
}

function withAuth(init?: RequestInit): RequestInit {
  const token = getToken();
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...(init || {}), headers };
}

async function handleAuthErrors(res: Response): Promise<void> {
  if (res.status === 401 || res.status === 403) {
    clearToken();
    emitAuthLogout(buildNextPath());
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(buildUrl(path), withAuth(init));
  } catch (err) {
    // Network/CORS/Server down => fetch throws TypeError in browsers
    const msg =
      err instanceof Error ? err.message : "Network error (possible CORS or server unreachable).";
    throw new ApiError(msg, 0, "");
  }

  await handleAuthErrors(res);

  if (!res.ok) {
    const bodyText = await parseErrorBody(res);
    throw new ApiError(bodyText || res.statusText, res.status, bodyText);
  }

  // Handle empty responses (204 or empty body)
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    return text as unknown as T;
  }

  return (await res.json()) as T;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { method: "GET", ...(init || {}) });
}

export async function apiPostJson<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...(init || {}),
    headers,
  });
}

export async function apiPostForm<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: formData,
    ...(init || {}),
  });
}

export async function apiPostUrlEncoded<T>(
  path: string,
  data: Record<string, string>,
  init?: RequestInit
): Promise<T> {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => params.set(k, v));

  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/x-www-form-urlencoded");

  return request<T>(path, {
    method: "POST",
    body: params.toString(),
    ...(init || {}),
    headers,
  });
}

export async function apiPutJson<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    ...(init || {}),
    headers,
  });
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { method: "DELETE", ...(init || {}) });
}

export function apiFileUrl(path: string): string {
  return buildUrl(path);
}
