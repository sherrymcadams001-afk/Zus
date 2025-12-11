/**
 * Auth API
 * 
 * Authentication endpoints (register, login, logout).
 */

import { apiClient } from './client';

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  kyc_status: 'pending' | 'approved' | 'rejected';
  referral_code: string;
  created_at: number;
  updated_at: number;
}

export interface AuthResponse {
  status: 'success' | 'error';
  data?: {
    user: User;
    token: string;
    waitlisted?: boolean;
  };
  error?: string;
}

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (email: string, password: string, referralCode?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      referralCode,
    });
    return response.data;
  },

  /**
   * Login
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user
   */
  me: async (): Promise<{ status: string; data: User }> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
};
