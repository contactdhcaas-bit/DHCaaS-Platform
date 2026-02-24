// src/services/ruleService.ts
import axios, { AxiosError } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// TYPES - MATCHING BACKEND EXACTLY
// ============================================================================

export type RuleType =
  | 'NOT_NULL'
  | 'UNIQUE'
  | 'REGEX'
  | 'RANGE'
  | 'ENUM'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE_FORMAT'
  | 'LENGTH'
  | 'CUSTOM_SQL'
  | 'MIN_VALUE'
  | 'MAX_VALUE';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RuleScope = 'COLUMN' | 'ROW' | 'DATASET';

export type RuleStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface RuleParameters {
  // For REGEX
  pattern?: string;
  
  // For RANGE
  min?: number;
  max?: number;
  
  // For ENUM
  allowed_values?: string[];
  
  // For LENGTH
  min_length?: number;
  max_length?: number;
  
  // For DATE_FORMAT
  format?: string;
  
  // For CUSTOM_SQL
  expression?: string;
  
  // Any other custom parameters
  [key: string]: any;
}

// CREATE Request (what we send to backend)
export interface DataQualityRuleCreate {
  rule_name: string;
  description?: string | null;
  job_id: string;
  dataset_name?: string | null;
  rule_type: RuleType;
  scope?: RuleScope;
  column_name?: string | null;
  parameters?: RuleParameters;
  severity?: Severity;
  is_active?: boolean;
  stop_on_failure?: boolean;
  created_by: string;
  tags?: string[];
}

// RESPONSE (what we get from backend)
export interface DataQualityRuleResponse {
  rule_id: string;
  rule_name: string;
  description: string | null;
  job_id: string;
  dataset_name: string | null;
  rule_type: RuleType;
  scope: RuleScope;
  column_name: string | null;
  parameters: RuleParameters;
  severity: Severity;
  is_active: boolean;
  stop_on_failure: boolean;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  last_executed: string | null;
  total_executions: number;
  total_violations: number;
  total_passed: number;
  status: RuleStatus;
  tags: string[];
}

export interface ValidationReport {
  job_id: string;
  dataset_name: string;
  validation_date: string;
  total_rules_executed: number;
  total_rules_passed: number;
  total_rules_failed: number;
  total_violations: number;
  critical_violations: number;
  high_violations: number;
  medium_violations: number;
  low_violations: number;
  overall_status: string;
  quality_score: number;
  rules_summary: any[];
  violations_summary: any[];
}

// Dataset interface - normalized structure
export interface Dataset {
  job_id: string;
  datasource_name: string;
  column_names: string[];
  [key: string]: any;
}

export interface Stats {
  total_rules: number;
  active_rules: number;
  total_violations: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class RuleService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔑 [getAuthHeaders] Token exists:', !!token);
    console.log('👤 [getAuthHeaders] User:', user.email || 'No user');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getCurrentUserEmail(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const email = user.email || 'system@dhcaas.com';
    console.log('👤 [getCurrentUserEmail] Using email:', email);
    return email;
  }

  private normalizeDataset(item: any): Dataset {
    // Handle different response structures
    return {
      job_id: item.job_id || item.id || item._id || '',
      datasource_name: item.datasource_name || item.name || item.dataset_name || 'Unnamed Dataset',
      column_names: item.column_names || item.columns || [],
      ...item, // Preserve all other fields
    };
  }

