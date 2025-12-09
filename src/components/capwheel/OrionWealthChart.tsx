/**
 * ORION Wealth Performance Chart
 * 
 * SYSTEM-WIDE AUM visualization showing CapWheel's total assets under management
 * Glowing green vector line graph with real-time updates
 * This component reflects entire platform, NOT user-specific data
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, type IChartApi, type ISeriesApi, AreaSeries, HistogramSeries, type Time } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';

// System-wide AUM base value (~$2.4B)
const SYSTEM_AUM_BASE = 2_400_000_000;

// Generate system-wide AUM performance data (NOT user-specific)
const generateSystemAUMData = (days: number = 180) => {
  const data: Array<{ time: Time; value: number }> = [];
  const volumeData: Array<{ time: Time; value: number; color: string }> = [];
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 24 * 60 * 60;

  // Start from a slightly lower base and trend upward
  let currentValue = SYSTEM_AUM_BASE * 0.92; // Start at 92% of current
  
  for (let i = days; i >= 0; i--) {
    const time = (now - i * daySeconds) as Time;
    
    // Gradual upward trend with realistic daily fluctuations
    const dailyChange = (Math.random() * 0.015 - 0.004); // Slight upward bias
    currentValue *= (1 + dailyChange);
    
    // Keep within realistic bounds
    currentValue = Math.max(currentValue, SYSTEM_AUM_BASE * 0.85);
    currentValue = Math.min(currentValue, SYSTEM_AUM_BASE * 1.05);
    
    data.push({ time, value: currentValue });
    
    // Generate volume data (daily trading volume)
    const dailyVolume = Math.random() * 50_000_000 + 10_000_000; // $10M-$60M daily volume
    const isPositive = dailyChange >= 0;
    volumeData.push({
      time,
      value: dailyVolume,
      color: isPositive ? 'rgba(0, 255, 157, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    });
  }

  // Ensure last value is close to current AUM
  if (data.length > 0) {
    data[data.length - 1].value = SYSTEM_AUM_BASE * (1 + (Math.random() * 0.01 - 0.005));
  }

  return { data, volumeData };
};

interface LiveTerminalProps {
  onClose: () => void;
}

const LiveTerminal = ({ onClose }: LiveTerminalProps) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const actions = [
      '> SCANNING: BTC/USDT Pair',
      '> SIGNAL DETECTED: RSI Oversold (32.0)',
      '> ACTION: Long Entry @ 44,201',
      '> STATUS: Executing...',
      '> PROFIT SECURED: +$1.86',
      '> SCANNING: ETH/USDT Pair',
      '> SIGNAL DETECTED: MACD Crossover',
      '> ACTION: Long Entry @ 2,340',
      '> STATUS: Executing...',
      '> PROFIT SECURED: +$0.94',
    ];

    let index = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, actions[index % actions.length]];
        return newLogs.slice(-6); // Keep last 6 lines
      });
      index++;
    }, 2000);

    // Initial logs
    setLogs(actions.slice(0, 4));

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute right-4 bottom-16 w-80 bg-[#0B1015]/95 backdrop-blur-xl border border-[#00FF9D]/30 rounded-lg shadow-2xl shadow-[#00FF9D]/10 overflow-hidden z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#00FF9D]/5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#00FF9D]">Live Terminal</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <X className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-xs space-y-1 h-32 overflow-hidden">
        {logs.map((log, i) => (
          <motion.div
            key={`${log}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${
              log.includes('PROFIT') ? 'text-[#00FF9D]' :
              log.includes('SCANNING') ? 'text-[#00B8D4]' :
              log.includes('ACTION') ? 'text-amber-400' :
              'text-slate-400'
            }`}
          >
            {log}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

type TimeframeKey = '24H' | '1M' | '1Y' | 'ALL';

export const OrionWealthChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeKey>('ALL');
  const [hoverData, setHoverData] = useState<{ value: number; time: string } | null>(null);
  const [latestValue, setLatestValue] = useState(SYSTEM_AUM_BASE);

  const timeframes: TimeframeKey[] = ['24H', '1M', '1Y', 'ALL'];

  const getTimeframeDays = (tf: TimeframeKey) => {
    switch (tf) {
      case '24H': return 1;
      case '1M': return 30;
      case '1Y': return 365;
      case 'ALL': return 180;
    }
  };

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Cleanup existing
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748b',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { visible: true, color: 'rgba(255,255,255,0.03)' },
        horzLines: { visible: true, color: 'rgba(255,255,255,0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 }, // Make room for volume
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: '#00FF9D',
          width: 1,
          style: 2,
          labelBackgroundColor: '#00FF9D',
        },
        horzLine: {
          color: '#00FF9D',
          width: 1,
          style: 2,
          labelBackgroundColor: '#00FF9D',
        },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#00FF9D',
      lineWidth: 2,
      topColor: 'rgba(0, 255, 157, 0.3)',
      bottomColor: 'rgba(0, 255, 157, 0.0)',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#00FF9D',
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as overlay
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // Place at bottom
        bottom: 0,
      },
    });

    const { data: dataPoints, volumeData } = generateSystemAUMData(getTimeframeDays(timeframe));
    series.setData(dataPoints);
    volumeSeries.setData(volumeData);

    if (dataPoints.length > 0) {
      setLatestValue(dataPoints[dataPoints.length - 1].value);
    }

    chart.timeScale().fitContent();

    // Crosshair move handler for tooltips
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }

      const seriesData = param.seriesData.get(series);
      if (seriesData && 'value' in seriesData) {
        const date = new Date((param.time as number) * 1000);
        setHoverData({
          value: seriesData.value,
          time: date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      }
    });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;
  }, [timeframe]);

  useEffect(() => {
    initChart();

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Real-time AUM updates - simulates live platform activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (seriesRef.current && latestValue > 0) {
        const now = Math.floor(Date.now() / 1000) as Time;
        // Micro-fluctuations: ±0.01-0.05%
        const fluctuation = (Math.random() * 0.001 - 0.0003);
        const newValue = latestValue * (1 + fluctuation);
        setLatestValue(newValue);
        seriesRef.current.update({ time: now, value: newValue });
      }
    }, 2500); // Update every 2.5 seconds

    return () => clearInterval(interval);
  }, [latestValue]);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) {
      return '$' + (val / 1_000_000_000).toFixed(2) + 'B';
    }
    if (val >= 1_000_000) {
      return '$' + (val / 1_000_000).toFixed(2) + 'M';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden relative h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00FF9D]/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-[#00FF9D]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              CapWheel AUM
            </h3>
            <p className="text-xs text-slate-500">Platform-wide Assets Under Management</p>
          </div>
        </div>
        
        {/* Live indicator + Value */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-[#00FF9D] font-mono">{formatCurrency(latestValue)}</p>
            <div className="flex items-center gap-1 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
              <span className="text-[10px] text-[#00FF9D] uppercase tracking-wider">Live</span>
            </div>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  timeframe === tf
                    ? 'bg-[#00FF9D] text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Value Display */}
      {hoverData && (
        <div className="absolute top-16 left-5 bg-[#0B1015]/90 border border-white/10 rounded-lg px-3 py-2 z-10">
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(hoverData.value)}</p>
          <p className="text-xs text-slate-400">{hoverData.time} UTC</p>
        </div>
      )}

      {/* Chart */}
      <div className="relative w-full h-[280px]">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Live Terminal Toggle */}
      <button
        onClick={() => setShowTerminal(!showTerminal)}
        className={`absolute bottom-4 right-4 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
          showTerminal
            ? 'bg-[#00FF9D] text-black'
            : 'bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30 hover:bg-[#00FF9D]/20'
        }`}
      >
        {showTerminal ? 'HIDE TERMINAL' : 'SHOW TERMINAL'}
      </button>

      {/* Live Terminal */}
      {showTerminal && <LiveTerminal onClose={() => setShowTerminal(false)} />}
    </motion.div>
  );
};
