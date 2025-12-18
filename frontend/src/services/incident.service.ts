import { apiClient } from './api';
import { Incident, PaginatedResponse, FilterOptions, AIDiagnosisResponse } from '@/types';

export const incidentService = {
  async getIncidents(filters: FilterOptions): Promise<PaginatedResponse<Incident>> {
    return apiClient.get<PaginatedResponse<Incident>>('/incidents', { params: filters });
  },

  async getIncidentById(id: string): Promise<Incident> {
    return apiClient.get<Incident>(`/incidents/${id}`);
  },

  async acknowledgeIncident(id: string): Promise<Incident> {
    return apiClient.post<Incident>(`/incidents/${id}/acknowledge`);
  },

  async assignIncident(id: string, userId: string): Promise<Incident> {
    return apiClient.post<Incident>(`/incidents/${id}/assign`, { userId });
  },

  async updateStatus(id: string, status: string): Promise<Incident> {
    return apiClient.patch<Incident>(`/incidents/${id}/status`, { status });
  },

  async addComment(id: string, comment: string): Promise<Incident> {
    return apiClient.post<Incident>(`/incidents/${id}/comments`, { comment });
  },

  async resolveIncident(id: string, resolution: string): Promise<Incident> {
    return apiClient.post<Incident>(`/incidents/${id}/resolve`, { resolution });
  },

  async getAIDiagnosis(id: string): Promise<AIDiagnosisResponse> {
    return apiClient.post<AIDiagnosisResponse>(`/ai/diagnose`, { incidentId: id });
  },

  async getSimilarIncidents(id: string): Promise<Incident[]> {
    return apiClient.get<Incident[]>(`/incidents/${id}/similar`);
  },
};
