/**
 * CapWheel Dashboard Component - ORION Design
 * 
 * NO-SCROLL single viewport cockpit layout
 * - Sidebar navigation (Command Center) with Tier Display
 * - 4 metric cards (AUM, Yield, Partners, Vesting)
 * - Wealth chart + Dynamic Data Matrix side by side
 * - Transaction Ledger + Strategy Performance side by side
 * - Boost Capital button prominently placed
 */

import { useEffect, useState } from 'react';
import { OrionSidebar } from './OrionSidebar';
import { OrionMetricsGrid } from './OrionMetricsGrid';
import { OrionWealthChart } from './OrionWealthChart';
import { OrionTransactionLedger } from './OrionTransactionLedger';
import { OrionWealthProjection } from './OrionWealthProjection';
import { OrionStrategyPerformance } from './OrionStrategyPerformance';
import { OrionTierDisplay } from './OrionTierDisplay';
import { BoostCapitalButton } from './BoostCapital';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Settings, User } from 'lucide-react';

// Compact Header Bar
const DashboardHeader = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Overview /</span>
          <span className="text-xs font-semibold text-white">Dashboard</span>
        </div>
        {/* Boost Capital Button in Header */}
        <BoostCapitalButton variant="compact" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[#00FF9D]">
          {time.toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-black" />
        </div>
      </div>
    </header>
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
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>

      {/* Main Content - NO SCROLL */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <DashboardHeader />

        {/* Dashboard Grid - Fills viewport */}
        <main className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
          {/* Row 1: 4 Metric Cards */}
          <div className="flex-shrink-0">
            <OrionMetricsGrid />
          </div>

          {/* Row 2: Chart (2/5) + Data Matrix (2/5) + Tier Display (1/5) */}
          <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">
            <div className="col-span-2 min-h-0">
              <OrionWealthChart />
            </div>
            <div className="col-span-2 min-h-0">
              <OrionWealthProjection />
            </div>
            <div className="col-span-1 min-h-0 overflow-auto">
              <OrionTierDisplay />
            </div>
          </div>

          {/* Row 3: Ledger (1/2) + Strategy (1/2) */}
          <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
            <div className="min-h-0 overflow-hidden">
              <OrionTransactionLedger />
            </div>
            <div className="min-h-0 overflow-hidden">
              <OrionStrategyPerformance />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
