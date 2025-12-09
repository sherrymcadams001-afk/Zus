import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, AlertTriangle, Loader2, Bitcoin, Coins } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiClient } from '../../api/client';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CryptoId = 'btc' | 'eth' | 'ltc' | 'usdttrc20';

interface CryptoOption {
  id: CryptoId;
  symbol: string;
  name: string;
  network?: string;
  color: string;
}

const CRYPTO_OPTIONS: CryptoOption[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { id: 'ltc', symbol: 'LTC', name: 'Litecoin', color: '#BFBBBB' },
  { id: 'usdttrc20', symbol: 'USDT', name: 'Tether', network: 'TRC20', color: '#26A17B' },
];

type ModalStep = 'form' | 'payment' | 'success' | 'error';

interface PaymentData {
  transactionId: number;
  paymentId: number;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: string;
}

export const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const [step, setStep] = useState<ModalStep>('form');
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>(CRYPTO_OPTIONS[0]);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [_paymentStatus, setPaymentStatus] = useState<string>('waiting');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setAmount('');
      setSelectedCrypto(CRYPTO_OPTIONS[0]);
      setError('');
      setPaymentData(null);
      setPaymentStatus('waiting');
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [isOpen]);

  // Poll payment status
  const pollPaymentStatus = useCallback(async (paymentId: number) => {
    try {
      const res = await apiClient.get(`/api/wallet/payment-status/${paymentId}`);
      if (res.data.status === 'success') {
        const newStatus = res.data.data.status;
        setPaymentStatus(newStatus);
        
        if (newStatus === 'completed') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setStep('success');
        } else if (newStatus === 'failed') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setError('Payment failed or expired. Please try again.');
          setStep('error');
        }
      }
    } catch (err) {
      console.error('Failed to poll payment status:', err);
    }
  }, []);

  // Start polling when payment is created
  useEffect(() => {
    if (step === 'payment' && paymentData?.paymentId) {
      pollRef.current = setInterval(() => {
        pollPaymentStatus(paymentData.paymentId);
      }, 10000); // Poll every 10 seconds
      
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }
  }, [step, paymentData?.paymentId, pollPaymentStatus]);

  const handleCopy = () => {
    if (paymentData?.payAddress) {
      navigator.clipboard.writeText(paymentData.payAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 1) {
        throw new Error('Minimum deposit is $1');
      }

      const res = await apiClient.post('/api/wallet/create-payment', {
        amount: numAmount,
        currency: selectedCrypto.id,
      });

      if (res.data.status === 'success') {
        setPaymentData(res.data.data);
        setStep('payment');
      } else {
        throw new Error(res.data.error || 'Failed to create payment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create payment request';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    onClose();
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
        <Card className="border-gray-700 bg-[#12181F] p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">Deposit Crypto</h3>
                  <p className="text-sm text-gray-400">Select amount and cryptocurrency</p>
                </div>

                <form onSubmit={handleCreatePayment} className="space-y-6">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-2">Amount (USD)</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount in USD"
                      min="1"
                      step="0.01"
                      required
                      className="text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum deposit: $1</p>
                  </div>

                  {/* Crypto Selector */}
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-2">Select Cryptocurrency</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CRYPTO_OPTIONS.map((crypto) => (
                        <button
                          key={crypto.id}
                          type="button"
                          onClick={() => setSelectedCrypto(crypto)}
                          className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                            selectedCrypto.id === crypto.id
                              ? 'border-[#00FF9D] bg-[#00FF9D]/10'
                              : 'border-white/10 bg-black/20 hover:border-white/30'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: crypto.color + '20' }}
                          >
                            {crypto.id === 'btc' ? (
                              <Bitcoin className="w-4 h-4" style={{ color: crypto.color }} />
                            ) : (
                              <Coins className="w-4 h-4" style={{ color: crypto.color }} />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{crypto.symbol}</div>
                            <div className="text-xs text-gray-500">
                              {crypto.network ? `${crypto.name} (${crypto.network})` : crypto.name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#00FF9D] text-black hover:bg-[#00E88A] font-semibold"
                    disabled={isCreating || !amount}
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Payment...
                      </span>
                    ) : (
                      `Deposit with ${selectedCrypto.symbol}`
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'payment' && paymentData && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-xl font-bold text-white">Send {paymentData.payCurrency}</h3>
                  <p className="text-sm text-gray-400">
                    Send exactly {paymentData.payAmount} {paymentData.payCurrency} to complete your ${paymentData.priceAmount} deposit
                  </p>
                </div>

                {/* Payment Amount */}
                <div className="bg-black/30 p-4 rounded-lg border border-white/10 space-y-1">
                  <div className="text-xs text-gray-500 uppercase">Amount to Send</div>
                  <div className="text-2xl font-bold text-[#00FF9D]">
                    {paymentData.payAmount} {paymentData.payCurrency}
                  </div>
                  <div className="text-xs text-gray-500">≈ ${paymentData.priceAmount} USD</div>
                </div>

                {/* Payment Address */}
                <div className="bg-black/30 p-4 rounded-lg border border-white/10 space-y-2">
                  <div className="text-xs text-gray-500 uppercase">Send to this Address</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[#00FF9D] font-mono text-xs break-all flex-1">
                      {paymentData.payAddress}
                    </code>
                    <button 
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/10 rounded-md transition-colors shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-[#00FF9D]" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${paymentData.payAddress}`}
                    alt="Payment Address QR Code"
                    className="w-36 h-36"
                  />
                </div>

                {/* Status Indicator */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-center">
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-200 font-medium">Waiting for payment...</p>
                    <p className="text-xs text-yellow-200/70">
                      Your balance will update automatically once payment is confirmed
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200/80">
                    Send exactly {paymentData.payAmount} {paymentData.payCurrency} to the address above. 
                    Sending a different amount or wrong cryptocurrency may result in loss of funds.
                  </p>
                </div>

                <Button 
                  onClick={handleClose}
                  variant="outline"
                  className="w-full border-white/20 text-gray-300 hover:bg-white/5"
                >
                  Close (Payment will continue processing)
                </Button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-16 h-16 bg-[#00FF9D]/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-[#00FF9D]" />
                </div>
                <h3 className="text-xl font-bold text-white">Deposit Complete!</h3>
                <p className="text-gray-400">
                  Your deposit has been confirmed.<br />
                  Funds have been added to your wallet.
                </p>
                <Button 
                  onClick={handleClose}
                  className="w-full bg-[#00FF9D] text-black hover:bg-[#00E88A]"
                >
                  Done
                </Button>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Payment Failed</h3>
                <p className="text-gray-400">{error || 'Payment was not completed.'}</p>
                <Button 
                  onClick={() => {
                    setStep('form');
                    setError('');
                    setPaymentData(null);
                  }}
                  className="w-full bg-[#00FF9D] text-black hover:bg-[#00E88A]"
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};
