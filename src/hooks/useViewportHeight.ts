/**
 * useViewportHeight Hook
 * 
 * Dynamic viewport height handling for mobile browsers
 * Accounts for browser chrome (address bar, navigation bar)
 * Sets CSS custom property --vh for use in CSS
 */

import { useEffect, useState, useCallback } from 'react';

interface ViewportDimensions {
  height: number;
  width: number;
  vh: number; // 1% of viewport height
  vw: number; // 1% of viewport width
  isKeyboardOpen: boolean;
}

/**
 * Hook to track real viewport height on mobile
 * Mobile browsers have dynamic viewport height due to browser chrome
 */
export function useViewportHeight() {
  const [dimensions, setDimensions] = useState<ViewportDimensions>(() => {
    if (typeof window === 'undefined') {
      return { height: 0, width: 0, vh: 0, vw: 0, isKeyboardOpen: false };
    }
    
    const height = window.innerHeight;
    const width = window.innerWidth;
    const vh = height * 0.01;
    const vw = width * 0.01;
    
    // Set CSS custom properties on initial load
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--viewport-width', `${width}px`);
    
    return {
      height,
      width,
      vh,
      vw,
      isKeyboardOpen: false,
    };
  });

  const updateDimensions = useCallback(() => {
    const height = window.innerHeight;
    const width = window.innerWidth;
    const vh = height * 0.01;
    const vw = width * 0.01;
    
    // Detect keyboard by checking if viewport height is significantly smaller
    // Usually keyboard takes 40-50% of screen height
    const initialHeight = window.screen?.availHeight || window.outerHeight;
    const isKeyboardOpen = height < initialHeight * 0.7;

    setDimensions({ height, width, vh, vw, isKeyboardOpen });

    // Set CSS custom property for use in stylesheets
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--viewport-width', `${width}px`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for resize events (includes orientation change)
    window.addEventListener('resize', updateDimensions);

    // Also listen for visual viewport changes (better for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateDimensions);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateDimensions);
      }
    };
  }, [updateDimensions]);

  return dimensions;
}

/**
 * Hook to get full height that accounts for mobile browser chrome
 * Returns a style object with height set to use CSS variable
 */
export function useFullHeight() {
  useViewportHeight(); // Ensures CSS variable is set

  return {
    // Use CSS calc with fallback
    height: 'calc(var(--vh, 1vh) * 100)',
    minHeight: 'calc(var(--vh, 1vh) * 100)',
  };
}

/**
 * Hook to detect if virtual keyboard is likely open
 */
export function useKeyboardOpen() {
  const { isKeyboardOpen } = useViewportHeight();
  return isKeyboardOpen;
}

/**
 * Hook to lock scroll when virtual keyboard opens
 * Prevents page from jumping/scrolling unexpectedly
 */
export function useKeyboardScrollLock() {
  const isKeyboardOpen = useKeyboardOpen();
  
  useEffect(() => {
    if (isKeyboardOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Lock body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isKeyboardOpen]);
  
  return isKeyboardOpen;
}

/**
 * Get safe area insets for notched devices
 */
export function useSafeAreaInsets() {
  const [insets] = useState(() => {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    // Check if env() is supported
    const supportsEnv = window.CSS.supports('padding-top', 'env(safe-area-inset-top)');
    
    if (supportsEnv) {
      // Create a temporary element to measure safe area insets
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        padding-top: env(safe-area-inset-top);
        padding-right: env(safe-area-inset-right);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        visibility: hidden;
        pointer-events: none;
      `;
      document.body.appendChild(el);
      
      const computed = getComputedStyle(el);
      const result = {
        top: parseFloat(computed.paddingTop) || 0,
        right: parseFloat(computed.paddingRight) || 0,
        bottom: parseFloat(computed.paddingBottom) || 0,
        left: parseFloat(computed.paddingLeft) || 0,
      };
      
      document.body.removeChild(el);
      return result;
    }
    
    return { top: 0, right: 0, bottom: 0, left: 0 };
  });

  return insets;
}

export default useViewportHeight;
