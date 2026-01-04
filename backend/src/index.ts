/**
 * Trading Agent Engine
 * 
 * A Cloudflare Worker that provides API endpoints for user balance management
 * and authentication, backed by D1 database.
 * 
 * Enterprise features:
 * - User authentication and management
 * - D1 database integration
 * - Multi-user support
 */

import { Env } from './types';
import { handleAuthRoutes } from './routes/auth';
import { handleWalletRoutes } from './routes/wallet';
import { handlePortfolioRoutes } from './routes/portfolio';
import { handlePoolRoutes } from './routes/pools';
import { handleReferralRoutes } from './routes/referrals';
import { handleDashboardRoutes } from './routes/dashboard';
import { handleProfileRoutes } from './routes/profile';
import { handleAdminRoutes } from './routes/admin';
import { handleNowPaymentsWebhook } from './routes/nowpayments';
import { handleInviteCodeRoutes } from './routes/inviteCodes';
import { handleNotificationRoutes } from './routes/notifications';
import { enforceRateLimit } from './middleware/rateLimit';

/**
 * Handle HTTP requests
 * @param ctx - ExecutionContext for background tasks (passed to routes that need waitUntil)
 */
async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  // CORS headers for frontend access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Edge rate limiting (KV-backed; persistent across cold starts)
  // Exempt health + webhooks to avoid breaking upstream delivery.
  if (url.pathname !== '/health' && url.pathname !== '/api/webhook/nowpayments') {
    const isAuthEndpoint = url.pathname === '/api/auth/login' || url.pathname === '/api/auth/register' || url.pathname === '/api/invite-codes/validate';
    const limited = await enforceRateLimit(request, env, {
      windowSeconds: 60,
      maxRequests: isAuthEndpoint ? 20 : 120,
      keyPrefix: isAuthEndpoint ? 'auth' : 'api',
    });
    if (limited) {
      limited.headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
      limited.headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
      limited.headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
      return limited;
    }
  }

  // Auth routes (pass ctx for immediate email sending)
  if (url.pathname.startsWith('/api/auth/')) {
    return handleAuthRoutes(request, env, url.pathname, ctx);
  }

  // Admin routes (pass ctx for approval emails)
  if (url.pathname.startsWith('/api/admin')) {
    return handleAdminRoutes(request, env, url.pathname, ctx);
  }

  // Wallet routes
  if (url.pathname.startsWith('/api/wallet')) {
    return handleWalletRoutes(request, env, url.pathname);
  }

  // Portfolio routes
  if (url.pathname.startsWith('/api/portfolio')) {
    return handlePortfolioRoutes(request, env, url.pathname);
  }

  // Pool routes
  if (url.pathname.startsWith('/api/pools')) {
    return handlePoolRoutes(request, env, url.pathname);
  }

  // Referral routes
  if (url.pathname.startsWith('/api/referrals')) {
    return handleReferralRoutes(request, env, url.pathname);
  }

  // Invite code routes
  if (url.pathname.startsWith('/api/invite-codes')) {
    return handleInviteCodeRoutes(request, env, url.pathname);
  }

  // Notification routes
  if (url.pathname.startsWith('/api/notifications')) {
    return handleNotificationRoutes(request, env, url.pathname);
  }

  // Dashboard aggregate route (SINGLE call for all data)
  if (url.pathname === '/api/dashboard') {
    return handleDashboardRoutes(request, env, url.pathname);
  }

  // Profile routes
  if (url.pathname.startsWith('/api/profile')) {
    return handleProfileRoutes(request, env, url.pathname);
  }

  // NowPayments IPN webhook (no auth required)
  if (url.pathname === '/api/webhook/nowpayments') {
    return handleNowPaymentsWebhook(request, env);
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },
};
