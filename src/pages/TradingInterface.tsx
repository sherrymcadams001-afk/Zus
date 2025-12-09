/**
 * Trading Interface
 * 
 * The existing trading interface (from App.tsx)
 */

import { useEffect, useState, useRef } from 'react';
import { Globe, Shield, Menu, Bell, Settings } from 'lucide-react';
import { streamEngine } from '../core/StreamEngine';
import { portfolioManager } from '../core/PortfolioManager';
import { MacroTicker } from '../components/MacroTicker';
import { Watchlist } from '../components/Watchlist';
import { MainChart } from '../components/MainChart';
import { OrderBook } from '../components/OrderBook';
import { BotActivityLog } from '../components/BotActivityLog';
import { LiveTrades } from '../components/LiveTrades';
import { OrionSidebar } from '../components/capwheel/OrionSidebar';
import { MobileNavDrawer, SwipeEdgeDetector } from '../components/mobile/MobileNavDrawer';
import { MobileBottomNav } from '../components/mobile/MobileBottomNav';

// Orion Enterprise Session Timer Hook
function useSessionTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

type MobileTab = 'WATCH' | 'BOOK' | 'LOGS' | 'LEDGER';

export default function TradingInterface() {
  const [region, setRegion] = useState<'Global' | 'US'>('Global');
  const [mobileTab, setMobileTab] = useState<MobileTab>('LOGS');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const sessionTime = useSessionTimer();

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Start the stream engine (with auto geo-failover)
    streamEngine.start().then(() => {
      // Initialize chart after engine is ready (and region probed)
      streamEngine.subscribeToChart('BTCUSDT');
    });
    
    // Start Portfolio Manager (Global Data Script)
    portfolioManager.start();
    
    // Check region periodically
    const checkRegion = () => {
      const config = streamEngine.getConfig();
      setRegion(config.useUSEndpoint ? 'US' : 'Global');
    };
    
    const interval = setInterval(checkRegion, 2000);
    checkRegion();

    // Cleanup on unmount
    return () => {
      streamEngine.stop();
      portfolioManager.stop();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden font-sans select-none">
      {/* Swipe Edge Detector for mobile */}
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header Bar - Unified with Dashboard */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-slate-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">Trading /</span>
            <span className="text-xs font-semibold text-white">Agent</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#00FF9D] hidden sm:inline">
              {time.toLocaleTimeString('en-US', { hour12: false })} UTC
            </span>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#00FF9D]/10 border border-[#00FF9D]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
              <span className="text-[10px] font-bold text-[#00FF9D] tracking-wider">LIVE</span>
            </div>
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors hidden sm:block">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MacroTicker - Enterprise ticker bar */}
        <div className="h-7 flex-shrink-0 z-40 relative border-b border-white/5 hidden lg:block">
          <MacroTicker />
        </div>

        {/* --- DESKTOP LAYOUT (Hidden on Mobile) --- */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          {/* Main Content Area - Orion Glass Cockpit */}
          <div className="flex-1 flex gap-3 p-3 min-h-0 bg-[#0B1015]">
            {/* Left Panel - Liquidity Sources */}
            <div className="w-[240px] flex-shrink-0 flex flex-col">
              <Watchlist />
            </div>

            {/* Center Area - Chart + Execution Logs */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Chart Area */}
              <div className="flex-1 min-h-0">
                <MainChart />
              </div>

              {/* Bottom Panels - Execution Logic */}
              <div className="h-[200px] flex-shrink-0 grid grid-cols-[2fr_1fr] gap-3">
                <BotActivityLog />
                <LiveTrades />
              </div>
            </div>

            {/* Right Panel - DOM */}
            <div className="w-[200px] flex-shrink-0 flex flex-col">
              <OrderBook />
            </div>
          </div>
        </div>

        {/* --- MOBILE LAYOUT (Visible on Mobile) --- */}
        <div className="flex lg:hidden flex-col flex-1 min-h-0 bg-[#0B1015] overflow-y-auto overflow-x-hidden pb-20">
          {/* Mobile Chart Area */}
          <div className="h-[280px] flex-shrink-0 border-b border-white/5 bg-[#0B1015] p-2">
            <MainChart />
          </div>

          {/* Mobile Tabs - Clear Enterprise Labels */}
          <div className="h-10 flex-shrink-0 flex items-center bg-[#0B1015] border-b border-white/5">
            {([
              { key: 'WATCH', label: 'Markets' },
              { key: 'BOOK', label: 'Book' },
              { key: 'LOGS', label: 'Agent Logs' },
              { key: 'LEDGER', label: 'Trades' }
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className={`flex-1 min-w-0 h-full text-[10px] font-semibold tracking-wide transition-colors truncate px-1 ${
                  mobileTab === key 
                    ? 'text-[#00FF9D] bg-[#00FF9D]/10 border-b-2 border-[#00FF9D]' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile Content Area */}
          <div className="flex-1 min-h-[300px] relative p-2">
            {mobileTab === 'WATCH' && <Watchlist />}
            {mobileTab === 'BOOK' && <OrderBook />}
            {mobileTab === 'LOGS' && <BotActivityLog />}
            {mobileTab === 'LEDGER' && <LiveTrades />}
          </div>
        </div>

        {/* Status Bar */}
        <div className="hidden lg:flex h-6 flex-shrink-0 bg-[#0B1015] border-t border-white/5 items-center justify-between px-4 text-[9px] text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Globe className="h-2.5 w-2.5" />
              <span>Region:</span>
              <span className="text-slate-400 font-medium">{region}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Session:</span>
              <span className="text-slate-400 font-mono">{sessionTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-2.5 w-2.5 text-[#00FF9D]" />
            <span className="text-[#00FF9D] font-medium">ONLINE</span>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
