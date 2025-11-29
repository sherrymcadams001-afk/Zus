/**
 * Trading Agent Engine
 * 
 * A Cloudflare Worker that generates AI-powered trading logs
 * using Workers AI (Llama-3) and stores them in KV.
 * Also provides API endpoints for user balance management
 * to integrate with broader platforms.
 */

export interface Env {
  TRADING_CACHE: KVNamespace;
  AI: Ai;
}

interface NarrativeResponse {
  log: string;
  timestamp: number;
}

/**
 * Bot tier types for multi-tier trading system
 */
type BotTier = 'protobot' | 'chainpulse' | 'titan' | 'omega';

/**
 * Bot tier configuration
 */
interface BotTierConfig {
  name: string;
  hourlyRoiMin: number;  // Per trade hour (null for Omega which uses daily)
  hourlyRoiMax: number;
  dailyRoiMin: number;   // 8 trading hours × hourly rate
  dailyRoiMax: number;
  minimumStake: number;
  tradingHoursPerDay: number;
  tradingDaysPerWeek: number;
  roiWithdrawalHours: number;    // Hours after investment
  capitalWithdrawalDays: number; // Days after investment
  investmentDurationDays: number;
}

/**
 * Bot tier configurations
 */
const BOT_TIERS: Record<BotTier, BotTierConfig> = {
  protobot: {
    name: 'Protobot',
    hourlyRoiMin: 0.001,    // 0.1%
    hourlyRoiMax: 0.0012,   // 0.12%
    dailyRoiMin: 0.008,     // 0.8% (8 hours × 0.1%)
    dailyRoiMax: 0.0096,    // 0.96% (8 hours × 0.12%)
    minimumStake: 100,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 40,
    investmentDurationDays: 365,
  },
  chainpulse: {
    name: 'Chainpulse Bot',
    hourlyRoiMin: 0.0012,   // 0.12%
    hourlyRoiMax: 0.0014,   // 0.14%
    dailyRoiMin: 0.0096,    // 0.96% (8 hours × 0.12%)
    dailyRoiMax: 0.0112,    // 1.12% (8 hours × 0.14%)
    minimumStake: 4000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 45,
    investmentDurationDays: 365,
  },
  titan: {
    name: 'Titan Bot',
    hourlyRoiMin: 0.0014,   // 0.14%
    hourlyRoiMax: 0.0016,   // 0.16%
    dailyRoiMin: 0.0112,    // 1.12% (8 hours × 0.14%)
    dailyRoiMax: 0.0128,    // 1.28% (8 hours × 0.16%)
    minimumStake: 25000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 65,
    investmentDurationDays: 365,
  },
  omega: {
    name: 'Omega Bot',
    hourlyRoiMin: 0.00225,  // 0.225% per hour (1.8% / 8)
    hourlyRoiMax: 0.00225,  // Fixed rate
    dailyRoiMin: 0.018,     // 1.8% fixed
    dailyRoiMax: 0.018,     // 1.8% fixed
    minimumStake: 50000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 85,
    investmentDurationDays: 365,
  },
};

const VALID_BOT_TIERS: BotTier[] = ['protobot', 'chainpulse', 'titan', 'omega'];

/**
 * User balance stored in KV
 */
interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
  botTier: BotTier;
  lastUpdated: number;
}

/**
 * API response for balance endpoint
 */
interface BalanceResponse {
  status: 'success' | 'error';
  data?: {
    userId: string;
    balance: number;
    currency: string;
    botTier: BotTier;
    botTierConfig: BotTierConfig;
    dailyTargetPct: {
      min: number;
      max: number;
    };
    projectedDailyProfit: {
      min: number;
      max: number;
    };
    lastUpdated: number;
  };
  error?: string;
}

const KV_KEY = 'LATEST_LOG';
const USER_BALANCE_PREFIX = 'USER_BALANCE_';
const HTTP_CACHE_MAX_AGE = 5; // seconds - for CDN caching
const KV_EXPIRATION_TTL = 60; // seconds - for KV storage

