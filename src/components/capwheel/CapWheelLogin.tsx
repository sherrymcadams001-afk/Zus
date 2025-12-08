/**
 * CapWheel Login Component
 * 
 * Minimal, centered glass card login - Enterprise aesthetic
 * Single focus: secure entry
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { Lock, Hexagon, UserPlus, LogIn } from 'lucide-react';
import { authAPI } from '../../api/auth';

type AuthMode = 'login' | 'register';

export const CapWheelLogin = () => {
  const navigate = useNavigate();
  const { setEnterpriseUser } = useCapWheel();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Validate password match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }

        const response = await authAPI.register(email, password);
        
        if (response.status === 'success') {
          setSuccess('Account created! You can now sign in.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(response.error || 'Registration failed');
        }
      } else {
        const response = await authAPI.login(email, password);
        
        if (response.status === 'success' && response.data) {
          // Store auth token
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Set enterprise user context
          setEnterpriseUser({
            id: String(response.data.user.id),
            name: response.data.user.email.split('@')[0],
            email: response.data.user.email,
            role: response.data.user.role === 'admin' ? 'Executive' : 'Trader',
            desk: 'Volatility Harvesting',
            permissions: ['trade', 'view_positions', 'manage_risk'],
          });
          
          navigate('/capwheel/dashboard');
        } else {
          setError(response.error || 'Invalid credentials');
        }
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle radial gradient - static, not animated */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(15,23,42,0) 0%, rgba(2,6,14,1) 70%)',
        }}
      />

      {/* Login Card - Glass morphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0.1, 1] }}
        className="w-[400px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative z-10"
      >
        {/* Logo - Centered geometric icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Hexagon className="h-8 w-8 text-emerald-500" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Title - Simple, no tagline */}
        <h1 className="text-center text-white text-lg font-medium mb-8">
          {mode === 'login' ? 'Sign in to CapWheel' : 'Create your account'}
        </h1>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-2">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder="you@company.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password Field (Register only) */}
          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm text-slate-400 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="••••••••"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              mode === 'login' ? 'Signing in...' : 'Creating account...'
            ) : (
              <>
                {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Trust Footer */}
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Lock className="h-3 w-3" />
          <span>End-to-end encrypted connection</span>
        </div>
      </motion.div>
    </div>
  );
};