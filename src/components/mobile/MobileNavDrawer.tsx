import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, User, Wallet, PieChart, ArrowRightLeft, Activity, Zap } from 'lucide-react';
import { CapWheelLogo } from '../../assets/capwheel-logo';
import { useAuthStore } from '../../store/useAuthStore';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer = ({ isOpen, onClose }: MobileNavDrawerProps) => {
  const user = useAuthStore((state) => state.user);

  const menuItems = [
    {
      title: 'Overview',
      items: [
        { to: '/capwheel/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/capwheel/profile', icon: <User size={20} />, label: 'Profile' },
      ]
    },
    {
      title: 'Capital Management',
      items: [
        { to: '/capwheel/strategy-pools', icon: <PieChart size={20} />, label: 'Strategy Pools' },
        { to: '/capwheel/allocation', icon: <Activity size={20} />, label: 'Allocation' },
        { to: '/capwheel/liquidity', icon: <Wallet size={20} />, label: 'Liquidity' },
      ]
    },
    {
      title: 'Trading',
      items: [
        { to: '/capwheel/trading', icon: <Zap size={20} />, label: 'Trading Agent' },
        { to: '/capwheel/markets', icon: <ArrowRightLeft size={20} />, label: 'Live Markets' },
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
                        {item.label}
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