// Legacy daily profit target configuration (used as fallback)
const TARGET_DAILY_MIN = 0.011;
const TARGET_DAILY_MAX = 0.014;

// Supported currencies whitelist
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'SGD'];

// Model name constant for type safety
const AI_MODEL = '@cf/meta/llama-3-8b-instruct';

/**
 * Validate userId format
 * - Must be alphanumeric with optional hyphens and underscores
 * - Length between 1 and 128 characters
 */
function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false;
  if (userId.length < 1 || userId.length > 128) return false;
  // Only allow alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]+$/.test(userId);
}

/**
 * Validate currency code
 * - Must be in the supported currencies whitelist
 */
function isValidCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
}

/**
 * Validate bot tier
 * - Must be one of the valid bot tiers
 */
function isValidBotTier(tier: string): tier is BotTier {
  return VALID_BOT_TIERS.includes(tier as BotTier);
}

/**
 * Get the appropriate bot tier based on stake amount
 * Returns the highest tier the stake qualifies for
 */
function getBotTierForStake(stakeAmount: number): BotTier {
  if (stakeAmount >= BOT_TIERS.omega.minimumStake) return 'omega';
  if (stakeAmount >= BOT_TIERS.titan.minimumStake) return 'titan';
  if (stakeAmount >= BOT_TIERS.chainpulse.minimumStake) return 'chainpulse';
  return 'protobot';
}

/**
 * Validate that stake meets minimum for selected tier
 */
function isValidStakeForTier(stakeAmount: number, tier: BotTier): boolean {
  return stakeAmount >= BOT_TIERS[tier].minimumStake;
}

/**
 * AI prompt for generating trading logs
 */
const TRADING_LOG_PROMPT = `Generate 1 short, technical financial trade log entry. 
Examples of style:
- "Long BTC @ 97,450 - RSI divergence on 15m, volume spike confirming breakout"
- "Short ETH @ 3,420 - Head & shoulders pattern complete, targeting 3,200"
- "Exit DOGE long @ 0.42 - Take profit hit, +12.5% realized"

Keep it under 100 characters. Be technical and specific. Include price levels when possible.
Only output the log entry, nothing else.`;

/**
 * Generate a trading log using Workers AI
 */
async function generateTradingLog(ai: Ai): Promise<string> {
  try {
    // Use text generation model
    const response = await ai.run(AI_MODEL as Parameters<typeof ai.run>[0], {
      prompt: TRADING_LOG_PROMPT,
      max_tokens: 100,
    });

    // Handle different response formats
    if (typeof response === 'string') {
      return response.trim();
    }
    if (response && typeof response === 'object' && 'response' in response) {
      return String(response.response).trim();
    }
    
    return 'Long BTC @ 97,500 - Momentum breakout confirmed on 4H';
  } catch (error) {
    console.error('AI generation failed:', error);
    // Fallback log in case of AI failure
    return `System check @ ${new Date().toISOString()} - All systems nominal`;
  }
}

/**
 * Store the generated log in KV
 */
async function storeLog(kv: KVNamespace, log: string): Promise<NarrativeResponse> {
  const narrative: NarrativeResponse = {
    log,
    timestamp: Date.now(),
  };

  await kv.put(KV_KEY, JSON.stringify(narrative), {
    expirationTtl: KV_EXPIRATION_TTL,
  });

  return narrative;
}

/**
 * Get the latest log from KV
 */
async function getLatestLog(kv: KVNamespace): Promise<NarrativeResponse | null> {
  const data = await kv.get(KV_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as NarrativeResponse;
  } catch {
    return null;
  }
}

/**
 * Get user balance from KV
 */
async function getUserBalance(kv: KVNamespace, userId: string): Promise<UserBalance | null> {
  const data = await kv.get(`${USER_BALANCE_PREFIX}${userId}`);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as UserBalance;
  } catch {
    return null;
  }
}

/**
 * Store user balance in KV
 */
