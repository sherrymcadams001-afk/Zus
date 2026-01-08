/**
 * ORION Wealth Performance Chart
 * 
 * SYSTEM-WIDE AUM visualization showing CapWheel's total assets under management
 * Multi-line chart with contextual metrics showing platform complexity
 * This component reflects entire platform, NOT user-specific data
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, type IChartApi, type ISeriesApi, LineSeries, AreaSeries, type Time } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// System-wide base values
const SYSTEM_AUM_BASE = 2_400_000_000;        // ~$2.4B Total AUM
const STAKING_POOL_BASE = 1_680_000_000;      // ~70% in strategies
const TRADING_VOLUME_BASE = 180_000_000;      // ~$180M daily trading
const NET_INFLOWS_BASE = 45_000_000;          // ~$45M net monthly inflows

interface ChartDataPoint {
  time: Time;
  value: number;
}

interface MultiLineData {
  aum: ChartDataPoint[];
  stakingPool: ChartDataPoint[];
  tradingVolume: ChartDataPoint[];
  netInflows: ChartDataPoint[];
}

// Generate multi-line system data with realistic correlations and organic patterns
const generateMultiLineData = (days: number = 180): MultiLineData => {
  const aum: ChartDataPoint[] = [];
  const stakingPool: ChartDataPoint[] = [];
  const tradingVolume: ChartDataPoint[] = [];
  const netInflows: ChartDataPoint[] = [];
  
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 24 * 60 * 60;

  // Starting values (lower in the past)
  const aumStart = SYSTEM_AUM_BASE * 0.72;
  const stakingStart = STAKING_POOL_BASE * 0.68;
  const volumeStart = TRADING_VOLUME_BASE * 0.55;
  const inflowStart = NET_INFLOWS_BASE * 0.4;

  // Seed for deterministic "random" patterns
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let i = days; i >= 0; i--) {
    const time = (now - i * daySeconds) as Time;
    const progress = (days - i) / days;
    const dayIndex = days - i;

    // Complex wave patterns for organic movement
    const wave1 = Math.sin(dayIndex * 0.15) * 0.012;
    const wave2 = Math.sin(dayIndex * 0.08 + 1.5) * 0.018;
    const wave3 = Math.sin(dayIndex * 0.03 + 0.7) * 0.025;
    const microNoise = (seededRandom() - 0.5) * 0.006;
    
    // Market events (occasional dips/spikes)
    const marketEvent = (dayIndex % 37 < 2) ? (seededRandom() - 0.6) * 0.04 : 0;
    const weekendEffect = (dayIndex % 7 === 0 || dayIndex % 7 === 6) ? -0.005 : 0.002;

    // AUM: Primary growth line with compound effect
    const aumGrowth = aumStart + (SYSTEM_AUM_BASE - aumStart) * Math.pow(progress, 0.85);
    const aumFluctuation = wave1 + wave2 * 0.5 + microNoise + marketEvent * 0.7;
    aum.push({ time, value: aumGrowth * (1 + aumFluctuation) });

    // Staking Pool: Slightly lagged correlation to AUM, smoother
    const stakingGrowth = stakingStart + (STAKING_POOL_BASE - stakingStart) * Math.pow(progress, 0.9);
    const stakingFluctuation = wave2 * 0.8 + wave3 * 0.4 + microNoise * 0.5 + marketEvent * 0.3;
    stakingPool.push({ time, value: stakingGrowth * (1 + stakingFluctuation) });

    // Trading Volume: More volatile, inverse correlation during dips (people sell)
    const volumeGrowth = volumeStart + (TRADING_VOLUME_BASE - volumeStart) * Math.pow(progress, 0.75);
    const volumeSpike = marketEvent !== 0 ? Math.abs(marketEvent) * 3 : 0; // Spikes during events
    const volumeFluctuation = wave1 * 2 + wave3 + (seededRandom() - 0.5) * 0.04 + volumeSpike + weekendEffect * 2;
    tradingVolume.push({ time, value: Math.max(volumeGrowth * (1 + volumeFluctuation), volumeStart * 0.3) });

    // Net Inflows: Most volatile, leads other metrics
    const inflowGrowth = inflowStart + (NET_INFLOWS_BASE - inflowStart) * Math.pow(progress, 0.7);
    const inflowSeasonality = Math.sin(dayIndex * 0.2) * 0.15; // Monthly patterns
    const inflowFluctuation = wave1 * 0.5 + inflowSeasonality + (seededRandom() - 0.45) * 0.08 + marketEvent * 1.5;
    netInflows.push({ time, value: Math.max(inflowGrowth * (1 + inflowFluctuation), 0) });
  }

  return { aum, stakingPool, tradingVolume, netInflows };
};

type TimeframeKey = '24H' | '1M' | '1Y' | 'ALL';

// Legend configuration
const SERIES_CONFIG = {
  aum: { name: 'Total AUM', color: '#00FF9D', visible: true },
  stakingPool: { name: 'Staking Pool', color: '#00B8D4', visible: true },
  tradingVolume: { name: 'Trading Volume', color: '#6B7FD7', visible: true },
  netInflows: { name: 'Net Inflows', color: '#D4AF37', visible: true },
} as const;

type SeriesKey = keyof typeof SERIES_CONFIG;

export const OrionWealthChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Record<SeriesKey, ISeriesApi<'Line' | 'Area'> | null>>({
    aum: null,
    stakingPool: null,
    tradingVolume: null,
    netInflows: null,
  });
  const [timeframe, setTimeframe] = useState<TimeframeKey>('ALL');
  const [hoverData, setHoverData] = useState<{ values: Record<SeriesKey, number>; time: string } | null>(null);
  const [latestValues, setLatestValues] = useState({
    aum: SYSTEM_AUM_BASE,
    stakingPool: STAKING_POOL_BASE,
    tradingVolume: TRADING_VOLUME_BASE,
    netInflows: NET_INFLOWS_BASE,
  });
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    aum: true,
    stakingPool: true,
    tradingVolume: true,
    netInflows: true,
  });
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

  const toggleSeries = (key: SeriesKey) => {
    setVisibleSeries(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      const series = seriesRefs.current[key];
      if (series) {
        series.applyOptions({ visible: newState[key] });
      }
      return newState;
    });
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
      autoSize: false,
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
        visible: !isMobile,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: !isMobile,
        visible: !isMobile,
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
      handleScale: false,
      handleScroll: false,
    });

    // Create AUM series (primary - Area for emphasis)
    const aumSeries = chart.addSeries(AreaSeries, {
      lineColor: SERIES_CONFIG.aum.color,
      lineWidth: 2,
      topColor: 'rgba(0, 255, 157, 0.15)',
      bottomColor: 'rgba(0, 255, 157, 0.0)',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: SERIES_CONFIG.aum.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
      visible: visibleSeries.aum,
    });

    // Create Staking Pool series (Line)
    const stakingPoolSeries = chart.addSeries(LineSeries, {
      color: SERIES_CONFIG.stakingPool.color,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: SERIES_CONFIG.stakingPool.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
      visible: visibleSeries.stakingPool,
    });

    // Create Trading Volume series (Line - different scale)
    const tradingVolumeSeries = chart.addSeries(LineSeries, {
      color: SERIES_CONFIG.tradingVolume.color,
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: SERIES_CONFIG.tradingVolume.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'volume',
      visible: visibleSeries.tradingVolume,
    });

    // Create Net Inflows series (Line - different scale)
    const netInflowsSeries = chart.addSeries(LineSeries, {
      color: SERIES_CONFIG.netInflows.color,
      lineWidth: 1,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: SERIES_CONFIG.netInflows.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'inflows',
      visible: visibleSeries.netInflows,
    });

    // Configure secondary price scales (hidden)
    tradingVolumeSeries.priceScale().applyOptions({
      visible: false,
      scaleMargins: { top: 0.2, bottom: 0.2 },
    });
    netInflowsSeries.priceScale().applyOptions({
      visible: false,
      scaleMargins: { top: 0.3, bottom: 0.3 },
    });

    // Generate and set data
    const data = generateMultiLineData(getTimeframeDays(timeframe));
    aumSeries.setData(data.aum);
    stakingPoolSeries.setData(data.stakingPool);
    tradingVolumeSeries.setData(data.tradingVolume);
    netInflowsSeries.setData(data.netInflows);

    // Update latest values
    if (data.aum.length > 0) {
      setLatestValues({
        aum: data.aum[data.aum.length - 1].value,
        stakingPool: data.stakingPool[data.stakingPool.length - 1].value,
        tradingVolume: data.tradingVolume[data.tradingVolume.length - 1].value,
        netInflows: data.netInflows[data.netInflows.length - 1].value,
      });
    }

    chart.timeScale().fitContent();

    // Crosshair move handler for tooltips
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }

      const values: Record<SeriesKey, number> = {
        aum: 0,
        stakingPool: 0,
        tradingVolume: 0,
        netInflows: 0,
      };

      const aumData = param.seriesData.get(aumSeries);
      const stakingData = param.seriesData.get(stakingPoolSeries);
      const volumeData = param.seriesData.get(tradingVolumeSeries);
      const inflowData = param.seriesData.get(netInflowsSeries);

      if (aumData && 'value' in aumData) values.aum = aumData.value;
      if (stakingData && 'value' in stakingData) values.stakingPool = stakingData.value;
      if (volumeData && 'value' in volumeData) values.tradingVolume = volumeData.value;
      if (inflowData && 'value' in inflowData) values.netInflows = inflowData.value;

      const date = new Date((param.time as number) * 1000);
      setHoverData({
        values,
        time: date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    });

    chartRef.current = chart;
    seriesRefs.current = {
      aum: aumSeries,
      stakingPool: stakingPoolSeries,
      tradingVolume: tradingVolumeSeries,
      netInflows: netInflowsSeries,
    };
  }, [timeframe, isMobile, visibleSeries]);

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

  // Real-time updates - simulates live platform activity across all metrics
  // Use requestAnimationFrame for smoother rendering
  useEffect(() => {
    let animationId: number;
    let lastUpdate = 0;
    const updateInterval = 3000; // Update every 3 seconds instead of 2.5
    
    const updateChart = (timestamp: number) => {
      if (timestamp - lastUpdate >= updateInterval) {
        lastUpdate = timestamp;
        const now = Math.floor(Date.now() / 1000) as Time;
        
        // Update each series with correlated micro-fluctuations
        const baseFlux = (Math.random() - 0.5) * 0.0008; // Reduced fluctuation
        
        if (seriesRefs.current.aum && latestValues.aum > 0) {
          const newAum = latestValues.aum * (1 + baseFlux + (Math.random() - 0.5) * 0.0004);
          seriesRefs.current.aum.update({ time: now, value: newAum });
          setLatestValues(prev => ({ ...prev, aum: newAum }));
        }
        
        if (seriesRefs.current.stakingPool && latestValues.stakingPool > 0) {
          const newStaking = latestValues.stakingPool * (1 + baseFlux * 0.6 + (Math.random() - 0.5) * 0.0002);
          seriesRefs.current.stakingPool.update({ time: now, value: newStaking });
          setLatestValues(prev => ({ ...prev, stakingPool: newStaking }));
        }
        
        if (seriesRefs.current.tradingVolume && latestValues.tradingVolume > 0) {
          const newVolume = latestValues.tradingVolume * (1 + (Math.random() - 0.5) * 0.002);
          seriesRefs.current.tradingVolume.update({ time: now, value: newVolume });
          setLatestValues(prev => ({ ...prev, tradingVolume: newVolume }));
        }
        
        if (seriesRefs.current.netInflows && latestValues.netInflows > 0) {
          const newInflows = latestValues.netInflows * (1 + (Math.random() - 0.45) * 0.003);
          seriesRefs.current.netInflows.update({ time: now, value: Math.max(newInflows, 0) });
          setLatestValues(prev => ({ ...prev, netInflows: Math.max(newInflows, 0) }));
        }
      }
      
      animationId = requestAnimationFrame(updateChart);
    };
    
    animationId = requestAnimationFrame(updateChart);

    return () => cancelAnimationFrame(animationId);
  }, [latestValues]);

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
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
            <span className="text-xs font-semibold text-white">Live Performance</span>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-3">
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

      {/* Interactive Legend */}
      {!isMobile && (
        <div className="flex items-center gap-4 px-5 py-2 border-b border-white/5 bg-black/20">
          {(Object.entries(SERIES_CONFIG) as [SeriesKey, typeof SERIES_CONFIG[SeriesKey]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              className={`flex items-center gap-2 text-xs transition-all ${
                visibleSeries[key] ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div 
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-slate-400 hover:text-white">{config.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hover Value Display - Multi-line tooltip */}
      {hoverData && !isMobile && (
        <div className="absolute top-28 left-5 bg-[#0B1015]/95 border border-white/10 rounded-lg px-3 py-2 z-10 min-w-[180px]">
          <p className="text-xs text-slate-400 mb-2">{hoverData.time} UTC</p>
          <div className="space-y-1">
            {(Object.entries(SERIES_CONFIG) as [SeriesKey, typeof SERIES_CONFIG[SeriesKey]][]).map(([key, config]) => (
              visibleSeries[key] && (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-[10px] text-slate-500">{config.name}</span>
                  </div>
                  <span 
                    className="text-xs font-mono font-medium"
                    style={{ color: config.color }}
                  >
                    {formatCurrency(hoverData.values[key])}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={`relative w-full ${isMobile ? 'h-[220px]' : 'h-[280px]'}`}>
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </motion.div>
  );
};
