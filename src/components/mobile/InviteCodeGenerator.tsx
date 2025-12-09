import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InviteCodeGenerator = () => {
  const [copied, setCopied] = useState(false);
  const inviteCode = "CW-ALPHA-7X92"; // This would come from API in real implementation

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join CapWheel',
          text: `Join me on CapWheel with code ${inviteCode}`,
          url: window.location.origin,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-[#0f1621] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Invite Network</h3>
        <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">ACTIVE</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 flex items-center px-3 font-mono text-sm text-slate-300">
          {inviteCode}
        </div>
        
        <button
          onClick={handleCopy}
          className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check size={18} className="text-emerald-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy size={18} className="text-slate-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={handleShare}
          className="h-10 w-10 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors"
        >
          <Share2 size={18} className="text-emerald-500" />
        </button>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Referrals: 0</span>
        <span>Volume: /bin/zsh.00</span>
      </div>
    </div>
  );
};
