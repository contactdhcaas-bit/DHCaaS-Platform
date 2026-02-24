// src/api/axios.ts
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dhcaas_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached to request:', config.url);
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401/403 errors (expired/invalid token)
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔓 Token expired or invalid - redirecting to login');
      
      // Clear auth data
      localStorage.removeItem('dhcaas_token');
      localStorage.removeItem('dhcaas_user');
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
