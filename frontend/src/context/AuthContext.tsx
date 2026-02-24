// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// ===== TYPES =====
interface User {
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// ===== CONTEXT =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== CUSTOM HOOK (MUST BE BEFORE PROVIDER) =====
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ===== PROVIDER =====
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('dhcaas_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token by calling /api/v1/auth/me
          const response = await axios.get('http://localhost:8000/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          // Update user with fresh data
          setUser(response.data);
          localStorage.setItem('dhcaas_user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Token validation failed:', error);
          // Clear invalid token
          localStorage.removeItem('access_token');
          localStorage.removeItem('dhcaas_user');
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    loadAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<LoginResponse>(
        'http://localhost:8000/api/v1/auth/login',
        { email, password }
      );

      const { access_token, user: userData } = response.data;

      // Save to state
      setToken(access_token);
      setUser(userData);

      // Persist to localStorage (CRITICAL: use 'access_token' key)
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('dhcaas_user', JSON.stringify(userData));

      console.log('✅ Login successful:', userData.email);
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('dhcaas_user');
    console.log('✅ Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== EXPORT DEFAULT =====
export default AuthContext;
