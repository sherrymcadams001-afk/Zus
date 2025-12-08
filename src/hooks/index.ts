/**
 * Hooks
 * 
 * Custom React hooks for the CapWheel application
 */

// Dashboard data hooks
export {
  useDashboardData,
  useWalletBalance,
  useEarningsProjections,
  useStrategyMetrics,
} from './useDashboardData';

// Media query and responsive hooks
export {
  useMediaQuery,
  useResponsive,
  useBreakpoint,
  useWindowSize,
  BREAKPOINTS,
  MEDIA_QUERIES,
} from './useMediaQuery';

// Touch gesture hooks
export {
  useSwipeGesture,
  useGlobalSwipe,
  type SwipeDirection,
} from './useSwipeGesture';

// Viewport and keyboard hooks
export {
  useViewportHeight,
  useFullHeight,
  useKeyboardOpen,
  useKeyboardScrollLock,
  useSafeAreaInsets,
} from './useViewportHeight';

// Animation hooks
export { useSellFlashEffect } from './useSellFlashEffect';
