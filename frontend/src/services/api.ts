// src/services/api.ts
// DHCaaS API Service Layer - Unified Axios Client
// Centralized API client for all backend communication

import axios, { AxiosInstance, AxiosError } from 'axios';

// ===== BASE CONFIGURATION =====
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// ===== AXIOS INSTANCE =====
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== REQUEST INTERCEPTOR (Add Auth Token) =====
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== RESPONSE INTERCEPTOR (Handle Errors) =====
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token');
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;


// ===== CONNECTORS TYPES =====

export interface ConnectorConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface Connector {
  id: string;
  name: string;
  type: 'postgres' | 'mysql';
  config: ConnectorConfig;
  status: string;
  last_tested_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectorCreateRequest {
  name: string;
  type: 'postgres' | 'mysql';
  config: ConnectorConfig;
}

export interface TestConnectionResponse {
  status: 'success' | 'error';
  message: string;
  latency_ms: number;
  details?: {
    server_version?: string;
    database?: string;
    tables_count?: number;
    connection_type?: string;
    error_type?: string;
    error_code?: number;
    hint?: string;
  };
}

export interface ConnectorListResponse {
  total: number;
  connectors: Connector[];
}

// ===== CONNECTORS API FUNCTIONS =====

/**
 * Get all connectors
 * @param type Optional filter by connector type (postgres, mysql)
 * @returns List of connectors with masked passwords
 */
export const getConnectors = async (type?: 'postgres' | 'mysql'): Promise<ConnectorListResponse> => {
  const params = type ? { connector_type: type } : {};
  const response = await apiClient.get<ConnectorListResponse>('/connectors/', { params });
  return response.data;
};

/**
 * Create a new connector
 * @param data Connector configuration
 * @returns Created connector with masked password
 */
export const createConnector = async (data: ConnectorCreateRequest): Promise<Connector> => {
  const response = await apiClient.post<Connector>('/connectors/', data);
  return response.data;
};

/**
 * Test a connector connection (KILLER FEATURE)
 * @param id Connector ID
 * @returns Connection test results with latency and details
 */
export const testConnector = async (id: string): Promise<TestConnectionResponse> => {
  const response = await apiClient.post<TestConnectionResponse>(`/connectors/${id}/test`);
  return response.data;
};

/**
 * Delete a connector
 * @param id Connector ID
 * @returns Success message
 */
export const deleteConnector = async (id: string): Promise<{ message: string; id: string }> => {
  const response = await apiClient.delete<{ message: string; id: string }>(`/connectors/${id}`);
  return response.data;
};
