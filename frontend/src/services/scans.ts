import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useOrgStore } from "@/store/orgStore";
import type { CreateScanJobResponse, ScanJob } from "../types/scanJob";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ListScanJobsResponse = {
  items: ScanJob[];
  total: number;
};

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const organizationId = useOrgStore.getState().currentOrganization?.id;

  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (organizationId) headers.set("X-Organization-ID", organizationId);

  const res = await fetch(`/api${path}`, { ...init, headers });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    } else if (res.status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (res.status === 404) {
      toast.error("Resource not found.");
    } else if (res.status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await res.json()) as T;

  return (await res.text()) as unknown as T;
}

export async function healthCheck(): Promise<unknown> {
  return await http<unknown>("/health", { method: "GET" as HttpMethod });
}

export async function createScanJob(payload: unknown): Promise<CreateScanJobResponse> {
  return await http<CreateScanJobResponse>("/scan-jobs", {
    method: "POST" as HttpMethod,
    body: JSON.stringify(payload),
  });
}

export async function getScanJob(jobid: string): Promise<ScanJob> {
  return await http<ScanJob>(`/scan-jobs/${encodeURIComponent(jobid)}`, {
    method: "GET" as HttpMethod,
  });
}

/**
 * List scan jobs (matches Jobs.tsx expectation: { items, total }).
 * If your backend returns { items, total } this is correct.
 */
export async function listScanJobs(limit = 20, offset = 0): Promise<ListScanJobsResponse> {
  return await http<ListScanJobsResponse>(
    `/scan-jobs?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
    { method: "GET" as HttpMethod }
  );
}

export async function uploadToPresignedUrl(
  url: string,
  file: Blob | File,
  contentType?: string
): Promise<void> {
  // Build init without optional undefined fields (for exactOptionalPropertyTypes)
  const init: RequestInit = {
    method: "PUT",
    body: file,
  };

  if (contentType) {
    init.headers = { "Content-Type": contentType };
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed with status ${res.status}`);
  }
}
