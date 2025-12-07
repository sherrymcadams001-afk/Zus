/**
 * CapWheel Context
 * 
 * Enterprise-specific state management for CapWheel platform
 * Manages RWA positions, hedge metrics, and portfolio data
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// ========== Type Definitions ==========

export interface RWAPosition {
  id: string;
  type: 'T-Bills' | 'Real Estate' | 'Gold' | 'Commodities' | 'Private Credit';
  allocation: number; // Percentage
  value: number; // USD value
  yield: number; // APY percentage
  maturity?: string; // ISO date string
}

export interface HedgeMetrics {
  totalRWAAllocation: number; // Percentage of portfolio in RWA
  cryptoAllocation: number; // Percentage of portfolio in crypto
  hedgeEfficiency: number; // 0-100 score
  autoRebalanceEnabled: boolean;
  isRebalancing: boolean; // Whether rebalancing is currently active
  lastRebalance: string; // ISO date string
  targetHedgeRatio: number; // Target RWA percentage
}

export interface PortfolioMetrics {
  totalAUM: number; // Assets Under Management (USD)
  dailyPnL: number; // Daily Profit & Loss (USD)
  dailyPnLPercent: number; // Daily P&L percentage
  sharpeRatio: number;
  winRate: number; // Percentage
  volatilityCaptured: number; // Percentage
  timeWeightedReturn: number; // Percentage
}

export interface MarketSession {
  session: 'PRE_MARKET' | 'MARKET_OPEN' | 'MARKET_CLOSE' | 'AFTER_HOURS' | 'WEEKEND';
  nextEvent: string;
  timeUntilNext: number; // seconds
}

export interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: 'Trader' | 'Analyst' | 'Risk Manager' | 'Executive' | 'Admin';
  desk?: string;
  permissions: string[];
}

interface CapWheelContextType {
  // State
  rwaPositions: RWAPosition[];
  hedgeMetrics: HedgeMetrics;
  portfolioMetrics: PortfolioMetrics;
  marketSession: MarketSession;
  enterpriseUser: EnterpriseUser | null;
  
  // Actions
  updateRWAPositions: (positions: RWAPosition[]) => void;
  updateHedgeMetrics: (metrics: Partial<HedgeMetrics>) => void;
  updatePortfolioMetrics: (metrics: Partial<PortfolioMetrics>) => void;
  toggleAutoRebalance: () => void;
  setEnterpriseUser: (user: EnterpriseUser | null) => void;
}

// ========== Context Creation ==========

const CapWheelContext = createContext<CapWheelContextType | undefined>(undefined);

// ========== Mock Data Generators ==========

const generateMockRWAPositions = (): RWAPosition[] => [
  {
    id: 'rwa-1',
    type: 'T-Bills',
    allocation: 35,
    value: 1750000,
    yield: 4.5,
    maturity: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rwa-2',
    type: 'Gold',
    allocation: 15,
    value: 750000,
    yield: 0,
  },
  {
    id: 'rwa-3',
    type: 'Real Estate',
    allocation: 25,
    value: 1250000,
    yield: 6.2,
  },
  {
    id: 'rwa-4',
    type: 'Private Credit',
    allocation: 20,
    value: 1000000,
    yield: 8.5,
    maturity: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rwa-5',
    type: 'Commodities',
    allocation: 5,
    value: 250000,
    yield: 3.2,
  },
];

const generateMockHedgeMetrics = (): HedgeMetrics => ({
  totalRWAAllocation: 60,
  cryptoAllocation: 40,
  hedgeEfficiency: 87.5,
  autoRebalanceEnabled: true,
  isRebalancing: false,
  lastRebalance: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  targetHedgeRatio: 60,
});

const generateMockPortfolioMetrics = (): PortfolioMetrics => ({
  totalAUM: 12500000,
  dailyPnL: 125000,
  dailyPnLPercent: 1.02,
  sharpeRatio: 2.35,
  winRate: 68.5,
  volatilityCaptured: 24.8,
  timeWeightedReturn: 18.6,
});

const getCurrentMarketSession = (): MarketSession => {
  const now = new Date();
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  
  // Weekend
  if (day === 0 || day === 6) {
    return {
      session: 'WEEKEND',
      nextEvent: 'Market Open',
      timeUntilNext: 0,
    };
  }
  
  // Market hours (approximate - 9:30 AM - 4:00 PM EST = 14:30 - 21:00 UTC)
  if (hour >= 14 && hour < 21) {
    return {
      session: 'MARKET_OPEN',
      nextEvent: 'Market Close',
      timeUntilNext: (21 - hour) * 3600,
    };
  } else if (hour >= 13 && hour < 14) {
    return {
      session: 'PRE_MARKET',
      nextEvent: 'Market Open',
      timeUntilNext: (14 - hour) * 3600,
    };
  } else if (hour >= 21 && hour < 23) {
    return {
      session: 'AFTER_HOURS',
      nextEvent: 'Market Close',
      timeUntilNext: 0,
    };
  }
  
  return {
    session: 'MARKET_CLOSE',
    nextEvent: 'Pre-Market',
    timeUntilNext: 0,
  };
};

// ========== Provider Component ==========

export const CapWheelProvider = ({ children }: { children: ReactNode }) => {
  const [rwaPositions, setRwaPositions] = useState<RWAPosition[]>(generateMockRWAPositions());
  const [hedgeMetrics, setHedgeMetrics] = useState<HedgeMetrics>(generateMockHedgeMetrics());
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics>(generateMockPortfolioMetrics());
  const [marketSession, setMarketSession] = useState<MarketSession>(getCurrentMarketSession());
  const [enterpriseUser, setEnterpriseUser] = useState<EnterpriseUser | null>(null);

  // Update market session every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketSession(getCurrentMarketSession());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Simulate live portfolio updates with bounds
  useEffect(() => {
    const baseMetrics = generateMockPortfolioMetrics();
    const interval = setInterval(() => {
      setPortfolioMetrics((prev) => {
        const newDailyPnL = prev.dailyPnL + (Math.random() - 0.5) * 5000;
        const newDailyPnLPercent = prev.dailyPnLPercent + (Math.random() - 0.5) * 0.1;
        
        // Keep values within reasonable bounds (±50% of baseline)
        const boundedDailyPnL = Math.max(
          baseMetrics.dailyPnL * 0.5,
          Math.min(baseMetrics.dailyPnL * 1.5, newDailyPnL)
        );
        const boundedDailyPnLPercent = Math.max(
          baseMetrics.dailyPnLPercent * 0.5,
          Math.min(baseMetrics.dailyPnLPercent * 1.5, newDailyPnLPercent)
        );
        
        return {
          ...prev,
          dailyPnL: boundedDailyPnL,
          dailyPnLPercent: boundedDailyPnLPercent,
        };
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const updateRWAPositions = (positions: RWAPosition[]) => {
    setRwaPositions(positions);
  };

  const updateHedgeMetrics = (metrics: Partial<HedgeMetrics>) => {
    setHedgeMetrics((prev) => ({ ...prev, ...metrics }));
  };

  const updatePortfolioMetrics = (metrics: Partial<PortfolioMetrics>) => {
    setPortfolioMetrics((prev) => ({ ...prev, ...metrics }));
  };

  const toggleAutoRebalance = () => {
    setHedgeMetrics((prev) => ({
      ...prev,
      autoRebalanceEnabled: !prev.autoRebalanceEnabled,
      lastRebalance: !prev.autoRebalanceEnabled ? new Date().toISOString() : prev.lastRebalance,
    }));
  };

  const value: CapWheelContextType = {
    rwaPositions,
    hedgeMetrics,
    portfolioMetrics,
    marketSession,
    enterpriseUser,
    updateRWAPositions,
    updateHedgeMetrics,
    updatePortfolioMetrics,
    toggleAutoRebalance,
    setEnterpriseUser,
  };

  return (
    <CapWheelContext.Provider value={value}>
      {children}
    </CapWheelContext.Provider>
  );
};

// ========== Hook ==========

export const useCapWheel = () => {
  const context = useContext(CapWheelContext);
  if (context === undefined) {
    throw new Error('useCapWheel must be used within a CapWheelProvider');
  }
  return context;
};
