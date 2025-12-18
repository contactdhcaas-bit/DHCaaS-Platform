import { apiClient } from './api';
import { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/register', data);
  },

  async logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    return apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
  },

  async resetPassword(email: string): Promise<void> {
    return apiClient.post<void>('/auth/reset-password', { email });
  },
};
