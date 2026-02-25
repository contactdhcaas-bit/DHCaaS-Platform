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

// ===== SCHEMA INTROSPECTION TYPES =====

export interface ColumnSchema {
  column: string;
  type: string;
  nullable: boolean;
}

export interface SchemaResponse {
  status: 'success' | 'error';
  schema: Record<string, ColumnSchema[]>;
  table_count: number;
  message: string;
}

// ===== SCHEMA INTROSPECTION API FUNCTION =====

/**
 * Get database schema from a connector (SCHEMA INTROSPECTION - CORE ENGINE)
 * Extracts all tables and columns with data types for Data Quality Rules
 * @param id Connector ID
 * @returns Schema structure with tables and columns
 */
export const getConnectorSchema = async (id: string): Promise<SchemaResponse> => {
  const response = await apiClient.get<SchemaResponse>(`/connectors/${id}/schema`);
  return response.data;
};

// ===== DATA QUALITY RULES TYPES =====

export interface DQRuleConfig {
  // Dynamic config based on rule type
  pattern?: string;
  case_sensitive?: boolean;
  min_value?: number;
  max_value?: number;
  inclusive?: boolean;
  min_length?: number;
  max_length?: number;
  values?: string[];
}

export interface DQRule {
  id: string;
  rule_name: string;
  description: string | null;
  connector_id: string;
  connector_name: string;
  table_name: string;
  column_name: string;
  data_type: string | null;
  rule_type: 'not_null' | 'regex_match' | 'numeric_range' | 'string_length' | 'allowed_values';
  rule_config: DQRuleConfig;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  sample_size: number | null;
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
  last_execution_status: string | null;
  last_pass_count: number | null;
  last_fail_count: number | null;
  last_pass_rate: number | null;
}

export interface DQRuleCreate {
  rule_name: string;
  description?: string;
  connector_id: string;
  table_name: string;
  column_name: string;
  rule_type: 'not_null' | 'regex_match' | 'numeric_range' | 'string_length' | 'allowed_values';
  rule_config: DQRuleConfig;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled?: boolean;
  sample_size?: number;
}

export interface DQRulesListResponse {
  total: number;
  rules: DQRule[];
}

// ===== DATA QUALITY RULES API FUNCTIONS =====

/**
 * Get all data quality rules with optional filters
 * @param params Optional filters (connector_id, table_name, rule_type, severity, enabled)
 * @returns List of data quality rules
 */
export const getRules = async (params?: {
  connector_id?: string;
  table_name?: string;
  rule_type?: string;
  severity?: string;
  enabled?: boolean;
}): Promise<DQRulesListResponse> => {
  const response = await apiClient.get<DQRulesListResponse>('/rules/', { params });
  return response.data;
};

/**
 * Get a single data quality rule by ID
 * @param id Rule ID
 * @returns Rule details
 */
export const getRule = async (id: string): Promise<DQRule> => {
  const response = await apiClient.get<DQRule>(`/rules/${id}`);
  return response.data;
};

/**
 * Create a new data quality rule
 * @param data Rule configuration
 * @returns Created rule
 */
export const createRule = async (data: DQRuleCreate): Promise<DQRule> => {
  const response = await apiClient.post<DQRule>('/rules/', data);
  return response.data;
};

/**
 * Update an existing data quality rule
 * @param id Rule ID
 * @param data Partial rule data to update
 * @returns Updated rule
 */
export const updateRule = async (id: string, data: Partial<DQRuleCreate>): Promise<DQRule> => {
  const response = await apiClient.put<DQRule>(`/rules/${id}`, data);
  return response.data;
};

/**
 * Delete a data quality rule
 * @param id Rule ID
 * @returns Success message
 */
export const deleteRule = async (id: string): Promise<{ message: string; id: string }> => {
  const response = await apiClient.delete<{ message: string; id: string }>(`/rules/${id}`);
  return response.data;
};

/**
 * Enable or disable a data quality rule
 * @param id Rule ID
 * @param enable True to enable, false to disable
 * @returns Success message
 */
export const toggleRuleStatus = async (
  id: string,
  enable: boolean
): Promise<{ message: string; id: string }> => {
  const endpoint = enable ? `/rules/${id}/enable` : `/rules/${id}/disable`;
  const response = await apiClient.post<{ message: string; id: string }>(endpoint);
  return response.data;
};
