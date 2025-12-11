/**
 * Login Page - Orion Enterprise Design System
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Mail, Lock, ArrowRight, Shield, TrendingUp, Activity } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { CapWheelLogo } from '../assets/capwheel-logo';

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
    <div className="min-h-screen bg-gradient-to-br from-orion-bg via-orion-bg-secondary to-orion-bg flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orion-cyan/10 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(69, 162, 158, 0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CapWheelLogo size={48} />
              <div>
                <h1 className="text-2xl font-bold tracking-wider">ORION</h1>
                <p className="text-xs text-orion-cyan tracking-widest uppercase">Trading Agent Platform</p>
              </div>
            </div>
            
            <div className="mt-16 space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orion-cyan/10 border border-orion-cyan/20">
                  <Shield className="h-5 w-5 text-orion-cyan" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Enterprise Security</h3>
                  <p className="text-orion-slate-dark text-sm">Bank-grade encryption and multi-factor authentication</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orion-cyan/10 border border-orion-cyan/20">
                  <TrendingUp className="h-5 w-5 text-orion-cyan" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Real-Time Analytics</h3>
                  <p className="text-orion-slate-dark text-sm">Advanced AI-powered trading insights and predictions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orion-cyan/10 border border-orion-cyan/20">
                  <Activity className="h-5 w-5 text-orion-cyan" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">24/7 Trading</h3>
                  <p className="text-orion-slate-dark text-sm">Autonomous bot execution across global markets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[rgba(255,255,255,0.08)]">
            <div>
              <div className="text-2xl font-bold text-orion-cyan">99.9%</div>
              <div className="text-xs text-orion-slate-dark uppercase tracking-wide">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orion-cyan">$2.4B+</div>
              <div className="text-xs text-orion-slate-dark uppercase tracking-wide">Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orion-cyan">50K+</div>
              <div className="text-xs text-orion-slate-dark uppercase tracking-wide">Traders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <CapWheelLogo size={48} />
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">ORION</h1>
              <p className="text-xs text-orion-cyan tracking-widest uppercase">Trading Agent Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-orion-slate-dark">Access your trading dashboard</p>
          </div>

          <div className="bg-orion-bg-secondary/80 backdrop-blur-sm rounded-xl p-8 border border-[rgba(255,255,255,0.08)] shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-orion-danger/10 border border-orion-danger/30 text-orion-danger px-4 py-3 rounded-lg flex items-start gap-3">
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-orion-slate mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-orion-slate-dark" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-orion-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder-orion-slate-dark focus:outline-none focus:border-orion-cyan/50 focus:ring-2 focus:ring-orion-cyan/20 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-orion-slate mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-orion-slate-dark" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-orion-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder-orion-slate-dark focus:outline-none focus:border-orion-cyan/50 focus:ring-2 focus:ring-orion-cyan/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orion-cyan hover:bg-orion-cyan-bright text-white font-bold py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orion-cyan/20 hover:shadow-orion-cyan/40 glow-cyan-md hover:glow-cyan-lg"
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

            <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
              <p className="text-orion-slate-dark text-sm text-center">
                Don't have an account?{' '}
                <Link to="/register" className="text-orion-cyan hover:text-orion-cyan-bright font-semibold transition-colors">
                  Request Access →
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-orion-slate-dark mt-6">
            Protected by enterprise-grade security • <span className="text-orion-cyan">SSL Encrypted</span>
          </p>
        </div>
      </div>
    </div>
  );
}
