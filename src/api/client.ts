/**
 * API Client
 * 
 * Axios instance with interceptors for authentication and error handling.
 */

import axios from 'axios';

// API base URL - configure based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://trading-agent-engine.sherry-mcadams001.workers.dev';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear auth and redirect if not already on login page
      // and if the request was to a protected endpoint (not auth/me validation)
      const isAuthValidation = error.config?.url?.includes('/api/auth/me');
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (!isAuthValidation && !isLoginPage) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/capwheel/login';
      }
    }
    return Promise.reject(error);
  }
);
