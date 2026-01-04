import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, type AdminUser, type AdminUserDetail, type PlatformAnalytics, type PendingWithdrawal } from '../api/admin';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ExternalLink, CheckCircle, Users, Wallet, Settings, 
  LogOut, LayoutDashboard, TrendingUp, TrendingDown, Activity,
  AlertTriangle, Clock, DollarSign, PieChart, RefreshCw,
  Search, ChevronLeft, ChevronRight, Ban, UserCheck, XCircle,
  ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';

// Metric Card Component
const MetricCard = ({ title, value, change, changeType, icon: Icon, color }: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'red' | 'cyan';
}) => {
  const colors = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
  };
  const iconColors = {
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 ${colors[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {change && (
            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              changeType === 'up' ? 'text-green-400' : changeType === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : changeType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
              {change}
            </div>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};

// Activity Item Component
const ActivityItem = ({ tx }: { tx: { type: string; amount: number; user_email?: string; created_at: number; status: string } }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
      tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
      tx.type === 'withdraw' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
    }`}>
      {tx.type === 'deposit' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white truncate">{tx.user_email || 'Unknown'}</p>
      <p className="text-xs text-gray-500">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
    </div>
    <div className="text-right">
      <p className={`text-sm font-mono font-medium ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
      </p>
      <p className="text-xs text-gray-500">{new Date(tx.created_at * 1000).toLocaleTimeString()}</p>
    </div>
  </div>
);

const AdminPanel = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deposits' | 'withdrawals' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewUser, setViewUser] = useState<AdminUserDetail | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Deposits & Withdrawals State
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);

  // Settings State
  const [depositAddress, setDepositAddress] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await adminApi.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const response = await adminApi.getUsers({ page, limit: 20, search: searchQuery, status: statusFilter });
      setUsers(response.data);
      if (response.pagination) {
        setUsersPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  }, [searchQuery, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await fetchAnalytics();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'deposits') {
        const response = await adminApi.getPendingDeposits();
        setPendingDeposits(response.data);
      } else if (activeTab === 'withdrawals') {
        const response = await adminApi.getPendingWithdrawals();
        setPendingWithdrawals(response.data);
      } else if (activeTab === 'settings') {
        const response = await adminApi.getSettings();
        setDepositAddress(response.data.deposit_address_trc20 || '');
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchAnalytics, fetchUsers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSaveSettings = async () => {
    try {
      setProcessing(true);
      await adminApi.updateSetting('deposit_address_trc20', depositAddress);
      alert('Settings saved successfully');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveDeposit = async (txId: number) => {
    if (!confirm('Approve this deposit?')) return;
    try {
      await adminApi.approveDeposit(txId);
      fetchData();
    } catch (error) {
      alert('Failed to approve deposit');
    }
  };

  const handleApproveWithdrawal = async (txId: number) => {
    if (!confirm('Approve this withdrawal?')) return;
    try {
      await adminApi.approveWithdrawal(txId);
      fetchData();
    } catch (error) {
      alert('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (txId: number) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await adminApi.rejectWithdrawal(txId, reason || undefined);
      fetchData();
    } catch (error) {
      alert('Failed to reject withdrawal');
    }
  };

  const handleViewUser = async (userId: number) => {
    try {
      const response = await adminApi.getUserDetails(userId);
      setViewUser(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch user details', error);
    }
  };

  const handleUpdateUserStatus = async (userId: number, status: string) => {
    if (!confirm(`Change user status to ${status}?`)) return;
    try {
      await adminApi.updateUserStatus(userId, status);
      fetchData();
      if (isViewModalOpen) handleViewUser(userId);
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !balanceAmount) return;
    try {
      setProcessing(true);
      await adminApi.addBalance(selectedUser.id, parseFloat(balanceAmount), 'Admin Deposit');
      setIsModalOpen(false);
      setBalanceAmount('');
      fetchData();
    } catch (error) {
      alert('Failed to add balance');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/capwheel/login');
  };

  const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: TrendingUp, badge: pendingDeposits.length },
    { id: 'withdrawals', label: 'Withdrawals', icon: TrendingDown, badge: pendingWithdrawals.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed inset-0 flex bg-[#0a0f1a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#0d1320] border-r border-gray-800/50 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800/50 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-white">CONTROL</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-3 border-t border-gray-800/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#0d1320]/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-white">
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {loading && !analytics && !users.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Total AUM" value={formatCurrency(analytics.platform.totalAUM)} icon={DollarSign} color="cyan" change={`${formatCurrency(analytics.volume.deposits_24h)} today`} changeType="up" />
                    <MetricCard title="Total Users" value={analytics.users.total_users.toLocaleString()} icon={Users} color="blue" change={`+${analytics.users.new_users_24h} today`} changeType="up" />
                    <MetricCard title="Active Stakes" value={formatCurrency(analytics.staking.total_staked)} icon={PieChart} color="purple" change={`${analytics.staking.active_stakes} active`} changeType="neutral" />
                    <MetricCard title="Pending Actions" value={analytics.transactions.pending_transactions} icon={Clock} color="yellow" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Volume Stats */}
                    <Card className="border-gray-800/50 bg-[#0d1320] p-5 col-span-2">
                      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Volume Statistics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
                          <p className="text-xs text-gray-500 uppercase">Total Deposits</p>
                          <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(analytics.volume.total_deposits)}</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
                          <p className="text-xs text-gray-500 uppercase">Total Withdrawals</p>
                          <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(analytics.volume.total_withdrawals)}</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
                          <p className="text-xs text-gray-500 uppercase">Pending Deposits</p>
                          <p className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(analytics.volume.pending_deposits)}</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
                          <p className="text-xs text-gray-500 uppercase">Pending Withdrawals</p>
                          <p className="text-xl font-bold text-orange-400 mt-1">{formatCurrency(analytics.volume.pending_withdrawals)}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="border-gray-800/50 bg-[#0d1320] p-5">
                      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Recent Activity
                      </h3>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {analytics.recentActivity.slice(0, 8).map((tx) => (
                          <ActivityItem key={tx.id} tx={tx} />
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* User Stats */}
                  <Card className="border-gray-800/50 bg-[#0d1320] p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      User Breakdown
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <p className="text-2xl font-bold text-white">{analytics.users.active_users}</p>
                        <p className="text-xs text-gray-500 mt-1">Active</p>
                      </div>
                      <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <p className="text-2xl font-bold text-yellow-400">{analytics.users.pending_users}</p>
                        <p className="text-xs text-gray-500 mt-1">Pending</p>
                      </div>
                      <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <p className="text-2xl font-bold text-red-400">{analytics.users.suspended_users}</p>
                        <p className="text-xs text-gray-500 mt-1">Suspended</p>
                      </div>
                      <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <p className="text-2xl font-bold text-green-400">+{analytics.users.new_users_24h}</p>
                        <p className="text-xs text-gray-500 mt-1">New (24h)</p>
                      </div>
                      <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <p className="text-2xl font-bold text-blue-400">+{analytics.users.new_users_7d}</p>
                        <p className="text-xs text-gray-500 mt-1">New (7d)</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Search & Filter */}
                  <div className="flex gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        className="pl-10 bg-[#0d1320] border-gray-800"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); }}
                      className="px-4 py-2 bg-[#0d1320] border border-gray-800 rounded-lg text-sm text-white"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <Button onClick={() => fetchUsers()} variant="outline" size="md">Search</Button>
                  </div>

                  {/* Users Table */}
                  <Card className="border-gray-800/50 bg-[#0d1320] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                          <tr>
                            <th className="px-5 py-3">User</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Balance</th>
                            <th className="px-5 py-3 text-right">Joined</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-5 py-3">
                                <div className="font-medium text-white">{u.email}</div>
                                <div className="text-xs text-gray-500">ID: {u.id}</div>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  u.account_status === 'active' || u.account_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                  u.account_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {u.account_status || 'active'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-white">${u.balance.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right text-gray-500 text-xs">{new Date(u.created_at * 1000).toLocaleDateString()}</td>
                              <td className="px-5 py-3 text-right space-x-1">
                                <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" onClick={() => handleViewUser(u.id)}>View</Button>
                                <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10" onClick={() => { setSelectedUser(u); setIsModalOpen(true); }}>+$</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800/50 bg-gray-900/30">
                      <p className="text-xs text-gray-500">Showing {users.length} of {usersPagination.total} users</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled={!usersPagination.hasPrev} onClick={() => fetchUsers(usersPagination.page - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-3 py-1 text-sm text-gray-400">Page {usersPagination.page} / {usersPagination.totalPages || 1}</span>
                        <Button size="sm" variant="ghost" disabled={!usersPagination.hasNext} onClick={() => fetchUsers(usersPagination.page + 1)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Deposits Tab */}
              {activeTab === 'deposits' && (
                <Card className="border-gray-800/50 bg-[#0d1320]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">User</th>
                          <th className="px-5 py-3">Amount</th>
                          <th className="px-5 py-3">Tx Hash</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {pendingDeposits.length === 0 ? (
                          <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />No pending deposits</td></tr>
                        ) : pendingDeposits.map((tx) => {
                          const meta = tx.metadata ? JSON.parse(tx.metadata) : {};
                          return (
                            <tr key={tx.id} className="hover:bg-gray-800/30">
                              <td className="px-5 py-3 text-gray-400">{new Date(tx.created_at * 1000).toLocaleString()}</td>
                              <td className="px-5 py-3 text-white">{tx.user_email}</td>
                              <td className="px-5 py-3 font-mono text-green-400">${tx.amount.toLocaleString()}</td>
                              <td className="px-5 py-3">
                                <code className="text-xs bg-black/30 px-2 py-0.5 rounded text-gray-300">{meta.txHash?.slice(0,10)}...{meta.txHash?.slice(-6)}</code>
                                <a href={`https://tronscan.org/#/transaction/${meta.txHash}`} target="_blank" rel="noopener" className="ml-2 text-blue-400"><ExternalLink className="w-3 h-3 inline" /></a>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => handleApproveDeposit(tx.id)}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Withdrawals Tab */}
              {activeTab === 'withdrawals' && (
                <Card className="border-gray-800/50 bg-[#0d1320]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">User</th>
                          <th className="px-5 py-3">Amount</th>
                          <th className="px-5 py-3">User Balance</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {pendingWithdrawals.length === 0 ? (
                          <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />No pending withdrawals</td></tr>
                        ) : pendingWithdrawals.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-800/30">
                            <td className="px-5 py-3 text-gray-400">{new Date(tx.created_at * 1000).toLocaleString()}</td>
                            <td className="px-5 py-3 text-white">{tx.user_email}</td>
                            <td className="px-5 py-3 font-mono text-red-400">${tx.amount.toLocaleString()}</td>
                            <td className="px-5 py-3 font-mono text-gray-400">${tx.user_balance?.toLocaleString() ?? 'N/A'}</td>
                            <td className="px-5 py-3 text-right space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => handleApproveWithdrawal(tx.id)}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                              <Button size="sm" variant="danger" onClick={() => handleRejectWithdrawal(tx.id)}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl">
                  <Card className="border-gray-800/50 bg-[#0d1320] p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Deposit Configuration</h3>
                      <p className="text-sm text-gray-400 mt-1">Manage wallet addresses for deposits.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">TRC20 Deposit Address</label>
                      <Input value={depositAddress} onChange={(e) => setDepositAddress(e.target.value)} placeholder="TRC20 wallet address" className="bg-gray-900 border-gray-800" />
                    </div>
                    <Button onClick={handleSaveSettings} disabled={processing} className="bg-cyan-600 hover:bg-cyan-500">
                      {processing ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* View User Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <Card className="border-gray-700 bg-[#0d1320] p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{viewUser.user.email}</h3>
                    <p className="text-sm text-gray-400">ID: {viewUser.user.id} • Status: {viewUser.user.account_status || 'active'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-green-400" onClick={() => handleUpdateUserStatus(viewUser.user.id, 'active')}><UserCheck className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-yellow-400" onClick={() => handleUpdateUserStatus(viewUser.user.id, 'suspended')}><AlertTriangle className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleUpdateUserStatus(viewUser.user.id, 'banned')}><Ban className="w-4 h-4" /></Button>
                    <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white ml-2"><X className="w-6 h-6" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800"><div className="text-xs text-gray-500 uppercase">Available</div><div className="text-2xl font-mono text-green-400 mt-1">${viewUser.wallet.available_balance.toLocaleString()}</div></div>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800"><div className="text-xs text-gray-500 uppercase">Locked</div><div className="text-2xl font-mono text-yellow-400 mt-1">${viewUser.wallet.locked_balance.toLocaleString()}</div></div>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800"><div className="text-xs text-gray-500 uppercase">Pending</div><div className="text-2xl font-mono text-orange-400 mt-1">${viewUser.wallet.pending_balance.toLocaleString()}</div></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Transactions</h4>
                  <div className="overflow-x-auto border border-gray-800 rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-xs font-semibold sticky top-0">
                        <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right">Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {viewUser.transactions.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No transactions</td></tr>
                        ) : viewUser.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-800/30">
                            <td className="px-4 py-2 text-gray-400 text-xs">{new Date(tx.created_at * 1000).toLocaleString()}</td>
                            <td className="px-4 py-2"><span className={`uppercase text-xs font-bold ${tx.type === 'deposit' ? 'text-green-400' : tx.type === 'withdraw' ? 'text-red-400' : 'text-blue-400'}`}>{tx.type}</span></td>
                            <td className="px-4 py-2 text-white text-xs">{tx.description}</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{tx.type === 'withdraw' ? '-' : '+'}${tx.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right"><span className={`px-2 py-0.5 rounded text-xs ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{tx.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Balance Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card className="border-gray-700 bg-[#0d1320] p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Add Funds</h3>
                <p className="text-sm text-gray-400">Adding to <span className="text-white">{selectedUser.email}</span></p>
                <form onSubmit={handleAddBalance} className="space-y-4">
                  <Input type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" autoFocus className="bg-gray-900 border-gray-800 text-lg" />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={processing}>Cancel</Button>
                    <Button type="submit" disabled={processing || !balanceAmount} className="bg-green-600 hover:bg-green-500">{processing ? 'Processing...' : 'Confirm'}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
