import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, Zap, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const items = [
    { to: '/capwheel/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: '/capwheel/strategy-pools', icon: <PieChart size={20} />, label: 'Pools' },
    { to: '/capwheel/trading', icon: <Zap size={20} />, label: 'Trade' },
    { to: '/capwheel/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0B1015]/90 backdrop-blur-xl border-t border-white/10 pb-safe z-40 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-full h-full gap-1
              ${isActive ? 'text-[#00FF9D]' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
