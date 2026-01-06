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

/**
 * Process daily ROI payouts for all active stakes
 */
async function processDailyROIPayouts(env: Env): Promise<void> {
  try {
    console.log('Starting daily ROI payout processing...');
    
    // Get all active stakes
    const stakes = await env.DB.prepare(`
      SELECT ps.*, p.roi_min, p.roi_max, p.name as pool_name
      FROM pool_stakes ps
      JOIN pools p ON ps.pool_id = p.id
      WHERE ps.status = 'active'
    `).all<{
      id: number;
      user_id: number;
      pool_id: number;
      amount: number;
      roi_min: number;
      roi_max: number;
      pool_name: string;
    }>();
    
    if (!stakes.results || stakes.results.length === 0) {
      console.log('No active stakes found for ROI payout');
      return;
    }
    
    console.log(`Processing ROI for ${stakes.results.length} active stakes`);
    
    const timestamp = Math.floor(Date.now() / 1000);
    let successCount = 0;
    let errorCount = 0;
    
    // Process each stake
    for (const stake of stakes.results) {
      try {
        // Calculate daily ROI (average of min/max)
        const dailyRoi = (stake.roi_min + stake.roi_max) / 2;
        const payout = stake.amount * dailyRoi;
        
        // Update stake's total earned
        await env.DB.prepare(
          `UPDATE pool_stakes SET total_earned = total_earned + ? WHERE id = ?`
        ).bind(payout, stake.id).run();
        
        // Credit to user's wallet
        await env.DB.prepare(
          `UPDATE wallets SET available_balance = available_balance + ?, updated_at = ? WHERE user_id = ?`
        ).bind(payout, timestamp, stake.user_id).run();
        
        // Create transaction record
        await env.DB.prepare(
          `INSERT INTO transactions (user_id, type, amount, status, description, created_at, completed_at)
           VALUES (?, 'roi_payout', ?, 'completed', ?, ?, ?)`
        ).bind(stake.user_id, payout, `Daily ROI from ${stake.pool_name}`, timestamp, timestamp).run();
        
        successCount++;
        console.log(`Processed ROI payout: User ${stake.user_id}, Amount: $${payout.toFixed(2)}`);
      } catch (error) {
        errorCount++;
        console.error(`Error processing stake ${stake.id}:`, error);
      }
    }
    
    console.log(`ROI payout processing complete: ${successCount} succeeded, ${errorCount} failed`);
  } catch (error) {
    console.error('Fatal error in ROI payout processing:', error);
    throw error;
  }
}

export default {
  /**
   * Handle HTTP fetch requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },

  /**
   * Handle scheduled events (Cron Triggers)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Scheduled event triggered:', event.cron);
    
    // Execute daily ROI payouts
    ctx.waitUntil(
      processDailyROIPayouts(env).catch(err => {
        console.error('Scheduled ROI payout failed:', err);
      })
    );
  },
};
