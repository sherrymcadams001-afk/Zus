/**
 * Asset Protocol Page - "Code is Law"
 * 
 * Card-based layout explaining the CapWheel system architecture
 * Narrative: "From Execution to Settlement"
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Cpu, 
  Lock, 
  Landmark,
  ExternalLink,
  Shield,
  CheckCircle2
} from 'lucide-react';

// ============================================
// ANIMATION HELPERS
// ============================================

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
  })
};

// ============================================
// SECTION 1: EXECUTION LAYER - Network Nodes
// ============================================

const NetworkNode = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1, 1, 0.8, 1], opacity: [0, 1, 1, 0.7, 1] }}
    transition={{ duration: 3, delay, repeat: Infinity, repeatDelay: 2 }}
  >
    <div className="relative">
      <div className="absolute inset-0 w-3 h-3 bg-[#00FF9D] rounded-full blur-md opacity-60" />
      <div className="relative w-3 h-3 bg-[#00FF9D] rounded-full border border-[#00FF9D]/50" />
    </div>
  </motion.div>
);

const NetworkConnection = ({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) => (
  <motion.line
    x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
    stroke="#00FF9D" strokeWidth="1" strokeOpacity="0.3"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 1.5, delay, ease: "easeInOut" }}
  />
);

const ExecutionLayerVisual = () => {
  const nodes = [
    { x: 15, y: 25, delay: 0 }, { x: 40, y: 10, delay: 0.3 }, { x: 70, y: 20, delay: 0.5 },
    { x: 25, y: 55, delay: 0.7 }, { x: 55, y: 45, delay: 0.2 }, { x: 85, y: 50, delay: 0.9 },
    { x: 20, y: 85, delay: 0.4 }, { x: 60, y: 80, delay: 0.6 }, { x: 90, y: 75, delay: 0.8 },
  ];
  const connections = [
    { x1: 15, y1: 25, x2: 40, y2: 10, delay: 0.5 }, { x1: 40, y1: 10, x2: 70, y2: 20, delay: 0.7 },
    { x1: 15, y1: 25, x2: 25, y2: 55, delay: 0.6 }, { x1: 25, y1: 55, x2: 55, y2: 45, delay: 0.8 },
    { x1: 55, y1: 45, x2: 85, y2: 50, delay: 1.0 }, { x1: 40, y1: 10, x2: 55, y2: 45, delay: 0.9 },
    { x1: 70, y1: 20, x2: 85, y2: 50, delay: 1.1 }, { x1: 25, y1: 55, x2: 20, y2: 85, delay: 1.2 },
    { x1: 55, y1: 45, x2: 60, y2: 80, delay: 1.3 }, { x1: 85, y1: 50, x2: 90, y2: 75, delay: 1.4 },
  ];

  return (
    <div className="relative w-full h-40">
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,157,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.3) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />
      <svg className="absolute inset-0 w-full h-full">
        {connections.map((conn, i) => <NetworkConnection key={i} {...conn} />)}
      </svg>
      {nodes.map((node, i) => <NetworkNode key={i} {...node} />)}
      <motion.div
        className="absolute left-0 top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00FF9D]/50 to-transparent"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// ============================================
// SECTION 2: BONDING LAYER - Compressor
// ============================================

const BondingLayerVisual = () => (
  <div className="relative w-full h-40 flex items-center justify-center overflow-hidden">
    {/* Compressor Plates */}
    <motion.div
      className="absolute top-0 left-1/4 right-1/4 h-5 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg border-b-2 border-slate-500"
      animate={{ y: [0, 40, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-0 left-1/4 right-1/4 h-5 bg-gradient-to-t from-slate-600 to-slate-800 rounded-t-lg border-t-2 border-slate-500"
      animate={{ y: [0, -40, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Green particles in */}
    <div className="absolute left-2 top-1/2 -translate-y-1/2 space-y-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-[#00FF9D] rounded-full shadow-[0_0_8px_#00FF9D]"
          animate={{ x: [0, 80, 80], opacity: [1, 1, 0], scale: [1, 0.7, 0.4] }}
          transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, repeatDelay: 0.5 }}
        />
      ))}
    </div>
    {/* Lock center */}
    <motion.div
      className="relative w-16 h-16 flex items-center justify-center"
      animate={{ scale: [1, 0.85, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9D]/20 to-[#D4AF37]/20 rounded-lg blur-lg" />
      <Lock className="w-8 h-8 text-[#D4AF37]" />
    </motion.div>
    {/* Gold blocks out */}
    <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded shadow-[0_0_8px_#D4AF37]"
          initial={{ x: -80, opacity: 0, scale: 0.4 }}
          animate={{ x: [-80, 0, 0], opacity: [0, 1, 1], scale: [0.4, 1, 1] }}
          transition={{ duration: 2, delay: i * 0.5 + 1, repeat: Infinity, repeatDelay: 1 }}
        />
      ))}
    </div>
  </div>
);

