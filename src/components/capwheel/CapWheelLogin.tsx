/**
 * CapWheel Login Component
 * 
 * Enterprise-grade multi-step authentication flow
 * Design Principles Applied:
 *   - P1 Purpose First: Single goal = Authenticate
 *   - P3 One Primary Action: Only the "Next/Sign In" button is colored
 *   - P5 Choice Minimization: Show only what's needed at each step
 *   - P8 Color Economy: Emerald reserved only for primary CTA
 *   - P9 Spacing Scale: 8px multiples throughout
 *   - P11 Feedback States: Clear loading, error, focus states
 *   - P12 Accessibility: 44px targets, 4.5:1 contrast, visible focus rings
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, ArrowLeft, ArrowRight, Shield, Check } from 'lucide-react';
import { CapWheelLogo } from '../../assets/capwheel-logo';
import { authAPI } from '../../api/auth';

type AuthStep = 'email' | 'password' | 'register-password';
type AuthMode = 'login' | 'register';

// Logo imported from ../../assets/capwheel-logo (ORION-styled neon green glow)

export const CapWheelLogin = () => {
  const navigate = useNavigate();
  const { setEnterpriseUser } = useCapWheel();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Multi-step state
  const [step, setStep] = useState<AuthStep>('email');
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Refs for autofocus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus management on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'email') {
        emailInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [step]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle email step submission
  const handleEmailNext = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Transition to password step
    setStep(mode === 'register' ? 'register-password' : 'password');
  }, [email, mode]);

  // Handle password step submission
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
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

        const response = await authAPI.register(email, password, inviteCode);
        
        if (response.status === 'success') {
          setSuccess('Account created successfully');
          // Auto-transition to login after brief success display
          setTimeout(() => {
            setMode('login');
            setStep('password');
            setPassword('');
            setConfirmPassword('');
            setSuccess('');
          }, 1500);
        } else {
          setError(response.error ?? 'Registration failed');
        }
      } else {
        const response = await authAPI.login(email, password);
        
        if (response.status === 'success' && response.data) {
          // Update global auth store (handles localStorage and state)
          setAuth(response.data.user, response.data.token);
          
          // Update CapWheel context for legacy compatibility
          setEnterpriseUser({
            id: String(response.data.user.id),
            name: response.data.user.email.split('@')[0],
            email: response.data.user.email,
            role: response.data.user.role === 'admin' ? 'Executive' : 'Trader',
            desk: 'Volatility Harvesting',
            permissions: ['trade', 'view_positions', 'manage_risk'],
          });
          
          // Redirect based on role - use React Router for consistent state
          if (response.data.user.role === 'admin') {
            navigate('/capwheel/admin');
          } else {
            navigate('/capwheel/dashboard');
          }
        } else {
          setError(response.error ?? 'Invalid credentials');
        }
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, email, password, confirmPassword, navigate, setEnterpriseUser, setAuth]);

  // Go back to email step
  const handleBack = () => {
    setStep('email');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  // Toggle between login and register
  const toggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    if (step !== 'email') {
      setStep(newMode === 'register' ? 'register-password' : 'password');
    }
  };

  // Animation variants
  const fadeSlide = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at center, rgba(15,23,42,0) 0%, rgba(2,6,14,1) 80%)
          `,
        }}
      />

      {/* Login Card - P2 Figure-Ground: Elevated, isolated */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] bg-[#0f1629]/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/60 relative z-10"
      >
        {/* Header Section - P9 Spacing: 32px padding top */}
        <div className="px-10 pt-10 pb-0">
          {/* Logo - ORION-styled with neon glow */}
          <div className="flex justify-center mb-6">
            <CapWheelLogo size={56} animate={true} />
          </div>

          {/* Brand Name - P4 Hierarchy: Largest text */}
          <h1 className="text-center text-white text-[22px] font-semibold tracking-tight mb-2">
            CapWheel
          </h1>
          
          {/* Enterprise Subtitle - P10 Copy Clarity: Brief, impactful */}
          <p className="text-center text-slate-400 text-sm font-medium mb-8">
            Kinetic Capital Infrastructure
          </p>
        </div>

        {/* Form Container - Fixed height to prevent layout shift */}
        <div className="px-10 pb-6 min-h-[280px]">
          {/* Success Message */}
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-sm font-medium">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message - P11 Feedback States */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-Step Form Content */}
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              /* Step 1: Email Entry */
              <motion.form
                key="email-step"
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleEmailNext}
                className="space-y-6"
              >
                {/* Step Indicator */}
                <div className="text-center mb-2">
                  <span className="text-slate-500 text-xs uppercase tracking-widest font-medium">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </span>
                </div>

                {/* Email Input - P7 Affordances: Looks interactive */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm text-slate-300 mb-2 font-medium"
                  >
                    Email
                  </label>
                  <input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full h-12 px-4 bg-[#0a0f1a] border border-slate-700/80 rounded-lg text-white text-[15px] placeholder-slate-500 
                             focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 
                             transition-all duration-200"
                    placeholder="name@company.com"
                  />
                </div>

                {/* Primary Action - P3 One Primary Action, P8 Color Economy */}
                <button
                  type="submit"
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg 
                           transition-all duration-200 flex items-center justify-center gap-2
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#0f1629]"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Mode Toggle - P6 Familiar Patterns */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
                  >
                    {mode === 'login' ? 'Create an account' : 'Sign in instead'}
                  </button>
                </div>
              </motion.form>
            ) : (
              /* Step 2: Password Entry */
              <motion.form
                key="password-step"
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handlePasswordSubmit}
                className="space-y-6"
              >
                {/* Back Button + Email Display */}
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-700/60 
                             text-slate-400 hover:text-white hover:border-slate-600 transition-all
                             focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    aria-label="Go back to email"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{email}</p>
                    <p className="text-slate-500 text-xs">
                      {mode === 'login' ? 'Enter your password' : 'Create a secure password'}
                    </p>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm text-slate-300 mb-2 font-medium"
                  >
                    Password
                  </label>
                  <input
                    ref={passwordInputRef}
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full h-12 px-4 bg-[#0a0f1a] border border-slate-700/80 rounded-lg text-white text-[15px] placeholder-slate-500 
                             focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 
                             transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>

                {/* Confirm Password (Register only) */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label 
                        htmlFor="confirmPassword" 
                        className="block text-sm text-slate-300 mb-2 font-medium"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full h-12 px-4 bg-[#0a0f1a] border border-slate-700/80 rounded-lg text-white text-[15px] placeholder-slate-500 
                                 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 
                                 transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <p className="mt-2 text-xs text-slate-500">Minimum 8 characters</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Invite Code (Register only) */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6"
                    >
                      <label 
                        htmlFor="inviteCode" 
                        className="block text-sm text-slate-300 mb-2 font-medium"
                      >
                        Invite Code (Optional)
                      </label>
                      <input
                        id="inviteCode"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        autoComplete="off"
                        className="w-full h-12 px-4 bg-[#0a0f1a] border border-slate-700/80 rounded-lg text-white text-[15px] placeholder-slate-500 
                                 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 
                                 transition-all duration-200"
                        placeholder="CW-XXXX-XXXX"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button - P11 Feedback States: Loading state */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg 
                           transition-all duration-200 flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#0f1629]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                    </span>
                  ) : (
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>

                {/* Mode Toggle */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
                  >
                    {mode === 'login' ? 'Create an account' : 'Sign in instead'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Trust Footer - P12 Accessibility: Clear security messaging */}
        <div className="px-10 py-5 border-t border-white/[0.04] flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-500 text-xs">
            256-bit encrypted · SOC 2 compliant
          </span>
          <Lock className="h-3 w-3 text-slate-500" />
        </div>
      </motion.div>

      {/* Minimal Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-slate-600 text-xs">
          © 2025 CapWheel Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
};