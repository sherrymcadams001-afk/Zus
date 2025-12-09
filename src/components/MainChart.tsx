import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type LineData, type Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { useMarketStore, type Candle } from '../store/useMarketStore';
import { streamEngine } from '../core/StreamEngine';
import { BarChart3, Settings2, ChevronDown } from 'lucide-react';

// Professional Trading Colors - High Contrast
const CHART_UP_COLOR = '#22C55E';     // Vivid Green
const CHART_DOWN_COLOR = '#EF4444';   // Vivid Red
const CHART_BG_COLOR = '#0C0F14';     // Near Black
const CHART_TEXT_COLOR = '#94A3B8';   // Slate 400
const CHART_GRID_COLOR = 'rgba(255,255,255,0.04)'; // Subtle grid
const CHART_UP_WICK = '#16A34A';      // Darker green wick
const CHART_DOWN_WICK = '#DC2626';    // Darker red wick
const VOL_UP = 'rgba(34, 197, 94, 0.25)';
const VOL_DOWN = 'rgba(239, 68, 68, 0.20)';

// Indicator colors
const SMA_20_COLOR = '#FBBF24';       // Amber
const EMA_50_COLOR = '#3B82F6';       // Blue
const BB_UPPER_COLOR = 'rgba(156, 163, 175, 0.4)';
const BB_LOWER_COLOR = 'rgba(156, 163, 175, 0.4)';

// Timeframe options
const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
];

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
    color: candle.close >= candle.open ? VOL_UP : VOL_DOWN,
  };
}

function calculateSMA(data: Candle[], period: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val.close, 0);
    result.push({
      time: (data[i].time / 1000) as Time,
      value: sum / period,
    });
  }
  return result;
}

function calculateEMA(data: Candle[], period: number): LineData<Time>[] {
  if (data.length < period) return [];
  const result: LineData<Time>[] = [];
  const k = 2 / (period + 1);
  
  let ema = data.slice(0, period).reduce((acc, val) => acc + val.close, 0) / period;
  result.push({ time: (data[period - 1].time / 1000) as Time, value: ema });
  
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: (data[i].time / 1000) as Time, value: ema });
  }
  return result;
}

function calculateBollingerBands(data: Candle[], period: number = 20, stdDev: number = 2): { upper: LineData<Time>[]; lower: LineData<Time>[] } {
  const upper: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map(c => c.close);
    const mean = closes.reduce((a, b) => a + b, 0) / period;
    const variance = closes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    const time = (data[i].time / 1000) as Time;
    
    upper.push({ time, value: mean + stdDev * std });
    lower.push({ time, value: mean - stdDev * std });
  }
  
  return { upper, lower };
}

function formatSymbolDisplay(symbol: string): string {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol;
}

