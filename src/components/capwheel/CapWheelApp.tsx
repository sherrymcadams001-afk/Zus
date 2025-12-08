/**
 * CapWheel App Component
 * 
 * Main application wrapper with providers and routing
 * Includes Trading Agent integration
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { CapWheelProvider, useCapWheel } from '../../contexts/CapWheelContext';
import { CapWheelLogin } from './CapWheelLogin';
import { CapWheelDashboard } from './CapWheelDashboard';
import { ProfilePage } from './ProfilePage';
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
      
      {/* Profile Page */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
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
      
      {/* Live Markets - Removed, redirects to dashboard */}
      <Route 
        path="/markets" 
        element={<Navigate to="/capwheel/dashboard" replace />}
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
