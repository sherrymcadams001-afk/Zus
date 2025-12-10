/**
 * Asset Protocol Page - "Code is Law"
 * 
 * Vertical scrolling page explaining the Laws of the CapWheel system
 * Narrative: "From Execution to Settlement"
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Cpu, 
  Lock, 
  Landmark,
  ExternalLink,
  Zap,
  Shield,
  CheckCircle2
} from 'lucide-react';

// ============================================
// SECTION 1: EXECUTION LAYER - 3D Network Nodes
// ============================================

const NetworkNode = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1, 1, 0.8, 1],
      opacity: [0, 1, 1, 0.7, 1],
    }}
    transition={{ 
      duration: 3,
      delay,
      repeat: Infinity,
      repeatDelay: 2
    }}
  >
    <div className="relative">
      <div className="absolute inset-0 w-4 h-4 bg-[#00FF9D] rounded-full blur-md opacity-60" />
      <div className="relative w-4 h-4 bg-[#00FF9D] rounded-full border-2 border-[#00FF9D]/50" />
    </div>
  </motion.div>
);

const NetworkConnection = ({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) => (
  <motion.line
    x1={`${x1}%`}
    y1={`${y1}%`}
    x2={`${x2}%`}
    y2={`${y2}%`}
    stroke="#00FF9D"
    strokeWidth="1"
    strokeOpacity="0.3"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 1.5, delay, ease: "easeInOut" }}
  />
);

const ExecutionLayerVisual = () => {
  const nodes = [
    { x: 20, y: 30, delay: 0 },
    { x: 45, y: 15, delay: 0.3 },
    { x: 70, y: 25, delay: 0.5 },
    { x: 30, y: 60, delay: 0.7 },
    { x: 55, y: 50, delay: 0.2 },
    { x: 80, y: 55, delay: 0.9 },
    { x: 25, y: 85, delay: 0.4 },
    { x: 60, y: 80, delay: 0.6 },
    { x: 85, y: 75, delay: 0.8 },
  ];

  const connections = [
    { x1: 20, y1: 30, x2: 45, y2: 15, delay: 0.5 },
    { x1: 45, y1: 15, x2: 70, y2: 25, delay: 0.7 },
    { x1: 20, y1: 30, x2: 30, y2: 60, delay: 0.6 },
    { x1: 30, y1: 60, x2: 55, y2: 50, delay: 0.8 },
    { x1: 55, y1: 50, x2: 80, y2: 55, delay: 1.0 },
    { x1: 45, y1: 15, x2: 55, y2: 50, delay: 0.9 },
    { x1: 70, y1: 25, x2: 80, y2: 55, delay: 1.1 },
    { x1: 30, y1: 60, x2: 25, y2: 85, delay: 1.2 },
    { x1: 55, y1: 50, x2: 60, y2: 80, delay: 1.3 },
    { x1: 80, y1: 55, x2: 85, y2: 75, delay: 1.4 },
    { x1: 25, y1: 85, x2: 60, y2: 80, delay: 1.5 },
    { x1: 60, y1: 80, x2: 85, y2: 75, delay: 1.6 },
  ];

  return (
    <div className="relative w-full h-64 md:h-80">
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,157,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <svg className="absolute inset-0 w-full h-full">
        {connections.map((conn, i) => (
          <NetworkConnection key={i} {...conn} />
        ))}
      </svg>
      {nodes.map((node, i) => (
        <NetworkNode key={i} {...node} />
      ))}
      <motion.div
        className="absolute left-0 top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF9D]/50 to-transparent"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// ============================================
// SECTION 2: BONDING LAYER - Compressor Animation
// ============================================

const BondingLayerVisual = () => {
  return (
    <div className="relative w-full h-64 md:h-80 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute top-0 left-1/4 right-1/4 h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg border-b-4 border-slate-500"
        animate={{ y: [0, 60, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 right-1/4 h-8 bg-gradient-to-t from-slate-600 to-slate-800 rounded-t-lg border-t-4 border-slate-500"
        animate={{ y: [0, -60, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute left-0 top-1/2 -translate-y-1/2 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-[#00FF9D] rounded-full shadow-[0_0_10px_#00FF9D]"
            animate={{ x: [0, 120, 120], opacity: [1, 1, 0], scale: [1, 0.8, 0.5] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, repeatDelay: 0.6 }}
          />
        ))}
      </div>

      <motion.div
        className="relative w-24 h-24 flex items-center justify-center"
        animate={{ scale: [1, 0.8, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9D]/20 to-[#D4AF37]/20 rounded-lg blur-xl" />
        <Lock className="w-12 h-12 text-[#D4AF37]" />
      </motion.div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-4 h-4 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded shadow-[0_0_10px_#D4AF37]"
            initial={{ x: -120, opacity: 0, scale: 0.5 }}
            animate={{ x: [-120, 0, 0], opacity: [0, 1, 1], scale: [0.5, 1, 1] }}
            transition={{ duration: 2, delay: i * 0.5 + 1, repeat: Infinity, repeatDelay: 1 }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// SECTION 3: ANCHOR LAYER - Glass Cards
// ============================================

interface AssetCardProps {
  title: string;
  subtitle: string;
  yieldValue: string;
  icon: React.ReactNode;
  delay: number;
}

const GlassAssetCard = ({ title, subtitle, yieldValue, icon, delay }: AssetCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="relative group"
      style={{ perspective: 1000 }}
    >
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-[#00FF9D]/10 rounded-xl">{icon}</div>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-1">{title}</h4>
            <p className="text-sm text-slate-400 mb-3">{subtitle}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase">Yield</span>
              <span className="text-[#00FF9D] font-mono font-bold">{yieldValue}</span>
            </div>
          </div>
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          animate={{ translateX: ['100%', '-100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>
    </motion.div>
  );
};

const AnchorLayerVisual = () => {
  const assets = [
    { title: "Singapore REITs", subtitle: "Commercial Property Trust", yieldValue: "4.8% APY", icon: <Landmark className="w-6 h-6 text-[#00FF9D]" /> },
    { title: "US Treasury Bills", subtitle: "Short-term Government Bonds", yieldValue: "5.2% APY", icon: <Shield className="w-6 h-6 text-[#00B8D4]" /> },
    { title: "Tokenized Gold", subtitle: "LBMA Certified Reserves", yieldValue: "2.1% APY", icon: <span className="w-6 h-6 text-[#D4AF37] font-bold text-lg">Au</span> },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {assets.map((asset, i) => (
        <GlassAssetCard key={asset.title} {...asset} delay={i * 0.15} />
      ))}
    </div>
  );
};

// ============================================
// SECTION 4: REFERENCE LIBRARY
// ============================================

interface DocFileProps {
  name: string;
  size: string;
  delay: number;
}

const DocumentFile = ({ name, size, delay }: DocFileProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#00FF9D]/30 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <FileText className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">{name}</p>
          <p className="text-xs text-slate-500">{size}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Download className="w-4 h-4 text-slate-400" />
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </div>
    </motion.div>
  );
};

// ============================================
// SECTION WRAPPER
// ============================================

interface ProtocolSectionProps {
  phase: string;
  headline: string;
  copy: string;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
  index: number;
}

const ProtocolSection = ({ phase, headline, copy, badge, badgeColor, children, index }: ProtocolSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
      className="min-h-[80vh] flex flex-col justify-center py-16 md:py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-10 h-10 rounded-full bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center">
          <span className="text-[#00FF9D] font-bold">{index}</span>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">{phase}</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-white mb-4"
      >
        {headline}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
        className="text-lg text-slate-400 mb-8 max-w-2xl leading-relaxed"
      >
        {copy}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <span 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border"
          style={{ backgroundColor: `${badgeColor}15`, borderColor: `${badgeColor}40`, color: badgeColor }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {badge}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AssetProtocol = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const documents = [
    { name: "GMT_Architecture_v9.2.pdf", size: "2.4 MB" },
    { name: "Bonding_Settlement_Mechanics.pdf", size: "1.8 MB" },
    { name: "RWA_Title_Attestation.pdf", size: "892 KB" },
  ];

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-[#0B1015]">
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-[#00FF9D] z-50 origin-left"
        style={{ width: progressWidth }}
      />

      <div className="max-w-4xl mx-auto px-6">
        <motion.header
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="min-h-[60vh] flex flex-col justify-center py-16"
        >
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF9D]/10 border border-[#00FF9D]/20 text-[#00FF9D] text-xs font-medium">
              <Cpu className="w-3.5 h-3.5" />
              SYSTEM ARCHITECTURE
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            ASSET<br />
            <span className="text-[#00FF9D]">PROTOCOL</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-xl">
            Code is Law.<br />
            <span className="text-white font-medium">From Execution to Settlement.</span>
          </p>

          <motion.div 
            className="flex items-center gap-2 text-slate-500"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm">Scroll to explore</span>
            <Zap className="w-4 h-4" />
          </motion.div>
        </motion.header>

        <ProtocolSection
          index={1}
          phase="The Source"
          headline="Phase 1: Just-In-Time Execution"
          copy="The GMT Core scans the mempool. The Protocol injects liquidity only when profitable spreads are mathematically guaranteed."
          badge="Status: AUTONOMOUS"
          badgeColor="#00FF9D"
        >
          <ExecutionLayerVisual />
        </ProtocolSection>

        <ProtocolSection
          index={2}
          phase="The Lock"
          headline="Phase 2: The Bonding Cycle"
          copy="To ensure solvency, the Protocol enforces Strategy-Aligned Bonding Epochs. This aligns liquidity depth with the specific Maturity of each institutional order flow."
          badge="Constraint: HARD CODED"
          badgeColor="#D4AF37"
        >
          <BondingLayerVisual />
        </ProtocolSection>

        <ProtocolSection
          index={3}
          phase="The Asset"
          headline="Phase 3: RWA Finality"
          copy="Yield is not left idle. The Protocol sweeps excess variance into Tokenized Real World Assets for long-term preservation."
          badge="Custody: VERIFIED"
          badgeColor="#00B8D4"
        >
          <AnchorLayerVisual />
        </ProtocolSection>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 md:py-24 border-t border-white/5"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Protocol Documentation</h3>
              <p className="text-sm text-slate-500">Technical specifications & attestations</p>
            </div>
          </div>

          <div className="space-y-3">
            {documents.map((doc, i) => (
              <DocumentFile key={doc.name} {...doc} delay={i * 0.1} />
            ))}
          </div>
        </motion.section>

        <footer className="py-12 border-t border-white/5 text-center">
          <p className="text-xs text-slate-600 font-mono">
            CAPWHEEL PROTOCOL v2.1 • KINETIC FRAMEWORK
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AssetProtocol;
