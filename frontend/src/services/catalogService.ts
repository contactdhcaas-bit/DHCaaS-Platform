/**
 * Data Catalog Service
 * API calls for dataset catalog and smart tagging
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ColumnMetadata {
  name: string;
  data_type: string;
  sample_values?: any[];
  null_count?: number;
  unique_count?: number;
  tags?: string[];
}

export interface CatalogItem {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  tags: string[];
  columns: ColumnMetadata[];
  row_count: number;
  quality_score?: number;
  owner_id?: string;
  scan_id?: string;
  created_at: string;
  updated_at: string;
  last_scanned_at?: string;
  total_incidents?: number;
  critical_incidents?: number;
}

export interface CatalogListResponse {
  total: number;
  items: CatalogItem[];
  page: number;
  page_size: number;
}

export interface CatalogStats {
  total_datasets: number;
  average_quality_score: number;
  total_rows: number;
  unique_tags: number;
}

export interface PopularTag {
  tag: string;
  count: number;
}

class CatalogService {
  async getCatalogItems(
    page: number = 1,
    pageSize: number = 20,
    tags?: string,
    search?: string
  ): Promise<CatalogListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (tags) {
      params.append('tags', tags);
    }

    if (search) {
      params.append('search', search);
    }

    const response = await axios.get<CatalogListResponse>(
      `${API_BASE_URL}/api/v1/catalog?${params.toString()}`
    );

    return response.data;
  }

  async getCatalogItem(itemId: string): Promise<CatalogItem> {
    const response = await axios.get<CatalogItem>(
      `${API_BASE_URL}/api/v1/catalog/${itemId}`
    );

    return response.data;
  }

  async getCatalogStats(): Promise<CatalogStats> {
    const response = await axios.get<CatalogStats>(
      `${API_BASE_URL}/api/v1/catalog/stats/summary`
    );

    return response.data;
  }

  async getPopularTags(limit: number = 10): Promise<PopularTag[]> {
    const response = await axios.get<PopularTag[]>(
      `${API_BASE_URL}/api/v1/catalog/tags/popular?limit=${limit}`
    );

    return response.data;
  }

  async deleteCatalogItem(itemId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/v1/catalog/${itemId}`);
  }
}

export const catalogService = new CatalogService();
