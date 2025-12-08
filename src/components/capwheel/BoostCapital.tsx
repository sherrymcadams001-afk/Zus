/**
 * ORION Boost Capital Component
 * 
 * Capital injection interface - NEVER use the word "Deposit"
 * Framed as investment opportunity, not spending
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface BoostCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BoostCapitalModal = ({ isOpen, onClose, onSuccess }: BoostCapitalModalProps) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBoost = async () => {
    const numAmount = parseFloat(amount);
    
    // Validation
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < 100) {
      setError('Minimum boost amount is $100');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call API to boost capital (deposit)
      const response = await apiClient.post('/api/wallet/deposit', {
        amount: numAmount,
        currency: 'USD',
      });

      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setAmount('');
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to boost capital');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 5000, 10000, 25000];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-[#0F1419] border border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#00FF9D]/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00FF9D]/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#00FF9D]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Boost Capital</h2>
                    <p className="text-xs text-slate-400">Accelerate your wealth growth</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <CheckCircle2 className="w-16 h-16 text-[#00FF9D] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Capital Boosted!</h3>
                    <p className="text-sm text-slate-400">Your investment is now active</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Boost Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg">
                          $
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-mono focus:border-[#00FF9D]/50 focus:outline-none transition-colors"
                          min="100"
                          step="100"
                        />
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Quick Select</p>
                      <div className="grid grid-cols-3 gap-2">
                        {quickAmounts.map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setAmount(amt.toString())}
                            className={`px-3 py-2 rounded-lg text-sm font-mono font-medium transition-all active:scale-[0.98] ${
                              amount === amt.toString()
                                ? 'bg-[#00FF9D] text-black'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            ${amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-[#00B8D4]/10 border border-[#00B8D4]/30 rounded-lg p-3">
                      <p className="text-xs text-[#00B8D4]">
                        💡 Higher capital unlocks premium tiers with increased daily returns up to 1.8%
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white/5 text-slate-400 font-medium rounded-lg hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBoost}
                        disabled={isProcessing || !amount}
                        className="flex-1 px-4 py-3 bg-[#00FF9D] text-black font-bold rounded-lg hover:bg-[#00FF9D]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,157,0.2)]"
                      >
                        {isProcessing ? 'Processing...' : 'Boost Capital'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Boost Capital Button Component
interface BoostCapitalButtonProps {
  variant?: 'primary' | 'secondary' | 'compact';
  className?: string;
}

export const BoostCapitalButton = ({ variant = 'primary', className = '' }: BoostCapitalButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const variants = {
    primary: 'px-6 py-3 bg-[#00FF9D] text-black font-bold text-sm rounded-lg hover:bg-[#00FF9D]/90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,157,0.15)]',
    secondary: 'px-4 py-2 bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30 font-semibold text-sm rounded-lg hover:bg-[#00FF9D]/20 active:scale-[0.98] transition-all',
    compact: 'px-3 py-1.5 bg-[#00FF9D] text-black font-bold text-xs rounded-lg hover:bg-[#00FF9D]/90 active:scale-[0.98] transition-all',
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${variants[variant]} ${className} flex items-center gap-2`}
      >
        <TrendingUp className={variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} />
        Boost Capital
      </button>

      <BoostCapitalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Close modal and let polling refresh the data
          setIsModalOpen(false);
        }}
      />
    </>
  );
};
