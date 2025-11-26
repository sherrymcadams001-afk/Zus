import { useEffect } from 'react';
import { Activity, Zap, Radio } from 'lucide-react';
import { streamEngine } from './core/StreamEngine';
import { useMarketStore } from './store/useMarketStore';
import { Watchlist } from './components/Watchlist';
import { MainChart } from './components/MainChart';
import { OrderBook } from './components/OrderBook';
import { BotActivityLog } from './components/BotActivityLog';
import { FundsOverview } from './components/FundsOverview';
import { LiveTrades } from './components/LiveTrades';

function App() {
  const { tickerConnected, klineConnected, tickers } = useMarketStore();

  useEffect(() => {
    // Start the stream engine
    streamEngine.start();

    // Cleanup on unmount
    return () => {
      streamEngine.stop();
    };
  }, []);

  return (
    <div className="grid h-screen grid-cols-12 grid-rows-[48px_1fr_192px] gap-1 bg-orion-bg p-1">
      {/* Header - col-span-12 h-12 */}
      <header className="col-span-12 flex items-center justify-between rounded border border-white/5 bg-orion-panel px-4">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-orion-neon-cyan" />
          <h1 className="text-sm font-bold tracking-wider text-orion-neon-cyan">
            ORION
          </h1>
          <span className="text-[9px] uppercase tracking-widest text-slate-600">
            Trading Interface
          </span>
        </div>

        <div className="flex items-center gap-6 text-[10px]">
          {/* Ticker Status */}
          <div className="flex items-center gap-2">
            <Radio className={`h-3 w-3 ${tickerConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}`} />
            <span className="text-slate-500">Ticker</span>
            <span className={tickerConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}>
              {tickerConnected ? 'LIVE' : 'OFF'}
            </span>
          </div>

          {/* Kline Status */}
          <div className="flex items-center gap-2">
            <Activity className={`h-3 w-3 ${klineConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}`} />
            <span className="text-slate-500">Kline</span>
            <span className={klineConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}>
              {klineConnected ? 'LIVE' : 'OFF'}
            </span>
          </div>

          {/* Pairs Count */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Pairs</span>
            <span className="tabular-nums text-white">
              {tickers.size > 0 ? tickers.size : '—'}
            </span>
          </div>
        </div>
      </header>

      {/* Left Sidebar - Watchlist - col-span-2 */}
      <aside className="col-span-2 overflow-hidden">
        <Watchlist />
      </aside>

      {/* Center - Main Chart - col-span-8 */}
      <main className="col-span-8 overflow-hidden">
        <MainChart />
      </main>

      {/* Right Sidebar - Order Book - col-span-2 */}
      <aside className="col-span-2 overflow-hidden">
        <OrderBook />
      </aside>

      {/* Bottom Console - col-span-12 h-48 grid grid-cols-3 */}
      <div className="col-span-12 grid grid-cols-3 gap-1">
        {/* Bot Activity Log */}
        <div className="overflow-hidden">
          <BotActivityLog />
        </div>

        {/* Funds Overview */}
        <div className="overflow-hidden">
          <FundsOverview />
        </div>

        {/* Live Trades */}
        <div className="overflow-hidden">
          <LiveTrades />
        </div>
      </div>
    </div>
  );
}

export default App;
