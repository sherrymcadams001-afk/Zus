/**
 * ORION Wealth Projection Engine
 * 
 * Interactive wealth calculator with:
 * - Sliders for Initial Capital and Monthly Contribution
 * - J-Curve visualization
 * - Auto-Compound toggle with FOMO effect
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Info } from 'lucide-react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

const Slider = ({ label, value, min, max, step, onChange, format }: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = format ? format(value) : value.toString();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="text-sm font-bold text-white font-mono">{displayValue}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-[#00FF9D]
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,157,0.5)]
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(0,255,157,0.7)]"
          style={{
            background: `linear-gradient(to right, #00FF9D ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
};

interface ToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const Toggle = ({ label, enabled, onChange }: ToggleProps) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
    <div className="flex items-center gap-2">
      <Zap className={`w-4 h-4 ${enabled ? 'text-[#00FF9D]' : 'text-slate-500'}`} />
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-[#00FF9D]' : 'bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
      />
    </button>
  </div>
);

// J-Curve visualization component
const JCurveGraph = ({ withPayout, withCompound }: { withPayout: number; withCompound: number }) => {
  const points = useMemo(() => {
    const payoutPoints: string[] = [];
    const compoundPoints: string[] = [];
    const years = 10;
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const year = (i / steps) * years;
      const x = (i / steps) * 280 + 20;
      
      // Linear payout growth
      const payoutY = 180 - (withPayout / 100000) * (year / years) * 160;
      payoutPoints.push(`${x},${Math.max(20, Math.min(180, payoutY))}`);
      
      // Exponential compound growth
      const compoundY = 180 - (withCompound / 1000000) * Math.pow(year / years, 2.5) * 160;
      compoundPoints.push(`${x},${Math.max(20, Math.min(180, compoundY))}`);
    }

    return { payout: payoutPoints.join(' '), compound: compoundPoints.join(' ') };
  }, [withPayout, withCompound]);

  return (
    <svg viewBox="0 0 300 200" className="w-full h-48">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="20"
          y1={20 + i * 40}
          x2="280"
          y2={20 + i * 40}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}

      {/* Payout line */}
      <polyline
        points={points.payout}
        fill="none"
        stroke="#64748b"
        strokeWidth="2"
        strokeDasharray="4 2"
      />

      {/* Compound line with glow */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="compoundGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B8D4" />
          <stop offset="100%" stopColor="#00FF9D" />
        </linearGradient>
      </defs>
      <polyline
        points={points.compound}
        fill="none"
        stroke="url(#compoundGradient)"
        strokeWidth="3"
        filter="url(#glow)"
      />

      {/* Legend */}
      <g transform="translate(200, 15)">
        <line x1="0" y1="5" x2="20" y2="5" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
        <text x="25" y="9" fontSize="8" fill="#64748b">Payouts</text>
      </g>
      <g transform="translate(200, 30)">
        <line x1="0" y1="5" x2="20" y2="5" stroke="#00FF9D" strokeWidth="2" />
        <text x="25" y="9" fontSize="8" fill="#00FF9D">Compound</text>
      </g>

      {/* X-axis label */}
      <text x="150" y="195" fontSize="9" fill="#64748b" textAnchor="middle">Years</text>
    </svg>
  );
};

export const OrionWealthProjection = () => {
  const [initialCapital, setInitialCapital] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [autoCompound, setAutoCompound] = useState(true);

  const calculateProjection = useCallback((compound: boolean) => {
    const annualYield = 0.0715; // 7.15% based on the metrics
    const years = 10;
    let value = initialCapital;

    for (let year = 0; year < years; year++) {
      value += monthlyContribution * 12;
      if (compound) {
        value *= (1 + annualYield);
      } else {
        value += initialCapital * annualYield;
      }
    }

    return value;
  }, [initialCapital, monthlyContribution]);

  const projections = useMemo(() => ({
    withPayout: calculateProjection(false),
    withCompound: calculateProjection(true),
  }), [calculateProjection]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const difference = projections.withCompound - projections.withPayout;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00FF9D]" />
          Wealth Projection Engine
        </h3>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-6">
          <Slider
            label="Initial Capital"
            value={initialCapital}
            min={100}
            max={100000}
            step={100}
            onChange={setInitialCapital}
            format={(v) => `$${v.toLocaleString()}`}
          />

          <Slider
            label="Monthly Contribution"
            value={monthlyContribution}
            min={0}
            max={5000}
            step={50}
            onChange={setMonthlyContribution}
            format={(v) => `$${v.toLocaleString()}`}
          />

          <Toggle
            label="Auto-Compound Yield"
            enabled={autoCompound}
            onChange={setAutoCompound}
          />

          {/* Projection Values */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">With Payouts</p>
              <p className="text-lg font-bold text-slate-300 font-mono">
                {formatCurrency(projections.withPayout)}
              </p>
            </div>
            <div className="bg-[#00FF9D]/10 border border-[#00FF9D]/20 rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#00FF9D] mb-1">With Compounding</p>
              <p className="text-lg font-bold text-[#00FF9D] font-mono">
                {formatCurrency(projections.withCompound)}
              </p>
            </div>
          </div>

          {/* FOMO Message */}
          {autoCompound && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
            >
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                By choosing to compound, you gain an additional{' '}
                <span className="font-bold text-amber-400">{formatCurrency(difference)}</span>{' '}
                over 10 years compared to taking payouts.
              </p>
            </motion.div>
          )}
        </div>

        {/* J-Curve Graph */}
        <div className="flex flex-col">
          <p className="text-xs text-slate-500 mb-2">10-Year Projection</p>
          <JCurveGraph 
            withPayout={projections.withPayout} 
            withCompound={projections.withCompound} 
          />
        </div>
      </div>
    </motion.div>
  );
};
