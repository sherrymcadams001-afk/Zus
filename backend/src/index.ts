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
 * User balance stored in KV
 */
interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
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

// Daily profit target configuration (1.1% - 1.4%)
const TARGET_DAILY_MIN = 0.011;
const TARGET_DAILY_MAX = 0.014;

// Model name constant for type safety
const AI_MODEL = '@cf/meta/llama-3-8b-instruct';

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
async function setUserBalance(kv: KVNamespace, userId: string, balance: number, currency = 'USD'): Promise<UserBalance> {
  const userBalance: UserBalance = {
    userId,
    balance,
    currency,
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

    const response: BalanceResponse = {
      status: 'success',
      data: {
        userId: userBalance.userId,
        balance: userBalance.balance,
        currency: userBalance.currency,
        dailyTargetPct: {
          min: TARGET_DAILY_MIN,
          max: TARGET_DAILY_MAX,
        },
        projectedDailyProfit: {
          min: userBalance.balance * TARGET_DAILY_MIN,
          max: userBalance.balance * TARGET_DAILY_MAX,
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
      const body = await request.json() as { userId?: string; balance?: number; currency?: string };
      
      if (!body.userId || typeof body.balance !== 'number') {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: 'userId (string) and balance (number) are required' 
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

      const userBalance = await setUserBalance(
        env.TRADING_CACHE, 
        body.userId, 
        body.balance,
        body.currency || 'USD'
      );

      const response: BalanceResponse = {
        status: 'success',
        data: {
          userId: userBalance.userId,
          balance: userBalance.balance,
          currency: userBalance.currency,
          dailyTargetPct: {
            min: TARGET_DAILY_MIN,
            max: TARGET_DAILY_MAX,
          },
          projectedDailyProfit: {
            min: userBalance.balance * TARGET_DAILY_MIN,
            max: userBalance.balance * TARGET_DAILY_MAX,
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

    try {
      const body = await request.json() as { balance?: number; currency?: string };
      
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

      const userBalance = await setUserBalance(
        env.TRADING_CACHE, 
        userId, 
        body.balance,
        body.currency || 'USD'
      );

      const response: BalanceResponse = {
        status: 'success',
        data: {
          userId: userBalance.userId,
          balance: userBalance.balance,
          currency: userBalance.currency,
          dailyTargetPct: {
            min: TARGET_DAILY_MIN,
            max: TARGET_DAILY_MAX,
          },
          projectedDailyProfit: {
            min: userBalance.balance * TARGET_DAILY_MIN,
            max: userBalance.balance * TARGET_DAILY_MAX,
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
