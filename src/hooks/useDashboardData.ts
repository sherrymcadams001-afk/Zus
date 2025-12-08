/**
 * useDashboardData Hook
 * 
 * React hook for consuming orchestrated dashboard data.
 * Handles polling, caching, and error states.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData } from '../core/DataOrchestrator';
import {
  orchestrateDashboardData,
  getDefaultDashboardData,
} from '../core/DataOrchestrator';

interface UseDashboardDataOptions {
  /** Polling interval in milliseconds. Default 30000 (30s) */
  pollingInterval?: number;
  /** Whether to enable polling. Default true */
  enablePolling?: boolean;
  /** Callback when data updates */
  onUpdate?: (data: DashboardData) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface UseDashboardDataResult {
  data: DashboardData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastFetch: number | null;
}

export function useDashboardData(
  options: UseDashboardDataOptions = {}
): UseDashboardDataResult {
  const {
    pollingInterval = 30000,
    enablePolling = true,
    onUpdate,
    onError,
  } = options;

  const [data, setData] = useState<DashboardData>(getDefaultDashboardData());
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  
  const isMounted = useRef(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      
      const dashboardData = await orchestrateDashboardData();
      
      if (isMounted.current) {
        setData(dashboardData);
        setLastFetch(Date.now());
        onUpdate?.(dashboardData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch dashboard data');
      
      if (isMounted.current) {
        setIsError(true);
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [onUpdate, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (enablePolling && pollingInterval > 0) {
      pollingRef.current = setInterval(fetchData, pollingInterval);
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, pollingInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData,
    lastFetch,
  };
}

/**
 * Lightweight hook for just wallet balance
 * More efficient for components that only need AUM
 */
export function useWalletBalance() {
  const { data, isLoading, refetch } = useDashboardData({
    pollingInterval: 60000, // Less frequent for balance-only
  });

  return {
    balance: data.aum,
    tier: data.currentTier,
    isLoading,
    refetch,
  };
}

/**
 * Hook for earnings projections only
 */
export function useEarningsProjections() {
  const { data, isLoading } = useDashboardData({
    enablePolling: false, // Projections don't need polling
  });

  return {
    daily: data.dailyEarnings,
    weekly: data.weeklyEarnings,
    monthly: data.monthlyEarnings,
    tier: data.currentTier,
    isLoading,
  };
}

/**
 * Hook for strategy metrics only
 */
export function useStrategyMetrics() {
  const { data, isLoading, refetch } = useDashboardData({
    pollingInterval: 60000,
  });

  return {
    sharpeRatio: data.sharpeRatio,
    maxDrawdown: data.maxDrawdown,
    winRate: data.winRate,
    isLoading,
    refetch,
  };
}