  // GET DATASETS WITH FALLBACK ENDPOINTS
  async getDatasets(): Promise<Dataset[]> {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📥 [getDatasets] STARTING DATASET FETCH');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🌐 [getDatasets] API Base:', API_BASE);
    console.log('🔑 [getDatasets] Auth Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    
    const endpoints = [
      '/api/v1/datasets',
      '/api/v1/scan-jobs/',
      '/api/v1/scan-jobs',
      '/datasets',
      '/scan-jobs',
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const url = `${API_BASE}${endpoint}`;
        console.log('\n───────────────────────────────────────────────────────');
        console.log('🎯 [getDatasets] Attempting endpoint:', endpoint);
        console.log('📍 [getDatasets] Full URL:', url);
        console.log('───────────────────────────────────────────────────────');

        const response = await axios.get(url, {
          headers: this.getAuthHeaders(),
          params: { limit: 100 },
          timeout: 10000, // 10 second timeout
        });

        console.log('✅ [getDatasets] HTTP Status:', response.status);
        console.log('📦 [getDatasets] Response Type:', typeof response.data);
        console.log('📦 [getDatasets] Response Keys:', Object.keys(response.data || {}));
        console.log('📦 [getDatasets] Raw Response Preview:', JSON.stringify(response.data).substring(0, 200) + '...');

        // Extract array from different response formats
        let datasets: any[] = [];

        if (Array.isArray(response.data)) {
          console.log('✓ [getDatasets] Response is direct array');
          datasets = response.data;
        } else if (response.data && typeof response.data === 'object') {
          console.log('✓ [getDatasets] Response is object, checking nested arrays...');
          
          // FIX: Check for .jobs FIRST (this is what the backend actually returns)
          if (response.data.jobs && Array.isArray(response.data.jobs)) {
            console.log('✓ [getDatasets] Found array in .jobs');
            datasets = response.data.jobs;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            console.log('✓ [getDatasets] Found array in .items');
            datasets = response.data.items;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            console.log('✓ [getDatasets] Found array in .results');
            datasets = response.data.results;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            console.log('✓ [getDatasets] Found array in .data');
            datasets = response.data.data;
          } else if (response.data.datasets && Array.isArray(response.data.datasets)) {
            console.log('✓ [getDatasets] Found array in .datasets');
            datasets = response.data.datasets;
          } else {
            console.warn('⚠️ [getDatasets] No recognized array found in response object');
            console.warn('⚠️ [getDatasets] Available keys:', Object.keys(response.data));
            datasets = [];
          }
        } else {
          console.warn('⚠️ [getDatasets] Unexpected response format');
          datasets = [];
        }

        console.log('📊 [getDatasets] Extracted datasets count:', datasets.length);

        if (datasets.length === 0) {
          console.warn('⚠️ [getDatasets] Endpoint returned empty array, trying next endpoint...');
          continue; // Try next endpoint
        }

        // Normalize all datasets
        const normalizedDatasets = datasets.map((item, index) => {
          console.log(`🔄 [getDatasets] Normalizing dataset ${index + 1}:`, {
            job_id: item.job_id || item.id,
            name: item.datasource_name || item.name,
            columns: (item.column_names || item.columns || []).length,
          });
          return this.normalizeDataset(item);
        });

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ [getDatasets] SUCCESS!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📍 [getDatasets] Working endpoint:', endpoint);
        console.log('📊 [getDatasets] Total datasets:', normalizedDatasets.length);
        console.log('📋 [getDatasets] Dataset IDs:', normalizedDatasets.map(d => d.job_id));
        console.log('📋 [getDatasets] Dataset Names:', normalizedDatasets.map(d => d.datasource_name));
        console.log('═══════════════════════════════════════════════════════\n');

        return normalizedDatasets;

      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const message = error.response?.data?.detail || error.message;

        console.log('❌ [getDatasets] Endpoint failed:', endpoint);
        console.log('❌ [getDatasets] Status:', status);
        console.log('❌ [getDatasets] Message:', message);

        if (status === 404 || status === 400) {
          console.log('⏭️  [getDatasets] Endpoint not found or invalid, trying next...');
          continue; // Try next endpoint
        } else {
          console.error('🔴 [getDatasets] Unexpected error:', error);
          // For non-404 errors, still try next endpoint
          continue;
        }
      }
    }

    // All endpoints failed
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('❌ [getDatasets] ALL ENDPOINTS FAILED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔴 [getDatasets] Tried endpoints:', endpoints);
    console.error('🔴 [getDatasets] Last error:', lastError?.response?.data || lastError?.message);
    console.log('═══════════════════════════════════════════════════════\n');

