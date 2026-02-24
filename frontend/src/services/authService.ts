// src/services/authService.ts
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { access_token } = response.data;
    
    // Store token
    localStorage.setItem('access_token', access_token);
    
    return response.data;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('access_token');
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export const authService = new AuthService();
export default authService;
