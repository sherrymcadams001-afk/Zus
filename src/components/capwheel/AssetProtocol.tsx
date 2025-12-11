/**
 * Asset Protocol - Circular Flow with Intricate Animations
 * 
 * True circular layout showing asset transformation cycle
 * Animated energy particles flow through the pipeline
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Cpu, 
  Lock, 
  Landmark,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';

// ============================================
// CIRCULAR FLOW RING - The main visual
// ============================================

const CircularFlowRing = ({ activePhase }: { activePhase: number }) => {
  const [particles, setParticles] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate particles
    const interval = setInterval(() => {
      setParticles(prev => {
        const newId = Date.now();
        const updated = [...prev, newId].slice(-8); // Keep max 8 particles
        return updated;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 mx-auto">
      {/* Outer glow ring */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-[#00FF9D]/20 via-[#00B8D4]/20 to-[#D4AF37]/20 blur-xl" />
      
      {/* Main ring track */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <defs>
          {/* Gradient for the ring */}
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF9D" />
            <stop offset="50%" stopColor="#00B8D4" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background track */}
        <circle
          cx="100" cy="100" r="85"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        
        {/* Animated gradient ring */}
        <motion.circle
          cx="100" cy="100" r="85"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="534"
          filter="url(#glow)"
          initial={{ strokeDashoffset: 534, rotate: -90 }}
          animate={{ strokeDashoffset: 0, rotate: 270 }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          style={{ transformOrigin: 'center' }}
        />
        
        {/* Inner decorative ring */}
        <circle
          cx="100" cy="100" r="70"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
      </svg>
      
      {/* Flowing particles */}
      <AnimatePresence>
        {particles.map((id, index) => (
          <motion.div
            key={id}
            className="absolute w-2 h-2 rounded-full"
            initial={{ 
              left: '50%', 
              top: '7.5%',
              scale: 0,
              background: '#00FF9D',
              boxShadow: '0 0 10px #00FF9D'
            }}
            animate={{
              left: ['50%', '92.5%', '50%', '7.5%', '50%'],
              top: ['7.5%', '50%', '92.5%', '50%', '7.5%'],
              scale: [0, 1, 1, 1, 0],
              background: ['#00FF9D', '#00FF9D', '#00B8D4', '#D4AF37', '#D4AF37'],
              boxShadow: [
                '0 0 10px #00FF9D',
                '0 0 10px #00FF9D', 
                '0 0 10px #00B8D4',
                '0 0 10px #D4AF37',
                '0 0 10px #D4AF37'
              ]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 6,
              ease: "linear",
              delay: index * 0.1
            }}
            style={{ 
              translateX: '-50%',
              translateY: '-50%'
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[#0F1419] border border-white/10 flex items-center justify-center">
            <Cpu className="w-7 h-7 text-[#00FF9D]" />
          </div>
          <p className="text-xs text-slate-500 font-mono">PROTOCOL</p>
          <p className="text-lg font-bold text-white">v2.1</p>
        </motion.div>
      </div>
      
      {/* Phase nodes on the ring */}
      <PhaseNode 
        angle={-90} 
        phase={1} 
        title="Execution" 
        tooltip="Trade orders are validated and routed through the execution engine"
        icon={<Zap className="w-4 h-4" />}
        color="#00FF9D"
        isActive={activePhase === 1}
      />
      <PhaseNode 
        angle={0} 
        phase={2} 
        title="Bonding" 
        tooltip="Assets are locked into yield-bearing vaults for collateralization"
        icon={<Lock className="w-4 h-4" />}
        color="#00B8D4"
        isActive={activePhase === 2}
      />
      <PhaseNode 
        angle={195} 
        phase={3} 
        title="Settlement" 
        tooltip="Final reconciliation converts volatile holdings to stable value"
        icon={<Landmark className="w-4 h-4" />}
        color="#D4AF37"
        isActive={activePhase === 3}
      />
    </div>
  );
};

// ============================================
// PHASE NODE - Positioned on the ring by angle
// ============================================

interface PhaseNodeProps {
  angle: number; // Degrees: 0=right, 90=bottom, 180=left, -90=top
  phase: number;
  title: string;
  tooltip: string;
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
}

const PhaseNode = ({ angle, phase, title, tooltip, icon, color, isActive }: PhaseNodeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Calculate position on circle
  // SVG viewBox is 200x200, circle center at (100,100), radius=85
  // Circle edge at 85/200 = 42.5% from center
  // Using exact 42.5% to place node centers precisely on the ring line
  const radius = 42.5; // matches SVG circle r=85 in viewBox 200
  const radians = (angle * Math.PI) / 180;
  const x = 50 + radius * Math.cos(radians);
  const y = 50 + radius * Math.sin(radians);

  const handleTap = () => {
    setShowTooltip(prev => !prev);
  };

  // Use CSS calc to ensure precise centering regardless of node size
  return (
    <motion.div 
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: phase * 0.2, type: "spring", stiffness: 200 }}
    >
      <motion.div
        className="relative cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={handleTap}
      >
        {/* Glow effect */}
        <motion.div 
          className="absolute inset-0 rounded-full blur-md"
          style={{ backgroundColor: color }}
          animate={{ opacity: isActive ? [0.3, 0.6, 0.3] : 0.2 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Node circle */}
        <div 
          className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2"
          style={{ 
            backgroundColor: '#0F1419',
            borderColor: isActive ? color : `${color}60`,
            boxShadow: isActive ? `0 0 20px ${color}40` : 'none'
          }}
        >
          <div className="scale-75 sm:scale-100" style={{ color }}>{icon}</div>
        </div>
        
        {/* Phase number */}
        <div 
          className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold"
          style={{ backgroundColor: color, color: '#0B1015' }}
        >
          {phase}
        </div>
        
        {/* Label */}
        <div className="absolute top-full mt-1 sm:mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[10px] sm:text-xs font-medium text-white">{title}</p>
        </div>
        
        {/* Tooltip on hover/tap */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-36 sm:w-44 p-2 rounded-lg text-xs text-center z-50"
              style={{ 
                backgroundColor: '#1A1F26',
                border: `1px solid ${color}40`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 10px ${color}20`
              }}
            >
              <p className="text-slate-300 leading-relaxed text-[10px] sm:text-[11px]">{tooltip}</p>
              {/* Tooltip arrow */}
              <div 
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${color}40`
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// PHASE DETAIL CARD - Expands on selection
// ============================================

interface PhaseDetailProps {
  phase: number;
  title: string;
  description: string;
  status: string;
  color: string;
  icon: React.ReactNode;
}

const PhaseDetail = ({ phase, title, description, status, color, icon }: PhaseDetailProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: phase * 0.1 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="bg-[#0F1419] border rounded-xl p-4 cursor-default transition-shadow hover:shadow-lg"
    style={{ 
      borderColor: `${color}30`,
      boxShadow: `inset 0 1px 0 ${color}10`
    }}
  >
    <div className="flex items-start gap-3">
      {/* Icon */}
      <motion.div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            PHASE {phase}
          </span>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 mb-2">{description}</p>
        <div className="flex items-center gap-1.5">
          <motion.div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] font-mono uppercase" style={{ color }}>{status}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

// ============================================
// ASSET CARD - Compact with animation
// ============================================

interface AssetCardProps {
  title: string;
  yieldValue: string;
  icon: React.ReactNode;
  delay: number;
}

const AssetCard = ({ title, yieldValue, icon, delay }: AssetCardProps) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ x: 4, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
    className="flex items-center justify-between p-3 bg-[#0F1419] border border-[#D4AF37]/20 rounded-lg transition-colors cursor-default"
  >
    <div className="flex items-center gap-2">
      <motion.div 
        className="w-8 h-8 rounded bg-[#D4AF37]/10 flex items-center justify-center"
        whileHover={{ rotate: 10 }}
      >
        {icon}
      </motion.div>
      <span className="text-white text-sm">{title}</span>
    </div>
    <motion.span 
      className="text-[#D4AF37] font-mono text-sm font-bold"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {yieldValue}
    </motion.span>
  </motion.div>
);

// ============================================
// DOCUMENT ROW
// ============================================

const DocumentRow = ({ name, hash }: { name: string; hash: string }) => (
  <motion.div 
    className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 cursor-pointer"
    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
  >
    <div className="flex items-center gap-2">
      <FileText className="w-3.5 h-3.5 text-red-400" />
      <span className="text-white text-xs">{name}</span>
    </div>
    <div className="flex items-center gap-3">
      <code className="text-[10px] text-slate-600 font-mono">{hash}</code>
      <Download className="w-3.5 h-3.5 text-slate-500 hover:text-white transition-colors" />
    </div>
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const AssetProtocol = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [activePhase, setActivePhase] = useState(1);

  // Cycle through phases
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase(prev => prev >= 3 ? 1 : prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const phases = [
    { 
      phase: 1, 
      title: "Execution", 
      description: "JIT scanning for mathematically guaranteed spreads",
      status: "Scanning",
      color: "#00FF9D",
      icon: <Zap className="w-5 h-5 text-[#00FF9D]" />
    },
    { 
      phase: 2, 
      title: "Bonding", 
      description: "14-day epochs ensure solvency via locked liquidity",
      status: "T-14 Days",
      color: "#00B8D4",
      icon: <Lock className="w-5 h-5 text-[#00B8D4]" />
    },
    { 
      phase: 3, 
      title: "Settlement", 
      description: "Yields swept into audited real-world asset vaults",
      status: "Verified",
      color: "#D4AF37",
      icon: <Landmark className="w-5 h-5 text-[#D4AF37]" />
    },
  ];

  const assets = [
    { title: "Singapore REITs", yieldValue: "4.8%", icon: <Landmark className="w-4 h-4 text-[#00FF9D]" /> },
    { title: "US Treasury Bills", yieldValue: "5.2%", icon: <Shield className="w-4 h-4 text-[#00B8D4]" /> },
    { title: "Tokenized Gold", yieldValue: "2.1%", icon: <span className="text-[#D4AF37] font-bold text-xs">Au</span> },
  ];

  const documents = [
    { name: "GMT_Architecture_v9.2.pdf", hash: "0x7a3f...1d4b" },
    { name: "Bonding_Mechanics.pdf", hash: "0x2b4c...0f1a" },
    { name: "RWA_Attestation.pdf", hash: "0x9f8e...5b4a" },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[#0B1015] p-4 md:p-6">
      <div className="max-w-5xl mx-auto" ref={ref}>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 bg-[#00FF9D]/10 rounded-lg"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Cpu className="w-5 h-5 text-[#00FF9D]" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">Asset Protocol</h1>
              <p className="text-xs text-slate-500">From Execution to Settlement</p>
            </div>
          </div>
          <motion.span 
            className="px-2 py-1 bg-[#00FF9D]/10 border border-[#00FF9D]/20 rounded text-[10px] text-[#00FF9D] font-mono"
            animate={{ borderColor: ['rgba(0,255,157,0.2)', 'rgba(0,255,157,0.5)', 'rgba(0,255,157,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            LIVE
          </motion.span>
        </motion.div>

        {/* Main Layout: Circle + Details */}
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4 lg:gap-8 mb-8">
          
          {/* Circular Flow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center py-8"
          >
            <CircularFlowRing activePhase={activePhase} />
          </motion.div>
          
          {/* Phase Details */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-1 h-4 bg-gradient-to-b from-[#00FF9D] via-[#00B8D4] to-[#D4AF37] rounded-full" />
              <h2 className="text-sm font-semibold text-white">Protocol Phases</h2>
            </motion.div>
            
            {phases.map((p) => (
              <PhaseDetail key={p.phase} {...p} />
            ))}
            
            {/* Flow legend */}
            <motion.div 
              className="flex items-center justify-center gap-4 pt-4 text-[10px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#00FF9D]" />
                <span className="text-slate-500">Volatile</span>
              </span>
              <span className="text-slate-700">→</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#00B8D4]" />
                <span className="text-slate-500">Bonded</span>
              </span>
              <span className="text-slate-700">→</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span className="text-slate-500">Settled</span>
              </span>
            </motion.div>
          </div>
        </div>

        {/* Bottom Grid: Assets + Documents */}
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* Vault Contents */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-[#0F1419] border border-white/5 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              </motion.div>
              <h3 className="text-sm font-semibold text-white">Vault Contents</h3>
            </div>
            <div className="space-y-2">
              {assets.map((asset, i) => (
                <AssetCard key={asset.title} {...asset} delay={0.8 + i * 0.1} />
              ))}
            </div>
          </motion.div>
          
          {/* Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-[#0F1419] border border-white/5 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">Documentation</h3>
            </div>
            <div>
              {documents.map((doc) => (
                <DocumentRow key={doc.name} {...doc} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-[10px] text-slate-600 font-mono">
            CAPWHEEL PROTOCOL v2.1 • KINETIC FRAMEWORK
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AssetProtocol;
