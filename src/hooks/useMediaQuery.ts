/**
 * useMediaQuery Hook
 * 
 * Responsive breakpoint detection with SSR support
 * Mobile: 320px - 767px
 * Tablet: 768px - 1023px
 * Desktop: 1024px+
 */

import { useState, useEffect, useCallback } from 'react';

// Breakpoint values aligned with Tailwind defaults
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

// Media query strings for each breakpoint
export const MEDIA_QUERIES = {
  isMobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  isTablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  isDesktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  isWide: `(min-width: ${BREAKPOINTS.wide}px)`,
  isTouchDevice: '(hover: none) and (pointer: coarse)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDarkMode: '(prefers-color-scheme: dark)',
} as const;

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR, using lazy initialization
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);

    // Create event handler for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use modern API if available
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handler);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handler);
      } else {
        mediaQueryList.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook for common responsive breakpoints
 * Returns an object with boolean flags for each breakpoint
 */
export function useResponsive() {
  const isMobile = useMediaQuery(MEDIA_QUERIES.isMobile);
  const isTablet = useMediaQuery(MEDIA_QUERIES.isTablet);
  const isDesktop = useMediaQuery(MEDIA_QUERIES.isDesktop);
  const isWide = useMediaQuery(MEDIA_QUERIES.isWide);
  const isTouchDevice = useMediaQuery(MEDIA_QUERIES.isTouchDevice);
  const prefersReducedMotion = useMediaQuery(MEDIA_QUERIES.prefersReducedMotion);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isTouchDevice,
    prefersReducedMotion,
    // Composite helpers
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}

/**
 * Hook to get current breakpoint as a string
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'wide' {
  const isWide = useMediaQuery(MEDIA_QUERIES.isWide);
  const isDesktop = useMediaQuery(MEDIA_QUERIES.isDesktop);
  const isTablet = useMediaQuery(MEDIA_QUERIES.isTablet);

  if (isWide) return 'wide';
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}

/**
 * Hook to track window dimensions
 */
export function useWindowSize() {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const handleResize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Debounced resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize]);

  return size;
}

export default useMediaQuery;
