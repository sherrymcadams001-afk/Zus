/**
 * Login Page - Enterprise Grade
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Zap, Mail, Lock, ArrowRight, Shield, TrendingUp, Activity } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);
      
      if (response.status === 'success' && response.data) {
        setAuth(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.error || 'Login failed');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B0D] via-[#0B0E11] to-[#0A0B0D] flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4AA]/10 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 212, 170, 0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-[#00D4AA]/20 border border-[#00D4AA]/30 backdrop-blur-sm">
                <Zap className="h-7 w-7 text-[#00D4AA]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider">TRADING <span className="text-[#00D4AA]">AGENT</span></h1>
                <p className="text-xs text-slate-400 tracking-widest uppercase">Enterprise Trading Platform</p>
              </div>
            </div>
            
            <div className="mt-16 space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/20">
                  <Shield className="h-5 w-5 text-[#00D4AA]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Enterprise Security</h3>
                  <p className="text-slate-400 text-sm">Bank-grade encryption and multi-factor authentication</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/20">
                  <TrendingUp className="h-5 w-5 text-[#00D4AA]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Real-Time Analytics</h3>
                  <p className="text-slate-400 text-sm">Advanced AI-powered trading insights and predictions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/20">
                  <Activity className="h-5 w-5 text-[#00D4AA]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">24/7 Trading</h3>
                  <p className="text-slate-400 text-sm">Autonomous bot execution across global markets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold text-[#00D4AA]">99.9%</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00D4AA]">$2.4B+</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00D4AA]">50K+</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Traders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-[#00D4AA]/20 border border-[#00D4AA]/30">
              <Zap className="h-7 w-7 text-[#00D4AA]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">TRADING <span className="text-[#00D4AA]">AGENT</span></h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">Access your trading dashboard</p>
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
                    className="w-full pl-11 pr-4 py-3.5 bg-[#12141A] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4AA]/50 focus:ring-2 focus:ring-[#00D4AA]/20 transition-all"
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
                    className="w-full pl-11 pr-4 py-3.5 bg-[#12141A] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4AA]/50 focus:ring-2 focus:ring-[#00D4AA]/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00D4AA] to-[#00B890] hover:from-[#00B890] hover:to-[#00D4AA] text-black font-bold py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00D4AA]/20 hover:shadow-[#00D4AA]/40"
              >
                {isLoading ? (
                  <>
                    <Activity className="h-5 w-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-400 text-sm text-center">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#00D4AA] hover:text-[#00B890] font-semibold transition-colors">
                  Create Account →
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Protected by enterprise-grade security • <span className="text-[#00D4AA]">SSL Encrypted</span>
          </p>
        </div>
      </div>
    </div>
  );
}
