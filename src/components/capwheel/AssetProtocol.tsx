/**
 * Asset Protocol v2 - "Scrollytelling Experience"
 * 
 * Visual overhaul with Energy Beam pipeline, scroll-linked animations
 * Headlines: Plain English (Benefit) → Technical (Proof)
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Cpu, 
  Lock, 
  Landmark,
  Shield,
  Clock,
  Zap,
  Terminal,
  CheckCircle2
} from 'lucide-react';

// ============================================
// THE ENERGY BEAM - Central Glowing SVG Path
// ============================================

interface EnergyBeamProps {
  scrollProgress: number;
}

const EnergyBeam = ({ scrollProgress }: EnergyBeamProps) => {
  const pathLength = useSpring(scrollProgress, { stiffness: 50, damping: 20 });
  
  return (
    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-32 pointer-events-none z-0 hidden lg:block">
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 1000" 
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glow filters */}
          <filter id="beamGlow" x="-100%" y="-10%" width="300%" height="120%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feFlood floodColor="#00FF9D" floodOpacity="0.8"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient for the beam fill */}
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FF9D" />
            <stop offset="40%" stopColor="#00FF9D" />
            <stop offset="60%" stopColor="#00B8D4" />
            <stop offset="80%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          
          {/* Background path gradient */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00B8D4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Background path (always visible) */}
        <path
          d="M 50 0 L 50 300 L 50 500 L 50 700 L 50 1000"
          fill="none"
          stroke="url(#bgGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Animated fill path */}
        <motion.path
          d="M 50 0 L 50 300 L 50 500 L 50 700 L 50 1000"
          fill="none"
          stroke="url(#beamGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#beamGlow)"
          style={{ pathLength }}
          initial={{ pathLength: 0 }}
        />
        
        {/* Pulse markers at each section */}
        <circle cx="50" cy="150" r="8" fill="#00FF9D" opacity={scrollProgress > 0.1 ? 0.8 : 0.2}>
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="500" r="8" fill="#00B8D4" opacity={scrollProgress > 0.4 ? 0.8 : 0.2}>
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="850" r="8" fill="#D4AF37" opacity={scrollProgress > 0.7 ? 0.8 : 0.2}>
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {/* Traveling pulse */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
        style={{
          top: `${scrollProgress * 100}%`,
          background: scrollProgress < 0.4 ? '#00FF9D' : scrollProgress < 0.7 ? '#00B8D4' : '#D4AF37',
          boxShadow: `0 0 30px ${scrollProgress < 0.4 ? '#00FF9D' : scrollProgress < 0.7 ? '#00B8D4' : '#D4AF37'}`
        }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
};

// ============================================
// GLASS PANEL - Reusable container with neon border
// ============================================

interface GlassPanelProps {
  children: React.ReactNode;
  borderColor?: string;
  className?: string;
}

const GlassPanel = ({ children, borderColor = '#00FF9D', className = '' }: GlassPanelProps) => (
  <div 
    className={`relative backdrop-blur-xl bg-black/40 rounded-2xl overflow-hidden ${className}`}
    style={{ 
      border: `1px solid ${borderColor}`,
      boxShadow: `0 0 30px ${borderColor}20, inset 0 0 30px ${borderColor}05`
    }}
  >
    {/* Subtle gradient overlay */}
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ background: `linear-gradient(135deg, ${borderColor}10 0%, transparent 50%)` }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

// ============================================
// SECTION 1: THE SOURCE - Scanner Animation
// ============================================

const ScannerAnimation = ({ isActive }: { isActive: boolean }) => {
  const [foundGap, setFoundGap] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      const timer = setInterval(() => {
        setFoundGap(true);
        setTimeout(() => setFoundGap(false), 2000);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isActive]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-black/60">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,157,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,157,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radar sweep */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2"
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #00FF9D40 30deg, transparent 60deg)'
          }}
        />
      </motion.div>
      
      {/* Radar rings */}
      {[1, 2, 3].map((i) => (
        <div 
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00FF9D]/20"
          style={{ width: `${i * 60}px`, height: `${i * 60}px` }}
        />
      ))}
      
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#00FF9D] rounded-full shadow-[0_0_15px_#00FF9D]" />
      
      {/* Target blips */}
      {isActive && (
        <>
          <motion.div
            className="absolute w-2 h-2 bg-[#00FF9D] rounded-full"
            style={{ top: '30%', left: '60%' }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-[#00FF9D] rounded-full"
            style={{ top: '65%', left: '35%' }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
          />
        </>
      )}
      
      {/* GAP FOUND popup */}
      <motion.div
        className="absolute top-4 right-4 px-3 py-2 bg-[#00FF9D]/20 border border-[#00FF9D] rounded-lg"
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ 
          opacity: foundGap ? 1 : 0, 
          scale: foundGap ? 1 : 0.8,
          y: foundGap ? 0 : -10
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00FF9D]" />
          <span className="text-[#00FF9D] font-mono font-bold text-sm">+0.4% GAP FOUND</span>
        </div>
      </motion.div>
      
      {/* Status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00FF9D] animate-pulse' : 'bg-white/30'}`} />
        <span className="text-xs font-mono text-slate-400">
          {isActive ? 'SCANNING MEMPOOL...' : 'STANDBY'}
        </span>
      </div>
    </div>
  );
};

const SourceSection = ({ isActive }: { isActive: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[80vh] flex items-center py-20"
    >
      <div className="w-full max-w-3xl mx-auto px-6">
        <GlassPanel borderColor={isActive ? '#00FF9D' : '#ffffff20'} className="p-8">
          {/* Phase indicator */}
          <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ x: -20, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              isActive ? 'bg-[#00FF9D]/20 border-[#00FF9D] shadow-[0_0_20px_#00FF9D40]' : 'bg-white/5 border-white/20'
            }`}>
              <Zap className={`w-6 h-6 transition-colors ${isActive ? 'text-[#00FF9D]' : 'text-white/40'}`} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-mono">Phase 01 • The Source</span>
          </motion.div>

          {/* NEW: Plain English headline (The Benefit) */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
          >
            We Catch the Spreads<br />
            <span className="text-[#00FF9D]">You Miss.</span>
          </motion.h2>

          {/* NEW: Technical subtitle (The Proof) */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-400 mb-8 font-mono"
          >
            Powered by <span className="text-[#00FF9D]">GMT Core JIT Execution</span>.
          </motion.p>

          {/* Scanner Animation */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <ScannerAnimation isActive={isActive && isInView} />
          </motion.div>
        </GlassPanel>
      </div>
    </motion.section>
  );
};

// ============================================
// SECTION 2: THE LOCK - Mechanical Gears
// ============================================

const GearAnimation = ({ isActive }: { isActive: boolean }) => {
  const [countdown, setCountdown] = useState({ days: 14, hours: 0, mins: 0 });
  
  useEffect(() => {
    if (isActive) {
      const timer = setInterval(() => {
        setCountdown(prev => ({
          ...prev,
          mins: prev.mins > 0 ? prev.mins - 1 : 59,
          hours: prev.mins === 0 ? (prev.hours > 0 ? prev.hours - 1 : 23) : prev.hours,
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive]);

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-black/60">
      {/* Main gear */}
      <motion.svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
        viewBox="0 0 100 100"
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <path
          d="M50 10 L55 25 L70 20 L65 35 L80 40 L65 50 L80 60 L65 65 L70 80 L55 75 L50 90 L45 75 L30 80 L35 65 L20 60 L35 50 L20 40 L35 35 L30 20 L45 25 Z"
          fill="none"
          stroke="#00B8D4"
          strokeWidth="2"
        />
        <circle cx="50" cy="50" r="15" fill="none" stroke="#00B8D4" strokeWidth="2" />
      </motion.svg>
      
      {/* Secondary gear (counter-rotate) */}
      <motion.svg
        className="absolute left-[25%] top-1/2 -translate-y-1/2 w-20 h-20 opacity-60"
        viewBox="0 0 100 100"
        animate={isActive ? { rotate: -360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <path
          d="M50 15 L55 30 L70 25 L65 40 L80 45 L65 55 L75 70 L60 65 L55 80 L45 70 L30 75 L35 60 L20 55 L35 45 L25 30 L40 35 Z"
          fill="none"
          stroke="#00B8D4"
          strokeWidth="1.5"
        />
        <circle cx="50" cy="50" r="12" fill="none" stroke="#00B8D4" strokeWidth="1.5" />
      </motion.svg>
      
      {/* Third gear */}
      <motion.svg
        className="absolute right-[25%] top-1/2 -translate-y-1/2 w-20 h-20 opacity-60"
        viewBox="0 0 100 100"
        animate={isActive ? { rotate: -360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <path
          d="M50 15 L55 30 L70 25 L65 40 L80 45 L65 55 L75 70 L60 65 L55 80 L45 70 L30 75 L35 60 L20 55 L35 45 L25 30 L40 35 Z"
          fill="none"
          stroke="#00B8D4"
          strokeWidth="1.5"
        />
        <circle cx="50" cy="50" r="12" fill="none" stroke="#00B8D4" strokeWidth="1.5" />
      </motion.svg>
      
      {/* Energy beam entering gears */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-[#00FF9D] to-[#00B8D4]"
        animate={{ opacity: isActive ? [0.3, 1, 0.3] : 0.2 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Energy beam exiting gears */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-[#00B8D4] to-[#D4AF37]"
        animate={{ opacity: isActive ? [0.3, 1, 0.3] : 0.2 }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      
      {/* Countdown Timer Overlay */}
      <div className="absolute top-4 left-4 bg-black/80 border border-[#00B8D4]/50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          <Clock className="w-3 h-3" />
          <span>Until Maturity</span>
        </div>
        <div className="font-mono text-[#00B8D4] font-bold text-lg">
          T-{countdown.days}D {String(countdown.hours).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}
        </div>
      </div>
      
      {/* Status */}
      <div className="absolute bottom-3 right-3">
        <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${
          isActive ? 'bg-[#00B8D4]/20 text-[#00B8D4]' : 'bg-white/10 text-white/40'
        }`}>
          {isActive ? '● BONDING' : '○ IDLE'}
        </span>
      </div>
    </div>
  );
};

