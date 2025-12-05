/**
 * Auth Store
 * 
 * Global state for authentication.
 */

import { create } from 'zustand';
import type { User } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => void;
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
  
  initAuth: () => {
    const token = localStorage.getItem('authToken');
    const storedUserStr = localStorage.getItem('user');
    
    if (token && storedUserStr) {
      try {
        const user = JSON.parse(storedUserStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
