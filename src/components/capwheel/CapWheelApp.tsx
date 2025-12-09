/**
 * CapWheel App Component
 * 
 * Main application wrapper with providers and routing
 * Includes Trading Agent integration
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { CapWheelProvider, useCapWheel } from '../../contexts/CapWheelContext';
import { CapWheelLogin } from './CapWheelLogin';
import { OrionSidebar } from './OrionSidebar';
import { CapWheelDashboard } from './CapWheelDashboard';
import { CapWheelProfile } from './CapWheelProfile';
import TradingInterface from '../../pages/TradingInterface';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { enterpriseUser } = useCapWheel();
  
  if (!enterpriseUser) {
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
