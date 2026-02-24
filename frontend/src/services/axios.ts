// src/services/axios.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached to request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.config?.url, error.response?.status);
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized - Clearing token');
      localStorage.removeItem('access_token');
      // Don't redirect here - let AuthContext handle it
    }
    
    return Promise.reject(error);
  }
);

export default api;
