/**
 * Rate Limiting Middleware
 * 
 * Edge-based rate limiting using in-memory Map with sliding window.
 * For production at scale, migrate to KV-backed implementation.
 * 
 * Limits: 100 requests per minute per IP (configurable)
 */

import type { Env } from '../types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start - acceptable for free tier)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100; // requests per window
const CLEANUP_INTERVAL = 300_000; // Clean expired entries every 5 minutes

let lastCleanup = Date.now();

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
 * Cleanup expired entries to prevent memory bloat
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit check - returns null if allowed, Response if blocked
 */
export function checkRateLimit(
  request: Request,
  _env: Env,
  options?: { maxRequests?: number; windowMs?: number }
): Response | null {
  const maxRequests = options?.maxRequests ?? MAX_REQUESTS;
  const windowMs = options?.windowMs ?? WINDOW_MS;
  
  const ip = getClientIP(request);
  const now = Date.now();
  
  // Periodic cleanup
  cleanupExpiredEntries();
  
  const entry = rateLimitStore.get(ip);
  
  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return null; // Allowed
  }
  
  if (entry.count >= maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
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
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      },
    });
  }
  
  // Increment and allow
  entry.count++;
  return null; // Allowed
}

/**
 * Stricter rate limit for auth endpoints (prevent brute force)
 * 10 requests per minute per IP
 */
export function checkAuthRateLimit(request: Request, env: Env): Response | null {
  return checkRateLimit(request, env, { maxRequests: 10, windowMs: 60_000 });
}

/**
 * Enforce rate limit - async signature matching index.ts usage
 * Returns Response if rate limited, null if allowed
 */
export async function enforceRateLimit(
  request: Request,
  options: { windowSeconds?: number; maxRequests?: number; keyPrefix?: string }
): Promise<Response | null> {
  const windowMs = (options.windowSeconds ?? 60) * 1000;
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const keyPrefix = options.keyPrefix ?? 'global';
  
  const ip = getClientIP(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  
  // Periodic cleanup
  cleanupExpiredEntries();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
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
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      },
    });
  }
  
  entry.count++;
  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  request: Request,
  maxRequests = MAX_REQUESTS
): Response {
  const ip = getClientIP(request);
  const entry = rateLimitStore.get(ip);
  
  if (!entry) return response;
  
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(maxRequests));
  headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
  headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
