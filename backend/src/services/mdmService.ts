/**
 * MDM Golden Record Service
 * Handles Master Data Management API calls
 */

import apiClient from './api';

export interface SourceRecord {
  source_system: string;
  source_id: string;
  data: Record<string, any>;
  last_updated: string;
  quality_score: number;
}

export interface GoldenRecord {
  id: string;
  entity_type: string;
  golden_data: Record<string, any>;
  confidence_score: number;
  field_confidence: Record<string, number>;
  source_records: SourceRecord[];
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MDMStats {
  total_golden_records: number;
  total_source_records: number;
  average_confidence: number;
  records_by_entity_type: Record<string, number>;
}

/**
 * Get all Golden Records with pagination
 */
export const getGoldenRecords = async (
  skip: number = 0,
  limit: number = 50
): Promise<{ items: GoldenRecord[]; total: number }> => {
  const response = await apiClient.get('/mdm/golden-records', {
    params: { skip, limit }
  });
  return response.data;
};

/**
 * Get Golden Record details by ID
 */
export const getGoldenRecordDetails = async (id: string): Promise<GoldenRecord> => {
  const response = await apiClient.get(`/mdm/golden-record/${id}`);
  return response.data;
};

/**
 * Create a new Golden Record
 */
export const createGoldenRecord = async (
  entityType: string,
  sourceRecords: SourceRecord[]
): Promise<GoldenRecord> => {
  const response = await apiClient.post('/mdm/golden-record', {
    entity_type: entityType,
    source_records: sourceRecords
  });
  return response.data;
};

/**
 * Create demo Golden Record for testing
 */
export const createDemoRecord = async (): Promise<GoldenRecord> => {
  const response = await apiClient.post('/mdm/demo/create-sample-golden-record');
  return response.data;
};

/**
 * Get MDM system statistics
 */
export const getMDMStats = async (): Promise<MDMStats> => {
  const response = await apiClient.get('/mdm/stats');
  return response.data;
};
