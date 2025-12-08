/**
 * CapWheel Chart Component
 * 
 * Trading chart with CapWheel branding and regime indicators
 */

import { useEffect, useRef, useMemo } from 'react';
import { 
  createChart, 
  type IChartApi, 
  type ISeriesApi, 
  type CandlestickData, 
  type HistogramData,
  type LineData,
  type Time,
  CandlestickSeries,
  HistogramSeries,
  LineSeries
} from 'lightweight-charts';
import { useMarketStore, type Candle } from '../../store/useMarketStore';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';

// CapWheel Chart Colors - Enhanced for visibility
const CHART_UP_COLOR = '#00FF9D';      // Brighter Neon Green
const CHART_DOWN_COLOR = '#FF2E55';    // Brighter Neon Red
const CHART_BG_COLOR = '#0B1221';      // Deep Navy/Black
const CHART_TEXT_COLOR = '#94A3B8';    // Slate 400
const CHART_GRID_COLOR = '#1E293B';    // Slate 800
const VOL_UP_COLOR = 'rgba(0, 255, 157, 0.15)';
const VOL_DOWN_COLOR = 'rgba(255, 46, 85, 0.15)';
const SMA_COLOR = '#F59E0B';           // Amber
const EMA_COLOR = '#3B82F6';           // Blue

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
    color: candle.close >= candle.open ? VOL_UP_COLOR : VOL_DOWN_COLOR,
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

function calculateEMA(data: Candle[], count: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  const k = 2 / (count + 1);
  
  // Start with SMA for the first point
  let ema = data.slice(0, count).reduce((acc, val) => acc + val.close, 0) / count;
  
  // Push the first point (at index count-1)
  result.push({
    time: (data[count - 1].time / 1000) as Time,
    value: ema
  });

  // Calculate the rest
  for (let i = count; i < data.length; i++) {
    const price = data[i].close;
    ema = price * k + ema * (1 - k);
    result.push({
      time: (data[i].time / 1000) as Time,
      value: ema,
    });
  }
  return result;
}

type RegimeType = 'BULLISH' | 'BEARISH' | 'HIGH_VOL' | 'RANGING';

const getMarketRegime = (candles: Candle[]): RegimeType => {
  if (candles.length < 20) return 'RANGING';
  
  const recent = candles.slice(-20);
  const priceChange = ((recent[recent.length - 1].close - recent[0].close) / recent[0].close) * 100;
  
  // Calculate volatility (simplified)
  const volatilities = recent.map(c => ((c.high - c.low) / c.close) * 100);
  const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  
  if (avgVolatility > 3) return 'HIGH_VOL';
  if (priceChange > 2) return 'BULLISH';
  if (priceChange < -2) return 'BEARISH';
  return 'RANGING';
};

