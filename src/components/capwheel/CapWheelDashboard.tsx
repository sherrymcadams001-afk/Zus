/**
 * CapWheel Dashboard Component - ORION Design
 * 
 * Enterprise "Cockpit" layout with:
 * - Command Center sidebar navigation
 * - Bento Grid metric cards
 * - Wealth Performance chart
 * - Transaction Ledger
 * - Wealth Projection Engine
 * - Strategy Performance module
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { OrionSidebar } from './OrionSidebar';
import { OrionMetricsGrid } from './OrionMetricsGrid';
import { OrionWealthChart } from './OrionWealthChart';
import { OrionTransactionLedger } from './OrionTransactionLedger';
import { OrionWealthProjection } from './OrionWealthProjection';
import { OrionStrategyPerformance } from './OrionStrategyPerformance';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, User, Settings } from 'lucide-react';

// Top Header Bar
const DashboardHeader = () => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#0B1015]">
      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Overview</span>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-semibold text-white">Dashboard</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* DateTime */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{formattedDate}</p>
          <p className="text-xs font-mono text-[#00FF9D]">{formattedTime} UTC</p>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#00FF9D] rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2 pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
        </button>
      </div>
    </header>
  );
};

// Bottom Navigation Bar (Mobile-friendly)
const BottomNav = () => {
  const navItems = [
    { icon: '📊', label: 'DASHBOARD', active: true },
    { icon: '📈', label: 'ANALYTICS', active: false },
    { icon: '💼', label: 'PORTFOLIO', active: false },
    { icon: '⚡', label: 'TRADING', active: false },
    { icon: '⚙️', label: 'SETTINGS', active: false },
    { icon: '👤', label: 'USER PROFILE', active: false },
  ];

  return (
    <nav className="h-12 flex items-center justify-center gap-6 border-t border-white/5 bg-[#0B1015] px-4">
      {navItems.map((item, i) => (
        <button
          key={i}
          className={`flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-colors ${
            item.active
              ? 'text-[#00FF9D] border-b-2 border-[#00FF9D]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span>{item.icon}</span>
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export const CapWheelDashboard = () => {
  const setWalletBalance = usePortfolioStore((state) => state.setWalletBalance);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await apiClient.get('/api/wallet');
        if (response.data.status === 'success') {
          setWalletBalance(response.data.data.available_balance);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };

    if (user) {
      fetchBalance();
    }
  }, [setWalletBalance, user]);

  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <DashboardHeader />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metrics Grid - AUM, Net Yield, Partner Volume, Vesting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrionMetricsGrid />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Wealth Performance Chart - 2 cols */}
            <div className="xl:col-span-2">
              <OrionWealthChart />
            </div>

            {/* Wealth Projection Engine - 1 col */}
            <div className="xl:col-span-1">
              <OrionWealthProjection />
            </div>
          </div>

          {/* Transaction Ledger */}
          <OrionTransactionLedger />

          {/* Strategy Performance */}
          <OrionStrategyPerformance />

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center py-6 border-t border-white/5"
          >
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">
              CapWheel Brokerage Collective • Institutional-Grade Capital Intelligence
            </p>
          </motion.div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};
