/**
 * DHCaaS Incident Service
 * ========================
 * 
 * Service layer for Incident Management API integration.
 * Handles all HTTP communication with the backend incidents endpoints.
 * 
 * Features:
 * - Type-safe API calls with TypeScript interfaces
 * - Comprehensive error handling
 * - Query parameter support for filtering and pagination
 * - Response validation
 * 
 * @author DHCaaS Frontend Team
 * @version 1.0.0
 * @date February 05, 2026
 */

import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './api';

// =============================================================================
// CONFIGURATION
// =============================================================================

const INCIDENTS_ENDPOINT = `${API_BASE_URL}/incidents`;

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 10000; // 10 seconds

// =============================================================================
// TYPE DEFINITIONS (Match Backend Pydantic Models)
// =============================================================================

/**
 * Incident severity levels
 */
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Incident status values
 */
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

/**
 * Complete incident data model
 * Matches backend Pydantic Incident model exactly
 */
export interface Incident {
  id: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  status: IncidentStatus;
  source: string;
  scan_id: string | null;
  data_source: string | null;
  affected_records: number | null;
  regulatory_frameworks: string[];
  created_at: string; // ISO 8601 timestamp
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  assignee: string | null;
  tags: string[];
  resolution_notes: string | null;
}

/**
 * Paginated incident list response
 * Matches backend IncidentListResponse model
 */
export interface IncidentListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  incidents: Incident[];
}

/**
 * Request body for acknowledging an incident
 */
export interface AcknowledgeRequest {
  acknowledged_by: string; // Email address
  notes?: string; // Optional notes
}

/**
 * Request body for resolving an incident
 */
export interface ResolveRequest {
  resolved_by: string; // Email address
  resolution_notes: string; // Required, min 10 chars
}

/**
 * API response for acknowledge/resolve operations
 */
export interface MessageResponse {
  message: string;
  incident: Incident;
}

/**
 * Query parameters for fetching incidents
 */
export interface FetchIncidentsParams {
  page?: number;
  page_size?: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
}

/**
 * Error response structure
 */
export interface APIError {
  message: string;
  statusCode: number;
  detail?: string;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Custom error class for API errors
 */
export class IncidentServiceError extends Error {
  statusCode: number;
  detail?: string;

  constructor(message: string, statusCode: number, detail?: string) {
    super(message);
    this.name = 'IncidentServiceError';
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/**
 * Parse axios error and return structured error
 */
function handleAPIError(error: unknown): IncidentServiceError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail: string }>;
    
    if (axiosError.response) {
      // Server responded with error status
      const statusCode = axiosError.response.status;
      const detail = axiosError.response.data?.detail || axiosError.message;
      
      let message: string;
      
      switch (statusCode) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 404:
          message = 'Incident not found.';
          break;
        case 503:
          message = 'Service temporarily unavailable. Please try again later.';
          break;
        case 500:
          message = 'Internal server error. Please contact support.';
          break;
        default:
          message = 'An unexpected error occurred.';
      }
      
      return new IncidentServiceError(message, statusCode, detail);
    } else if (axiosError.request) {
      // Request made but no response received
      return new IncidentServiceError(
        'Unable to reach the server. Please check your connection.',
        0,
        'Network error'
      );
    }
  }
  
  // Unknown error
  return new IncidentServiceError(
    'An unexpected error occurred.',
    0,
    error instanceof Error ? error.message : 'Unknown error'
  );
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch paginated and filtered list of incidents
 * 
 * @param params - Query parameters for pagination and filtering
 * @returns Promise resolving to paginated incident list
 * @throws IncidentServiceError if request fails
 * 
 * @example
 * // Get first page of all incidents
 * const response = await fetchIncidents({ page: 1 });
 * 
 * @example
 * // Get critical incidents only
 * const response = await fetchIncidents({ severity: 'critical' });
 * 
 * @example
 * // Get open incidents, page 2
 * const response = await fetchIncidents({ page: 2, status: 'open' });
 */
export async function fetchIncidents(
  params: FetchIncidentsParams = {}
): Promise<IncidentListResponse> {
  try {
    const response = await axios.get<IncidentListResponse>(INCIDENTS_ENDPOINT, {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        ...(params.status && { status: params.status }),
        ...(params.severity && { severity: params.severity }),
      },
    });
    
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Fetch a single incident by ID
 * 
 * Note: This endpoint may not be implemented yet in backend.
 * If 404 is returned, consider fetching all and filtering client-side.
 * 
 * @param id - Incident ID
 * @returns Promise resolving to incident
 * @throws IncidentServiceError if request fails
 */
export async function fetchIncidentById(id: string): Promise<Incident> {
  try {
    const response = await axios.get<Incident>(`${INCIDENTS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Acknowledge an incident
 * 
 * Changes incident status from 'open' to 'acknowledged'.
 * Records timestamp and user who acknowledged.
 * 
 * @param id - Incident ID
 * @param request - Acknowledgment details (user email, optional notes)
 * @returns Promise resolving to updated incident
 * @throws IncidentServiceError if request fails
 * 
 * @example
 * const result = await acknowledgeIncident('INC-2026-001', {
 *   acknowledged_by: 'user@dhcaas.com',
 *   notes: 'Investigating now'
 * });
 */
export async function acknowledgeIncident(
  id: string,
  request: AcknowledgeRequest
): Promise<MessageResponse> {
  try {
    const response = await axios.post<MessageResponse>(
      `${INCIDENTS_ENDPOINT}/${id}/acknowledge`,
      request
    );
    
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Resolve an incident
 * 
 * Changes incident status to 'resolved'.
 * Records timestamp, user, and resolution notes.
 * Auto-acknowledges if not already acknowledged.
 * 
 * @param id - Incident ID
 * @param request - Resolution details (user email, resolution notes)
 * @returns Promise resolving to updated incident
 * @throws IncidentServiceError if request fails
 * 
 * @example
 * const result = await resolveIncident('INC-2026-001', {
 *   resolved_by: 'admin@dhcaas.com',
 *   resolution_notes: 'Fixed by updating ETL pipeline validation rules.'
 * });
 */
export async function resolveIncident(
  id: string,
  request: ResolveRequest
): Promise<MessageResponse> {
  try {
    const response = await axios.post<MessageResponse>(
      `${INCIDENTS_ENDPOINT}/${id}/resolve`,
      request
    );
    
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Health check for incidents API
 * 
 * @returns Promise resolving to health status
 * @throws IncidentServiceError if request fails
 */
export async function checkIncidentsHealth(): Promise<{
  status: string;
  message: string;
  incident_count: string;
}> {
  try {
    const response = await axios.get(`${INCIDENTS_ENDPOINT}/health`);
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get severity badge color for UI
 */
export function getSeverityColor(severity: IncidentSeverity): string {
  const colors: Record<IncidentSeverity, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue',
  };
  return colors[severity];
}

/**
 * Get status badge color for UI
 */
export function getStatusColor(status: IncidentStatus): string {
  const colors: Record<IncidentStatus, string> = {
    open: 'red',
    acknowledged: 'yellow',
    resolved: 'green',
  };
  return colors[status];
}

/**
 * Format ISO 8601 timestamp to readable date
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate resolution notes (min 10 characters)
 */
export function isValidResolutionNotes(notes: string): boolean {
  return notes.trim().length >= 10;
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default {
  fetchIncidents,
  fetchIncidentById,
  acknowledgeIncident,
  resolveIncident,
  checkIncidentsHealth,
  getSeverityColor,
  getStatusColor,
  formatTimestamp,
  isValidEmail,
  isValidResolutionNotes,
};
