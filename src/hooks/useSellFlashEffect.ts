import { useEffect, useState, useRef } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

/**
 * Custom hook that provides a flash effect when sell trades occur.
 * Returns `true` briefly (~300ms) when a sell trade happens, then returns to `false`.
 */
export function useSellFlashEffect(): boolean {
  const lastSellTimestamp = usePortfolioStore((state) => state.lastSellTimestamp);
  const [sellFlashActive, setSellFlashActive] = useState(false);
  const prevSellTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (lastSellTimestamp && lastSellTimestamp !== prevSellTimestamp.current) {
      prevSellTimestamp.current = lastSellTimestamp;
      
      // Activate flash on next tick to avoid synchronous setState in effect
      const activateTimeout = setTimeout(() => {
        setSellFlashActive(true);
      }, 0);
      
      // Reset after 300ms
      const resetTimeout = setTimeout(() => {
        setSellFlashActive(false);
      }, 300);
      
      return () => {
        clearTimeout(activateTimeout);
        clearTimeout(resetTimeout);
      };
    }
  }, [lastSellTimestamp]);

  return sellFlashActive;
}
