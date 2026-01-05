/**
 * CapWheel App Component
 * 
 * Main application wrapper with providers and routing
 * Includes Trading Agent integration
 */

import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import { CapWheelProvider } from '../../contexts/CapWheelContext';
import { useAuthStore } from '../../store/useAuthStore';
import { CapWheelLogin } from './CapWheelLogin';
import { OrionSidebar } from './OrionSidebar';
import { CapWheelDashboard } from './CapWheelDashboard';
import { CapWheelProfile } from './CapWheelProfile';
import { StrategyPools } from './StrategyPools';
import { AssetProtocol } from './AssetProtocol';
import { PartnerNetwork } from './PartnerNetwork';
import TradingInterface from '../../pages/TradingInterface';
import AdminPanel from '../../pages/AdminPanel';
import { CapWheelLogo } from '../../assets/capwheel-logo';
import { MobileNavDrawer, SwipeEdgeDetector } from '../mobile/MobileNavDrawer';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { SupportChat } from './SupportChat';

// Branded loading screen
const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B1015] gap-6">
    <CapWheelLogo size={80} animate={true} />
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <p className="text-gray-500 text-sm">Initializing session...</p>
  </div>
);

// Protected Route wrapper - uses useAuthStore as single source of truth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Show loading screen while auth is being validated
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/capwheel/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route wrapper - ensures user has admin role
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/capwheel/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/capwheel/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Profile wrapper with mobile navigation
const ProfileWrapper = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
      {/* Swipe detector for mobile */}
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header with back button */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
          <button
            onClick={() => navigate('/capwheel/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="text-white font-semibold">Profile</span>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <CapWheelProfile />
        
        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

// Strategy Pools wrapper with shared layout
const StrategyPoolsWrapper = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
      {/* Swipe detector for mobile */}
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header with back button */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
          <button
            onClick={() => navigate('/capwheel/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="text-white font-semibold">Strategy Pools</span>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <StrategyPools />
        </div>
        
        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

// Asset Protocol wrapper with shared layout
const AssetProtocolWrapper = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
      {/* Swipe detector for mobile */}
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header with back button */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
          <button
            onClick={() => navigate('/capwheel/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="text-white font-semibold">Asset Protocol</span>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <AssetProtocol />
        </div>
        
        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

const CapWheelRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<CapWheelLogin />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <CapWheelDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfileWrapper />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } 
      />

      {/* Trading Agent - Integrated with shared layout */}
      <Route 
        path="/trading" 
        element={
          <ProtectedRoute>
            <TradingInterface />
          </ProtectedRoute>
        } 
      />
      
      {/* Live Markets - Placeholder routes for sidebar navigation */}
      <Route 
        path="/markets" 
        element={
          <ProtectedRoute>
            <CapWheelDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Capital Management Routes */}
      <Route 
        path="/strategy-pools" 
        element={
          <ProtectedRoute>
            <StrategyPoolsWrapper />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/protocol" 
        element={
          <ProtectedRoute>
            <AssetProtocolWrapper />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/liquidity" 
        element={
          <ProtectedRoute>
            <CapWheelDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Governance Routes */}
      <Route 
        path="/ledger" 
        element={
          <ProtectedRoute>
            <CapWheelDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partners" 
        element={
          <ProtectedRoute>
            <PartnerNetwork />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/security" 
        element={
          <ProtectedRoute>
            <CapWheelDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Default Redirects */}
      <Route path="/" element={<Navigate to="/capwheel/login" replace />} />
      <Route path="*" element={<Navigate to="/capwheel/login" replace />} />
    </Routes>
  );
};

export const CapWheelApp = () => {
  return (
    <CapWheelProvider>
      <CapWheelRoutes />
      <SupportChat />
    </CapWheelProvider>
  );
};