const LockSection = ({ isActive }: { isActive: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[80vh] flex items-center py-20"
    >
      <div className="w-full max-w-3xl mx-auto px-6">
        <GlassPanel borderColor={isActive ? '#00B8D4' : '#ffffff20'} className="p-8">
          {/* Phase indicator */}
          <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ x: -20, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              isActive ? 'bg-[#00B8D4]/20 border-[#00B8D4] shadow-[0_0_20px_#00B8D440]' : 'bg-white/5 border-white/20'
            }`}>
              <Lock className={`w-6 h-6 transition-colors ${isActive ? 'text-[#00B8D4]' : 'text-white/40'}`} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-mono">Phase 02 • The Lock</span>
          </motion.div>

          {/* NEW: Plain English headline */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
          >
            Why We Lock<br />
            <span className="text-[#00B8D4]">Your Funds.</span>
          </motion.h2>

          {/* Technical subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-400 mb-8 font-mono"
          >
            Solvency ensured via <span className="text-[#00B8D4]">14-Day Bonding Epochs</span>.
          </motion.p>

          {/* Gear Animation */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <GearAnimation isActive={isActive && isInView} />
          </motion.div>
        </GlassPanel>
      </div>
    </motion.section>
  );
};

// ============================================
// SECTION 3: THE ASSET - Prism Refraction
// ============================================

interface AssetCardProps {
  title: string;
  subtitle: string;
  yieldValue: string;
  icon: React.ReactNode;
  image?: string;
  delay: number;
  isActive: boolean;
}

const AssetCard = ({ title, subtitle, yieldValue, icon, delay, isActive }: AssetCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background image on hover (for REITs) */}
      {title === "Singapore REITs" && (
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.3 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=200&fit=crop")',
              filter: 'saturate(0.5)'
            }}
          />
        </motion.div>
      )}
      
      <div 
        className={`relative backdrop-blur-xl rounded-xl p-5 transition-all duration-300 ${
          isActive 
            ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/50 hover:border-[#D4AF37]' 
            : 'bg-white/5 border border-white/10'
        }`}
        style={isActive ? { boxShadow: '0 0 20px #D4AF3720' } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-[#D4AF37]/20' : 'bg-white/5'
            }`}>
              {icon}
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg">{title}</h4>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-mono font-bold text-2xl ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`}>
              {yieldValue}
            </p>
            <p className="text-xs text-slate-600 uppercase">APY</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PrismAnimation = ({ isActive }: { isActive: boolean }) => (
  <div className="relative h-32 w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/40 mb-6">
    {/* Incoming green beam */}
    <motion.div
      className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-[#00FF9D] to-[#00B8D4]"
      animate={isActive ? { width: ['0%', '40%'] } : { width: '0%' }}
      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
    />
    
    {/* Prism */}
    <div className="relative z-10">
      <motion.div
        className="w-16 h-16 rotate-45 border-2 border-white/40 bg-gradient-to-br from-white/10 to-white/5"
        animate={isActive ? { 
          borderColor: ['rgba(255,255,255,0.4)', 'rgba(212,175,55,0.8)', 'rgba(255,255,255,0.4)'],
          boxShadow: ['0 0 0px transparent', '0 0 30px #D4AF37', '0 0 0px transparent']
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
    
    {/* Outgoing gold beams (refracted) */}
    <motion.div
      className="absolute right-0 top-[30%] h-1 bg-gradient-to-r from-[#D4AF37] to-transparent"
      animate={isActive ? { width: ['0%', '40%'] } : { width: '0%' }}
      transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
    />
    <motion.div
      className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-[#D4AF37] to-transparent"
      animate={isActive ? { width: ['0%', '45%'] } : { width: '0%' }}
      transition={{ duration: 1, delay: 0.6, repeat: Infinity, repeatDelay: 2 }}
    />
    <motion.div
      className="absolute right-0 top-[70%] h-1 bg-gradient-to-r from-[#B8860B] to-transparent"
      animate={isActive ? { width: ['0%', '35%'] } : { width: '0%' }}
      transition={{ duration: 1, delay: 0.7, repeat: Infinity, repeatDelay: 2 }}
    />
    
    {/* Labels */}
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#00FF9D]">YIELD</span>
    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#D4AF37]">GOLD</span>
  </div>
);

const AssetSection = ({ isActive }: { isActive: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  
  const assets = [
    { title: "Singapore REITs", subtitle: "Commercial Property Trust", yieldValue: "4.8%", icon: <Landmark className="w-6 h-6 text-[#00FF9D]" /> },
    { title: "US Treasury Bills", subtitle: "Short-term Government Bonds", yieldValue: "5.2%", icon: <Shield className="w-6 h-6 text-[#00B8D4]" /> },
    { title: "Tokenized Gold", subtitle: "LBMA Certified Reserves", yieldValue: "2.1%", icon: <span className="text-[#D4AF37] font-bold text-xl">Au</span> },
  ];
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[80vh] flex items-center py-20"
    >
      <div className="w-full max-w-3xl mx-auto px-6">
        <GlassPanel borderColor={isActive ? '#D4AF37' : '#ffffff20'} className="p-8">
          {/* Phase indicator */}
          <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ x: -20, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              isActive ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-[0_0_20px_#D4AF3740]' : 'bg-white/5 border-white/20'
            }`}>
              <Landmark className={`w-6 h-6 transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-mono">Phase 03 • The Asset</span>
          </motion.div>

          {/* NEW: Plain English headline */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
          >
            Backed by<br />
            <span className="text-[#D4AF37]">Real World Assets.</span>
          </motion.h2>

          {/* Technical subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-400 mb-8 font-mono"
          >
            Yields are swept into <span className="text-[#D4AF37]">audited physical vaults</span>.
          </motion.p>

          {/* Prism Animation */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <PrismAnimation isActive={isActive && isInView} />
          </motion.div>
          
          {/* Asset Cards */}
          <div className="space-y-3">
            {assets.map((asset, i) => (
              <AssetCard 
                key={asset.title} 
                {...asset} 
                delay={0.6 + i * 0.1} 
                isActive={isActive}
              />
            ))}
          </div>
        </GlassPanel>
      </div>
    </motion.section>
  );
};

// ============================================
// DOCUMENT FOOTER - Terminal Style
// ============================================

interface DocFileProps {
  name: string;
  size: string;
  hash: string;
  delay: number;
}

const DocumentFile = ({ name, size, hash, delay }: DocFileProps) => {
  const [copied, setCopied] = useState(false);
  
  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between p-4 bg-black/60 border border-white/10 rounded-lg hover:border-[#00FF9D]/30 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-red-500/10 rounded">
          <FileText className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-xs text-slate-600 font-mono">{size}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Hash display */}
        <code className="text-xs text-slate-500 font-mono hidden md:block">
          {hash.slice(0, 8)}...{hash.slice(-8)}
        </code>
        
        {/* Verify Hash button */}
        <button
          onClick={copyHash}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded text-xs font-mono text-[#00FF9D] hover:bg-[#00FF9D]/20 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Terminal className="w-3 h-3" />
              <span>Verify Hash</span>
            </>
          )}
        </button>
        
        <Download className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
      </div>
    </motion.div>
  );
};

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
    { name: "GMT_Architecture_v9.2.pdf", size: "2.4 MB", hash: "0x7a3f8c2e1d4b5a6f9e8c7d2b3a1f4e5d6c7b8a9f" },
    { name: "Bonding_Settlement_Mechanics.pdf", size: "1.8 MB", hash: "0x2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f4a6b8c" },
    { name: "RWA_Title_Attestation.pdf", size: "892 KB", hash: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e" },
  ];

  // Determine active sections
  const isSourceActive = progress < 0.4;
  const isLockActive = progress >= 0.3 && progress < 0.7;
  const isAssetActive = progress >= 0.6;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-[#0B1015]">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
        style={{ 
          scaleX: smoothProgress,
          background: 'linear-gradient(90deg, #00FF9D 0%, #00B8D4 50%, #D4AF37 100%)'
        }}
      />
      
      <div className="relative max-w-5xl mx-auto">
        {/* Energy Beam */}
        <EnergyBeam scrollProgress={progress} />
        
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 pt-16 pb-8 px-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded-full mb-6">
            <Cpu className="w-4 h-4 text-[#00FF9D]" />
            <span className="text-xs font-mono text-[#00FF9D] uppercase tracking-wider">System Architecture v2.1</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
            ASSET <span className="text-[#00FF9D]">PROTOCOL</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-8 max-w-xl mx-auto">
            Code is Law. <span className="text-white font-medium">From Execution to Settlement.</span>
          </p>
          
          <motion.div
            className="flex items-center justify-center gap-2 text-slate-600"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm">Scroll to explore the pipeline</span>
            <span>↓</span>
          </motion.div>
        </motion.header>

        {/* Sections */}
        <div className="relative z-10">
          <SourceSection isActive={isSourceActive} />
          <LockSection isActive={isLockActive} />
          <AssetSection isActive={isAssetActive} />
        </div>

        {/* Documentation Footer */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative z-10 px-6 py-16 border-t border-white/5"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-slate-800 rounded-lg">
                <Terminal className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Protocol Documentation</h3>
                <p className="text-sm text-slate-500">Technical specifications • On-chain verified</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <DocumentFile key={doc.name} {...doc} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t border-white/5">
          <p className="text-xs text-slate-600 font-mono uppercase tracking-wider">
            CapWheel Protocol v2.1 • Kinetic Framework • Audited
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AssetProtocol;
