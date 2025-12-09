/**
 * CapWheel Dashboard Component - ORION Design
 * 
 * NO-SCROLL single viewport cockpit layout
 * - Sidebar navigation (Command Center)
 * - 4 metric cards (AUM, Yield, Partners, Vesting)
 * - Wealth chart + Dynamic Data Matrix side by side
 * - Transaction Ledger + Strategy Performance side by side
 */

import { useEffect, useState } from 'react';
import { OrionSidebar } from './OrionSidebar';
import { OrionMetricsGrid } from './OrionMetricsGrid';
import { OrionWealthChart } from './OrionWealthChart';
import { OrionWealthProjection } from './OrionWealthProjection';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { MobileNavDrawer } from '../mobile/MobileNavDrawer';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { InviteCodeGenerator } from '../mobile/InviteCodeGenerator';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { CollapsibleCard } from '../mobile/CollapsibleCard';

// Compact Header Bar
const DashboardHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1.5 text-slate-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">Overview /</span>
        <span className="text-xs font-semibold text-white">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[#00FF9D] hidden sm:inline">
          {time.toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors hidden sm:block">
          <Settings className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center sm:hidden">
          <User className="w-3.5 h-3.5 text-black" />
        </div>
      </div>
    </header>
  );
};

export const CapWheelDashboard = () => {
  const setWalletBalance = usePortfolioStore((state) => state.setWalletBalance);
  const user = useAuthStore((state) => state.user);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

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
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>

      {/* Main Content - NO SCROLL on Desktop, Scroll on Mobile */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <DashboardHeader onMenuClick={() => setIsMobileNavOpen(true)} />

        {/* Dashboard Grid */}
        <main className={`flex-1 p-4 flex flex-col gap-3 ${isMobile ? 'overflow-y-auto pb-24' : 'overflow-hidden'}`}>
          {/* Row 1: Metrics */}
          <div className="flex-shrink-0">
            <OrionMetricsGrid />
          </div>

          {/* Mobile: Invite Code */}
          {isMobile && (
            <div className="flex-shrink-0 mb-3">
              <InviteCodeGenerator />
            </div>
          )}

          {/* Row 2: Chart + Projection */}
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <CollapsibleCard title="Wealth Performance" defaultOpen={true}>
                <div className="h-[300px]">
                  <OrionWealthChart />
                </div>
              </CollapsibleCard>
              
              <CollapsibleCard title="Projections">
                <div className="h-[300px]">
                  <OrionWealthProjection />
                </div>
              </CollapsibleCard>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
              <div className="col-span-2 min-h-0">
                <OrionWealthChart />
              </div>
              <div className="col-span-1 min-h-0 flex flex-col gap-3">
                <div className="flex-1 min-h-0">
                  <OrionWealthProjection />
                </div>
                <div className="flex-shrink-0">
                  <InviteCodeGenerator />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
