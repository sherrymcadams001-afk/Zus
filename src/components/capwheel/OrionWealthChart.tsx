/**
 * ORION Wealth Performance Chart
 * 
 * Tier-driven simulation surface for the current portfolio.
 * Uses the same tier math as the dashboard, cashflow panel, and live portfolio manager.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, type IChartApi, type ISeriesApi, LineSeries, AreaSeries, type Time } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  calculateTierEarnings,
  getAverageDailyRoi,
  getSimulationBaseBalance,
  type StrategyTierConfig,
} from '../../core/strategy-tiers';

interface ChartDataPoint {
  time: Time;
  value: number;
}

interface PerformanceSeriesData {
  equity: ChartDataPoint[];
  principal: ChartDataPoint[];
  payoutTrack: ChartDataPoint[];
  projection: ChartDataPoint[];
}

interface TimeframeConfig {
  points: number;
  totalDays: number;
  stepSeconds: number;
}

type TimeframeKey = '24H' | '1M' | '1Y' | 'ALL';

// Legend configuration
const SERIES_CONFIG = {
  equity: { name: 'Total Equity', color: '#00FF9D', visible: true },
  principal: { name: 'Starting Capital', color: '#6B7FD7', visible: true },
  payoutTrack: { name: 'Payout Track', color: '#D4AF37', visible: true },
  projection: { name: 'Compounded Path', color: '#00B8D4', visible: true },
} as const;

type SeriesKey = keyof typeof SERIES_CONFIG;

function getTimeframeConfig(timeframe: TimeframeKey): TimeframeConfig {
  switch (timeframe) {
    case '24H':
      return { points: 24, totalDays: 1, stepSeconds: 60 * 60 };
    case '1M':
      return { points: 30, totalDays: 30, stepSeconds: 24 * 60 * 60 };
    case '1Y':
      return { points: 52, totalDays: 365, stepSeconds: 7 * 24 * 60 * 60 };
    case 'ALL':
      return { points: 180, totalDays: 180, stepSeconds: 24 * 60 * 60 };
  }
}

function createPerformanceSeries(
  timeframe: TimeframeKey,
  currentEquity: number,
  tierConfig: StrategyTierConfig,
  effectiveDailyRate: number,
): PerformanceSeriesData {
  const { points, totalDays, stepSeconds } = getTimeframeConfig(timeframe);
  const now = Math.floor(Date.now() / 1000);
  const elapsedTradingDays = Math.max(totalDays, 1);
  const projectedStart = currentEquity / Math.pow(1 + effectiveDailyRate, elapsedTradingDays);
  const startingCapital = Math.max(
    tierConfig.minimumStake,
    getSimulationBaseBalance(projectedStart, projectedStart),
  );

  const equity: ChartDataPoint[] = [];
  const principal: ChartDataPoint[] = [];
  const payoutTrack: ChartDataPoint[] = [];
  const projection: ChartDataPoint[] = [];

  const oscillationBase = Math.min(0.18, Math.max(effectiveDailyRate * 6, 0.02));

  for (let index = 0; index <= points; index += 1) {
    const progress = index / points;
    const syntheticTradingDays = elapsedTradingDays * progress;
    const time = (now - (points - index) * stepSeconds) as Time;
    const smoothProjection = startingCapital * Math.pow(1 + effectiveDailyRate, syntheticTradingDays);
    const simplePayout = startingCapital + (startingCapital * effectiveDailyRate * syntheticTradingDays);
    const oscillationEnvelope = Math.sin(progress * Math.PI);
    const shapedNoise = (
      Math.sin(progress * Math.PI * 2.35)
      + Math.sin(progress * Math.PI * 6.1) * 0.45
    ) * oscillationEnvelope * oscillationBase;
    const realizedEquity = smoothProjection * (1 + shapedNoise);

    equity.push({ time, value: index === points ? currentEquity : Math.max(realizedEquity, startingCapital * 0.9) });
    principal.push({ time, value: startingCapital });
    payoutTrack.push({ time, value: simplePayout });
    projection.push({ time, value: index === points ? currentEquity : smoothProjection });
  }

  return { equity, principal, payoutTrack, projection };
}

export const OrionWealthChart = () => {
  const { data } = useDashboardData({ pollingInterval: 30000 });
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Record<SeriesKey, ISeriesApi<'Line' | 'Area'> | null>>({
    equity: null,
    principal: null,
    payoutTrack: null,
    projection: null,
  });
  const [timeframe, setTimeframe] = useState<TimeframeKey>('ALL');
  const [hoverData, setHoverData] = useState<{ values: Record<SeriesKey, number>; time: string } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    equity: true,
    principal: true,
    payoutTrack: true,
    projection: true,
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const timeframes: TimeframeKey[] = ['24H', '1M', '1Y', 'ALL'];

  const effectiveDailyRate = useMemo(
    () => (data.roi?.actualDailyRatePercent ?? (getAverageDailyRoi(data.tierConfig) * 100)) / 100,
    [data.roi?.actualDailyRatePercent, data.tierConfig],
  );
  const currentEquity = useMemo(
    () => Math.max(data.aum, data.tierConfig.minimumStake),
    [data.aum, data.tierConfig.minimumStake],
  );
  const chartData = useMemo(
    () => createPerformanceSeries(timeframe, currentEquity, data.tierConfig, effectiveDailyRate),
    [currentEquity, data.tierConfig, effectiveDailyRate, timeframe],
  );
  const latestValues = useMemo(
    () => ({
      equity: chartData.equity[chartData.equity.length - 1]?.value ?? currentEquity,
      principal: chartData.principal[chartData.principal.length - 1]?.value ?? currentEquity,
      payoutTrack: chartData.payoutTrack[chartData.payoutTrack.length - 1]?.value ?? currentEquity,
      projection: chartData.projection[chartData.projection.length - 1]?.value ?? currentEquity,
    }),
    [chartData, currentEquity],
  );

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

    // Create Equity series (primary - Area for emphasis)
    const equitySeries = chart.addSeries(AreaSeries, {
      lineColor: SERIES_CONFIG.equity.color,
      lineWidth: 2,
      topColor: 'rgba(0, 255, 157, 0.15)',
      bottomColor: 'rgba(0, 255, 157, 0.0)',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: SERIES_CONFIG.equity.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
      visible: visibleSeries.equity,
    });

    // Create Principal series (Line)
    const principalSeries = chart.addSeries(LineSeries, {
      color: SERIES_CONFIG.principal.color,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: SERIES_CONFIG.principal.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
      visible: visibleSeries.principal,
    });

    // Create Payout Track series (Line)
    const payoutTrackSeries = chart.addSeries(LineSeries, {
      color: SERIES_CONFIG.payoutTrack.color,
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: SERIES_CONFIG.payoutTrack.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
      visible: visibleSeries.payoutTrack,
    });

    // Create Projection series (Line)
    const projectionSeries = chart.addSeries(LineSeries, {
      color: SERIES_CONFIG.projection.color,
      lineWidth: 1,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: SERIES_CONFIG.projection.color,
      crosshairMarkerBackgroundColor: '#0B1015',
      priceScaleId: 'right',
      visible: visibleSeries.projection,
    });

    // Generate and set data
    equitySeries.setData(chartData.equity);
    principalSeries.setData(chartData.principal);
    payoutTrackSeries.setData(chartData.payoutTrack);
    projectionSeries.setData(chartData.projection);

    chart.timeScale().fitContent();

    // Crosshair move handler for tooltips
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }

      const values: Record<SeriesKey, number> = {
        equity: 0,
        principal: 0,
        payoutTrack: 0,
        projection: 0,
      };

      const equityData = param.seriesData.get(equitySeries);
      const principalData = param.seriesData.get(principalSeries);
      const payoutTrackData = param.seriesData.get(payoutTrackSeries);
      const projectionData = param.seriesData.get(projectionSeries);

      if (equityData && 'value' in equityData) values.equity = equityData.value;
      if (principalData && 'value' in principalData) values.principal = principalData.value;
      if (payoutTrackData && 'value' in payoutTrackData) values.payoutTrack = payoutTrackData.value;
      if (projectionData && 'value' in projectionData) values.projection = projectionData.value;

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
      equity: equitySeries,
      principal: principalSeries,
      payoutTrack: payoutTrackSeries,
      projection: projectionSeries,
    };
  }, [chartData, isMobile, visibleSeries]);

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

  const formatCurrency = (val: number) => {
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

      <div className={`grid ${isMobile ? 'grid-cols-2 gap-2 px-3 py-2' : 'grid-cols-4 gap-3 px-5 py-3'} border-b border-white/5 bg-black/20`}>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Current Equity</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(latestValues.equity)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Starting Capital</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(latestValues.principal)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Daily Target</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(calculateTierEarnings(latestValues.equity, data.tierConfig, effectiveDailyRate).daily)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Tier</p>
          <p className="text-sm font-semibold text-white">{data.tierConfig.name}</p>
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
