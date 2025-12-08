/**
 * Trading Interface
 * 
 * The existing trading interface (from App.tsx)
 */

import { useEffect, useState, useRef } from 'react';
import { Activity, Zap, Radio, TrendingUp, TrendingDown, Globe, Shield, Clock } from 'lucide-react';
import { streamEngine } from '../core/StreamEngine';
import { portfolioManager } from '../core/PortfolioManager';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useSellFlashEffect } from '../hooks/useSellFlashEffect';
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
  const { tickerConnected, tickers } = useMarketStore();
  const { sessionPnL } = usePortfolioStore();
  const [region, setRegion] = useState<'Global' | 'US'>('Global');
  const [mobileTab, setMobileTab] = useState<MobileTab>('LOGS');
  const sellFlashActive = useSellFlashEffect();
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
    <div className="h-screen w-screen overflow-hidden bg-[#0F172A] flex flex-col font-sans select-none">
      {/* MacroTicker - Fixed height top bar */}
      <div className="h-7 flex-shrink-0 z-50 relative border-b border-white/5">
        <MacroTicker />
      </div>

      {/* --- DESKTOP LAYOUT (Hidden on Mobile) --- */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        {/* Header Bar - Orion Command Center */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur-xl px-4 shadow-lg z-40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-widest text-white leading-none">ORION <span className="text-emerald-400">NEURAL</span></h1>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 leading-none mt-1">Autonomous Execution Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Session Alpha - Orion Style */}
            <div className="flex items-center gap-6 border-r border-white/10 pr-6">
              <div className="text-right">
                <div className="text-[9px] uppercase text-slate-500 font-medium tracking-wider">Session Alpha Generated</div>
                <div className={`flex items-center justify-end gap-1.5 text-xl font-bold tabular-nums tracking-tight transition-colors duration-150 ${
                  sellFlashActive ? 'text-slate-400' : (sessionPnL >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-400')
                }`}>
                  {sessionPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {sessionPnL >= 0 ? '+' : '-'}${Math.abs(sessionPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase text-slate-500 font-medium tracking-wider">Uptime</div>
                <div className="flex items-center justify-end gap-1.5 text-sm font-mono text-slate-300">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {sessionTime}
                </div>
              </div>
            </div>

            {/* Status Indicators - Orion Style */}
            <div className="flex items-center gap-4 text-[10px]">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[8px]">Link Status</span>
                <div className="flex items-center gap-1.5">
                  <Radio className={`h-3 w-3 ${tickerConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                  <span className={`font-bold ${tickerConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {tickerConnected ? 'LOW LATENCY' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[8px]">Sources</span>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-slate-500" />
                  <span className="tabular-nums text-white font-bold">{tickers.size > 0 ? tickers.size : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Orion Glass Cockpit */}
        <div className="flex-1 flex gap-2 p-2 min-h-0 bg-[#0F172A]">
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
      <div className="flex md:hidden flex-col flex-1 min-h-0 bg-[#0F172A]">
        {/* Mobile Header - Orion Style */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur-xl px-4 z-40">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-bold tracking-widest text-white leading-none">ORION <span className="text-emerald-400">NEURAL</span></h1>
              <span className="text-[8px] uppercase tracking-widest text-slate-500 leading-none mt-0.5">Engine</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-[8px] uppercase text-slate-500 font-medium tracking-wider">Session Alpha</div>
            <div className={`text-sm font-bold tabular-nums tracking-tight leading-none transition-colors duration-150 ${
              sellFlashActive ? 'text-slate-400' : (sessionPnL >= 0 ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'text-slate-400')
            }`}>
              {sessionPnL >= 0 ? '+' : '-'}${Math.abs(sessionPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </header>

        {/* Mobile Chart Area (Fixed Top 35%) */}
        <div className="h-[35%] flex-shrink-0 border-b border-white/10 bg-[#0F172A] p-1">
          <MainChart />
        </div>

        {/* Mobile Tabs - Orion Institutional Labels */}
        <div className="h-10 flex-shrink-0 flex items-center bg-slate-900/50 border-b border-white/10 overflow-x-auto no-scrollbar">
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
                  ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400' 
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
