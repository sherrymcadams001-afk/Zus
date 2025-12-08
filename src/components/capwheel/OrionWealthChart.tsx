/**
 * ORION Wealth Performance Chart
 * 
 * Glowing green vector line graph with real-time updates
 * Alpha Sparkline with hover tooltips
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, type IChartApi, type ISeriesApi, AreaSeries, HistogramSeries, type Time } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { TransactionData } from '../../core/DataOrchestrator';

// Generate realistic wealth performance data
const generatePerformanceData = (days: number = 180, transactions: TransactionData[] = []) => {
  const data: Array<{ time: Time; value: number }> = [];
  const volumeData: Array<{ time: Time; value: number; color: string }> = [];
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 24 * 60 * 60;

  // If we have real transactions, use them to build the curve
  if (transactions.length > 0) {
    // Sort transactions by date
    const sortedTxns = [...transactions].sort((a, b) => a.created_at - b.created_at);
    
    // Start from the first transaction or 'days' ago
    const startTime = now - (days * daySeconds);
    let runningBalance = 0;
    
    // Calculate initial balance before the start time
    sortedTxns.forEach(txn => {
      if (txn.created_at < startTime) {
        if (['deposit', 'trade_profit', 'roi_payout', 'referral_commission'].includes(txn.type)) {
          runningBalance += txn.amount;
        } else if (['withdraw', 'trade_loss'].includes(txn.type)) {
          runningBalance -= txn.amount;
        }
      }
    });

    // Generate daily points
    for (let i = days; i >= 0; i--) {
      const time = (now - i * daySeconds) as Time;
      const dayStart = now - i * daySeconds;
      const dayEnd = dayStart + daySeconds;
      
      // Apply transactions for this day
      const dayTxns = sortedTxns.filter(t => t.created_at >= dayStart && t.created_at < dayEnd);
      
      let dailyVolume = 0;
      let isPositiveDay = true;

      dayTxns.forEach(txn => {
        dailyVolume += Math.abs(txn.amount);
        if (['deposit', 'trade_profit', 'roi_payout', 'referral_commission'].includes(txn.type)) {
          runningBalance += txn.amount;
        } else if (['withdraw', 'trade_loss'].includes(txn.type)) {
          runningBalance -= txn.amount;
          isPositiveDay = false; // If there's a withdrawal/loss, mark volume as red (simplification)
        }
      });
      
      // Ensure non-negative
      const value = Math.max(0, runningBalance);
      data.push({ time, value });
      
      // Add volume data
      if (dailyVolume > 0) {
        volumeData.push({
          time,
          value: dailyVolume,
          color: isPositiveDay ? 'rgba(0, 255, 157, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        });
      }
    }
  } else {
    // Fallback to simulation if no data
    let value = 1000;
    for (let i = days; i >= 0; i--) {
      const time = (now - i * daySeconds) as Time;
      const growth = 1 + (Math.random() * 0.008 - 0.002); 
      value *= growth;
      data.push({ time, value: Math.round(value * 100) / 100 });
      
      // Simulated volume
      if (Math.random() > 0.7) {
        volumeData.push({
          time,
          value: Math.random() * 50,
          color: Math.random() > 0.5 ? 'rgba(0, 255, 157, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        });
      }
    }
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
  const { data } = useDashboardData({ pollingInterval: 60000 });
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeKey>('ALL');
  const [hoverData, setHoverData] = useState<{ value: number; time: string } | null>(null);
  const [latestValue, setLatestValue] = useState(0);

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

    const { data: dataPoints, volumeData } = generatePerformanceData(getTimeframeDays(timeframe), data.transactions);
    series.setData(dataPoints);
    volumeSeries.setData(volumeData);

    if (dataPoints.length > 0) {
      setLatestValue(dataPoints[dataPoints.length - 1].value);
    }
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
  }, [timeframe, data.transactions]);

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

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (seriesRef.current) {
        const now = Math.floor(Date.now() / 1000) as Time;
        const newValue = latestValue * (1 + (Math.random() * 0.002 - 0.0005));
        setLatestValue(newValue);
        seriesRef.current.update({ time: now, value: newValue });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [latestValue]);

  const formatCurrency = (val: number) => {
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
      className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Wealth Performance <span className="text-[#00FF9D]">(Real-Time)</span>
          </h3>
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

      {/* Hover Value Display */}
      {hoverData && (
        <div className="absolute top-16 left-5 bg-[#0B1015]/90 border border-white/10 rounded-lg px-3 py-2 z-10">
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(hoverData.value)}</p>
          <p className="text-xs text-slate-400">{hoverData.time} UTC</p>
        </div>
      )}

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full" />

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
