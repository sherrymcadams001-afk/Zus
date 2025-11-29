import { useEffect, useState, useRef, useCallback } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

/**
 * Custom hook that provides a flash effect when sell trades occur.
 * Returns `true` briefly (~300ms) when a sell trade happens, then returns to `false`.
 */
export function useSellFlashEffect(): boolean {
  const { lastSellTimestamp, clearSellFlash } = usePortfolioStore();
  const [sellFlashActive, setSellFlashActive] = useState(false);
  const prevSellTimestamp = useRef<number | null>(null);

  const handleReset = useCallback(() => {
    setSellFlashActive(false);
    clearSellFlash();
  }, [clearSellFlash]);

  useEffect(() => {
    if (lastSellTimestamp && lastSellTimestamp !== prevSellTimestamp.current) {
      prevSellTimestamp.current = lastSellTimestamp;
      
      // Use setTimeout to schedule state updates asynchronously
      const flashTimeout = setTimeout(() => {
        setSellFlashActive(true);
      }, 0);
      
      // Reset after ~300ms
      const resetTimeout = setTimeout(handleReset, 300);
      
      return () => {
        clearTimeout(flashTimeout);
        clearTimeout(resetTimeout);
      };
    }
  }, [lastSellTimestamp, handleReset]);

  return sellFlashActive;
}