// ============================================
// SECTION 3: ANCHOR LAYER - RWA Cards
// ============================================

interface AssetCardProps {
  title: string;
  subtitle: string;
  yieldValue: string;
  icon: React.ReactNode;
  delay: number;
}

const GlassAssetCard = ({ title, subtitle, yieldValue, icon, delay }: AssetCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-white/5 hover:border-[#00FF9D]/20 transition-all"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 bg-[#00FF9D]/10 rounded-lg shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium text-sm truncate">{title}</h4>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-slate-600 uppercase">Yield</span>
          <span className="text-[#00FF9D] font-mono text-xs font-bold">{yieldValue}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const AnchorLayerVisual = () => {
  const assets = [
    { title: "Singapore REITs", subtitle: "Commercial Property Trust", yieldValue: "4.8% APY", icon: <Landmark className="w-4 h-4 text-[#00FF9D]" /> },
    { title: "US Treasury Bills", subtitle: "Short-term Gov Bonds", yieldValue: "5.2% APY", icon: <Shield className="w-4 h-4 text-[#00B8D4]" /> },
    { title: "Tokenized Gold", subtitle: "LBMA Certified", yieldValue: "2.1% APY", icon: <span className="text-[#D4AF37] font-bold text-sm">Au</span> },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {assets.map((asset, i) => <GlassAssetCard key={asset.title} {...asset} delay={i * 0.1} />)}
    </div>
  );
};

// ============================================
// PROTOCOL CARD COMPONENT
// ============================================

interface ProtocolCardProps {
  index: number;
  phase: string;
  headline: string;
  copy: string;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
  delay: number;
}

const ProtocolCard = ({ index, phase, headline, copy, badge, badgeColor, children, delay }: ProtocolCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      custom={delay}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={cardVariants}
      className="bg-[#0F1419] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
    >
      {/* Phase Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center shrink-0">
          <span className="text-[#00FF9D] font-bold text-sm">{index}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{phase}</span>
      </div>

      {/* Title & Copy */}
      <h3 className="text-lg font-bold text-white mb-2">{headline}</h3>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">{copy}</p>

      {/* Badge */}
      <div className="mb-4">
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
          style={{ backgroundColor: `${badgeColor}10`, borderColor: `${badgeColor}30`, color: badgeColor }}
        >
          <CheckCircle2 className="w-3 h-3" />
          {badge}
        </span>
      </div>

      {/* Visual */}
      <div className="bg-black/20 rounded-lg overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

// ============================================
// DOCUMENT FILE ROW
// ============================================

interface DocFileProps {
  name: string;
  size: string;
  delay: number;
}

const DocumentFile = ({ name, size, delay }: DocFileProps) => (
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
  const documents = [
    { name: "GMT_Architecture_v9.2.pdf", size: "2.4 MB" },
    { name: "Bonding_Settlement_Mechanics.pdf", size: "1.8 MB" },
    { name: "RWA_Title_Attestation.pdf", size: "892 KB" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0B1015] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#00FF9D]/10 rounded-xl shrink-0">
              <Cpu className="w-6 h-6 text-[#00FF9D]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">ASSET PROTOCOL</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#00FF9D]/10 border border-[#00FF9D]/20 text-[#00FF9D] text-[10px] font-bold uppercase">
                  v2.1
                </span>
              </div>
              <p className="text-slate-400">
                Code is Law. <span className="text-white font-medium">From Execution to Settlement.</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Protocol Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProtocolCard
            index={1}
            phase="The Source"
            headline="Just-In-Time Execution"
            copy="The GMT Core scans the mempool. The Protocol injects liquidity only when profitable spreads are mathematically guaranteed."
            badge="AUTONOMOUS"
            badgeColor="#00FF9D"
            delay={0}
          >
            <ExecutionLayerVisual />
          </ProtocolCard>

          <ProtocolCard
            index={2}
            phase="The Lock"
            headline="The Bonding Cycle"
            copy="To ensure solvency, the Protocol enforces Strategy-Aligned Bonding Epochs. This aligns liquidity depth with institutional order flow maturity."
            badge="HARD CODED"
            badgeColor="#D4AF37"
            delay={1}
          >
            <BondingLayerVisual />
          </ProtocolCard>
        </div>

        {/* RWA Finality - Full Width */}
        <ProtocolCard
          index={3}
          phase="The Asset"
          headline="RWA Finality"
          copy="Yield is not left idle. The Protocol sweeps excess variance into Tokenized Real World Assets for long-term preservation."
          badge="VERIFIED"
          badgeColor="#00B8D4"
          delay={2}
        >
          <div className="p-4">
            <AnchorLayerVisual />
          </div>
        </ProtocolCard>

        {/* Documentation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Protocol Documentation</h3>
              <p className="text-xs text-slate-500">Technical specifications & attestations</p>
            </div>
          </div>
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <DocumentFile key={doc.name} {...doc} delay={0.4 + i * 0.1} />
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
            CapWheel Protocol v2.1 • Kinetic Framework
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetProtocol;
