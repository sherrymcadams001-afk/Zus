import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type Time, CandlestickSeries } from 'lightweight-charts';
import { useMarketStore, type Candle } from '../store/useMarketStore';
import { streamEngine } from '../core/StreamEngine';

// Binance Dark theme colors
const CHART_UP_COLOR = '#00C087';
const CHART_DOWN_COLOR = '#F6465D';
const CHART_BG_COLOR = '#0B0E11';
const CHART_GRID_COLOR = '#1E2329';
const CHART_TEXT_COLOR = '#848E9C';

/**
 * Convert Candle to lightweight-charts format
 */
function candleToChartData(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.time / 1000) as Time, // Convert ms to seconds
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

/**
 * MainChart component - displays real-time candlestick chart using lightweight-charts
 */
export function MainChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastCandleTimeRef = useRef<number | null>(null);

  const activeCandle = useMarketStore((state) => state.activeCandle);
  const klineConnected = useMarketStore((state) => state.klineConnected);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_BG_COLOR },
        textColor: CHART_TEXT_COLOR,
      },
      grid: {
        vertLines: { color: CHART_GRID_COLOR },
        horzLines: { color: CHART_GRID_COLOR },
      },
      crosshair: {
        mode: 0, // Normal crosshair
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

    // Create candlestick series using v5 API
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

    // Subscribe to chart data
    streamEngine.subscribeToChart('BTCUSDT');

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update chart with new candle data
  useEffect(() => {
    if (!activeCandle || !seriesRef.current) return;

    const chartData = candleToChartData(activeCandle);
    const candleTime = activeCandle.time;

    // Always update the chart with latest data
    seriesRef.current.update(chartData);

    // Track the candle time for potential future logic
    if (lastCandleTimeRef.current !== candleTime) {
      lastCandleTimeRef.current = candleTime;
    }
  }, [activeCandle]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-[#0B0E11]">
      <div className="flex items-center justify-between border-b border-gray-800 bg-[#161A1E] px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">BTCUSDT</h2>
          <span className="text-xs text-gray-500">1m</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${klineConnected ? 'bg-[#00C087]' : 'bg-[#F6465D]'}`}
          />
          <span className="text-xs text-gray-500">
            {klineConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}
