import { create } from 'zustand';
import { apiClient } from '../api/client';

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
  startOfDayWalletBalance: number;
  
  // Loading state
  isLoading: boolean;
  isInitialized: boolean;
  
  // Flash state for sell events
  lastSellTimestamp: number | null;
  
  // History
  trades: Trade[];
  logs: LogEntry[];
  
  // Actions
  initFromBackend: () => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  updateBalances: (walletDelta: number, poolDelta: number) => void;
  setEquity: (equity: number) => void;
  setWalletBalance: (balance: number) => void;
  resetDailyEquity: (walletBalance: number) => void;
  clearSellFlash: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  // Initialize with zeros - real data comes from backend
  walletBalance: 0,
  poolBalance: 0,
  totalEquity: 0,
  sessionPnL: 0,
  startOfDayEquity: 0,
  startOfDayWalletBalance: 0,
  
  isLoading: false,
  isInitialized: false,
  lastSellTimestamp: null,
  trades: [],
  logs: [],

  // Fetch real data from backend
  initFromBackend: async () => {
    const state = get();
    if (state.isInitialized || state.isLoading) return;
    
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/api/dashboard');
      const { wallet, staking, transactions } = response.data;
      
      const walletBalance = wallet?.available_balance ?? 0;
      const stakedBalance = staking?.totalStaked ?? 0;
      const totalEquity = walletBalance + stakedBalance;
      
      // Convert recent transactions to trades format
      const recentTrades: Trade[] = (transactions || []).slice(0, 20).map((tx: {
        id: number;
        type: string;
        amount: number;
        created_at: string;
      }) => ({
        id: tx.id,
        symbol: 'USDT',
        side: tx.type === 'deposit' ? 'BUY' : 'SELL',
        price: 1,
        quantity: tx.amount,
        pnl: tx.type === 'profit' ? tx.amount : 0,
        timestamp: new Date(tx.created_at).getTime(),
      }));
      
      set({
        walletBalance,
        totalEquity,
        startOfDayWalletBalance: walletBalance,
        startOfDayEquity: totalEquity,
        trades: recentTrades,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to init portfolio from backend:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  setWalletBalance: (balance) => set((state) => ({ 
    walletBalance: balance,
    totalEquity: balance + state.poolBalance,
  })),

  resetDailyEquity: (walletBalance) => set((state) => ({
    startOfDayEquity: walletBalance + state.poolBalance,
    startOfDayWalletBalance: walletBalance,
    sessionPnL: 0,
  })),

  addTrade: (tradeData) => {
    const state = get();
    const pnl = Number(tradeData.pnl);
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now(),
      timestamp: Date.now(),
      pnl,
    };
    
    // Update PnL based on trade result
    const newPnL = state.sessionPnL + pnl;
    
    // Track sell timestamp for flash effect
    const isSell = tradeData.side === 'SELL';
    
    // Update balances (Zero-sum: User profit = Pool loss, User loss = Pool profit)
    set((state) => ({
      trades: [newTrade, ...state.trades].slice(0, 50),
      sessionPnL: newPnL,
      walletBalance: state.walletBalance + pnl,
      poolBalance: state.poolBalance - pnl,
      totalEquity: state.totalEquity + pnl,
      lastSellTimestamp: isSell ? Date.now() : state.lastSellTimestamp,
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
  
  clearSellFlash: () => set({ lastSellTimestamp: null }),
}));
