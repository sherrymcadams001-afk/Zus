import { useEffect, useState } from 'react';
import { Activity, Zap, Radio, TrendingUp, TrendingDown, Globe, Shield } from 'lucide-react';
import { streamEngine } from './core/StreamEngine';
import { portfolioManager } from './core/PortfolioManager';
import { useMarketStore } from './store/useMarketStore';
import { usePortfolioStore } from './store/usePortfolioStore';
import { MacroTicker } from './components/MacroTicker';
import { Watchlist } from './components/Watchlist';
import { MainChart } from './components/MainChart';
import { OrderBook } from './components/OrderBook';
import { BotActivityLog } from './components/BotActivityLog';
import { LiveTrades } from './components/LiveTrades';
import { TreasuryReactor } from './components/TreasuryReactor';

type MobileTab = 'WATCH' | 'BOOK' | 'LOGS' | 'LEDGER' | 'FUNDS';

function App() {
  const { tickerConnected, tickers } = useMarketStore();
  const { sessionPnL } = usePortfolioStore();
  const [region, setRegion] = useState<'Global' | 'US'>('Global');
  const [mobileTab, setMobileTab] = useState<MobileTab>('LOGS');

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
    <div className="h-screen w-screen overflow-hidden bg-orion-bg flex flex-col font-sans select-none">
      {/* MacroTicker - Fixed height top bar */}
      <div className="h-7 flex-shrink-0 z-50 relative border-b border-white/5">
        <MacroTicker />
      </div>

      {/* --- DESKTOP LAYOUT (Hidden on Mobile) --- */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        {/* Header Bar */}
        <header className="h-12 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#0B0E11] px-4 shadow-sm z-40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded bg-orion-neon-cyan/10 border border-orion-neon-cyan/20">
              <Zap className="h-5 w-5 text-orion-neon-cyan" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-widest text-white leading-none">ORION <span className="text-orion-neon-cyan">AI</span></h1>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 leading-none mt-1">The consensus mechanism</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Scoreboard */}
            <div className="flex items-center gap-6 border-r border-white/10 pr-6">
              <div className="text-right">
                <div className="text-[9px] uppercase text-slate-500 font-medium tracking-wider">Wallet Balance</div>
                <div className="text-lg font-bold tabular-nums text-white tracking-tight">
                  ${usePortfolioStore((state) => state.walletBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase text-slate-500 font-medium tracking-wider">Session P&L</div>
                <div className={`flex items-center justify-end gap-1 text-lg font-bold tabular-nums tracking-tight ${
                  sessionPnL >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'
                }`}>
                  {sessionPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4 text-[10px]">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[8px]">Data Stream</span>
                <div className="flex items-center gap-1.5">
                  <Radio className={`h-3 w-3 ${tickerConnected ? 'text-orion-neon-green animate-pulse' : 'text-orion-neon-red'}`} />
                  <span className={`font-bold ${tickerConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}`}>
                    {tickerConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span className="text-slate-500 uppercase tracking-wider text-[8px]">Active Pairs</span>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-slate-400" />
                  <span className="tabular-nums text-white font-bold">{tickers.size > 0 ? tickers.size : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-1 p-1 min-h-0 bg-[#050607]">
          {/* Left Panel - Watchlist */}
          <div className="w-[280px] flex-shrink-0 flex flex-col">
            <Watchlist />
          </div>

          {/* Center Area - Chart + Bottom Panels */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            {/* Chart Area */}
            <div className="flex-1 min-h-0">
              <MainChart />
            </div>

            {/* Bottom Panels - Fixed height */}
            <div className="h-[180px] flex-shrink-0 grid grid-cols-3 gap-1">
              <BotActivityLog />
              <LiveTrades />
              <TreasuryReactor />
            </div>
          </div>

          {/* Right Panel - Order Book */}
          <div className="w-[260px] flex-shrink-0 flex flex-col">
            <OrderBook />
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT (Visible on Mobile) --- */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 bg-[#050607]">
        {/* Mobile Header */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#0B0E11] px-4 z-40">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded bg-orion-neon-cyan/10 border border-orion-neon-cyan/20">
              <Zap className="h-4 w-4 text-orion-neon-cyan" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-bold tracking-widest text-white leading-none">ORION</h1>
              <span className="text-[8px] uppercase tracking-widest text-slate-500 leading-none mt-0.5">Terminal</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-[8px] uppercase text-slate-500 font-medium tracking-wider">Balance</div>
            <div className="text-sm font-bold tabular-nums text-white tracking-tight leading-none">
              ${usePortfolioStore((state) => state.walletBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </header>

        {/* Mobile Chart Area (Fixed Top 35%) */}
        <div className="h-[35%] flex-shrink-0 border-b border-white/5 bg-[#0B0E11]">
          <MainChart />
        </div>

        {/* Mobile Tabs */}
        <div className="h-10 flex-shrink-0 flex items-center bg-[#0B0E11] border-b border-white/5 overflow-x-auto no-scrollbar">
          {(['WATCH', 'BOOK', 'LOGS', 'LEDGER', 'FUNDS'] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 min-w-[70px] h-full text-[10px] font-bold tracking-wider uppercase transition-colors ${
                mobileTab === tab 
                  ? 'text-orion-neon-cyan bg-orion-neon-cyan/5 border-b-2 border-orion-neon-cyan' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mobile Content Area (Dynamic) */}
        <div className="flex-1 min-h-0 relative">
          {mobileTab === 'WATCH' && <Watchlist />}
          {mobileTab === 'BOOK' && <OrderBook />}
          {mobileTab === 'LOGS' && <BotActivityLog />}
          {mobileTab === 'LEDGER' && <LiveTrades />}
          {mobileTab === 'FUNDS' && <TreasuryReactor />}
        </div>
      </div>

      {/* Status Bar (Shared) */}
      <div className="h-6 flex-shrink-0 bg-[#0B0E11] border-t border-white/5 flex items-center justify-between px-3 text-[9px] text-slate-500">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Globe className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">Region:</span>
            <span className="text-slate-300 font-medium">{region}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Shield className="h-2.5 w-2.5 text-orion-neon-green" />
            <span className="text-orion-neon-green font-medium">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

