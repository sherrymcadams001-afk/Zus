/**
 * useSwipeGesture Hook
 * 
 * Touch gesture detection for swipe navigation
 * Supports left, right, up, down directions with configurable thresholds
 */

import { useRef, useCallback, useEffect } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeConfig {
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number;
  /** Maximum time in ms for the swipe gesture (default: 300) */
  maxTime?: number;
  /** Minimum velocity in px/ms (default: 0.3) */
  minVelocity?: number;
  /** Callback when swipe is detected */
  onSwipe?: (direction: SwipeDirection) => void;
  /** Callback for specific directions */
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Whether swipe detection is enabled (default: true) */
  enabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isActive: boolean;
}

/**
 * Hook to detect swipe gestures on a ref element
 * @param config - Swipe configuration options
 * @returns ref to attach to the element
 */
export function useSwipeGesture<T extends HTMLElement>(config: SwipeConfig = {}) {
  const {
    threshold = 50,
    maxTime = 300,
    minVelocity = 0.3,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    enabled = true,
  } = config;

  const elementRef = useRef<T>(null);
  const touchStateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isActive: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    if (!touch) return;

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isActive: true,
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStateRef.current.isActive) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const { startX, startY, startTime } = touchStateRef.current;
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;

    // Reset state
    touchStateRef.current.isActive = false;

    // Check time constraint
    if (deltaTime > maxTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine primary direction
    const isHorizontal = absX > absY;
    const distance = isHorizontal ? absX : absY;
    const velocity = distance / deltaTime;

    // Check thresholds
    if (distance < threshold || velocity < minVelocity) return;

    let direction: SwipeDirection;

    if (isHorizontal) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Fire callbacks
    onSwipe?.(direction);

    switch (direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }
  }, [enabled, threshold, maxTime, minVelocity, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStateRef.current.isActive) return;
    
    // Optional: Prevent default scrolling during horizontal swipes
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);

    // If horizontal movement is dominant, prevent vertical scroll
    if (deltaX > deltaY && deltaX > 10) {
      // Don't prevent default - let browser handle scroll
      // e.preventDefault();
    }
  }, [enabled]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enabled, handleTouchStart, handleTouchEnd, handleTouchMove]);

  return elementRef;
}

/**
 * Hook to detect swipes anywhere on the document
 */
export function useGlobalSwipe(config: SwipeConfig = {}) {
  const {
    threshold = 50,
    maxTime = 300,
    minVelocity = 0.3,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    enabled = true,
  } = config;

  const touchStateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isActive: false,
  });

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isActive: true,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStateRef.current.isActive) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const { startX, startY, startTime } = touchStateRef.current;
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      touchStateRef.current.isActive = false;

      if (deltaTime > maxTime) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const isHorizontal = absX > absY;
      const distance = isHorizontal ? absX : absY;
      const velocity = distance / deltaTime;

      if (distance < threshold || velocity < minVelocity) return;

      let direction: SwipeDirection;
      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      onSwipe?.(direction);

      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, maxTime, minVelocity, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
}

export default useSwipeGesture;
