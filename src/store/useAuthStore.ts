/**
 * Auth Store
 * 
 * Global state for authentication with proper session persistence.
 */

import { create } from 'zustand';
import type { User } from '../api/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://trading-agent-engine.sherry-mcadams001.workers.dev';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  setAuth: (user, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  
  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  initAuth: async () => {
    const token = localStorage.getItem('authToken');
    const storedUserStr = localStorage.getItem('user');
    
    if (!token || !storedUserStr) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }
    
    // Validate token with backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          const user: User = {
            id: data.data.id,
            email: data.data.email,
            role: data.data.role,
            kyc_status: data.data.kyc_status,
            referral_code: data.data.referral_code || '',
            created_at: data.data.created_at || 0,
            updated_at: data.data.updated_at || 0,
          };
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      
      // Token invalid - clear auth
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      // Network error - use cached user data (offline support)
      try {
        const user = JSON.parse(storedUserStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));
