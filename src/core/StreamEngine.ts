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
 * Raw kline data from Binance REST API (array format)
 */
type BinanceKlineArray = [
  number,   // 0: Open time
  string,   // 1: Open price
  string,   // 2: High price
  string,   // 3: Low price
  string,   // 4: Close price
  string,   // 5: Volume
  number,   // 6: Close time
  string,   // 7: Quote asset volume
  number,   // 8: Number of trades
  string,   // 9: Taker buy base asset volume
  string,   // 10: Taker buy quote asset volume
  string    // 11: Ignore
];

const STORAGE_KEY_REGION = 'orion_binance_region';

/**
 * StreamEngine - Singleton class for managing Binance WebSocket connections
 *
 * Features:
 * - Geo-Failover: Auto-detects blocked regions and switches endpoints
 * - Socket A: Connects to miniTicker@arr stream for all market tickers
 * - Socket B: Connects to kline stream for active chart symbol
 * - Buffering: Uses requestAnimationFrame to flush updates max 60 times/sec
 * - Auto-reconnect: Automatically reconnects on connection close
 * - Abort Control: Cancels pending fetch requests on rapid symbol switching
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
  private activeInterval: string = '1m';

  private readonly BASE_URL_GLOBAL = 'wss://stream.binance.com:9443/ws';
  private readonly BASE_URL_US = 'wss://stream.binance.us:9443/ws';
  private readonly API_BASE_URL_GLOBAL = 'https://api.binance.com/api/v3';
  private readonly API_BASE_URL_US = 'https://api.binance.us/api/v3';

  private reconnectTimeouts: { ticker?: ReturnType<typeof setTimeout>; kline?: ReturnType<typeof setTimeout> } = {};
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly RECONNECT_DELAY = 3000;
  private readonly POLLING_INTERVAL = 5000; // Poll every 5s as fallback
  private readonly DEFAULT_LOG_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

  // Abort controller for fetch requests
  private currentFetchController: AbortController | null = null;
  private failoverAttempted = false;

  private constructor(config: StreamEngineConfig = {}) {
    // Check localStorage for persisted region preference
    const savedRegion = this.getSavedRegion();
    
    this.config = {
      useUSEndpoint: savedRegion === 'US' || (config.useUSEndpoint ?? false),
      enableLogging: config.enableLogging ?? true,
      logSymbols: config.logSymbols ?? this.DEFAULT_LOG_SYMBOLS,
    };
  }

  /**
   * Get saved region from localStorage
   */
  private getSavedRegion(): 'US' | 'GLOBAL' | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REGION);
      if (saved === 'US' || saved === 'GLOBAL') return saved;
    } catch {
      // localStorage not available
    }
    return null;
  }

  /**
   * Save region preference to localStorage
   */
  private saveRegion(region: 'US' | 'GLOBAL'): void {
    try {
      localStorage.setItem(STORAGE_KEY_REGION, region);
      this.log(`Region preference saved: ${region}`);
    } catch {
      // localStorage not available
    }
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
   * Get the API base URL based on configuration
   */
  private get apiBaseUrl(): string {
    return this.config.useUSEndpoint ? this.API_BASE_URL_US : this.API_BASE_URL_GLOBAL;
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
   * Start all WebSocket connections with geo-failover
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Already running');
      return;
    }

    this.isRunning = true;
    this.failoverAttempted = false;
    this.log('Starting StreamEngine...');

    // Start polling immediately (will use default config initially)
    this.startPollingFallback();

    // Probe regions first if no preference is saved
    if (!this.getSavedRegion()) {
      try {
        await this.probeRegions();
      } catch (error) {
        this.log('Region probe error, continuing with default', error);
      }
    }

    this.log(`Using ${this.config.useUSEndpoint ? 'US' : 'Global'} endpoint`);

    this.connectTickerStreamWithFailover();

    // Also reconnect kline stream if an active symbol is set
    if (this.activeSymbol) {
      this.connectKlineStream();
      // Re-fetch historical candles to ensure we have data for the selected region
      this.fetchHistoricalCandles(this.activeSymbol);
    }
  }

  /**
   * Probe both regions to determine the best endpoint
   */
  private async probeRegions(): Promise<void> {
    this.log('Probing regions...');
    
    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(id);
        return res;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    const probeGlobal = fetchWithTimeout(`${this.API_BASE_URL_GLOBAL}/ping`)
      .then(res => res.ok ? 'GLOBAL' : null)
      .catch(() => null);
      
    const probeUS = fetchWithTimeout(`${this.API_BASE_URL_US}/ping`)
      .then(res => res.ok ? 'US' : null)
      .catch(() => null);

    // Wait for the first successful response
    const result = await Promise.any([
      probeGlobal.then(r => r ? r : Promise.reject()),
      probeUS.then(r => r ? r : Promise.reject())
    ]).catch(() => null);

    if (result === 'US') {
      this.config.useUSEndpoint = true;
      this.saveRegion('US');
      this.log('Region probe selected: US');
    } else if (result === 'GLOBAL') {
      this.config.useUSEndpoint = false;
      this.saveRegion('GLOBAL');
      this.log('Region probe selected: GLOBAL');
    } else {
      this.log('Region probe failed, defaulting to current config');
    }
  }

  /**
   * Start polling fallback for ticker data
   */
  private startPollingFallback(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    
    const poll = async () => {
      if (!this.isRunning) return;
      
      try {
        const url = `${this.apiBaseUrl}/ticker/24hr`;
        const response = await fetch(url);
        if (!response.ok) return;
        
        const data = await response.json();
        // Map REST data to Ticker format
        const tickers = new Map<string, Ticker>();
        
        // Handle both array (Global) and object (US sometimes) responses if needed, 
        // but usually ticker/24hr returns array
        if (Array.isArray(data)) {
          for (const item of data) {
            tickers.set(item.symbol, {
              symbol: item.symbol,
              closePrice: item.lastPrice,
              openPrice: item.openPrice,
              highPrice: item.highPrice,
              lowPrice: item.lowPrice,
              volume: item.volume,
              quoteVolume: item.quoteVolume,
              eventTime: Date.now(),
            });
          }
        }

        if (tickers.size > 0) {
           const currentTickers = useMarketStore.getState().tickers;
           const merged = new Map(currentTickers);
           for (const [key, val] of tickers) {
             merged.set(key, val);
           }
           useMarketStore.getState().updateTickers(merged);
        }
      } catch (error) {
        // Silent fail for polling
      }
    };

    // Run immediately
    poll();

    // Then interval
    this.pollingInterval = setInterval(poll, this.POLLING_INTERVAL);
  }

  /**
   * Connect to ticker stream with automatic geo-failover
   */
  private connectTickerStreamWithFailover(): void {
    const url = `${this.baseUrl}/!miniTicker@arr`;
    this.log(`Connecting to ticker stream with failover: ${url}`);

    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasConnected = false;

    try {
      this.tickerSocket = new WebSocket(url);

      // Set up failover timeout - INCREASED to 5s to avoid flapping
      connectionTimeout = setTimeout(() => {
        if (!hasConnected && !this.failoverAttempted) {
          this.log(`Connection timeout after 5000ms, attempting failover...`);
          this.attemptFailover();
        }
      }, 5000);

      this.tickerSocket.onopen = () => {
        hasConnected = true;
        if (connectionTimeout) clearTimeout(connectionTimeout);
        
        this.log('Ticker stream connected');
        useMarketStore.getState().setTickerConnected(true);
        
        // Save successful region
        this.saveRegion(this.config.useUSEndpoint ? 'US' : 'GLOBAL');
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
        
        // Attempt failover on error if not already attempted
        if (!hasConnected && !this.failoverAttempted) {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          this.attemptFailover();
        }
      };

      this.tickerSocket.onclose = () => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        this.log('Ticker stream closed');
        useMarketStore.getState().setTickerConnected(false);

        // Auto-reconnect (but not failover on normal close)
        if (this.isRunning) {
          this.log(`Reconnecting ticker stream in ${this.RECONNECT_DELAY}ms...`);
          this.reconnectTimeouts.ticker = setTimeout(() => {
            this.connectTickerStream();
          }, this.RECONNECT_DELAY);
        }
      };
    } catch (error) {
      this.log('Failed to create ticker WebSocket', error);
      if (!this.failoverAttempted) {
        this.attemptFailover();
      }
    }
  }

  /**
   * Attempt to failover to the other endpoint
   */
  private attemptFailover(): void {
    this.failoverAttempted = true;
    
    // Close existing socket
    if (this.tickerSocket) {
      this.tickerSocket.close();
      this.tickerSocket = null;
    }

    // Switch endpoint
    const newEndpoint = !this.config.useUSEndpoint;
    this.config.useUSEndpoint = newEndpoint;
    
    this.log(`Failover: Switching to ${newEndpoint ? 'US' : 'Global'} endpoint`);
    
    // Try connecting with the new endpoint
    this.connectTickerStream();
  }

  /**
   * Stop all WebSocket connections
   */
  public stop(): void {
    this.isRunning = false;
    this.log('Stopping StreamEngine...');

    // Abort any pending fetch
    if (this.currentFetchController) {
      this.currentFetchController.abort();
      this.currentFetchController = null;
    }

    // Clear reconnect timeouts
    if (this.reconnectTimeouts.ticker) {
      clearTimeout(this.reconnectTimeouts.ticker);
    }
    if (this.reconnectTimeouts.kline) {
      clearTimeout(this.reconnectTimeouts.kline);
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
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

    // Abort any pending fetch request for previous symbol
    if (this.currentFetchController) {
      this.currentFetchController.abort();
      this.log('Aborted pending fetch request');
    }

    // Clear existing candles before loading new ones
    useMarketStore.getState().setHistoricalCandles([]);

    // Fetch historical candles for the new symbol
    this.fetchHistoricalCandles(symbol);

    // Reconnect kline stream with new symbol
    if (this.klineSocket) {
      this.klineSocket.close();
    }

    if (this.isRunning) {
      this.connectKlineStream();
    }
  }

  /**
   * Set the active time interval for the chart
   */
  public setChartInterval(interval: string): void {
    if (this.activeInterval === interval) return;

    this.activeInterval = interval;
    this.log(`Setting chart interval: ${interval}`);
    
    // Update store
    useMarketStore.getState().setActiveInterval(interval);

    // If we have an active symbol, reload data
    if (this.activeSymbol) {
      // Abort pending
      if (this.currentFetchController) {
        this.currentFetchController.abort();
      }

      // Clear candles
      useMarketStore.getState().setHistoricalCandles([]);

      // Fetch new data
      this.fetchHistoricalCandles(this.activeSymbol);

      // Reconnect stream
      if (this.klineSocket) {
        this.klineSocket.close();
      }
      if (this.isRunning) {
        this.connectKlineStream();
      }
    }
  }

  /**
   * Subscribe to chart data for a symbol (alias for setActiveSymbol)
   */
  public subscribeToChart(symbol: string): void {
    this.setActiveSymbol(symbol);
  }

  /**
   * Fetch historical candles from Binance REST API with abort support
   * Includes automatic failover to alternative endpoint if primary fails
   */
  private async fetchHistoricalCandles(symbol: string): Promise<void> {
    // Create new abort controller for this request
    this.currentFetchController = new AbortController();
    const { signal } = this.currentFetchController;

    const fetchFromUrl = async (baseUrl: string) => {
      const url = `${baseUrl}/klines?symbol=${symbol.toUpperCase()}&interval=${this.activeInterval}&limit=1000`;
      this.log(`Fetching historical candles: ${url}`);
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    };

    try {
      let data: BinanceKlineArray[];
      
      try {
        // Try primary endpoint
        data = await fetchFromUrl(this.apiBaseUrl);
      } catch (primaryError) {
        if (signal.aborted) throw primaryError;
        
        this.log('Primary endpoint failed, attempting failover for REST API...');
        
        // Try secondary endpoint
        const fallbackUrl = this.config.useUSEndpoint ? this.API_BASE_URL_GLOBAL : this.API_BASE_URL_US;
        data = await fetchFromUrl(fallbackUrl);
        
        this.log('Failover REST fetch successful');
      }

      // Check if request was aborted during parsing
      if (signal.aborted) {
        this.log('Fetch aborted after response received');
        return;
      }

      const candles: Candle[] = data.map((kline) => ({
        time: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        symbol: symbol.toUpperCase(),
        isClosed: true,
      }));

      // Only update if this is still the active symbol
      if (this.activeSymbol === symbol.toLowerCase()) {
        useMarketStore.getState().setHistoricalCandles(candles);
        this.log(`Loaded ${candles.length} historical candles for ${symbol}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.log(`Fetch aborted for ${symbol}`);
        return;
      }
      // CORS or network error - log warning but keep socket open
      this.log(`Warning: Failed to fetch historical candles:`, error);
    } finally {
      this.currentFetchController = null;
    }
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
   * Connect to the miniTicker stream (Socket A) - standard reconnect
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

    const url = `${this.baseUrl}/${this.activeSymbol}@kline_${this.activeInterval}`;
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

  /**
   * Get the currently active symbol
   */
  public getActiveSymbol(): string | null {
    return this.activeSymbol;
  }
}

// Export singleton instance
export const streamEngine = StreamEngine.getInstance();

// Export class for type usage and testing
export { StreamEngine };
