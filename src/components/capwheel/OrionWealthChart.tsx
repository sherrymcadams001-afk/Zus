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
import { TrendingUp } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

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

type TimeframeKey = '24H' | '1M' | '1Y' | 'ALL';

export const OrionWealthChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeKey>('ALL');
  const [hoverData, setHoverData] = useState<{ value: number; time: string } | null>(null);
  const [latestValue, setLatestValue] = useState(SYSTEM_AUM_BASE);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

    const chartHeight = isMobile ? 220 : 280;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748b',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { visible: !isMobile, color: 'rgba(255,255,255,0.03)' },
        horzLines: { visible: true, color: 'rgba(255,255,255,0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        visible: !isMobile, // Hide price labels on mobile
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: !isMobile,
        visible: !isMobile, // Hide time axis on mobile for cleaner look
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
  }, [timeframe, isMobile]);

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
      {/* Header - Simplified on mobile */}
      <div className={`flex items-center justify-between border-b border-white/5 ${isMobile ? 'px-3 py-2' : 'px-5 py-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`bg-[#00FF9D]/10 rounded-lg ${isMobile ? 'p-1.5' : 'p-2'}`}>
            <TrendingUp className={`text-[#00FF9D] ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          </div>
          {!isMobile && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                CapWheel AUM
              </h3>
              <p className="text-xs text-slate-500">Platform-wide Assets Under Management</p>
            </div>
          )}
          {isMobile && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
              <span className="text-xs font-semibold text-white">Live Performance</span>
            </div>
          )}
        </div>
        
        {/* Live indicator + Value (Desktop) or Timeframe only (Mobile) */}
        <div className="flex items-center gap-3">
          {!isMobile && (
            <div className="text-right">
              <p className="text-lg font-bold text-[#00FF9D] font-mono">{formatCurrency(latestValue)}</p>
              <div className="flex items-center gap-1 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
                <span className="text-[10px] text-[#00FF9D] uppercase tracking-wider">Live</span>
              </div>
            </div>
          )}
          
          {/* Timeframe Selector */}
          <div className={`flex items-center gap-0.5 bg-white/5 rounded-lg ${isMobile ? 'p-0.5' : 'p-1'}`}>
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`${isMobile ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-medium rounded transition-all ${
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

      {/* Hover Value Display - Hidden on mobile */}
      {hoverData && !isMobile && (
        <div className="absolute top-16 left-5 bg-[#0B1015]/90 border border-white/10 rounded-lg px-3 py-2 z-10">
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(hoverData.value)}</p>
          <p className="text-xs text-slate-400">{hoverData.time} UTC</p>
        </div>
      )}

      {/* Chart */}
      <div className={`relative w-full ${isMobile ? 'h-[220px]' : 'h-[280px]'}`}>
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </motion.div>
  );
};
