import { useMarketStore, type Ticker, type Candle } from '../store/useMarketStore';

/**
 * Configuration options for StreamEngine
 */
export interface StreamEngineConfig {
  /** Use US Binance endpoints (stream.binance.us) instead of global (stream.binance.com) */
  useUSEndpoint?: boolean;
  /** Enable console logging of incoming data */
  enableLogging?: boolean;
  /** Symbols to log for debugging (defaults to ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']) */
  logSymbols?: string[];
}

/**
 * Raw ticker data from Binance miniTicker stream
 */
interface BinanceMiniTicker {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
}

/**
 * Raw kline data from Binance kline stream
 */
interface BinanceKlineEvent {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
    V: string; // Taker buy base asset volume
    Q: string; // Taker buy quote asset volume
    B: string; // Ignore
  };
}

/**
 * StreamEngine - Singleton class for managing Binance WebSocket connections
 *
 * Features:
 * - Socket A: Connects to miniTicker@arr stream for all market tickers
 * - Socket B: Connects to kline stream for active chart symbol
 * - Buffering: Uses requestAnimationFrame to flush updates max 60 times/sec
 * - Auto-reconnect: Automatically reconnects on connection close
 * - US Support: Flag to switch between global and US Binance endpoints
 */
class StreamEngine {
  private static instance: StreamEngine | null = null;

  private tickerSocket: WebSocket | null = null;
  private klineSocket: WebSocket | null = null;

  private tickerBuffer: Map<string, Ticker> = new Map();
  private frameScheduled = false;
  private isRunning = false;

  private config: Required<StreamEngineConfig>;
  private activeSymbol: string | null = null;

  private readonly BASE_URL_GLOBAL = 'wss://stream.binance.com:9443/ws';
  private readonly BASE_URL_US = 'wss://stream.binance.us:9443/ws';

  private reconnectTimeouts: { ticker?: ReturnType<typeof setTimeout>; kline?: ReturnType<typeof setTimeout> } = {};
  private readonly RECONNECT_DELAY = 3000;
  private readonly DEFAULT_LOG_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

  private constructor(config: StreamEngineConfig = {}) {
    this.config = {
      useUSEndpoint: config.useUSEndpoint ?? false,
      enableLogging: config.enableLogging ?? true,
      logSymbols: config.logSymbols ?? this.DEFAULT_LOG_SYMBOLS,
    };
  }

  /**
   * Get the singleton instance of StreamEngine
   */
  public static getInstance(config?: StreamEngineConfig): StreamEngine {
    if (!StreamEngine.instance) {
      StreamEngine.instance = new StreamEngine(config);
    }
    return StreamEngine.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    if (StreamEngine.instance) {
      StreamEngine.instance.stop();
      StreamEngine.instance = null;
    }
  }

  /**
   * Get the base WebSocket URL based on configuration
   */
  private get baseUrl(): string {
    return this.config.useUSEndpoint ? this.BASE_URL_US : this.BASE_URL_GLOBAL;
  }

  /**
   * Log a message if logging is enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.config.enableLogging) {
      if (data !== undefined) {
        console.log(`[StreamEngine] ${message}`, data);
      } else {
        console.log(`[StreamEngine] ${message}`);
      }
    }
  }

  /**
   * Start all WebSocket connections
   */
  public start(): void {
    if (this.isRunning) {
      this.log('Already running');
      return;
    }

    this.isRunning = true;
    this.log('Starting StreamEngine...');
    this.log(`Using ${this.config.useUSEndpoint ? 'US' : 'Global'} endpoint`);

    this.connectTickerStream();

    // Also reconnect kline stream if an active symbol is set
    if (this.activeSymbol) {
      this.connectKlineStream();
    }
  }

  /**
   * Stop all WebSocket connections
   */
  public stop(): void {
    this.isRunning = false;
    this.log('Stopping StreamEngine...');

    // Clear reconnect timeouts
    if (this.reconnectTimeouts.ticker) {
      clearTimeout(this.reconnectTimeouts.ticker);
    }
    if (this.reconnectTimeouts.kline) {
      clearTimeout(this.reconnectTimeouts.kline);
    }

    // Close sockets
    if (this.tickerSocket) {
      this.tickerSocket.close();
      this.tickerSocket = null;
    }
    if (this.klineSocket) {
      this.klineSocket.close();
      this.klineSocket = null;
    }

    // Clear buffer
    this.tickerBuffer.clear();
    this.frameScheduled = false;

    // Update store
    useMarketStore.getState().setTickerConnected(false);
    useMarketStore.getState().setKlineConnected(false);
  }

  /**
   * Set the active symbol for kline stream
   */
  public setActiveSymbol(symbol: string): void {
    const normalizedSymbol = symbol.toLowerCase();

    if (this.activeSymbol === normalizedSymbol) {
      return;
    }

    this.activeSymbol = normalizedSymbol;
    this.log(`Setting active symbol: ${symbol}`);

    // Reconnect kline stream with new symbol
    if (this.klineSocket) {
      this.klineSocket.close();
    }

    if (this.isRunning) {
      this.connectKlineStream();
    }
  }

  /**
   * Subscribe to chart data for a symbol (alias for setActiveSymbol)
   */
  public subscribeToChart(symbol: string): void {
    this.setActiveSymbol(symbol);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<StreamEngineConfig>): void {
    const needsReconnect = config.useUSEndpoint !== undefined &&
      config.useUSEndpoint !== this.config.useUSEndpoint;

    this.config = { ...this.config, ...config };

    if (needsReconnect && this.isRunning) {
      this.log('Endpoint changed, reconnecting...');
      this.stop();
      this.start();
    }
  }

