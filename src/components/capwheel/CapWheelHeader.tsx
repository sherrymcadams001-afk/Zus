/**
 * CapWheel Header Component
 * 
 * Enterprise header with market session indicator, UTC clock, and user profile
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CapWheelLogoStatic } from '../../assets/capwheel-logo';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { Clock, TrendingUp, User, LogOut, Settings } from 'lucide-react';

export const CapWheelHeader = () => {
  const { marketSession, enterpriseUser, portfolioMetrics } = useCapWheel();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
      hour12: false,
    });
  };

  const getSessionColor = () => {
    switch (marketSession.session) {
      case 'MARKET_OPEN':
        return 'text-capwheel-profit';
      case 'PRE_MARKET':
      case 'AFTER_HOURS':
        return 'text-capwheel-electric';
      case 'MARKET_CLOSE':
      case 'WEEKEND':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const getSessionLabel = () => {
    switch (marketSession.session) {
      case 'MARKET_OPEN':
        return 'MARKET OPEN';
      case 'PRE_MARKET':
        return 'PRE-MARKET';
      case 'AFTER_HOURS':
        return 'AFTER HOURS';
      case 'MARKET_CLOSE':
        return 'MARKET CLOSED';
      case 'WEEKEND':
        return 'WEEKEND';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <header className="capwheel-frosted border-b border-capwheel-border-subtle sticky top-0 z-50">
      <div className="max-w-[2000px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <CapWheelLogoStatic size={40} />
            <div>
              <h1 className="text-xl font-bold capwheel-text-gradient">
                CapWheel
              </h1>
              <p className="text-xs text-gray-500 font-mono">
                ENTERPRISE TRADING
              </p>
            </div>
          </div>

          {/* Center - Market Session & Time */}
          <div className="flex items-center gap-6">
            {/* Market Session Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-capwheel-surface rounded-lg border border-capwheel-border-subtle">
              <div className={`w-2 h-2 rounded-full ${getSessionColor()} animate-pulse`}></div>
              <span className={`text-sm font-mono font-semibold ${getSessionColor()}`}>
                {getSessionLabel()}
              </span>
            </div>

            {/* UTC Clock */}
            <div className="flex items-center gap-2 px-4 py-2 bg-capwheel-surface rounded-lg border border-capwheel-border-subtle">
              <Clock size={16} className="text-capwheel-electric" />
              <span className="text-sm font-mono font-semibold text-white">
                {formatTime(currentTime)} <span className="text-gray-500">UTC</span>
              </span>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2 px-4 py-2 bg-capwheel-surface rounded-lg border border-capwheel-border-subtle">
              <TrendingUp size={16} className="text-capwheel-gold" />
              <span className="text-sm font-mono font-semibold text-capwheel-profit">
                +{portfolioMetrics.timeWeightedReturn.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">TWR</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
              className="flex items-center gap-3 px-4 py-2 bg-capwheel-surface rounded-lg border border-capwheel-border-subtle hover:border-capwheel-gold transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-capwheel-gold to-capwheel-gold-light flex items-center justify-center">
                <User size={18} className="text-capwheel-navy" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  {enterpriseUser?.name || 'Guest User'}
                </p>
                <p className="text-xs text-gray-500">
                  {enterpriseUser?.role || 'Visitor'}
                </p>
              </div>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: [0.2, 0, 0.1, 1] }}
                className="absolute right-0 mt-2 w-56 capwheel-card"
              >
                <div className="p-4 border-b border-capwheel-border-subtle">
                  <p className="text-sm font-semibold text-white">
                    {enterpriseUser?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {enterpriseUser?.email}
                  </p>
                  {enterpriseUser?.desk && (
                    <p className="text-xs text-capwheel-gold mt-1">
                      {enterpriseUser.desk}
                    </p>
                  )}
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={() => {
                      // TODO: Implement settings functionality
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-capwheel-surface-hover rounded transition-all duration-150"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <button 
                    onClick={() => {
                      // TODO: Implement sign out functionality
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-capwheel-surface-hover rounded transition-all duration-150"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
