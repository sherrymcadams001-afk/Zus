/**
 * CapWheel Dashboard Component
 * 
 * Main enterprise dashboard layout combining all CapWheel components
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CapWheelHeader } from './CapWheelHeader';
import { ExecutiveSummary } from './ExecutiveSummary';
import { RWAHedgePanel } from './RWAHedgePanel';
import { CapWheelChart } from './CapWheelChart';
import { EnterpriseActiveLogs } from './EnterpriseActiveLogs';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

export const CapWheelDashboard = () => {
  const setWalletBalance = usePortfolioStore((state) => state.setWalletBalance);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Fetch wallet balance from backend
        const response = await apiClient.get('/api/wallet');
        if (response.data.status === 'success') {
          setWalletBalance(response.data.data.available_balance);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        // Fallback to default/simulated balance if fetch fails or user not logged in
      }
    };

    if (user) {
      fetchBalance();
    }
  }, [setWalletBalance, user]);

  return (
    <div className="min-h-screen bg-capwheel-navy">
      {/* Header */}
      <CapWheelHeader />

      {/* Main Content */}
      <div className="max-w-[2000px] mx-auto p-6 space-y-6">
        {/* Executive Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ExecutiveSummary />
        </motion.div>

        {/* Primary Layout - Chart and RWA Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trading Chart - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <CapWheelChart />
          </div>

          {/* RWA Hedge Panel - Takes 1 column on XL screens */}
          <div className="xl:col-span-1">
            <RWAHedgePanel />
          </div>
        </div>

        {/* Execution Logs */}
        <EnterpriseActiveLogs />

        {/* Footer Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center py-8 border-t border-capwheel-border-subtle"
        >
          <p className="text-xs text-gray-600">
            CapWheel Enterprise Platform • Powered by{' '}
            <span className="text-orion-cyan font-semibold">Orion</span>
          </p>
          <p className="text-xs text-gray-700 mt-1 italic">
            "Crypto volatility isn't risk—it's fuel. RWA isn't future—it's the hedge."
          </p>
        </motion.div>
      </div>
    </div>
  );
};
