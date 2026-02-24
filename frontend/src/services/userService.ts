// src/services/userService.ts
import api from '../api/axios';

// ===== INTERFACES =====
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  company_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active?: boolean;
  is_verified?: boolean;
  company_id?: string | null;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  role?: 'admin' | 'editor' | 'viewer';
  is_active?: boolean;
  is_verified?: boolean;
  password?: string;
  company_id?: string | null;
}

// ===== USER SERVICE =====
class UserService {
  /**
   * Get list of users with pagination and filters
   */
  async getUsers(
    page: number = 1,
    page_size: number = 20,
    search?: string,
    role?: string,
    is_active?: boolean
  ): Promise<UserListResponse> {
    try {
      const params: any = { page, page_size };
      
      if (search) params.search = search;
      if (role) params.role = role;
      if (is_active !== undefined) params.is_active = is_active;

      const response = await api.get<UserListResponse>('/users/', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Create new user (Admin only)
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await api.post<User>('/users/', userData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await api.put<User>(`/users/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (Admin only)
   * @param hardDelete - If true, permanently delete. If false, soft delete (deactivate)
   */
  async deleteUser(userId: string, hardDelete: boolean = false): Promise<any> {
    try {
      const response = await api.delete(`/users/${userId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Activate user (Admin only)
   */
  async activateUser(userId: string): Promise<User> {
    try {
      const response = await api.post<User>(`/users/${userId}/activate`);
      return response.data;
    } catch (error: any) {
      console.error('Error activating user:', error);
      throw error;
    }
  }

  /**
   * Get role badge color
   */
  getRoleBadgeColor(role: string): string {
    const colors: { [key: string]: string } = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      editor: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return colors[role] || colors.viewer;
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(isActive: boolean): string {
    return isActive
      ? 'bg-green-500/20 text-green-400 border-green-500/50'
      : 'bg-red-500/20 text-red-400 border-red-500/50';
  }
}

export default new UserService();
