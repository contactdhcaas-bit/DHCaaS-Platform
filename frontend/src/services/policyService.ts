// src/services/policyService.ts
import api from './api';

export interface Policy {
  id: string;
  owner_id: string;
  is_global: boolean;
  name: string;
  description: string;
  rule_type: 'min_quality_score' | 'max_pii_rows' | 'forbidden_columns' | 'max_duplicates' | 'max_missing_percentage' | 'require_encryption';
  threshold: number;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'warning' | 'info';
  status: string;
  tags: string[];
  target_tables: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  violation_count: number;
  last_violation: string | null;
}

export interface PolicyCreate {
  name: string;
  description: string;
  rule_type: Policy['rule_type'];
  threshold: number;
  enabled: boolean;
  severity: Policy['severity'];
  tags?: string[];
  target_tables?: string[];
}

export interface PolicyUpdate {
  name?: string;
  description?: string;
  threshold?: number;
  enabled?: boolean;
  severity?: Policy['severity'];
  tags?: string[];
  target_tables?: string[];
}

class PolicyService {
  /**
   * Get all policies
   */
  async getPolicies(enabledOnly: boolean = false): Promise<Policy[]> {
    const response = await api.get('/policies/', {
      params: { enabled_only: enabledOnly }
    });
    return response.data;
  }

  /**
   * Get single policy by ID
   */
  async getPolicy(policyId: string): Promise<Policy> {
    const response = await api.get(`/policies/${policyId}`);
    return response.data;
  }

  /**
   * Create new policy
   */
  async createPolicy(data: PolicyCreate): Promise<Policy> {
    const response = await api.post('/policies/', data);
    return response.data;
  }

  /**
   * Update existing policy
   */
  async updatePolicy(policyId: string, data: PolicyUpdate): Promise<Policy> {
    const response = await api.put(`/policies/${policyId}`, data);
    return response.data;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    await api.delete(`/policies/${policyId}`);
  }

  /**
   * Toggle policy enabled status
   */
  async togglePolicy(policyId: string, enabled: boolean): Promise<Policy> {
    return this.updatePolicy(policyId, { enabled });
  }
}

export const policyService = new PolicyService();
export default policyService;