    return [];
  }

  // GET RULES
  async getRules(jobId: string): Promise<DataQualityRuleResponse[]> {
    console.log('\n📥 [getRules] Fetching rules for job:', jobId);

    try {
      const url = `${API_BASE}/api/v1/rules/dataset/${jobId}`;
      console.log('📍 [getRules] URL:', url);

      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
      });

      console.log('✅ [getRules] HTTP Status:', response.status);
      console.log('📦 [getRules] Rules count:', response.data.length);

      return response.data;
    } catch (error: any) {
      console.error('❌ [getRules] Error:', error.response?.data || error.message);
      console.error('❌ [getRules] Status:', error.response?.status);
      return [];
    }
  }

  // CREATE RULE
  async createRule(ruleData: DataQualityRuleCreate): Promise<DataQualityRuleResponse> {
    console.log('\n📤 [createRule] Creating rule...');
    console.log('📦 [createRule] Input data:', ruleData);

    try {
      // Ensure created_by is set
      if (!ruleData.created_by) {
        ruleData.created_by = this.getCurrentUserEmail();
        console.log('⚠️ [createRule] Auto-set created_by:', ruleData.created_by);
      }

      // Build payload with proper defaults
      const payload: DataQualityRuleCreate = {
        rule_name: ruleData.rule_name.trim(),
        description: ruleData.description?.trim() || null,
        job_id: ruleData.job_id,
        dataset_name: ruleData.dataset_name || null,
        rule_type: ruleData.rule_type,
        scope: ruleData.scope || 'COLUMN',
        column_name: ruleData.column_name?.trim() || null,
        parameters: ruleData.parameters || {},
        severity: ruleData.severity || 'MEDIUM',
        is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
        stop_on_failure: ruleData.stop_on_failure || false,
        created_by: ruleData.created_by,
        tags: ruleData.tags || [],
      };

      console.log('📦 [createRule] Final payload:', JSON.stringify(payload, null, 2));

      const url = `${API_BASE}/api/v1/rules/`;
      console.log('📍 [createRule] URL:', url);

      const response = await axios.post(url, payload, {
        headers: this.getAuthHeaders(),
      });

      console.log('✅ [createRule] Success. Rule ID:', response.data.rule_id);
      console.log('📦 [createRule] Response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('❌ [createRule] Error:', error.response?.data || error.message);
      console.error('❌ [createRule] Status:', error.response?.status);

      if (error.response?.status === 422) {
        console.error('🔴 [createRule] Validation errors:');
        console.error(JSON.stringify(error.response.data.detail, null, 2));
      }

      throw error;
    }
  }

  // DELETE RULE
  async deleteRule(ruleId: string): Promise<void> {
    console.log('\n🗑️ [deleteRule] Deleting rule:', ruleId);

    try {
      const url = `${API_BASE}/api/v1/rules/${ruleId}`;
      console.log('📍 [deleteRule] URL:', url);

      await axios.delete(url, {
        headers: this.getAuthHeaders(),
      });

      console.log('✅ [deleteRule] Success');
    } catch (error: any) {
      console.error('❌ [deleteRule] Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // RUN VALIDATION
  async runValidation(jobId: string): Promise<ValidationReport> {
    console.log('\n▶️ [runValidation] Starting validation for job:', jobId);

    try {
      const url = `${API_BASE}/api/v1/rules/validate/${jobId}`;
      console.log('📍 [runValidation] URL:', url);

      const response = await axios.post(
        url,
        {},
        {
          headers: this.getAuthHeaders(),
          timeout: 120000, // 2 minutes
        }
      );

      console.log('✅ [runValidation] Success');
      console.log('📊 [runValidation] Status:', response.data.overall_status);
      console.log('📊 [runValidation] Quality Score:', response.data.quality_score);
      console.log('📊 [runValidation] Violations:', response.data.total_violations);

      return response.data;
    } catch (error: any) {
      console.error('❌ [runValidation] Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // GET VIOLATIONS
  async getViolations(jobId: string, latestOnly: boolean = false): Promise<any[]> {
    console.log('\n📋 [getViolations] Fetching violations');
    console.log('📍 [getViolations] Job ID:', jobId);
    console.log('📍 [getViolations] Latest only:', latestOnly);

    try {
      const url = `${API_BASE}/api/v1/rules/violations/${jobId}`;
      console.log('📍 [getViolations] URL:', url);

      const response = await axios.get(url, {
        params: { latest_only: latestOnly },
        headers: this.getAuthHeaders(),
      });

      console.log('✅ [getViolations] Success. Count:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [getViolations] Error:', error.response?.data || error.message);
      return [];
    }
  }

  // GET STATS
  async getStats(): Promise<Stats> {
    console.log('\n📊 [getStats] Fetching statistics');

    try {
      const url = `${API_BASE}/api/v1/rules/stats`;
      console.log('📍 [getStats] URL:', url);

      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
      });

      console.log('✅ [getStats] Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [getStats] Error:', error.response?.data || error.message);
      return {
        total_rules: 0,
        active_rules: 0,
        total_violations: 0,
      };
    }
  }
}

export default new RuleService();
