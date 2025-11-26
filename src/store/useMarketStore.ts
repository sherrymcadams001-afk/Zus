import { create } from 'zustand';

/**
 * Ticker data from Binance miniTicker stream
 */
export interface Ticker {
  symbol: string;
  closePrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  eventTime: number;
}

/**
 * Kline/Candlestick data from Binance kline stream
 */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  isClosed: boolean;
}

interface MarketState {
  /** Map of symbol -> Ticker data */
  tickers: Map<string, Ticker>;
  /** Currently active candle from kline stream */
  activeCandle: Candle | null;
  /** Historical candles for the active symbol */
  historicalCandles: Candle[];
  /** Connection status for ticker stream */
  tickerConnected: boolean;
  /** Connection status for kline stream */
  klineConnected: boolean;

  // Actions
  updateTickers: (tickers: Map<string, Ticker>) => void;
  setActiveCandle: (candle: Candle | null) => void;
  setHistoricalCandles: (candles: Candle[]) => void;
  setTickerConnected: (connected: boolean) => void;
  setKlineConnected: (connected: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  tickers: new Map(),
  activeCandle: null,
  historicalCandles: [],
  tickerConnected: false,
  klineConnected: false,

  updateTickers: (tickers) => set({ tickers }),
  setActiveCandle: (candle) => set({ activeCandle: candle }),
  setHistoricalCandles: (candles) => set({ historicalCandles: candles }),
  setTickerConnected: (connected) => set({ tickerConnected: connected }),
  setKlineConnected: (connected) => set({ klineConnected: connected }),
}));
