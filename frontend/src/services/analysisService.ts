// src/services/analysisService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ChartDataRequest {
  dataset_id: string;
  x_field: string;
  y_field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  limit?: number;
}

export interface ChartDataResponse {
  success: boolean;
  data: ChartDataPoint[];
  total_points: number;
  x_field: string;
  y_field: string;
  aggregation: string;
}

export interface FieldsResponse {
  dimensions: string[];
  measures: string[];
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  source_type?: string;
  table_name?: string;
  created_at: string;
}

export interface DatasetsResponse {
  datasets: Dataset[];
}

class AnalysisService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Get chart data by aggregating dataset rows - REAL DATA
   */
  async getChartData(request: ChartDataRequest): Promise<ChartDataResponse> {
    try {
      const response = await axios.post<ChartDataResponse>(
        `${API_URL}/api/v1/analytics/chart`,
        request,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch chart data'
      );
    }
  }

  /**
   * Get available dimensions and measures from a dataset - REAL DATA
   */
  async getAvailableFields(datasetId: string): Promise<FieldsResponse> {
    try {
      const response = await axios.get<FieldsResponse>(
        `${API_URL}/api/v1/datasets/${datasetId}/fields`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available fields:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch dataset fields'
      );
    }
  }

  /**
   * Get list of available datasets for analysis - REAL DATA
   */
  async getAvailableDatasets(): Promise<DatasetsResponse> {
    try {
      const response = await axios.get<DatasetsResponse>(
        `${API_URL}/api/v1/datasets`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available datasets:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch datasets'
      );
    }
  }

  /**
   * Get dataset preview (first N rows)
   */
  async getDatasetPreview(datasetId: string, limit: number = 10): Promise<any> {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/datasets/${datasetId}/preview?limit=${limit}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dataset preview:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch dataset preview'
      );
    }
  }

  /**
   * Get dataset columns info
   */
  async getDatasetColumns(datasetId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/datasets/${datasetId}/columns`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dataset columns:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch dataset columns'
      );
    }
  }

  /**
   * Health check for analytics service
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/analytics/health`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error checking analytics health:', error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();
export default analysisService;
