/**
 * Asset Protocol - "The Connected Pipeline"
 * 
 * Interactive scroll-linked visualization showing liquidity flow
 * From Execution → Bonding → Settlement
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Cpu, 
  Lock, 
  Landmark,
  ExternalLink,
  Shield,
  Clock,
  Zap
} from 'lucide-react';

// ============================================
// THE PIPELINE - Central SVG Connection
// ============================================

interface PipelineProps {
  scrollProgress: number;
}

const Pipeline = ({ scrollProgress }: PipelineProps) => {
  // Calculate pulse position along the path
  const pulseY = scrollProgress * 100;
  
  // Color transitions: Green → Blue → Gold
  const getPulseColor = () => {
    if (scrollProgress < 0.33) return '#00FF9D'; // Green (volatile)
    if (scrollProgress < 0.66) return '#00B8D4'; // Blue (bonded)
    return '#D4AF37'; // Gold (settled)
  };

  const getGlowColor = () => {
    if (scrollProgress < 0.33) return 'rgba(0, 255, 157, 0.6)';
    if (scrollProgress < 0.66) return 'rgba(0, 184, 212, 0.6)';
    return 'rgba(212, 175, 55, 0.6)';
  };

  return (
    <div className="absolute left-1/2 top-0 bottom-0 w-24 -translate-x-1/2 pointer-events-none z-0">
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 1000" 
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Pipeline gradient */}
          <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.3" />
            <stop offset="33%" stopColor="#00FF9D" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#00B8D4" stopOpacity="0.5" />
            <stop offset="66%" stopColor="#00B8D4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* The Pipeline Path - Wide at top, constricts, opens to vault */}
        <path
          d={`
            M 20 0 
            C 20 50, 10 100, 10 150
            C 10 200, 30 250, 50 280
            C 70 310, 90 350, 90 400
            L 90 420
            C 90 450, 70 480, 50 500
            C 30 520, 10 550, 10 600
            L 10 650
            C 10 700, 30 750, 50 780
            C 70 810, 90 850, 90 900
            L 90 1000
            M 80 0
            C 80 50, 90 100, 90 150
            C 90 200, 70 250, 50 280
            C 30 310, 10 350, 10 400
            L 10 420
            C 10 450, 30 480, 50 500
            C 70 520, 90 550, 90 600
            L 90 650
            C 90 700, 70 750, 50 780
            C 30 810, 10 850, 10 900
            L 10 1000
          `}
          fill="none"
          stroke="url(#pipeGradient)"
          strokeWidth="2"
          opacity="0.4"
        />
        
        {/* Inner flow line */}
        <path
          d={`
            M 50 0
            C 50 100, 50 200, 50 280
            L 50 500
            L 50 780
            L 50 1000
          `}
          fill="none"
          stroke="url(#pipeGradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
      </svg>
      
      {/* The Energy Pulse */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10"
        style={{
          top: `${pulseY}%`,
          backgroundColor: getPulseColor(),
          boxShadow: `0 0 20px ${getGlowColor()}, 0 0 40px ${getGlowColor()}`,
        }}
        animate={{
          scale: scrollProgress < 0.33 ? [1, 1.3, 0.8, 1.2, 1] : [1, 1.1, 1],
        }}
        transition={{
          duration: scrollProgress < 0.33 ? 0.5 : 2,
          repeat: Infinity,
          ease: scrollProgress < 0.33 ? "easeInOut" : "easeInOut"
        }}
      />
      
      {/* Trail effect */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-2 h-16 rounded-full z-5"
        style={{
          top: `${Math.max(0, pulseY - 5)}%`,
          background: `linear-gradient(to bottom, transparent, ${getPulseColor()}40, transparent)`,
        }}
      />
    </div>
  );
};

// ============================================
// SECTION 1: THE SOURCE - Chaotic Input
// ============================================

