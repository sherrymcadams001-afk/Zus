/**
 * CapWheel Login Component
 * 
 * Premium enterprise login screen with SSO options
 * Features glass morphism, gold accents, and sophisticated animations
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CapWheelLogo } from '../../assets/capwheel-logo';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { Github, Mail, KeyRound, Building2 } from 'lucide-react';

export const CapWheelLogin = () => {
  const navigate = useNavigate();
  const { setEnterpriseUser } = useCapWheel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      setEnterpriseUser({
        id: 'user-1',
        name: 'Alex Morgan',
        email: email || 'alex.morgan@capwheel.com',
        role: 'Executive',
        desk: 'Volatility Harvesting',
        permissions: ['trade', 'view_positions', 'manage_risk'],
      });
      setIsLoading(false);
      navigate('/capwheel/dashboard');
    }, 1000);
  };

  const handleSSOLogin = (provider: string) => {
    setIsLoading(true);
    
    // Simulate SSO authentication
    setTimeout(() => {
      setEnterpriseUser({
        id: 'user-sso',
        name: 'Enterprise User',
        email: `user@${provider}.com`,
        role: 'Trader',
        desk: 'RWA Hedging',
        permissions: ['trade', 'view_positions'],
      });
      setIsLoading(false);
      navigate('/capwheel/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-capwheel-navy flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-capwheel-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-capwheel-electric rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0.1, 1] }}
        className="capwheel-card w-full max-w-md p-8 relative z-10"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CapWheelLogo size={80} animate={true} />
          </div>
          <h1 className="text-3xl font-bold capwheel-text-gradient mb-2">
            CapWheel
          </h1>
          <p className="text-gray-400 text-sm">
            Enterprise Trading Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              placeholder="user@enterprise.com"
              required
              className={`w-full px-4 py-3 bg-capwheel-surface border rounded-lg focus:outline-none text-white placeholder-gray-500 transition-all duration-200 ${
                emailError ? 'border-capwheel-loss focus:border-capwheel-loss' : 'border-capwheel-border-subtle focus:border-capwheel-gold'
              }`}
            />
            {emailError && (
              <p className="mt-1 text-sm text-capwheel-loss">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-capwheel-surface border border-capwheel-border-subtle rounded-lg focus:outline-none focus:border-capwheel-gold text-white placeholder-gray-500 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-capwheel-gold to-capwheel-gold-light text-capwheel-navy font-semibold rounded-lg hover:shadow-capwheel-glow-gold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-capwheel-border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-capwheel-surface-elevated text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        {/* SSO Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleSSOLogin('saml')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-capwheel-surface border border-capwheel-border-subtle rounded-lg hover:border-capwheel-gold text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <Building2 size={18} />
            <span className="text-sm font-medium">SAML</span>
          </button>

          <button
            onClick={() => handleSSOLogin('oauth')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-capwheel-surface border border-capwheel-border-subtle rounded-lg hover:border-capwheel-gold text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <KeyRound size={18} />
            <span className="text-sm font-medium">OAuth</span>
          </button>

          <button
            onClick={() => handleSSOLogin('github')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-capwheel-surface border border-capwheel-border-subtle rounded-lg hover:border-capwheel-gold text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <Github size={18} />
            <span className="text-sm font-medium">GitHub</span>
          </button>

          <button
            onClick={() => handleSSOLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-capwheel-surface border border-capwheel-border-subtle rounded-lg hover:border-capwheel-gold text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <Mail size={18} />
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-capwheel-border-subtle">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <span className="text-orion-cyan font-medium">Orion</span>
          </p>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-8 left-0 right-0 text-center z-10"
      >
        <p className="text-gray-500 text-sm italic">
          "Crypto volatility isn't risk—it's fuel. RWA isn't future—it's the hedge."
        </p>
      </motion.div>
    </div>
  );
};