function formatPrice(price: number): string {
  if (price >= 10000) return price.toFixed(2);
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

export function MainChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const lastLoadedSymbolRef = useRef<string | null>(null);

  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    bb: false,
  });

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
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(255,255,255,0.2)',
          style: 3,
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          width: 1,
          color: 'rgba(255,255,255,0.2)',
          style: 3,
          labelBackgroundColor: '#1E293B',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8, // Increased for better visibility
        minBarSpacing: 4,
        fixLeftEdge: true,
      },
    });

    // 1. Volume (Bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // 2. Indicators (Behind candles)
    const bbUpperSeries = chart.addSeries(LineSeries, { color: BB_UPPER_COLOR, lineWidth: 1, visible: false, crosshairMarkerVisible: false });
    const bbLowerSeries = chart.addSeries(LineSeries, { color: BB_LOWER_COLOR, lineWidth: 1, visible: false, crosshairMarkerVisible: false });
    const emaSeries = chart.addSeries(LineSeries, { color: EMA_50_COLOR, lineWidth: 1, visible: false, crosshairMarkerVisible: false });
    const smaSeries = chart.addSeries(LineSeries, { color: SMA_20_COLOR, lineWidth: 1, visible: false, crosshairMarkerVisible: false });

    // 3. Candlesticks (Top)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_UP_COLOR,
      downColor: CHART_DOWN_COLOR,
      borderUpColor: CHART_UP_COLOR,
      borderDownColor: CHART_DOWN_COLOR,
      wickUpColor: CHART_UP_WICK,
      wickDownColor: CHART_DOWN_WICK,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    smaSeriesRef.current = smaSeries;
    emaSeriesRef.current = emaSeries;
    bbUpperSeriesRef.current = bbUpperSeries;
    bbLowerSeriesRef.current = bbLowerSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ 
          width: containerRef.current.clientWidth, 
          height: containerRef.current.clientHeight 
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Sync Indicators Visibility
  useEffect(() => {
    if (smaSeriesRef.current) smaSeriesRef.current.applyOptions({ visible: indicators.sma });
    if (emaSeriesRef.current) emaSeriesRef.current.applyOptions({ visible: indicators.ema });
    if (bbUpperSeriesRef.current) bbUpperSeriesRef.current.applyOptions({ visible: indicators.bb });
    if (bbLowerSeriesRef.current) bbLowerSeriesRef.current.applyOptions({ visible: indicators.bb });
  }, [indicators]);

  // Data Updates
  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current || historicalCandles.length === 0) return;
    
    // Only update if symbol changed or we have new historical data
    if (lastLoadedSymbolRef.current !== activeSymbol || historicalCandles.length > 0) {
      const chartData = historicalCandles.map(candleToChartData);
      const volumeData = historicalCandles.map(candleToVolumeData);
      
      seriesRef.current.setData(chartData);
      volumeSeriesRef.current.setData(volumeData);

      // Calculate Indicators
      if (smaSeriesRef.current) smaSeriesRef.current.setData(calculateSMA(historicalCandles, 20));
      if (emaSeriesRef.current) emaSeriesRef.current.setData(calculateEMA(historicalCandles, 50));
      
      if (bbUpperSeriesRef.current && bbLowerSeriesRef.current) {
        const { upper, lower } = calculateBollingerBands(historicalCandles, 20, 2);
        bbUpperSeriesRef.current.setData(upper);
        bbLowerSeriesRef.current.setData(lower);
      }

      if (lastLoadedSymbolRef.current !== activeSymbol) {
        lastLoadedSymbolRef.current = activeSymbol;
        chartRef.current?.timeScale().fitContent();
      }
    }
  }, [historicalCandles, activeSymbol]);

  // Real-time Updates
  useEffect(() => {
    if (!activeCandle || !seriesRef.current || !volumeSeriesRef.current) return;
    if (activeCandle.symbol !== activeSymbol) return;
    
    seriesRef.current.update(candleToChartData(activeCandle));
    volumeSeriesRef.current.update(candleToVolumeData(activeCandle));
  }, [activeCandle, activeSymbol]);

  return (
    <div className="h-full flex flex-col rounded-lg border border-white/5 bg-[#0F1419] overflow-hidden relative group hover:border-[#00FF9D]/10 transition-colors">
      {/* Toolbar */}
      <div className="h-10 flex-shrink-0 flex items-center justify-between border-b border-white/5 px-4">
        <div className="flex items-center gap-6">
          {/* Symbol Info */}
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#00FF9D]" />
            <span className="text-sm font-bold text-white tracking-wide">{formatSymbolDisplay(activeSymbol)}</span>
            {activeCandle && (
              <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono ml-2 opacity-80">
                <span className="text-slate-400">O: <span className="text-white">{formatPrice(activeCandle.open)}</span></span>
                <span className="text-slate-400">H: <span className="text-white">{formatPrice(activeCandle.high)}</span></span>
                <span className="text-slate-400">L: <span className="text-white">{formatPrice(activeCandle.low)}</span></span>
                <span className="text-slate-400">C: <span className={activeCandle.close >= activeCandle.open ? 'text-[#00FF9D]' : 'text-red-400'}>{formatPrice(activeCandle.close)}</span></span>
              </div>
            )}
          </div>
          
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          
          {/* Timeframes */}
          <div className="flex items-center gap-1">
            {TIMEFRAMES.map((tf) => (
              <button 
                key={tf.value}
                onClick={() => streamEngine.setChartInterval(tf.value)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                  activeInterval === tf.value 
                    ? 'bg-[#00FF9D] text-black shadow-lg shadow-[#00FF9D]/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Indicators Dropdown */}
          <div className="relative group/indicators">
            <button className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 hover:text-white transition-colors">
              <Settings2 className="h-3.5 w-3.5" />
              <span>Indicators</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            <div className="absolute top-full left-0 mt-2 w-40 bg-[#0F1419] border border-white/10 rounded-lg shadow-xl p-2 hidden group-hover/indicators:block z-20">
              <label className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={indicators.sma}
                  onChange={(e) => setIndicators(prev => ({ ...prev, sma: e.target.checked }))}
                  className="rounded border-slate-600 text-[#00FF9D] focus:ring-[#00FF9D]/20 bg-slate-700"
                />
                <span className="text-xs text-slate-300">SMA (20)</span>
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={indicators.ema}
                  onChange={(e) => setIndicators(prev => ({ ...prev, ema: e.target.checked }))}
                  className="rounded border-slate-600 text-[#00FF9D] focus:ring-[#00FF9D]/20 bg-slate-700"
                />
                <span className="text-xs text-slate-300">EMA (50)</span>
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={indicators.bb}
                  onChange={(e) => setIndicators(prev => ({ ...prev, bb: e.target.checked }))}
                  className="rounded border-slate-600 text-[#00FF9D] focus:ring-[#00FF9D]/20 bg-slate-700"
                />
                <span className="text-xs text-slate-300">Bollinger Bands</span>
              </label>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${klineConnected ? 'bg-[#00FF9D] animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
            {klineConnected ? 'REALTIME' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative bg-[#0C0F14]">
        <div ref={containerRef} className="absolute inset-0" />
        
        {historicalCandles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B1015]/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-5 w-5 border-2 border-[#00FF9D] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-400">Loading Market Data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
