import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type LineData, type Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { useMarketStore, type Candle } from '../store/useMarketStore';
import { streamEngine } from '../core/StreamEngine';
import { BarChart3, Settings2 } from 'lucide-react';

// Orion Enterprise "Dark Pool" Colors
const CHART_UP_COLOR = '#10B981';    // Orion Emerald - Neon Glow
const CHART_DOWN_COLOR = '#64748B';  // Muted Slate - Calm (no panic)
const CHART_BG_COLOR = '#0F172A';    // Deep Slate Blue
const CHART_TEXT_COLOR = '#94A3B8';  // Slate 400
const CHART_GRID_COLOR = 'rgba(255,255,255,0.03)'; // Almost invisible grid

function candleToChartData(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.time / 1000) as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function candleToVolumeData(candle: Candle): HistogramData<Time> {
  return {
    time: (candle.time / 1000) as Time,
    value: candle.volume,
    color: candle.close >= candle.open ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
  };
}

function calculateSMA(data: Candle[], count: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  for (let i = count - 1; i < data.length; i++) {
    const slice = data.slice(i - count + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val.close, 0);
    const avg = sum / count;
    result.push({
      time: (data[i].time / 1000) as Time,
      value: avg,
    });
  }
  return result;
}

function formatSymbolDisplay(symbol: string): string {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol;
}

export function MainChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastCandleTimeRef = useRef<number | null>(null);
  const lastLoadedSymbolRef = useRef<string | null>(null);

  const [showIndicators, setShowIndicators] = useState(false);

  const activeSymbol = useMarketStore((state) => state.activeSymbol);
  const activeInterval = useMarketStore((state) => state.activeInterval);
  const activeCandle = useMarketStore((state) => state.activeCandle);
  const historicalCandles = useMarketStore((state) => state.historicalCandles);
  const klineConnected = useMarketStore((state) => state.klineConnected);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_BG_COLOR },
        textColor: CHART_TEXT_COLOR,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: CHART_GRID_COLOR },
        horzLines: { color: CHART_GRID_COLOR },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          width: 1,
          color: 'rgba(255,255,255,0.15)',
          style: 3, // LineStyle.Dashed
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          width: 1,
          color: 'rgba(255,255,255,0.15)',
          style: 3, // LineStyle.Dashed
          labelBackgroundColor: '#1E293B',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Make room for volume
        },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay on main chart
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // Volume takes bottom 20%
        bottom: 0,
      },
    });

    const smaSeries = chart.addSeries(LineSeries, {
      color: '#10B981',
      lineWidth: 1,
      crosshairMarkerVisible: false,
      visible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    smaSeriesRef.current = smaSeries;

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
      volumeSeriesRef.current = null;
      smaSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    streamEngine.subscribeToChart(activeSymbol);
    lastCandleTimeRef.current = null;
    lastLoadedSymbolRef.current = null;
  }, [activeSymbol]);

  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current || historicalCandles.length === 0) return;
    const firstCandle = historicalCandles[0];
    if (firstCandle && firstCandle.symbol === activeSymbol) {
      // Always update data if symbol matches, to handle re-fetches
      const chartData = historicalCandles.map(candleToChartData);
      const volumeData = historicalCandles.map(candleToVolumeData);
      const smaData = calculateSMA(historicalCandles, 20);
      
      seriesRef.current.setData(chartData);
      volumeSeriesRef.current.setData(volumeData);
      if (smaSeriesRef.current) smaSeriesRef.current.setData(smaData);
      
      if (lastLoadedSymbolRef.current !== activeSymbol) {
        lastLoadedSymbolRef.current = activeSymbol;
        if (chartRef.current) chartRef.current.timeScale().fitContent();
      }
    }
  }, [historicalCandles, activeSymbol]);

  useEffect(() => {
    if (seriesRef.current && volumeSeriesRef.current && smaSeriesRef.current && lastLoadedSymbolRef.current && lastLoadedSymbolRef.current !== activeSymbol) {
      seriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      smaSeriesRef.current.setData([]);
      lastLoadedSymbolRef.current = null;
      lastCandleTimeRef.current = null;
    }
  }, [activeSymbol]);

  useEffect(() => {
    if (!activeCandle || !seriesRef.current || !volumeSeriesRef.current) return;
    if (activeCandle.symbol !== activeSymbol) return;
    
    const chartData = candleToChartData(activeCandle);
    const volumeData = candleToVolumeData(activeCandle);
    
    seriesRef.current.update(chartData);
    volumeSeriesRef.current.update(volumeData);

    // Update SMA if we have enough history
    if (smaSeriesRef.current && historicalCandles.length >= 20) {
      // Combine last 19 candles + active candle
      const relevantCandles = [...historicalCandles.slice(-19), activeCandle];
      const sum = relevantCandles.reduce((acc, val) => acc + val.close, 0);
      const avg = sum / 20;
      
      smaSeriesRef.current.update({
        time: (activeCandle.time / 1000) as Time,
        value: avg,
      });
    }
    
    if (lastCandleTimeRef.current !== activeCandle.time) {
      lastCandleTimeRef.current = activeCandle.time;
    }
  }, [activeCandle, activeSymbol, historicalCandles]);

  return (
    <div className="h-full flex flex-col rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden relative group shadow-lg">
      {/* Chart Toolbar - Orion Style */}
      <div className="h-9 flex-shrink-0 flex items-center justify-between border-b border-white/10 px-3 bg-slate-800/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm font-bold text-white tracking-wide\">{formatSymbolDisplay(activeSymbol)}</span>
            {activeCandle && (
              <div className="hidden md:flex items-center gap-2 text-[9px] font-mono ml-2">
                <span className="text-slate-500">O:<span className="text-slate-300">{activeCandle.open.toFixed(2)}</span></span>
                <span className="text-slate-500">H:<span className="text-slate-300">{activeCandle.high.toFixed(2)}</span></span>
                <span className="text-slate-500">L:<span className="text-slate-300">{activeCandle.low.toFixed(2)}</span></span>
                <span className="text-slate-500">C:<span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-slate-400'}>{activeCandle.close.toFixed(2)}</span></span>
              </div>
            )}
          </div>
          
          <div className="h-3 w-px bg-white/10 hidden sm:block" />
          
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-none">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button 
                key={tf}
                onClick={() => streamEngine.setChartInterval(tf)}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors flex-shrink-0 ${
                  activeInterval === tf 
                    ? 'bg-emerald-500/15 text-emerald-400' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <button 
              onClick={() => {
                const newState = !showIndicators;
                setShowIndicators(newState);
                if (smaSeriesRef.current) {
                  smaSeriesRef.current.applyOptions({ visible: newState });
                }
              }}
              className={`hover:text-slate-300 transition-colors flex items-center gap-1 ${showIndicators ? 'text-emerald-400' : ''}`}
            >
              <Settings2 className="h-3 w-3" />
              <span className="hidden sm:inline">SMA 20</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${klineConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
            <span className="text-[9px] font-medium text-slate-500">{klineConnected ? 'LIVE FEED' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-0 relative">
        <div ref={containerRef} className="absolute inset-0" />
        
        {/* Loading / No Data State */}
        {historicalCandles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-slate-500">Initializing Data Feed...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
