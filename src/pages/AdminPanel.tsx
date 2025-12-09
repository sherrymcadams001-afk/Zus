import React, { useEffect, useState } from 'react';
import { adminApi, type AdminUser } from '../api/admin';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
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
      fetchUsers(); // Refresh list
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

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading admin panel...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Admin Control Center</h1>
        <Button onClick={fetchUsers} variant="outline" size="sm">Refresh</Button>
      </div>

      <Card className="overflow-hidden border-gray-800 bg-[#0B1015]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs">
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
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{u.email}</div>
                    <div className="text-xs text-gray-500">ID: {u.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.kyc_status === 'approved' ? 'bg-[#00FF9D]/20 text-[#00FF9D]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {u.kyc_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[#00FF9D]">
                    ${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {new Date(u.created_at * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-[#00FF9D] hover:text-[#00FF9D] hover:bg-[#00FF9D]/10"
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
              <Card className="border-gray-700 bg-[#12181F] p-6 space-y-4">
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
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsModalOpen(false)}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={processing || !balanceAmount}
                      className="bg-[#00FF9D] text-black hover:bg-[#00E88A]"
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
