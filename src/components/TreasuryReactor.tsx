import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Database, ArrowRightLeft } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';

interface Particle {
  id: number;
  direction: 'PUT' | 'CALL';
  pathIndex: number;
  amount: number;
}

// Compact bezier paths for smaller container
const PATHS = [
  'M 50 25 C 100 10, 160 10, 210 25',
  'M 50 40 C 100 40, 160 40, 210 40',
  'M 50 55 C 100 70, 160 70, 210 55',
];

const PATHS_REVERSED = [
  'M 210 25 C 160 10, 100 10, 50 25',
  'M 210 40 C 160 40, 100 40, 50 40',
  'M 210 55 C 160 70, 100 70, 50 55',
];

export function TreasuryReactor() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { poolBalance, walletBalance } = usePortfolioStore();
  const prevPoolBalance = useRef(poolBalance);
  const particleIdRef = useRef(0);

  const spawnParticle = useCallback((direction: 'PUT' | 'CALL', amount: number) => {
    const newParticle: Particle = {
      id: particleIdRef.current++,
      direction,
      pathIndex: Math.floor(Math.random() * 3),
      amount,
    };
    
    setParticles(prev => [...prev, newParticle]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1500);
  }, []);

  // Watch for balance changes to trigger visual effects
  useEffect(() => {
    const diff = poolBalance - prevPoolBalance.current;
    // Only trigger for significant changes (ignore tiny floating point noise)
    if (Math.abs(diff) > 0.01) {
      if (diff < 0) {
        // Pool decreased -> Payout -> PUT (Pool to Wallet)
        spawnParticle('PUT', Math.abs(diff));
      } else {
        // Pool increased -> Injection -> CALL (Wallet to Pool)
        spawnParticle('CALL', Math.abs(diff));
      }
    }
    prevPoolBalance.current = poolBalance;
  }, [poolBalance, spawnParticle]);

  return (
    <div className="h-full flex flex-col rounded border border-white/5 bg-orion-panel overflow-hidden">
      {/* Header */}
      <div className="h-8 flex-shrink-0 flex items-center gap-2 border-b border-white/5 px-3 bg-[#0B0E11]">
        <ArrowRightLeft className="h-3.5 w-3.5 text-orion-neon-cyan" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Treasury Reactor</span>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-between px-4 min-h-0 bg-[#0B0E11]/50">
        {/* Left Node - Pool */}
        <div className="z-10 flex flex-col items-center gap-1">
          <div className="relative flex h-12 w-14 flex-col items-center justify-center rounded border border-orion-neon-cyan/30 bg-orion-neon-cyan/5 shadow-[0_0_10px_rgba(0,212,255,0.1)]">
            <Database className="h-4 w-4 text-orion-neon-cyan" />
            <span className="text-[8px] uppercase text-slate-500 font-bold mt-0.5">Pool</span>
          </div>
          <div className="text-xs font-bold tabular-nums text-white font-mono">
            ${poolBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* SVG Canvas */}
        <svg viewBox="0 0 260 80" className="absolute inset-0 h-full w-full" style={{ zIndex: 1 }}>
          {PATHS.map((path, i) => (
            <path key={i} d={path} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
          ))}
          <AnimatePresence>
            {particles.map(particle => {
              const path = particle.direction === 'PUT' ? PATHS[particle.pathIndex] : PATHS_REVERSED[particle.pathIndex];
              const color = particle.direction === 'PUT' ? '#00FF94' : '#00D4FF';
              return (
                <motion.circle
                  key={particle.id}
                  r="3"
                  fill={color}
                  initial={{ offsetDistance: '0%', opacity: 0 }}
                  animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  style={{ offsetPath: `path('${path}')` }}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Right Node - Wallet */}
        <div className="z-10 flex flex-col items-center gap-1">
          <div className="relative flex h-12 w-14 flex-col items-center justify-center rounded border border-orion-neon-green/30 bg-orion-neon-green/5 shadow-[0_0_10px_rgba(0,255,148,0.1)]">
            <Wallet className="h-4 w-4 text-orion-neon-green" />
            <span className="text-[8px] uppercase text-slate-500 font-bold mt-0.5">Wallet</span>
          </div>
          <div className="text-xs font-bold tabular-nums text-white font-mono">
            ${walletBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
      
      {/* Footer Legend */}
      <div className="h-5 flex-shrink-0 flex items-center justify-center gap-4 border-t border-white/5 bg-[#0B0E11] text-[8px]">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-orion-neon-green" />
          <span className="text-slate-500">Profit</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-orion-neon-cyan" />
          <span className="text-slate-500">Inject</span>
        </div>
      </div>
    </div>
  );
}
