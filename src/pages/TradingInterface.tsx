/**
 * Trading Interface
 * 
 * The existing trading interface (from App.tsx)
 */

import { useEffect, useState, useRef } from 'react';
import { Globe, Shield } from 'lucide-react';
import { streamEngine } from '../core/StreamEngine';
import { portfolioManager } from '../core/PortfolioManager';
import { MacroTicker } from '../components/MacroTicker';
import { Watchlist } from '../components/Watchlist';
import { MainChart } from '../components/MainChart';
import { OrderBook } from '../components/OrderBook';
import { BotActivityLog } from '../components/BotActivityLog';
import { LiveTrades } from '../components/LiveTrades';

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
  const sessionTime = useSessionTimer();

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
    <div className="h-screen w-screen overflow-hidden bg-[#0B1015] flex flex-col font-sans select-none">
      {/* MacroTicker - Fixed height top bar */}
      <div className="h-7 flex-shrink-0 z-50 relative border-b border-white/5">
        <MacroTicker />
      </div>

      {/* --- DESKTOP LAYOUT (Hidden on Mobile) --- */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        {/* Header Bar - Orion Command Center */}
        <header className="h-12 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#0B1015] px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Trading /</span>
            <span className="text-xs font-semibold text-white">Terminal</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#00FF9D]">
              {sessionTime} UTC
            </span>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#00FF9D]/10 border border-[#00FF9D]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
              <span className="text-[10px] font-bold text-[#00FF9D] tracking-wider">LIVE</span>
            </div>
          </div>
        </header>


        {/* Main Content Area - Orion Glass Cockpit */}
        <div className="flex-1 flex gap-2 p-2 min-h-0 bg-[#0B1015]">
          {/* Left Panel - Liquidity Sources (Narrower) */}
          <div className="w-[260px] flex-shrink-0 flex flex-col">
            <Watchlist />
          </div>

          {/* Center Area - Chart + Execution Logs (Dominant) */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Chart Area */}
            <div className="flex-1 min-h-0">
              <MainChart />
            </div>

            {/* Bottom Panels - Execution Logic DOMINANT */}
            <div className="h-[220px] flex-shrink-0 grid grid-cols-[2fr_1fr] gap-2">
              <BotActivityLog />
              <LiveTrades />
            </div>
          </div>

          {/* Right Panel - DOM (Narrower/Collapsible) */}
          <div className="w-[200px] flex-shrink-0 flex flex-col">
            <OrderBook />
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT (Visible on Mobile) --- */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 bg-[#0B1015]">
        {/* Mobile Header - Orion Style */}
        <header className="h-12 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#0B1015] px-4 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Terminal</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#00FF9D]/10 border border-[#00FF9D]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00FF9D] tracking-wider">LIVE</span>
          </div>
        </header>

        {/* Mobile Chart Area (Fixed Top 35%) */}
        <div className="h-[35%] flex-shrink-0 border-b border-white/10 bg-[#0B1015] p-1">
          <MainChart />
        </div>

        {/* Mobile Tabs - Orion Institutional Labels */}
        <div className="h-10 flex-shrink-0 flex items-center bg-[#0B1015] border-b border-white/10 overflow-x-auto no-scrollbar">
          {([
            { key: 'WATCH', label: 'SOURCES' },
            { key: 'BOOK', label: 'DOM' },
            { key: 'LOGS', label: 'NEURAL' },
            { key: 'LEDGER', label: 'SETTLE' }
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={`flex-1 min-w-[70px] h-full text-[10px] font-bold tracking-wider uppercase transition-colors ${
                mobileTab === key 
                  ? 'text-[#00FF9D] bg-[#00FF9D]/10 border-b-2 border-[#00FF9D]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mobile Content Area (Dynamic) */}
        <div className="flex-1 min-h-0 relative p-1">
          {mobileTab === 'WATCH' && <Watchlist />}
          {mobileTab === 'BOOK' && <OrderBook />}
          {mobileTab === 'LOGS' && <BotActivityLog />}
          {mobileTab === 'LEDGER' && <LiveTrades />}
        </div>
      </div>

      {/* Status Bar (Shared) */}
      <div className="h-6 flex-shrink-0 bg-orion-bg-secondary border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between px-3 text-[9px] text-orion-slate-dark">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Globe className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">Region:</span>
            <span className="text-orion-slate font-medium">{region}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Shield className="h-2.5 w-2.5 text-orion-cyan" />
            <span className="text-orion-cyan font-medium">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
