/**
 * ORION Narrative Engine
 * 
 * A Cloudflare Worker that generates AI-powered trading logs
 * using Workers AI (Llama-3) and stores them in KV.
 */

export interface Env {
  ORION_CACHE: KVNamespace;
  AI: Ai;
}

interface NarrativeResponse {
  log: string;
  timestamp: number;
}

const KV_KEY = 'LATEST_LOG';
const HTTP_CACHE_MAX_AGE = 5; // seconds - for CDN caching
const KV_EXPIRATION_TTL = 60; // seconds - for KV storage

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
 * Handle scheduled cron trigger
 */
async function handleScheduled(env: Env): Promise<void> {
  console.log('[Narrative Engine] Generating new trading log...');
  
  const log = await generateTradingLog(env.AI);
  const narrative = await storeLog(env.ORION_CACHE, log);
  
  console.log('[Narrative Engine] Generated:', narrative.log);
}

/**
 * Handle HTTP requests
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // CORS headers for frontend access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // API endpoint: GET /api/narrative
  if (url.pathname === '/api/narrative' && request.method === 'GET') {
    let narrative = await getLatestLog(env.ORION_CACHE);

    // If no log exists, generate one on-demand
    if (!narrative) {
      const log = await generateTradingLog(env.AI);
      narrative = await storeLog(env.ORION_CACHE, log);
    }

    return new Response(JSON.stringify(narrative), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE}`,
        ...corsHeaders,
      },
    });
  }

  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', service: 'orion-narrative-engine' }), {
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
