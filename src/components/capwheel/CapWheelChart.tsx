/**
 * CapWheel Chart Component
 * 
 * Trading chart with CapWheel branding and regime indicators
 */

import { useEffect, useRef } from 'react';
import { 
  createChart, 
  type IChartApi, 
  type ISeriesApi, 
  type CandlestickData, 
  type Time,
  CandlestickSeries
} from 'lightweight-charts';
import { useMarketStore, type Candle } from '../../store/useMarketStore';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';

// CapWheel Chart Colors
const CHART_UP_COLOR = '#00FF88';      // Profit green
const CHART_DOWN_COLOR = '#FF3366';    // Loss red
const CHART_BG_COLOR = '#0A1628';      // CapWheel navy
const CHART_TEXT_COLOR = '#C5C6C7';    // Slate text
const CHART_GRID_COLOR = '#0F1E35';    // Navy light

function candleToChartData(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.time / 1000) as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
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
  const lastLoadedSymbolRef = useRef<string | null>(null);

  const activeSymbol = useMarketStore((state) => state.activeSymbol);
  const activeInterval = useMarketStore((state) => state.activeInterval);
  const activeCandle = useMarketStore((state) => state.activeCandle);
  const historicalCandles = useMarketStore((state) => state.historicalCandles);
  const klineConnected = useMarketStore((state) => state.klineConnected);

  const regime = getMarketRegime(historicalCandles);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_BG_COLOR },
        textColor: CHART_TEXT_COLOR,
        fontFamily: 'JetBrains Mono',
      },
      grid: {
        vertLines: { color: CHART_GRID_COLOR },
        horzLines: { color: CHART_GRID_COLOR },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#D4AF37',
          style: 3,
          labelBackgroundColor: '#D4AF37',
        },
        horzLine: {
          width: 1,
          color: '#D4AF37',
          style: 3,
          labelBackgroundColor: '#D4AF37',
        },
      },
      rightPriceScale: {
        borderColor: CHART_GRID_COLOR,
      },
      timeScale: {
        borderColor: CHART_GRID_COLOR,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_UP_COLOR,
      downColor: CHART_DOWN_COLOR,
      borderUpColor: CHART_UP_COLOR,
      borderDownColor: CHART_DOWN_COLOR,
      wickUpColor: CHART_UP_COLOR,
      wickDownColor: CHART_DOWN_COLOR,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Load historical data
  useEffect(() => {
    if (!seriesRef.current || historicalCandles.length === 0) return;

    const needsFullReload =
      lastLoadedSymbolRef.current !== activeSymbol;

    if (needsFullReload) {
      const chartData = historicalCandles.map(candleToChartData);
      seriesRef.current.setData(chartData);
      lastLoadedSymbolRef.current = activeSymbol;
    }
  }, [historicalCandles, activeSymbol]);

  // Update with active candle
  useEffect(() => {
    if (!seriesRef.current || !activeCandle) return;

    const chartData = candleToChartData(activeCandle);
    seriesRef.current.update(chartData);
  }, [activeCandle]);

  const formatSymbol = (symbol: string) => {
    if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
    return symbol;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0.1, 1] }}
      className="capwheel-card p-6 h-[600px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white font-mono">
            {formatSymbol(activeSymbol)}
          </h2>
          <p className="text-xs text-gray-500 font-mono">
            {activeInterval} • {klineConnected ? 'LIVE' : 'DISCONNECTED'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <RegimeBadge regime={regime} />
          
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
      <div ref={containerRef} className="flex-1 rounded-lg overflow-hidden border border-capwheel-border-subtle" />
    </motion.div>
  );
};
