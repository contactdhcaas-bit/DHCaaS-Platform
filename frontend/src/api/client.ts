import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// In development, Vite proxy redirects '/api' to backend.
// In production, Nginx will handle this path.
const API_URL = "/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically add Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Optional handling for 401/Auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const getFilenameFromContentDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;

  // Examples:
  // Content-Disposition: attachment; filename="report.pdf"
  // Content-Disposition: attachment; filename=report.pdf
  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)"?/i);
  if (!match || !match[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const getContentTypeFromHeaders = (headers: Record<string, any>): string | undefined => {
  const ct = headers?.["content-type"] ?? headers?.["Content-Type"];
  if (typeof ct === "string") return ct;
  return undefined;
};

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

/**
 * Download helper (PDF, CSV, etc.)
 * - Uses axios blob responseType
 * - Attempts to parse filename from Content-Disposition
 * - If backend returns JSON error as blob, tries to parse and throw a readable error
 */
export const downloadFile = async (url: string, defaultFilename: string): Promise<void> => {
  try {
    const response = await apiClient.get<Blob>(url, {
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });

    const contentDisposition = response.headers?.["content-disposition"];
    const filename = getFilenameFromContentDisposition(contentDisposition) ?? defaultFilename;

    const contentType = getContentTypeFromHeaders(response.headers) ?? "application/octet-stream";
    const blob = new Blob([response.data], { type: contentType });

    triggerBrowserDownload(blob, filename);
  } catch (err) {
    // If the server returns an error payload as blob, decode it to show a meaningful message
    const axiosErr = err as AxiosError;

    const response = axiosErr.response as AxiosResponse<Blob> | undefined;
    const headers = response?.headers ?? {};
    const contentType = getContentTypeFromHeaders(headers);

    if (response?.data instanceof Blob && contentType?.includes("application/json")) {
      try {
        const text = await response.data.text();
        const parsed = JSON.parse(text);
        const message =
          parsed?.detail ||
          parsed?.message ||
          parsed?.error ||
          "Download failed with a server error.";
        throw new Error(message);
      } catch {
        throw new Error("Download failed. The server returned an invalid error response.");
      }
    }

    throw err;
  }
};

/**
 * Multipart upload helper (CSV/XLSX, etc.)
 * - Uses FormData
 * - Supports upload progress callback
 *
 * Example:
 *   uploadMultipart("/scans/upload", formData, (pct) => setProgress(pct));
 */
export const uploadMultipart = async <T = any>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    ...config,
    headers: {
      ...(config?.headers ?? {}),
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total ?? 0;
      if (!total) return;
      const percent = Math.round((evt.loaded * 100) / total);
      onProgress(percent);
    },
  });

  return response.data;
};

export default apiClient;
