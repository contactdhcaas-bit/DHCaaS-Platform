/**
 * Cloud Connectors Service
 * Handles AWS S3, Azure Blob, and GCP Storage connectivity
 */


import api from './api';


export interface AWSCredentials {
  aws_access_key_id: string;
  aws_secret_access_key: string;
  region_name: string;
}


export interface AWSRegion {
  code: string;
  name: string;
}


export interface S3Bucket {
  name: string;
  creation_date: string | null;
  region: string;
}


export interface S3File {
  key: string;
  size: number;
  size_mb: number;
  last_modified: string | null;
  etag: string;
  storage_class: string;
}


export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  region?: string;
  error_code?: string;
}


export interface ListBucketsResponse {
  success: boolean;
  message: string;
  bucket_count: number;
  region: string;
  buckets: S3Bucket[];
}


export interface ListFilesResponse {
  success: boolean;
  message: string;
  bucket_name: string;
  prefix: string;
  file_count: number;
  is_truncated: boolean;
  files: S3File[];
}


export interface ListRegionsResponse {
  success: boolean;
  message: string;
  region_count: number;
  regions: AWSRegion[];
}


export interface S3ScanRequest {
  bucket_name: string;
  file_key: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  region_name: string;
  scan_name?: string;
}


export interface S3ScanResponse {
  success: boolean;
  message: string;
  scan_id?: string;
  job_id?: string;
  file_info?: {
    bucket: string;
    key: string;
    size: number;
    rows: number;
    columns: number;
    quality_score: number;
  };
}


/**
 * List available AWS regions
 */
export const listRegions = async (): Promise<ListRegionsResponse> => {
  const response = await api.get('/connectors/s3/regions');
  return response.data;
};


/**
 * Test AWS S3 connection with provided credentials
 */
export const testConnection = async (
  credentials: AWSCredentials
): Promise<ConnectionTestResponse> => {
  const response = await api.post('/connectors/s3/test', credentials);
  return response.data;
};


/**
 * List all S3 buckets accessible with provided credentials
 */
export const listBuckets = async (
  credentials: AWSCredentials
): Promise<ListBucketsResponse> => {
  const response = await api.post('/connectors/s3/buckets', credentials);
  return response.data;
};


/**
 * List files in a specific S3 bucket
 */
export const listFiles = async (
  credentials: AWSCredentials,
  bucketName: string,
  prefix: string = '',
  maxKeys: number = 1000
): Promise<ListFilesResponse> => {
  const response = await api.post('/connectors/s3/files', {
    ...credentials,
    bucket_name: bucketName,
    prefix,
    max_keys: maxKeys,
  });
  return response.data;
};


/**
 * Scan a file directly from S3 without downloading
 */
export const scanS3File = async (
  request: S3ScanRequest
): Promise<S3ScanResponse> => {
  const response = await api.post('/scan/s3', request);
  return response.data;
};


const connectorService = {
  listRegions,
  testConnection,
  listBuckets,
  listFiles,
  scanS3File,
};


export default connectorService;
