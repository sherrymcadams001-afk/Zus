/**
 * Rate Limiting Middleware (In-Memory)
 * 
 * Lightweight rate limiting using an in-memory Map.
 * Resets on cold start — acceptable for per-isolate abuse prevention.
 * Zero external dependencies (no KV reads/writes).
 */

import type { Env } from '../types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_REQUESTS = 100;

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
 * In-memory rate limit enforcement
 */
export async function enforceRateLimit(
  request: Request,
  _env: Env,
  options: { windowSeconds?: number; maxRequests?: number; keyPrefix?: string }
): Promise<Response | null> {
  const windowMs = (options.windowSeconds ?? 60) * 1000;
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const keyPrefix = options.keyPrefix ?? 'global';

  const ip = getClientIP(request);
  const key = `rl:${keyPrefix}:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
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
