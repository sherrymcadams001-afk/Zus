/**
 * App Component
 * 
 * Main application component with routing
 * Entry point is /capwheel (CapWheel login)
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { CapWheelApp } from './components/capwheel';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // Initialize auth state from localStorage
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* CapWheel Enterprise Route - Main Entry Point */}
        <Route path="/capwheel/*" element={<CapWheelApp />} />
        
        {/* All other routes redirect to CapWheel */}
        <Route path="*" element={<Navigate to="/capwheel" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


