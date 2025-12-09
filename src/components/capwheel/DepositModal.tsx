import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiClient } from '../../api/client';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Fetch wallet address when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLoadingAddress(true);
      apiClient.get('/api/wallet/deposit-address')
        .then(res => {
          if (res.data.status === 'success') {
            setWalletAddress(res.data.data.address);
          }
        })
        .catch(err => console.error('Failed to fetch deposit address', err))
        .finally(() => setLoadingAddress(false));
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiClient.post('/api/wallet/deposit', {
        amount: parseFloat(amount),
        txHash: txHash || `MANUAL-${Date.now()}`, // Generate a placeholder if not provided
        network: 'TRC20',
        description: `USDT Deposit (TRC20)`
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep('details');
        setAmount('');
        setTxHash('');
      }, 2000);
    } catch (err) {
      setError('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="border-gray-700 bg-[#12181F] p-6 space-y-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-[#00FF9D]/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-[#00FF9D]" />
              </div>
              <h3 className="text-xl font-bold text-white">Deposit Submitted</h3>
              <p className="text-gray-400">
                Your deposit request has been received. <br/>
                Funds will be credited after admin verification.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-xl font-bold text-white">Deposit USDT</h3>
                <p className="text-sm text-gray-400">Send USDT (TRC20) to the address below</p>
              </div>

              <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-lg border border-white/10 space-y-2">
                  <div className="text-xs text-gray-500 uppercase">Company Wallet (TRC20)</div>
                  <div className="flex items-center justify-between gap-2">
                    {loadingAddress ? (
                      <div className="text-gray-500 text-sm animate-pulse">Loading address...</div>
                    ) : walletAddress ? (
                      <>
                        <code className="text-[#00FF9D] font-mono text-sm break-all">
                          {walletAddress}
                        </code>
                        <button 
                          onClick={handleCopy}
                          className="p-2 hover:bg-white/10 rounded-md transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-[#00FF9D]" /> : <Copy className="w-4 h-4 text-gray-400" />}
                        </button>
                      </>
                    ) : (
                      <div className="text-yellow-500 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Deposits currently unavailable</span>
                      </div>
                    )}
                  </div>
                </div>

                {walletAddress && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`}
                      alt="Wallet QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-xs text-yellow-200/80">
                    Only send USDT on the TRON (TRC20) network. Sending other assets may result in permanent loss.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Amount Sent (USDT)</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="10"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Transaction Hash (Optional)</label>
                    <Input
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="Paste transaction hash (speeds up verification)"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Providing the TxID helps us verify your deposit faster.
                    </p>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#00FF9D] text-black hover:bg-[#00E88A]"
                    disabled={isSubmitting || !amount || !walletAddress}
                  >
                    {isSubmitting ? 'Submitting...' : 'I Have Sent The Funds'}
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