const SourceSection = ({ isActive }: { isActive: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[70vh] flex items-center py-16"
    >
      <div className="w-full max-w-2xl mx-auto px-6 lg:px-0">
        {/* Phase indicator */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
            isActive ? 'bg-[#00FF9D]/20 border-[#00FF9D]' : 'bg-white/5 border-white/20'
          }`}>
            <Zap className={`w-5 h-5 transition-colors ${isActive ? 'text-[#00FF9D]' : 'text-white/40'}`} />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-mono">Phase 01 • The Source</span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Inter']"
        >
          Just-In-Time Execution.
        </motion.h2>

        {/* Technical jargon (the hook) */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-lg text-slate-300 mb-4 font-mono"
        >
          "GMT Core scans mempool for mathematically guaranteed spreads."
        </motion.p>

        {/* Translation (clarity) */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-base text-slate-500 italic mb-8"
        >
          Basically: We only trade when we see the profit first. Zero guessing.
        </motion.p>

        {/* Visual: Chaotic volatility representation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="relative h-32 bg-black/30 rounded-xl border border-white/10 overflow-hidden"
        >
          {/* Erratic signal lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M 0 ${50 + i * 15} Q 25 ${30 + i * 20}, 50 ${60 - i * 10} T 100 ${40 + i * 15} T 150 ${55 - i * 5} T 200 ${45 + i * 10}`}
                fill="none"
                stroke={isActive ? '#00FF9D' : '#ffffff20'}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: isActive ? 1 : 0.3,
                  opacity: isActive ? [0.3, 0.8, 0.3] : 0.2
                }}
                transition={{ 
                  pathLength: { duration: 1, delay: i * 0.2 },
                  opacity: { duration: 2, repeat: Infinity, delay: i * 0.3 }
                }}
              />
            ))}
          </svg>
          
          {/* Status badge */}
          <div className="absolute bottom-3 right-3">
            <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${
              isActive ? 'bg-[#00FF9D]/20 text-[#00FF9D]' : 'bg-white/10 text-white/40'
            }`}>
              {isActive ? '● Scanning' : '○ Idle'}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

// ============================================
// SECTION 2: THE LOCK - Bonding Choke Point
// ============================================

const LockSection = ({ isActive, daysRemaining = 14 }: { isActive: boolean; daysRemaining?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[70vh] flex items-center py-16"
    >
      <div className="w-full max-w-2xl mx-auto px-6 lg:px-0">
        {/* Phase indicator */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
            isActive ? 'bg-[#00B8D4]/20 border-[#00B8D4]' : 'bg-white/5 border-white/20'
          }`}>
            <Lock className={`w-5 h-5 transition-colors ${isActive ? 'text-[#00B8D4]' : 'text-white/40'}`} />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-mono">Phase 02 • The Lock</span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Inter']"
        >
          The Bonding Cycle.
        </motion.h2>

        {/* Technical jargon */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-lg text-slate-300 mb-4 font-mono"
        >
          "Strategy-Aligned Bonding Epochs align liquidity depth with maturity."
        </motion.p>

        {/* Translation */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-base text-slate-500 italic mb-8"
        >
          Basically: Your capital is bonded to the trade duration (14 Days) to prevent slippage.
        </motion.p>

        {/* Visual: The Lock mechanism */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="relative h-40 bg-black/30 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center"
        >
          {/* Constricting walls */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-slate-800 to-transparent"
            animate={isActive ? { x: [0, 20, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-slate-800 to-transparent"
            animate={isActive ? { x: [0, -20, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* The Lock icon with tooltip */}
          <div 
            className="relative cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <motion.div
              className={`w-20 h-20 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                isActive ? 'bg-[#00B8D4]/20 border-2 border-[#00B8D4]' : 'bg-white/5 border border-white/20'
              }`}
              animate={isActive ? { scale: [1, 0.95, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className={`w-10 h-10 transition-colors ${isActive ? 'text-[#00B8D4]' : 'text-white/30'}`} />
            </motion.div>
            
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showTooltip ? 1 : 0, y: showTooltip ? 0 : 10 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-[#00B8D4]/30 rounded-lg px-4 py-2 whitespace-nowrap z-20"
            >
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#00B8D4]" />
                <span className="text-white font-medium">Status:</span>
                <span className="text-[#00B8D4] font-mono">{daysRemaining} Days Remaining</span>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-[#00B8D4]/30" />
            </motion.div>
          </div>
          
          {/* Pulsing rings */}
          {isActive && [1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-24 h-24 rounded-xl border border-[#00B8D4]/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

// ============================================
// SECTION 3: THE ASSET - Vault Output
// ============================================

const AssetSection = ({ isActive }: { isActive: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  
  const assets = [
    { title: "Singapore REITs", subtitle: "Commercial Property Trust", yieldValue: "4.8%", icon: <Landmark className="w-5 h-5 text-[#00FF9D]" /> },
    { title: "US Treasury Bills", subtitle: "Short-term Gov Bonds", yieldValue: "5.2%", icon: <Shield className="w-5 h-5 text-[#00B8D4]" /> },
    { title: "Tokenized Gold", subtitle: "LBMA Certified", yieldValue: "2.1%", icon: <span className="text-[#D4AF37] font-bold">Au</span> },
  ];
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[70vh] flex items-center py-16"
    >
      <div className="w-full max-w-2xl mx-auto px-6 lg:px-0">
        {/* Phase indicator */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
            isActive ? 'bg-[#D4AF37]/20 border-[#D4AF37]' : 'bg-white/5 border-white/20'
          }`}>
            <Landmark className={`w-5 h-5 transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`} />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-mono">Phase 03 • The Asset</span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Inter']"
        >
          RWA Finality.
        </motion.h2>

        {/* Technical jargon */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-lg text-slate-300 mb-4 font-mono"
        >
          "Protocol sweeps excess variance into Tokenized Real World Assets."
        </motion.p>

        {/* Translation */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-base text-slate-500 italic mb-8"
        >
          Basically: Trading profits are converted into Real Estate and Gold for safe keeping.
        </motion.p>

        {/* Visual: The Vault */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="relative bg-black/30 rounded-xl border border-white/10 overflow-hidden p-6"
        >
          {/* Vault header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">Vault Contents</span>
            <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${
              isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/10 text-white/40'
            }`}>
              {isActive ? '● Settled' : '○ Pending'}
            </span>
          </div>
          
          {/* Asset cards */}
          <div className="grid gap-3">
            {assets.map((asset, i) => (
              <motion.div
                key={asset.title}
                initial={{ x: -20, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 0.7 + i * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-500 ${
                  isActive 
                    ? 'bg-[#D4AF37]/5 border-[#D4AF37]/30 hover:bg-[#D4AF37]/10' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-[#D4AF37]/10' : 'bg-white/5'
                  }`}>
                    {asset.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{asset.title}</p>
                    <p className="text-xs text-slate-500">{asset.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`}>
                    {asset.yieldValue}
                  </p>
                  <p className="text-[10px] text-slate-600 uppercase">APY</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Gold crystallization effect */}
          {isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.1, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/20 to-transparent" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

// ============================================
// DOCUMENTATION SECTION
// ============================================

const DocumentFile = ({ name, size, delay }: { name: string; size: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg hover:bg-white/5 hover:border-[#00FF9D]/20 transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-red-500/10 rounded">
        <FileText className="w-4 h-4 text-red-400" />
      </div>
      <div>
        <p className="text-white font-medium text-sm">{name}</p>
        <p className="text-[10px] text-slate-600">{size}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Download className="w-3.5 h-3.5 text-slate-500" />
      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
    </div>
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const AssetProtocol = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (v) => setProgress(v));
    return () => unsubscribe();
  }, [smoothProgress]);

  const documents = [
    { name: "GMT_Architecture_v9.2.pdf", size: "2.4 MB" },
    { name: "Bonding_Settlement_Mechanics.pdf", size: "1.8 MB" },
    { name: "RWA_Title_Attestation.pdf", size: "892 KB" },
  ];

  // Determine which section is active based on scroll
  const isSourceActive = progress < 0.4;
  const isLockActive = progress >= 0.3 && progress < 0.7;
  const isAssetActive = progress >= 0.6;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-[#0B1015]">
      {/* Fixed progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00FF9D] via-[#00B8D4] to-[#D4AF37] z-50 origin-left"
        style={{ scaleX: smoothProgress }}
      />
      
      <div className="relative max-w-4xl mx-auto">
        {/* The Pipeline - Central connection */}
        <Pipeline scrollProgress={progress} />
        
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 pt-12 pb-8 px-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#00FF9D]/10 rounded-xl">
              <Cpu className="w-6 h-6 text-[#00FF9D]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">ASSET PROTOCOL</h1>
              <p className="text-sm text-slate-500">Code is Law • From Execution to Settlement</p>
            </div>
          </div>
          
          {/* Scroll hint */}
          <motion.div
            className="flex items-center gap-2 text-slate-600 text-sm"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>Scroll to follow the flow</span>
            <span>↓</span>
          </motion.div>
        </motion.header>

        {/* The Three Sections */}
        <div className="relative z-10">
          <SourceSection isActive={isSourceActive} />
          <LockSection isActive={isLockActive} />
          <AssetSection isActive={isAssetActive} />
        </div>

        {/* Documentation Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative z-10 px-6 py-16 border-t border-white/5"
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-800 rounded-lg">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Protocol Documentation</h3>
                <p className="text-sm text-slate-500">Technical specifications & attestations</p>
              </div>
            </div>
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <DocumentFile key={doc.name} {...doc} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t border-white/5">
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
            CapWheel Protocol v2.1 • Kinetic Framework
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AssetProtocol;
