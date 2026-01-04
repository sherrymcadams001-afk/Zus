/**
 * Rate Limiting Middleware (KV-backed)
 * 
 * Persistent rate limiting using Cloudflare KV.
 * Survives cold starts and works across isolates.
 * Falls back to in-memory if KV unavailable.
 */

import type { Env } from '../types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback store
const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

/**
 * Extract client IP from request headers
 */
function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Build rate limit response
 */
function buildRateLimitResponse(retryAfter: number, maxRequests: number, resetAt: number): Response {
  return new Response(JSON.stringify({
    status: 'error',
    error: 'Too many requests. Please try again later.',
    retryAfter,
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    },
  });
}

/**
 * KV-backed rate limit enforcement
 * Persistent across cold starts and isolates
 */
export async function enforceRateLimit(
  request: Request,
  env: Env,
  options: { windowSeconds?: number; maxRequests?: number; keyPrefix?: string }
): Promise<Response | null> {
  const windowMs = (options.windowSeconds ?? 60) * 1000;
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const keyPrefix = options.keyPrefix ?? 'global';
  
  const ip = getClientIP(request);
  const key = `rl:${keyPrefix}:${ip}`;
  const now = Date.now();
  
  // Use KV if available
  if (env.RATE_LIMIT) {
    try {
      const cached = await env.RATE_LIMIT.get(key, 'json') as RateLimitEntry | null;
      
      if (!cached || cached.resetAt < now) {
        // New window
        const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
        await env.RATE_LIMIT.put(key, JSON.stringify(entry), {
          expirationTtl: Math.ceil(windowMs / 1000) + 60
        });
        return null;
      }
      
      if (cached.count >= maxRequests) {
        const retryAfter = Math.ceil((cached.resetAt - now) / 1000);
        return buildRateLimitResponse(retryAfter, maxRequests, cached.resetAt);
      }
      
      // Increment count
      const updated: RateLimitEntry = { count: cached.count + 1, resetAt: cached.resetAt };
      await env.RATE_LIMIT.put(key, JSON.stringify(updated), {
        expirationTtl: Math.ceil((cached.resetAt - now) / 1000) + 60
      });
      return null;
    } catch (e) {
      console.error('KV rate limit error, falling back to memory:', e);
      // Fall through to in-memory
    }
  }
  
  // In-memory fallback
  const memKey = key;
  const entry = rateLimitStore.get(memKey);
  
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(memKey, { count: 1, resetAt: now + windowMs });
    return null;
  }
  
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return buildRateLimitResponse(retryAfter, maxRequests, entry.resetAt);
  }
  
  entry.count++;
  return null;
}

/**
 * Legacy sync functions - deprecated, use enforceRateLimit
 */
export function checkRateLimit(_request: Request, _env: Env): Response | null {
  return null;
}

export function checkAuthRateLimit(_request: Request, _env: Env): Response | null {
  return null;
}
