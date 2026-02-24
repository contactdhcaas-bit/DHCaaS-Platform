// src/services/reportsService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface ReportConfig {
  title: string;
  description?: string;
  dataset_id: string;
  chart_type: string;
  x_axis: string;
  y_axis: string;
  aggregation: string;
  color_by?: string;
}

export interface SavedReport extends ReportConfig {
  id: string;
  created_at: string;
  updated_at?: string;
}

export const reportsService = {
  // Create a new report
  createReport: async (report: ReportConfig): Promise<SavedReport> => {
    const response = await axios.post(`${API_BASE_URL}/reports`, report);
    return response.data;
  },

  // Get all reports
  getAllReports: async (): Promise<SavedReport[]> => {
    const response = await axios.get(`${API_BASE_URL}/reports`);
    return response.data;
  },

  // Get report by ID
  getReportById: async (reportId: string): Promise<SavedReport> => {
    const response = await axios.get(`${API_BASE_URL}/reports/${reportId}`);
    return response.data;
  },

  // Get reports by dataset ID
  getReportsByDataset: async (datasetId: string): Promise<SavedReport[]> => {
    const response = await axios.get(`${API_BASE_URL}/reports/dataset/${datasetId}`);
    return response.data;
  },

  // Delete a report
  deleteReport: async (reportId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/reports/${reportId}`);
  }
};
