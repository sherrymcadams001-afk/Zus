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
import { sendWelcomeEmail } from './services/emailService';

/**
 * Handle HTTP requests
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
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

  // Auth routes
  if (url.pathname.startsWith('/api/auth/')) {
    return handleAuthRoutes(request, env, url.pathname);
  }

  // Admin routes
  if (url.pathname.startsWith('/api/admin')) {
    return handleAdminRoutes(request, env, url.pathname);
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
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },

  /**
   * Handle scheduled tasks (Cron Triggers)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    
    // Find pending emails that are due
    // Process up to 10 emails per execution to avoid timeout
    const pendingEmails = await env.DB.prepare(
      `SELECT * FROM email_queue WHERE status = 'pending' AND scheduled_at <= ? LIMIT 10`
    ).bind(now).all<{ id: number; email: string; template_alias: string }>();
    
    if (pendingEmails.results.length > 0) {
      console.log(`Processing ${pendingEmails.results.length} pending emails`);
    }

    for (const email of pendingEmails.results) {
      ctx.waitUntil((async () => {
        try {
          let success = false;
          if (email.template_alias === 'welcome') {
            success = await sendWelcomeEmail(email.email);
          }
          
          if (success) {
            await env.DB.prepare(
              `UPDATE email_queue SET status = 'sent', updated_at = ? WHERE id = ?`
            ).bind(Math.floor(Date.now() / 1000), email.id).run();
          } else {
            // Mark as failed
            await env.DB.prepare(
              `UPDATE email_queue SET status = 'failed', updated_at = ? WHERE id = ?`
            ).bind(Math.floor(Date.now() / 1000), email.id).run();
          }
        } catch (error) {
          console.error(`Failed to process email ${email.id}:`, error);
        }
      })());
    }
  },
};
