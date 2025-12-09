/**
 * CapWheel App Component
 * 
 * Main application wrapper with providers and routing
 * Includes Trading Agent integration
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { CapWheelProvider } from '../../contexts/CapWheelContext';
import { useAuthStore } from '../../store/useAuthStore';
import { CapWheelLogin } from './CapWheelLogin';
import { OrionSidebar } from './OrionSidebar';
import { CapWheelDashboard } from './CapWheelDashboard';
import { CapWheelProfile } from './CapWheelProfile';
import TradingInterface from '../../pages/TradingInterface';
import AdminPanel from '../../pages/AdminPanel';
import { CapWheelLogo } from '../../assets/capwheel-logo';

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
            <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
              <div className="hidden lg:block flex-shrink-0">
                <OrionSidebar />
              </div>
              <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <CapWheelProfile />
              </div>
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />

      {/* Trading Agent - Full Trading Interface */}
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
            <CapWheelDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/allocation" 
        element={
          <ProtectedRoute>
            <CapWheelDashboard />
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
            <CapWheelDashboard />
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
    </CapWheelProvider>
  );
};
