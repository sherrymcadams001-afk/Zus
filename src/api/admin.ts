import { apiClient } from './client';

export interface AdminUser {
  id: number;
  email: string;
  role: string;
  created_at: number;
  kyc_status: string;
  balance: number;
  last_login: number | null;
}

export interface AdminUserDetail {
  user: AdminUser;
  wallet: {
    available_balance: number;
    locked_balance: number;
    pending_balance: number;
    currency: string;
  };
  transactions: {
    id: number;
    type: string;
    amount: number;
    status: string;
    description: string;
    created_at: number;
  }[];
}

export const adminApi = {
  getUsers: async () => {
    const response = await apiClient.get<{ status: string; data: AdminUser[] }>('/api/admin/users');
    return response.data;
  },
  
  getUserDetails: async (id: number) => {
    const response = await apiClient.get<{ status: string; data: AdminUserDetail }>(`/api/admin/users/${id}`);
    return response.data;
  },
  
  addBalance: async (userId: number, amount: number, description?: string) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/balance`, { amount, description });
    return response.data;
  }
};
