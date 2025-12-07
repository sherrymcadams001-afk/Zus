/**
 * CapWheel App Component
 * 
 * Main application wrapper with providers and routing
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { CapWheelProvider, useCapWheel } from '../../contexts/CapWheelContext';
import { CapWheelLogin } from './CapWheelLogin';
import { CapWheelDashboard } from './CapWheelDashboard';

const CapWheelRoutes = () => {
  const { enterpriseUser } = useCapWheel();

  return (
    <Routes>
      <Route path="/login" element={<CapWheelLogin />} />
      <Route 
        path="/dashboard" 
        element={
          enterpriseUser ? <CapWheelDashboard /> : <Navigate to="/capwheel/login" replace />
        } 
      />
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