const RegimeBadge = ({ regime }: { regime: RegimeType }) => {
  const configs = {
    BULLISH: {
      color: 'bg-capwheel-profit/20 border-capwheel-profit text-capwheel-profit',
      icon: <TrendingUp size={14} />,
      label: 'BULLISH',
    },
    BEARISH: {
      color: 'bg-capwheel-loss/20 border-capwheel-loss text-capwheel-loss',
      icon: <TrendingDown size={14} />,
      label: 'BEARISH',
    },
    HIGH_VOL: {
      color: 'bg-capwheel-electric/20 border-capwheel-electric text-capwheel-electric',
      icon: <Activity size={14} />,
      label: 'HIGH VOL',
    },
    RANGING: {
      color: 'bg-gray-500/20 border-gray-500 text-gray-400',
      icon: <Minus size={14} />,
      label: 'RANGING',
    },
  };

  const config = configs[regime];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color} font-mono text-xs font-semibold`}
    >
      {config.icon}
      {config.label}
    </motion.div>
  );
};

export const CapWheelChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastLoadedSymbolRef = useRef<string | null>(null);

  const activeSymbol = useMarketStore((state) => state.activeSymbol);
  const activeInterval = useMarketStore((state) => state.activeInterval);
  const activeCandle = useMarketStore((state) => state.activeCandle);
  const historicalCandles = useMarketStore((state) => state.historicalCandles);
  const klineConnected = useMarketStore((state) => state.klineConnected);

  // Calculate regime
  const regime = useMemo(() => getMarketRegime(historicalCandles), [historicalCandles]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_BG_COLOR },
        textColor: CHART_TEXT_COLOR,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: CHART_GRID_COLOR, style: 1 }, // Solid lines
        horzLines: { color: CHART_GRID_COLOR, style: 1 },
      },
      crosshair: {
        mode: 1, // Normal
        vertLine: {
          width: 1,
          color: '#475569',
          style: 3, // Dashed
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          width: 1,
          color: '#475569',
          style: 3,
          labelBackgroundColor: '#1E293B',
        },
      },
      rightPriceScale: {
        borderColor: CHART_GRID_COLOR,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Leave space for volume
        },
      },
      timeScale: {
        borderColor: CHART_GRID_COLOR,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 1. Volume Series (Bottom Layer)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume', // Separate scale for volume
    });
    
    // Configure volume price scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8, // Push to bottom 20%
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 2. SMA Series (Under Candles)
    const smaSeries = chart.addSeries(LineSeries, {
      color: SMA_COLOR,
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    smaSeriesRef.current = smaSeries;

    // 3. EMA Series (Under Candles)
    const emaSeries = chart.addSeries(LineSeries, {
      color: EMA_COLOR,
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    emaSeriesRef.current = emaSeries;

    // 4. Candlestick Series (Top Layer)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: CHART_UP_COLOR,
      downColor: CHART_DOWN_COLOR,
      borderVisible: false,
      wickUpColor: CHART_UP_COLOR,
      wickDownColor: CHART_DOWN_COLOR,
    });
    seriesRef.current = series;

    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ 
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update Historical Data
  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current || !smaSeriesRef.current || !emaSeriesRef.current || historicalCandles.length === 0) return;

    // Only update if symbol changed or we have new historical data
    // (Simple check: if last candle time is different or symbol changed)
    
    const data = historicalCandles.map(candleToChartData);
    const volumeData = historicalCandles.map(candleToVolumeData);
    const smaData = calculateSMA(historicalCandles, 20);
    const emaData = calculateEMA(historicalCandles, 50);

    seriesRef.current.setData(data);
    volumeSeriesRef.current.setData(volumeData);
    smaSeriesRef.current.setData(smaData);
    emaSeriesRef.current.setData(emaData);

    if (lastLoadedSymbolRef.current !== activeSymbol) {
      chartRef.current?.timeScale().fitContent();
      lastLoadedSymbolRef.current = activeSymbol;
    }
  }, [historicalCandles, activeSymbol]);

  // Update Real-time Candle
  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current || !activeCandle) return;

    const chartData = candleToChartData(activeCandle);
    const volumeData = candleToVolumeData(activeCandle);
    
    seriesRef.current.update(chartData);
    volumeSeriesRef.current.update(volumeData);
    
    // Note: Updating SMA/EMA in real-time is complex as it changes previous values. 
    // For simplicity, we skip real-time update of indicators until the candle closes and becomes historical.
    
  }, [activeCandle]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0.1, 1] }}
      className="capwheel-card p-6 h-[600px] flex flex-col bg-[#0B1221] rounded-xl border border-slate-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{activeSymbol}</h2>
            <span className="text-xs font-mono text-slate-400">{activeInterval}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RegimeBadge regime={regime} />
            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-mono text-amber-500">SMA 20</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-mono text-blue-500">EMA 50</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {klineConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-capwheel-profit animate-pulse"></div>
              <span className="text-xs text-capwheel-profit font-mono font-semibold">
                STREAMING
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="flex-1 rounded-lg overflow-hidden border border-slate-800/50" />
    </motion.div>
  );
};
