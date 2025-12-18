import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import { useOrgStore } from "@/store/orgStore";
import toast from "react-hot-toast";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        const organizationId = useOrgStore.getState().currentOrganization?.id;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (organizationId) {
          config.headers["X-Organization-ID"] = organizationId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status: number | undefined = error.response?.status;

        switch (status) {
          case 401:
            useAuthStore.getState().logout();
            window.location.href = "/login";
            toast.error("Session expired. Please login again.");
            break;

          case 403:
            toast.error("You do not have permission to perform this action.");
            break;

          case 404:
            toast.error("Resource not found.");
            break;

          default:
            if (typeof status === "number" && status >= 500) {
              toast.error("Server error. Please try again later.");
            }
            break;
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
