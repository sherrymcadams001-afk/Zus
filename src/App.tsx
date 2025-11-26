import { useEffect } from 'react';
import { streamEngine } from './core/StreamEngine';
import { useMarketStore } from './store/useMarketStore';
import { Watchlist } from './components/Watchlist';
import { MainChart } from './components/MainChart';

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
    <div className="grid h-screen grid-cols-[280px_1fr] grid-rows-[56px_1fr] bg-orion-bg">
      {/* Header */}
      <header className="col-span-2 flex items-center justify-between border-b border-gray-800 bg-[#0B0E11] px-6">
        <h1 className="text-xl font-bold text-orion-neon-cyan">Project ORION</h1>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${tickerConnected ? 'bg-orion-neon-green' : 'bg-orion-neon-red'}`}
            />
            <span className="text-gray-400">Ticker</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${klineConnected ? 'bg-orion-neon-green' : 'bg-orion-neon-red'}`}
            />
            <span className="text-gray-400">Kline</span>
          </div>
          <span className="text-gray-500">
            {tickers.size > 0 ? `${tickers.size} pairs` : 'Loading...'}
          </span>
        </div>
      </header>

      {/* Left Sidebar - Watchlist */}
      <aside className="overflow-hidden border-r border-gray-800 p-2">
        <Watchlist />
      </aside>

      {/* Center - Main Chart */}
      <main className="overflow-hidden p-2">
        <MainChart />
      </main>
    </div>
  );
}

export default App;
