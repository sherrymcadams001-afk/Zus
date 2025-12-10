/**
 * Asset Protocol - Circular Flow Layout
 * 
 * Compact interconnected design showing clear asset movement
 * Principle: "I know exactly where to go" - Directed user flow
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Cpu, 
  Lock, 
  Landmark,
  Shield,
  Zap,
  ArrowRight,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';

// ============================================
// FLOW CONNECTOR - Animated arrows between phases
// ============================================

const FlowConnector = ({ direction = 'right', delay = 0 }: { direction?: 'right' | 'down'; delay?: number }) => (
  <motion.div 
    className={`flex items-center justify-center ${direction === 'down' ? 'py-2' : 'px-2'}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
  >
    <motion.div
      animate={{ 
        x: direction === 'right' ? [0, 4, 0] : 0,
        y: direction === 'down' ? [0, 4, 0] : 0,
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {direction === 'right' ? (
        <ArrowRight className="w-5 h-5 text-[#00FF9D]/60" />
      ) : (
        <ArrowDown className="w-5 h-5 text-[#00FF9D]/60" />
      )}
    </motion.div>
  </motion.div>
);

// ============================================
// PHASE CARD - Compact phase representation
// ============================================

interface PhaseCardProps {
  phase: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  status: string;
  delay: number;
}

const PhaseCard = ({ phase, title, subtitle, icon, color, status, delay }: PhaseCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay }}
      className="relative"
    >
      <div 
        className="bg-[#0F1419] border rounded-xl p-4 hover:scale-[1.02] transition-transform cursor-default"
        style={{ borderColor: `${color}40` }}
      >
        {/* Phase number badge */}
        <div 
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: color, color: '#0B1015' }}
        >
          {phase}
        </div>
        
        {/* Icon */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        
        {/* Content */}
        <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
        <p className="text-slate-500 text-xs mb-2 leading-relaxed">{subtitle}</p>
        
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-mono uppercase" style={{ color }}>{status}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// ASSET PILL - Compact asset display
// ============================================

interface AssetPillProps {
  title: string;
  yield: string;
  icon: React.ReactNode;
  delay: number;
}

const AssetPill = ({ title, yield: yieldValue, icon, delay }: AssetPillProps) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-3 bg-[#0F1419] border border-[#D4AF37]/30 rounded-lg hover:border-[#D4AF37]/60 transition-colors"
  >
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded bg-[#D4AF37]/10 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-white text-sm font-medium">{title}</span>
    </div>
    <span className="text-[#D4AF37] font-mono text-sm font-bold">{yieldValue}</span>
  </motion.div>
);

// ============================================
// DOCUMENT ROW - Minimal file display
// ============================================

const DocumentRow = ({ name, hash }: { name: string; hash: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2">
      <FileText className="w-3.5 h-3.5 text-red-400" />
      <span className="text-white text-xs">{name}</span>
    </div>
    <div className="flex items-center gap-2">
      <code className="text-[10px] text-slate-600 font-mono">{hash.slice(0, 10)}...</code>
      <Download className="w-3 h-3 text-slate-500 hover:text-white cursor-pointer" />
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const AssetProtocol = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const assets = [
    { title: "Singapore REITs", yield: "4.8%", icon: <Landmark className="w-4 h-4 text-[#00FF9D]" /> },
    { title: "US Treasury Bills", yield: "5.2%", icon: <Shield className="w-4 h-4 text-[#00B8D4]" /> },
    { title: "Tokenized Gold", yield: "2.1%", icon: <span className="text-[#D4AF37] font-bold text-xs">Au</span> },
  ];

  const documents = [
    { name: "GMT_Architecture_v9.2.pdf", hash: "0x7a3f8c2e1d4b" },
    { name: "Bonding_Mechanics.pdf", hash: "0x2b4c6d8e0f1a" },
    { name: "RWA_Attestation.pdf", hash: "0x9f8e7d6c5b4a" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0B1015] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header - Minimal */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00FF9D]/10 rounded-lg">
              <Cpu className="w-5 h-5 text-[#00FF9D]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Asset Protocol</h1>
              <p className="text-xs text-slate-500">From Execution to Settlement</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-[#00FF9D]/10 border border-[#00FF9D]/20 rounded text-[10px] text-[#00FF9D] font-mono">
            v2.1
          </span>
        </motion.div>

        {/* Flow Diagram - Circular Grid */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="relative mb-8"
        >
          {/* Central Flow Visualization */}
          <div className="bg-[#0F1419]/50 border border-white/5 rounded-2xl p-6">
            
            {/* Top Row: Source → Lock */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-4">
              <PhaseCard
                phase={1}
                title="Execution"
                subtitle="JIT scanning for guaranteed spreads"
                icon={<Zap className="w-5 h-5 text-[#00FF9D]" />}
                color="#00FF9D"
                status="Scanning"
                delay={0.1}
              />
              
              <FlowConnector direction="right" delay={0.3} />
              
              <PhaseCard
                phase={2}
                title="Bonding"
                subtitle="14-day epochs ensure solvency"
                icon={<Lock className="w-5 h-5 text-[#00B8D4]" />}
                color="#00B8D4"
                status="T-14 Days"
                delay={0.2}
              />
            </div>
            
            {/* Arrow Down to Settlement */}
            <div className="flex justify-end pr-[25%]">
              <FlowConnector direction="down" delay={0.4} />
            </div>
            
            {/* Bottom Row: Settlement */}
            <div className="grid grid-cols-[1fr_1fr] gap-4">
              {/* Empty space for alignment */}
              <div />
              
              <PhaseCard
                phase={3}
                title="Settlement"
                subtitle="Swept into audited RWA vaults"
                icon={<Landmark className="w-5 h-5 text-[#D4AF37]" />}
                color="#D4AF37"
                status="Verified"
                delay={0.3}
              />
            </div>
            
            {/* Flow Summary */}
            <motion.div 
              className="mt-6 pt-4 border-t border-white/5"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00FF9D]" />
                  <span className="text-slate-400">Volatile</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00B8D4]" />
                  <span className="text-slate-400">Bonded</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span className="text-slate-400">Settled</span>
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Grid: Assets + Documents */}
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* RWA Assets */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#0F1419] border border-white/5 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-sm font-semibold text-white">Vault Contents</h3>
            </div>
            <div className="space-y-2">
              {assets.map((asset, i) => (
                <AssetPill key={asset.title} {...asset} delay={0.7 + i * 0.1} />
              ))}
            </div>
          </motion.div>
          
          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
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
        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-600 font-mono">
            CAPWHEEL PROTOCOL v2.1 • KINETIC FRAMEWORK
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetProtocol;
