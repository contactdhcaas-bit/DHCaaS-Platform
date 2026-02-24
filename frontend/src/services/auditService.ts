// src/services/auditService.ts
import api from './axios';

export interface AuditLog {
  id: string;
  action: string;
  actor_email: string;
  actor_id?: string;
  target_id?: string;
  target_email?: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

class AuditService {
  async getAuditLogs(page: number = 1, pageSize: number = 50): Promise<AuditLogsResponse> {
    const skip = (page - 1) * pageSize;
    const response = await api.get<AuditLogsResponse>(
      `/audit-logs/?skip=${skip}&limit=${pageSize}`
    );
    return response.data;
  }
}

export default new AuditService();
