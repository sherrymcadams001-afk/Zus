import { apiClient } from './client';

export interface AdminUser {
  id: number;
  email: string;
  role: string;
  created_at: number;
  kyc_status: string;
  account_status?: string;
  balance: number;
  last_login: number | null;
}

export interface AdminUserDetail {
  user: AdminUser & { referral_code?: string };
  wallet: {
    available_balance: number;
    locked_balance: number;
    pending_balance: number;
    currency: string;
  };
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: number;
  user_email?: string;
}

export interface PendingWithdrawal extends Transaction {
  user_id: number;
  user_email: string;
  user_balance: number;
}

export interface PlatformAnalytics {
  users: {
    total_users: number;
    new_users_24h: number;
    new_users_7d: number;
    active_users: number;
    pending_users: number;
    suspended_users: number;
  };
  volume: {
    total_deposits: number;
    total_withdrawals: number;
    deposits_24h: number;
    withdrawals_24h: number;
    pending_deposits: number;
    pending_withdrawals: number;
  };
  transactions: {
    total_transactions: number;
    transactions_24h: number;
    pending_transactions: number;
  };
  staking: {
    total_staked: number;
    active_stakes: number;
    staked_24h: number;
  };
  platform: {
    totalAUM: number;
    availableBalance: number;
    lockedBalance: number;
    pendingBalance: number;
  };
  recentActivity: Transaction[];
  generatedAt: number;
}

export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const adminApi = {
  // Analytics
  getAnalytics: async () => {
    const response = await apiClient.get<{ status: string; data: PlatformAnalytics }>('/api/admin/analytics');
    return response.data;
  },

  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.role) searchParams.set('role', params.role);
    
    const query = searchParams.toString();
    const url = `/api/admin/users${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<AdminUser>>(url);
    return response.data;
  },
  
  getUserDetails: async (id: number) => {
    const response = await apiClient.get<{ status: string; data: AdminUserDetail }>(`/api/admin/users/${id}`);
    return response.data;
  },
  
  addBalance: async (userId: number, amount: number, description?: string) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/balance`, { amount, description });
    return response.data;
  },

  updateUserStatus: async (userId: number, status: string, reason?: string) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/status`, { status, reason });
    return response.data;
  },

  // Pending Users
  getPendingUsers: async () => {
    const response = await apiClient.get<{ status: string; data: AdminUser[] }>('/api/admin/users/pending');
    return response.data;
  },

  approveUser: async (userId: number) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/approve`);
    return response.data;
  },

  // Deposits - All deposits history (paginated)
  getDeposits: async (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    
    const query = searchParams.toString();
    const url = `/api/admin/deposits${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<Transaction & { user_email: string }>>(url);
    return response.data;
  },

  // Legacy - pending deposits only
  getPendingDeposits: async () => {
    const response = await apiClient.get<{ status: string; data: Transaction[] }>('/api/admin/deposits/pending');
    return response.data;
  },

  approveDeposit: async (txId: number) => {
    const response = await apiClient.post(`/api/admin/deposits/${txId}/approve`);
    return response.data;
  },

  // Withdrawals
  getPendingWithdrawals: async () => {
    const response = await apiClient.get<{ status: string; data: PendingWithdrawal[] }>('/api/admin/withdrawals/pending');
    return response.data;
  },

  approveWithdrawal: async (txId: number) => {
    const response = await apiClient.post(`/api/admin/withdrawals/${txId}/approve`);
    return response.data;
  },

  rejectWithdrawal: async (txId: number, reason?: string) => {
    const response = await apiClient.post(`/api/admin/withdrawals/${txId}/reject`, { reason });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await apiClient.get<{ status: string; data: Record<string, string> }>('/api/admin/settings');
    return response.data;
  },

  updateSetting: async (key: string, value: string) => {
    const response = await apiClient.post('/api/admin/settings', { key, value });
    return response.data;
  }
};
