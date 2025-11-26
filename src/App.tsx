import { useEffect, useState } from 'react';
import { Activity, Zap, Radio, TrendingUp, TrendingDown, Globe, Server, Shield } from 'lucide-react';
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

function App() {
  const { tickerConnected, klineConnected, tickers } = useMarketStore();
  const { totalEquity, sessionPnL } = usePortfolioStore();
  const [region, setRegion] = useState<'Global' | 'US'>('Global');

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
      <div className="h-7 flex-shrink-0 z-50 relative">
        <MacroTicker />
      </div>

      {/* Header Bar - Fixed height */}
      <header className="h-12 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#0B0E11] px-4 shadow-sm z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded bg-orion-neon-cyan/10 border border-orion-neon-cyan/20">
            <Zap className="h-5 w-5 text-orion-neon-cyan" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white leading-none">ORION <span className="text-orion-neon-cyan">TERMINAL</span></h1>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 leading-none mt-1">Autonomous Trading System</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Scoreboard */}
          <div className="flex items-center gap-6 border-r border-white/10 pr-6">
            <div className="text-right">
              <div className="text-[9px] uppercase text-slate-500 font-medium tracking-wider">Total Equity</div>
              <div className="text-lg font-bold tabular-nums text-white tracking-tight">
                ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {/* Main Content Area - Takes remaining space */}
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

      {/* Status Bar */}
      <div className="h-6 flex-shrink-0 bg-[#0B0E11] border-t border-white/5 flex items-center justify-between px-3 text-[9px] text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            <span>Region: <span className="text-slate-300 font-medium">{region}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="h-3 w-3" />
            <span>Latency: <span className="text-orion-neon-green font-medium">24ms</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-orion-neon-green" />
            <span>System: <span className="text-orion-neon-green font-medium">OPERATIONAL</span></span>
          </div>
          <span>v2.4.0-beta</span>
        </div>
      </div>
    </div>
  );
}

export default App;

