import { create } from 'zustand';

export interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl: number;
  timestamp: number;
}

export interface LogEntry {
  id: number;
  timestamp: number;
  message: string;
  type: 'trade' | 'signal' | 'system';
}

interface PortfolioState {
  // Core Values
  walletBalance: number;
  poolBalance: number;
  totalEquity: number;
  sessionPnL: number;
  startOfDayEquity: number;
  
  // History
  trades: Trade[];
  logs: LogEntry[];
  
  // Actions
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  updateBalances: (walletDelta: number, poolDelta: number) => void;
  setEquity: (equity: number) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  walletBalance: 12588.00,
  poolBalance: 142500000.00, // Large liquidity pool
  totalEquity: 142512588.00,
  sessionPnL: 270.60,
  startOfDayEquity: 142512588.00, // Baseline for daily target
  trades: [],
  logs: [],

  addTrade: (tradeData) => {
    const state = get();
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now(),
      timestamp: Date.now(),
    };
    
    // Update PnL based on trade result
    const newPnL = state.sessionPnL + tradeData.pnl;
    
    // Update balances (simplified: profit adds to wallet)
    // We want the wallet to grow with profits, but stay smaller than pool
    
    set((state) => ({
      trades: [newTrade, ...state.trades].slice(0, 50),
      sessionPnL: newPnL,
      walletBalance: state.walletBalance + tradeData.pnl,
      totalEquity: state.totalEquity + tradeData.pnl,
    }));
  },

  addLog: (message, type) => {
    set((state) => ({
      logs: [{
        id: Date.now(),
        timestamp: Date.now(),
        message,
        type
      }, ...state.logs].slice(0, 50)
    }));
  },

  updateBalances: (walletDelta, poolDelta) => {
    set((state) => ({
      walletBalance: state.walletBalance + walletDelta,
      poolBalance: state.poolBalance + poolDelta,
      totalEquity: state.totalEquity + walletDelta + poolDelta
    }));
  },

  setEquity: (equity) => set({ totalEquity: equity }),
}));
