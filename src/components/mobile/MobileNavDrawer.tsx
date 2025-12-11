import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, User, Wallet, Zap, Users, Shield, FileCode } from 'lucide-react';
import { CapWheelLogo } from '../../assets/capwheel-logo';
import { useAuthStore } from '../../store/useAuthStore';
import { useRef, useCallback } from 'react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Swipe edge detector for opening the drawer
interface SwipeEdgeDetectorProps {
  onSwipeOpen: () => void;
}

export const SwipeEdgeDetector = ({ onSwipeOpen }: SwipeEdgeDetectorProps) => {
  const startX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only track if starting from left edge (within 25px)
    if (touch.clientX < 25) {
      startX.current = touch.clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startX.current === null) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    
    // Trigger open if swiped 60px to the right
    if (deltaX > 60) {
      onSwipeOpen();
      startX.current = null;
    }
  }, [onSwipeOpen]);

  const handleTouchEnd = useCallback(() => {
    startX.current = null;
  }, []);

  return (
    <div
      className="fixed left-0 top-0 bottom-0 w-6 z-40 lg:hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export const MobileNavDrawer = ({ isOpen, onClose }: MobileNavDrawerProps) => {
  const user = useAuthStore((state) => state.user);

  const menuItems = [
    {
      title: 'Overview',
      items: [
        { to: '/capwheel/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/capwheel/profile', icon: <User size={20} />, label: 'Profile' },
        { to: '/capwheel/protocol', icon: <FileCode size={20} />, label: 'Asset Protocol' },
        { to: '/capwheel/trading', icon: <Zap size={20} />, label: 'Trading Agent', badge: 'LIVE' },
        { to: '/capwheel/strategy-pools', icon: <Wallet size={20} />, label: 'Strategy Pools' },
      ]
    },
    {
      title: 'Governance & Audit',
      items: [
        ...(user?.role === 'admin' ? [{ to: '/capwheel/admin', icon: <Shield size={20} />, label: 'Admin Panel', badge: 'ADMIN' }] : []),
        { to: '/capwheel/partners', icon: <Users size={20} />, label: 'Partner Network' },
        { to: '/capwheel/security', icon: <Shield size={20} />, label: 'Security Center' },
      ]
    }
  ];

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0B1015] border-r border-white/10 z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <CapWheelLogo size={32} />
                <span className="font-bold text-white tracking-tight">CapWheel</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {menuItems.map((group, idx) => (
                <div key={idx}>
                  <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                          ${isActive 
                            ? 'bg-[#00FF9D]/10 text-[#00FF9D]' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {'badge' in item && item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.badge === 'LIVE' 
                              ? 'bg-[#00FF9D]/20 text-[#00FF9D]' 
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-white/5 bg-[#0f1621]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center text-black font-bold">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.email || 'User'}
                  </div>
                  <div className="text-xs text-emerald-500">Connected</div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
