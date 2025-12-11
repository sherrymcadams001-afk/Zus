/**
 * Register Page - Orion Enterprise
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Zap, Mail, Lock, ArrowRight, Shield, UserPlus, Key, Clock } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { CapWheelLogo } from '../assets/capwheel-logo';

// Password validation constant (should match backend MIN_PASSWORD_LENGTH)
const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register(email, password, referralCode || undefined);
      
      if (response.status === 'success' && response.data) {
        if (response.data.waitlisted) {
          setShowWaitlistModal(true);
        } else {
          setAuth(response.data.user, response.data.token);
          navigate('/dashboard');
        }
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err: unknown) {
      let errorMessage = 'An error occurred. Please try again.';
      if (isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (showWaitlistModal) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="bg-[#0B0E11] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A3FF]/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#00A3FF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-[#00A3FF]" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">You're on the Waitlist</h2>
            <p className="text-slate-400 mb-8">
              Due to high demand, we are rolling out access in waves. You have been added to our priority waitlist.
              <br /><br />
              Check your email in <strong>4 hours</strong> for your access link.
            </p>
            
            <Link 
              to="/login"
              className="inline-flex items-center justify-center w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-lg transition-colors border border-white/10"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020408] via-[#0B0E11] to-[#020408] flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A3FF]/10 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 163, 255, 0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <CapWheelLogo size={48} />
              <div>
                <h1 className="text-2xl font-bold tracking-wider">ORION</h1>
                <p className="text-xs text-[#00A3FF] tracking-widest uppercase">Trading Agent Platform</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-4">Start Your Trading Journey</h2>
                <p className="text-lg text-slate-300">Join thousands of traders using our AI-powered platform</p>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded bg-[#00A3FF]/20">
                    <Shield className="h-4 w-4 text-[#00A3FF]" />
                  </div>
                  <span className="text-slate-300">Enterprise-grade security and encryption</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded bg-[#00A3FF]/20">
                    <UserPlus className="h-4 w-4 text-[#00A3FF]" />
                  </div>
                  <span className="text-slate-300">Instant account activation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded bg-[#00A3FF]/20">
                    <Zap className="h-4 w-4 text-[#00A3FF]" />
                  </div>
                  <span className="text-slate-300">Real-time market data and analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Registration Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <CapWheelLogo size={48} />
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">ORION</h1>
              <p className="text-xs text-[#00A3FF] tracking-widest uppercase">Trading Agent Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400">Begin your journey to financial freedom</p>
          </div>

          <div className="bg-[#0B0E11]/80 backdrop-blur-sm rounded-xl p-8 border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#12141A] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00A3FF]/50 focus:ring-2 focus:ring-[#00A3FF]/20 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#12141A] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00A3FF]/50 focus:ring-2 focus:ring-[#00A3FF]/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Minimum {MIN_PASSWORD_LENGTH} characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#12141A] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00A3FF]/50 focus:ring-2 focus:ring-[#00A3FF]/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#12141A] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00A3FF]/50 focus:ring-2 focus:ring-[#00A3FF]/20 transition-all uppercase"
                    placeholder="ABCD1234"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0080FF] hover:from-[#0080FF] hover:to-[#00A3FF] text-white font-bold py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00A3FF]/20 hover:shadow-[#00A3FF]/40"
              >
                {isLoading ? (
                  <>
                    <UserPlus className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Request Access</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-400 text-sm text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-[#00A3FF] hover:text-[#0080FF] font-semibold transition-colors">
                  Sign In →
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
