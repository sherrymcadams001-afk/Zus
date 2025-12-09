import React, { useEffect, useState } from 'react';
import { adminApi, type AdminUser, type AdminUserDetail } from '../api/admin';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ExternalLink, CheckCircle, Users, Wallet, Settings, 
  LogOut, LayoutDashboard, Search, Bell, ChevronRight 
} from 'lucide-react';

const AdminPanel = () => {
  const { user, clearAuth, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'settings'>('users');
  
  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewUser, setViewUser] = useState<AdminUserDetail | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Deposits State
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [depositAddress, setDepositAddress] = useState('');

  useEffect(() => {
    // Wait for auth to finish loading before checking role
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      navigate('/capwheel/dashboard');
      return;
    }
    fetchData();
  }, [user, authLoading, navigate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await adminApi.getUsers();
        setUsers(response.data);
      } else if (activeTab === 'deposits') {
        const response = await adminApi.getPendingDeposits();
        setPendingDeposits(response.data);
      } else if (activeTab === 'settings') {
        const response = await adminApi.getSettings();
        setSettings(response.data);
        setDepositAddress(response.data.deposit_address_trc20 || '');
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setProcessing(true);
      await adminApi.updateSetting('deposit_address_trc20', depositAddress);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveDeposit = async (txId: number) => {
    if (!confirm('Are you sure you want to approve this deposit?')) return;
    
    try {
      await adminApi.approveDeposit(txId);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Failed to approve deposit', error);
      alert('Failed to approve deposit');
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

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !balanceAmount) return;

    try {
      setProcessing(true);
      await adminApi.addBalance(selectedUser.id, parseFloat(balanceAmount), 'Admin Deposit');
      setIsModalOpen(false);
      setBalanceAmount('');
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Failed to add balance', error);
      alert('Failed to add balance');
    } finally {
      setProcessing(false);
    }
  };

  const openBalanceModal = (user: AdminUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/capwheel/login');
  };

  if (loading && !users.length && !pendingDeposits.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-gray-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e293b] border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-wide text-white">ADMIN<span className="text-blue-500">PANEL</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            User Management
          </button>
          
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'deposits' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Wallet className="w-5 h-5" />
            Deposits
            {pendingDeposits.length > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingDeposits.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            System Settings
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-gray-500 truncate">admin@zus.com</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
        {/* Header */}
        <header className="h-16 bg-[#1e293b]/50 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'deposits' && 'Pending Deposits'}
              {activeTab === 'settings' && 'System Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={fetchData} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Refresh Data
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'users' && (
              <Card className="border-gray-800 bg-[#1e293b] shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Balance</th>
                        <th className="px-6 py-4 text-right">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{u.email}</div>
                            <div className="text-xs text-gray-500">ID: {u.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.kyc_status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                              {u.kyc_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-white font-medium">
                            ${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500">
                            {new Date(u.created_at * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              onClick={() => handleViewUser(u.id)}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              onClick={() => openBalanceModal(u)}
                            >
                              Add Funds
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === 'deposits' && (
              <Card className="border-gray-800 bg-[#1e293b] shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Tx Hash</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {pendingDeposits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle className="w-8 h-8 text-gray-600" />
                              <p>No pending deposits</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pendingDeposits.map((tx) => {
                          const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
                          return (
                            <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4 text-gray-400">
                                {new Date(tx.created_at * 1000).toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-white">{tx.user_email}</div>
                                <div className="text-xs text-gray-500">ID: {tx.user_id}</div>
                              </td>
                              <td className="px-6 py-4 font-mono text-green-400 font-medium">
                                ${tx.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-black/30 px-2 py-1 rounded text-gray-300 font-mono border border-gray-700">
                                    {metadata.txHash?.substring(0, 10)}...{metadata.txHash?.substring(metadata.txHash.length - 6)}
                                  </code>
                                  <a 
                                    href={`https://tronscan.org/#/transaction/${metadata.txHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">{metadata.network}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 text-white hover:bg-green-500 border-none"
                                  onClick={() => handleApproveDeposit(tx.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <Card className="border-gray-800 bg-[#1e293b] p-6 space-y-6 shadow-xl">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Deposit Configuration</h3>
                    <p className="text-sm text-gray-400">Manage wallet addresses and deposit settings.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">TRC20 Deposit Address</label>
                      <div className="flex gap-2">
                        <Input 
                          value={depositAddress}
                          onChange={(e) => setDepositAddress(e.target.value)}
                          placeholder="Enter TRC20 wallet address"
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        This address will be displayed to users in the deposit modal. Ensure it is a valid TRC20 address.
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-800">
                      <Button 
                        onClick={handleSaveSettings}
                        disabled={processing}
                        className="bg-blue-600 text-white hover:bg-blue-500 w-full sm:w-auto"
                      >
                        {processing ? 'Saving Changes...' : 'Save Configuration'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="border-gray-700 bg-[#1e293b] p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">User Details</h3>
                    <p className="text-sm text-gray-400">ID: {viewUser.user.id} • {viewUser.user.email}</p>
                  </div>
                  <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Available Balance</div>
                    <div className="text-2xl font-mono text-green-400 mt-1">${viewUser.wallet.available_balance.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Locked Balance</div>
                    <div className="text-2xl font-mono text-yellow-400 mt-1">${viewUser.wallet.locked_balance.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Total Equity</div>
                    <div className="text-2xl font-mono text-white mt-1">${(viewUser.wallet.available_balance + viewUser.wallet.locked_balance).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Transaction History</h4>
                  <div className="overflow-x-auto border border-gray-700 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700 bg-gray-800/30">
                        {viewUser.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No transactions found</td>
                          </tr>
                        ) : (
                          viewUser.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-700/30 transition-colors">
                              <td className="px-4 py-3 text-gray-400">
                                {new Date(tx.created_at * 1000).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`uppercase text-xs font-bold ${
                                  tx.type === 'deposit' ? 'text-green-400' : 
                                  tx.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white">{tx.description}</td>
                              <td className="px-4 py-3 text-right font-mono">
                                {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tx.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                  tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-red-500/10 text-red-400'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="border-gray-700 bg-[#1e293b] p-6 space-y-4 shadow-2xl">
                <h3 className="text-xl font-bold text-white">Add Funds</h3>
                <p className="text-sm text-gray-400">
                  Adding balance to <span className="text-white font-medium">{selectedUser.email}</span>
                </p>
                
                <form onSubmit={handleAddBalance} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Amount (USD)</label>
                    <Input 
                      type="number" 
                      value={balanceAmount} 
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      autoFocus
                      className="bg-gray-900 border-gray-700 text-white text-lg"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsModalOpen(false)}
                      disabled={processing}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={processing || !balanceAmount}
                      className="bg-green-600 text-white hover:bg-green-500"
                    >
                      {processing ? 'Processing...' : 'Confirm Deposit'}
                    </Button>
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
