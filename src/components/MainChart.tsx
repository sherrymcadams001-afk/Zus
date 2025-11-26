import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type Time, CandlestickSeries } from 'lightweight-charts';
import { useMarketStore, type Candle } from '../store/useMarketStore';
import { streamEngine } from '../core/StreamEngine';
import { BarChart3 } from 'lucide-react';

const CHART_UP_COLOR = '#00C087';
const CHART_DOWN_COLOR = '#F6465D';
const CHART_BG_COLOR = '#0B0E11';
const CHART_TEXT_COLOR = '#848E9C';

function candleToChartData(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.time / 1000) as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function formatSymbolDisplay(symbol: string): string {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol;
}

export function MainChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastCandleTimeRef = useRef<number | null>(null);
  const lastLoadedSymbolRef = useRef<string | null>(null);

  const activeSymbol = useMarketStore((state) => state.activeSymbol);
  const activeCandle = useMarketStore((state) => state.activeCandle);
  const historicalCandles = useMarketStore((state) => state.historicalCandles);
  const klineConnected = useMarketStore((state) => state.klineConnected);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_BG_COLOR },
        textColor: CHART_TEXT_COLOR,
        fontFamily: 'JetBrains Mono',
      },
      grid: {
        vertLines: { color: '#161A1E' },
        horzLines: { color: '#161A1E' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          width: 1,
          color: '#2E3238',
          style: 3, // LineStyle.Dashed
          labelBackgroundColor: '#2E3238',
        },
        horzLine: {
          width: 1,
          color: '#2E3238',
          style: 3, // LineStyle.Dashed
          labelBackgroundColor: '#2E3238',
        },
      },
      rightPriceScale: {
        borderColor: '#161A1E',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#161A1E',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 6,
        minBarSpacing: 2,
        fixLeftEdge: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_UP_COLOR,
      downColor: CHART_DOWN_COLOR,
      borderUpColor: CHART_UP_COLOR,
      borderDownColor: CHART_DOWN_COLOR,
      wickUpColor: CHART_UP_COLOR,
      wickDownColor: CHART_DOWN_COLOR,
      borderVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          chart.applyOptions({ width: clientWidth, height: clientHeight });
        }
      }
    };

    // Use ResizeObserver for more robust resizing (especially on mobile/flex layouts)
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // Initial sizing
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    streamEngine.subscribeToChart(activeSymbol);
    lastCandleTimeRef.current = null;
    lastLoadedSymbolRef.current = null;
  }, [activeSymbol]);

  useEffect(() => {
    if (!seriesRef.current || historicalCandles.length === 0) return;
    const firstCandle = historicalCandles[0];
    if (firstCandle && firstCandle.symbol === activeSymbol) {
      // Always update data if symbol matches, to handle re-fetches
      const chartData = historicalCandles.map(candleToChartData);
      seriesRef.current.setData(chartData);
      
      if (lastLoadedSymbolRef.current !== activeSymbol) {
        lastLoadedSymbolRef.current = activeSymbol;
        if (chartRef.current) chartRef.current.timeScale().fitContent();
      }
    }
  }, [historicalCandles, activeSymbol]);

  useEffect(() => {
    if (seriesRef.current && lastLoadedSymbolRef.current && lastLoadedSymbolRef.current !== activeSymbol) {
      seriesRef.current.setData([]);
      lastLoadedSymbolRef.current = null;
      lastCandleTimeRef.current = null;
    }
  }, [activeSymbol]);

  useEffect(() => {
    if (!activeCandle || !seriesRef.current) return;
    if (activeCandle.symbol !== activeSymbol) return;
    const chartData = candleToChartData(activeCandle);
    seriesRef.current.update(chartData);
    if (lastCandleTimeRef.current !== activeCandle.time) {
      lastCandleTimeRef.current = activeCandle.time;
    }
  }, [activeCandle, activeSymbol]);

  return (
    <div className="h-full flex flex-col rounded border border-white/5 bg-orion-panel overflow-hidden relative group">
      {/* Chart Toolbar */}
      <div className="h-8 flex-shrink-0 flex items-center justify-between border-b border-white/5 px-3 bg-[#0B0E11]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-orion-neon-cyan" />
            <span className="text-xs font-bold text-white tracking-wide">{formatSymbolDisplay(activeSymbol)}</span>
          </div>
          
          <div className="h-3 w-px bg-white/10" />
          
          <div className="flex items-center gap-1">
            {['1m', '5m', '15m', '1h', '4h', 'D'].map((tf) => (
              <button 
                key={tf}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors ${
                  tf === '1m' 
                    ? 'bg-white/10 text-orion-neon-cyan' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-white/10" />

          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <button className="hover:text-slate-300 transition-colors">Indicators</button>
            <button className="hover:text-slate-300 transition-colors">Display</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${klineConnected ? 'bg-orion-neon-green shadow-[0_0_4px_rgba(0,255,157,0.5)]' : 'bg-orion-neon-red'}`} />
            <span className="text-[9px] font-medium text-slate-500">{klineConnected ? 'Realtime' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-0 relative">
        <div ref={containerRef} className="absolute inset-0" />
        
        {/* Loading / No Data State */}
        {historicalCandles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0E11]/80 backdrop-blur-sm z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="h-4 w-4 border-2 border-orion-neon-cyan border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-slate-400">Loading Market Data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