  /**
   * Connect to the miniTicker stream (Socket A)
   */
  private connectTickerStream(): void {
    const url = `${this.baseUrl}/!miniTicker@arr`;
    this.log(`Connecting to ticker stream: ${url}`);

    try {
      this.tickerSocket = new WebSocket(url);

      this.tickerSocket.onopen = () => {
        this.log('Ticker stream connected');
        useMarketStore.getState().setTickerConnected(true);
      };

      this.tickerSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BinanceMiniTicker[];
          this.handleTickerData(data);
        } catch (error) {
          this.log('Error parsing ticker data', error);
        }
      };

      this.tickerSocket.onerror = (error) => {
        this.log('Ticker stream error', error);
      };

      this.tickerSocket.onclose = () => {
        this.log('Ticker stream closed');
        useMarketStore.getState().setTickerConnected(false);

        // Auto-reconnect
        if (this.isRunning) {
          this.log(`Reconnecting ticker stream in ${this.RECONNECT_DELAY}ms...`);
          this.reconnectTimeouts.ticker = setTimeout(() => {
            this.connectTickerStream();
          }, this.RECONNECT_DELAY);
        }
      };
    } catch (error) {
      this.log('Failed to create ticker WebSocket', error);
    }
  }

  /**
   * Connect to the kline stream (Socket B)
   */
  private connectKlineStream(): void {
    if (!this.activeSymbol) {
      this.log('No active symbol set for kline stream');
      return;
    }

    const url = `${this.baseUrl}/${this.activeSymbol}@kline_1m`;
    this.log(`Connecting to kline stream: ${url}`);

    try {
      this.klineSocket = new WebSocket(url);

      this.klineSocket.onopen = () => {
        this.log('Kline stream connected');
        useMarketStore.getState().setKlineConnected(true);
      };

      this.klineSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BinanceKlineEvent;
          this.handleKlineData(data);
        } catch (error) {
          this.log('Error parsing kline data', error);
        }
      };

      this.klineSocket.onerror = (error) => {
        this.log('Kline stream error', error);
      };

      this.klineSocket.onclose = () => {
        this.log('Kline stream closed');
        useMarketStore.getState().setKlineConnected(false);

        // Auto-reconnect
        if (this.isRunning && this.activeSymbol) {
          this.log(`Reconnecting kline stream in ${this.RECONNECT_DELAY}ms...`);
          this.reconnectTimeouts.kline = setTimeout(() => {
            this.connectKlineStream();
          }, this.RECONNECT_DELAY);
        }
      };
    } catch (error) {
      this.log('Failed to create kline WebSocket', error);
    }
  }

  /**
   * Handle incoming ticker data - buffer and schedule flush
   */
  private handleTickerData(data: BinanceMiniTicker[]): void {
    // Buffer the data
    for (const ticker of data) {
      this.tickerBuffer.set(ticker.s, {
        symbol: ticker.s,
        closePrice: ticker.c,
        openPrice: ticker.o,
        highPrice: ticker.h,
        lowPrice: ticker.l,
        volume: ticker.v,
        quoteVolume: ticker.q,
        eventTime: ticker.E,
      });
    }

    // Schedule a frame flush if not already scheduled
    if (!this.frameScheduled) {
      this.frameScheduled = true;
      requestAnimationFrame(() => this.flushTickerBuffer());
    }
  }

  /**
   * Flush the ticker buffer to the store (max 60fps)
   */
  private flushTickerBuffer(): void {
    this.frameScheduled = false;

    if (this.tickerBuffer.size === 0) {
      return;
    }

    // Create a new Map from the buffer
    const tickers = new Map(this.tickerBuffer);

    // Get current store tickers and merge
    const currentTickers = useMarketStore.getState().tickers;
    const mergedTickers = new Map(currentTickers);

    for (const [symbol, ticker] of tickers) {
      mergedTickers.set(symbol, ticker);
    }

    // Update store
    useMarketStore.getState().updateTickers(mergedTickers);

    // Log sample data using configurable symbols
    for (const symbol of this.config.logSymbols) {
      const ticker = tickers.get(symbol);
      if (ticker) {
        this.log(`${symbol}: $${parseFloat(ticker.closePrice).toFixed(2)}`);
      }
    }

    // Clear buffer
    this.tickerBuffer.clear();
  }

  /**
   * Handle incoming kline data
   */
  private handleKlineData(data: BinanceKlineEvent): void {
    const kline = data.k;

    const candle: Candle = {
      time: kline.t,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      symbol: kline.s,
      isClosed: kline.x,
    };

    useMarketStore.getState().setActiveCandle(candle);

    this.log(
      `${candle.symbol} Candle: O:${candle.open.toFixed(2)} H:${candle.high.toFixed(2)} L:${candle.low.toFixed(2)} C:${candle.close.toFixed(2)} ${candle.isClosed ? '[CLOSED]' : ''}`
    );
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<StreamEngineConfig> {
    return { ...this.config };
  }

  /**
   * Check if engine is running
   */
  public isEngineRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const streamEngine = StreamEngine.getInstance();

// Export class for type usage and testing
export { StreamEngine };