async function setUserBalance(kv: KVNamespace, userId: string, balance: number, currency = 'USD', botTier?: BotTier): Promise<UserBalance> {
  // Auto-select tier if not provided, based on stake amount
  const effectiveTier = botTier || getBotTierForStake(balance);
  
  const userBalance: UserBalance = {
    userId,
    balance,
    currency,
    botTier: effectiveTier,
    lastUpdated: Date.now(),
  };

  await kv.put(`${USER_BALANCE_PREFIX}${userId}`, JSON.stringify(userBalance));
  return userBalance;
}

/**
 * Handle scheduled cron trigger
 */
async function handleScheduled(env: Env): Promise<void> {
  console.log('[Trading Agent Engine] Generating new trading log...');
  
  const log = await generateTradingLog(env.AI);
  const narrative = await storeLog(env.TRADING_CACHE, log);
  
  console.log('[Trading Agent Engine] Generated:', narrative.log);
}

/**
 * Handle HTTP requests
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // CORS headers for frontend access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // API endpoint: GET /api/narrative
  if (url.pathname === '/api/narrative' && request.method === 'GET') {
    let narrative = await getLatestLog(env.TRADING_CACHE);

    // If no log exists, generate one on-demand
    if (!narrative) {
      const log = await generateTradingLog(env.AI);
      narrative = await storeLog(env.TRADING_CACHE, log);
    }

    return new Response(JSON.stringify(narrative), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE}`,
        ...corsHeaders,
      },
    });
  }

  // API endpoint: GET /api/balance/:userId - Get user balance
  if (url.pathname.startsWith('/api/balance/') && request.method === 'GET') {
    const userId = url.pathname.split('/').pop();
    
    if (!userId || userId === 'balance') {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'userId is required' 
      } as BalanceResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!isValidUserId(userId)) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'Invalid userId format. Must be alphanumeric with optional hyphens/underscores, 1-128 characters.' 
      } as BalanceResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const userBalance = await getUserBalance(env.TRADING_CACHE, userId);
    
    if (!userBalance) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'User balance not found. Use POST /api/balance to set initial balance.' 
      } as BalanceResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get tier config - use stored tier or fallback to auto-selected tier
    const effectiveTier = userBalance.botTier || getBotTierForStake(userBalance.balance);
    const tierConfig = BOT_TIERS[effectiveTier];

    const response: BalanceResponse = {
      status: 'success',
      data: {
        userId: userBalance.userId,
        balance: userBalance.balance,
        currency: userBalance.currency,
        botTier: effectiveTier,
        botTierConfig: tierConfig,
        dailyTargetPct: {
          min: tierConfig.dailyRoiMin,
          max: tierConfig.dailyRoiMax,
        },
        projectedDailyProfit: {
          min: userBalance.balance * tierConfig.dailyRoiMin,
          max: userBalance.balance * tierConfig.dailyRoiMax,
        },
        lastUpdated: userBalance.lastUpdated,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // API endpoint: POST /api/balance - Set user balance
  if (url.pathname === '/api/balance' && request.method === 'POST') {
    try {
      const body = await request.json() as { userId?: string; balance?: number; currency?: string; botTier?: string };
      
      if (!body.userId || typeof body.balance !== 'number') {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: 'userId (string) and balance (number) are required' 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (!isValidUserId(body.userId)) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: 'Invalid userId format. Must be alphanumeric with optional hyphens/underscores, 1-128 characters.' 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (body.balance < 0) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: 'balance must be a non-negative number' 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const currency = body.currency || 'USD';
      if (!isValidCurrency(currency)) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: `Invalid currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}` 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Validate and process botTier if provided
      let selectedTier: BotTier | undefined;
      if (body.botTier) {
        if (!isValidBotTier(body.botTier)) {
          return new Response(JSON.stringify({ 
            status: 'error', 
            error: `Invalid botTier. Valid tiers: ${VALID_BOT_TIERS.join(', ')}` 
          } as BalanceResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        selectedTier = body.botTier as BotTier;
        
        // Validate stake meets minimum for selected tier
        if (!isValidStakeForTier(body.balance, selectedTier)) {
          const tierConfig = BOT_TIERS[selectedTier];
          return new Response(JSON.stringify({ 
            status: 'error', 
            error: `Insufficient stake for ${tierConfig.name}. Minimum stake: $${tierConfig.minimumStake.toLocaleString()}` 
          } as BalanceResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const userBalance = await setUserBalance(
        env.TRADING_CACHE, 
        body.userId, 
        body.balance,
        currency.toUpperCase(),
        selectedTier
      );

      const tierConfig = BOT_TIERS[userBalance.botTier];
      const response: BalanceResponse = {
        status: 'success',
        data: {
          userId: userBalance.userId,
          balance: userBalance.balance,
          currency: userBalance.currency,
          botTier: userBalance.botTier,
          botTierConfig: tierConfig,
          dailyTargetPct: {
            min: tierConfig.dailyRoiMin,
            max: tierConfig.dailyRoiMax,
          },
          projectedDailyProfit: {
            min: userBalance.balance * tierConfig.dailyRoiMin,
            max: userBalance.balance * tierConfig.dailyRoiMax,
          },
          lastUpdated: userBalance.lastUpdated,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'Invalid JSON body' 
      } as BalanceResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // API endpoint: PUT /api/balance/:userId - Update user balance
  if (url.pathname.startsWith('/api/balance/') && request.method === 'PUT') {
    const userId = url.pathname.split('/').pop();
    
    if (!userId || userId === 'balance') {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'userId is required' 
      } as BalanceResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!isValidUserId(userId)) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'Invalid userId format. Must be alphanumeric with optional hyphens/underscores, 1-128 characters.' 
      } as BalanceResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      const body = await request.json() as { balance?: number; currency?: string; botTier?: string };
      
      if (typeof body.balance !== 'number') {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: 'balance (number) is required' 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (body.balance < 0) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: 'balance must be a non-negative number' 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const currency = body.currency || 'USD';
      if (!isValidCurrency(currency)) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: `Invalid currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}` 
        } as BalanceResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Validate and process botTier if provided
      let selectedTier: BotTier | undefined;
      if (body.botTier) {
        if (!isValidBotTier(body.botTier)) {
          return new Response(JSON.stringify({ 
            status: 'error', 
            error: `Invalid botTier. Valid tiers: ${VALID_BOT_TIERS.join(', ')}` 
          } as BalanceResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        selectedTier = body.botTier as BotTier;
        
        // Validate stake meets minimum for selected tier
        if (!isValidStakeForTier(body.balance, selectedTier)) {
          const tierConfig = BOT_TIERS[selectedTier];
          return new Response(JSON.stringify({ 
            status: 'error', 
            error: `Insufficient stake for ${tierConfig.name}. Minimum stake: $${tierConfig.minimumStake.toLocaleString()}` 
          } as BalanceResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const userBalance = await setUserBalance(
        env.TRADING_CACHE, 
        userId, 
        body.balance,
        currency.toUpperCase(),
        selectedTier
      );

      const tierConfig = BOT_TIERS[userBalance.botTier];
      const response: BalanceResponse = {
        status: 'success',
        data: {
          userId: userBalance.userId,
          balance: userBalance.balance,
          currency: userBalance.currency,
          botTier: userBalance.botTier,
          botTierConfig: tierConfig,
          dailyTargetPct: {
            min: tierConfig.dailyRoiMin,
            max: tierConfig.dailyRoiMax,
          },
          projectedDailyProfit: {
            min: userBalance.balance * tierConfig.dailyRoiMin,
            max: userBalance.balance * tierConfig.dailyRoiMax,
          },
          lastUpdated: userBalance.lastUpdated,
        },
      };

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch {
      return new Response(JSON.stringify({ 
        status: 'error', 
        error: 'Invalid JSON body' 
      } as BalanceResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', service: 'trading-agent-engine' }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  // 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export default {
  /**
   * Handle HTTP fetch requests
   */
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },

  /**
   * Handle scheduled cron triggers
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },
};
