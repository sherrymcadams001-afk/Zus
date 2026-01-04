/**
 * Admin Routes
 * 
 * Handles administrative operations including user management and system monitoring.
 */

import { Env } from '../types';
import { requireAdmin } from '../middleware/admin';
import { processDeposit, approveDeposit } from '../services/walletService';
import { sendApprovalEmail } from '../services/emailService';

/**
 * Handle admin routes
 * @param ctx - ExecutionContext for background tasks (emails via waitUntil)
 */
export async function handleAdminRoutes(
  request: Request, 
  env: Env, 
  path: string,
  ctx: ExecutionContext
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // All admin routes require admin authentication
  const authResult = await requireAdmin(request, env);
  if (authResult instanceof Response) return authResult;

  // GET /api/admin/users/pending - List users awaiting approval
  if (path === '/api/admin/users/pending' && request.method === 'GET') {
    try {
      const users = await env.DB.prepare(`
        SELECT 
          u.id, 
          u.email, 
          u.role, 
          u.created_at, 
          u.kyc_status,
          u.account_status
        FROM users u 
        WHERE u.account_status = 'pending'
        ORDER BY u.created_at DESC
      `).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: users.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Admin pending users error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch pending users'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/admin/users/:id/approve - Approve a pending user's account
  const approveUserMatch = path.match(/^\/api\/admin\/users\/(\d+)\/approve$/);
  if (approveUserMatch && request.method === 'POST') {
    const userId = parseInt(approveUserMatch[1]);
    
    try {
      // Get user details first
      const user = await env.DB.prepare(
        'SELECT id, email, account_status FROM users WHERE id = ?'
      ).bind(userId).first<{ id: number; email: string; account_status: string }>();

      if (!user) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'User not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (user.account_status === 'approved') {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'User is already approved'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Update account status to approved
      const timestamp = Math.floor(Date.now() / 1000);
      await env.DB.prepare(
        'UPDATE users SET account_status = ?, updated_at = ? WHERE id = ?'
      ).bind('approved', timestamp, userId).run();

      // Send approval email in background
      ctx.waitUntil(
        sendApprovalEmail(env, user.email).catch(err =>
          console.error('Failed to send approval email:', err)
        )
      );

      return new Response(JSON.stringify({
        status: 'success',
        message: 'User approved successfully',
        data: { userId, email: user.email }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Approve user error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to approve user'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // GET /api/admin/deposits/pending - List pending deposits
  if (path === '/api/admin/deposits/pending' && request.method === 'GET') {
    try {
      const deposits = await env.DB.prepare(`
        SELECT 
          t.*,
          u.email as user_email
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.type = 'deposit' AND t.status = 'pending'
        ORDER BY t.created_at DESC
      `).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: deposits.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch pending deposits'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/admin/deposits/:id/approve - Approve deposit
  const approveMatch = path.match(/^\/api\/admin\/deposits\/(\d+)\/approve$/);
  if (approveMatch && request.method === 'POST') {
    const txId = parseInt(approveMatch[1]);
    const result = await approveDeposit(env, txId);
    
    return new Response(JSON.stringify(result), {
      status: result.status === 'success' ? 200 : 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // GET /api/admin/users - List all users
  if (path === '/api/admin/users' && request.method === 'GET') {
    try {
      const users = await env.DB.prepare(`
        SELECT 
          u.id, 
          u.email, 
          u.role, 
          u.created_at, 
          u.kyc_status,
          u.account_status,
          COALESCE(w.available_balance, 0) as balance,
          (SELECT MAX(created_at) FROM user_sessions WHERE user_id = u.id) as last_login
        FROM users u 
        LEFT JOIN wallets w ON u.id = w.user_id
        ORDER BY u.created_at DESC
      `).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: users.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Admin users list error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch users'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // GET /api/admin/settings - Get system settings
  if (path === '/api/admin/settings' && request.method === 'GET') {
    try {
      const settings = await env.DB.prepare('SELECT * FROM system_settings').all();
      const settingsMap = settings.results.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      return new Response(JSON.stringify({
        status: 'success',
        data: settingsMap
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch settings'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/admin/settings - Update system settings
  if (path === '/api/admin/settings' && request.method === 'POST') {
    try {
      const body = await request.json() as { key: string; value: string };
      
      if (!body.key || body.value === undefined) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Key and value are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      await env.DB.prepare(
        `INSERT INTO system_settings (key, value, updated_at) 
         VALUES (?, ?, strftime('%s', 'now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).bind(body.key, body.value).run();

      return new Response(JSON.stringify({
        status: 'success',
        data: { key: body.key, value: body.value }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to update settings'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Match /api/admin/users/:id
  const userMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
  if (userMatch && request.method === 'GET') {
    const userId = parseInt(userMatch[1]);
    
    try {
      // Get user details
      const user = await env.DB.prepare(
        'SELECT id, email, role, created_at, kyc_status, account_status, referral_code FROM users WHERE id = ?'
      ).bind(userId).first();

      if (!user) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'User not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get wallet
      const wallet = await env.DB.prepare(
        'SELECT * FROM wallets WHERE user_id = ?'
      ).bind(userId).first();

      // Get recent transactions
      const transactions = await env.DB.prepare(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
      ).bind(userId).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          user,
          wallet,
          transactions: transactions.results
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch user details'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Match /api/admin/users/:id/balance
  const balanceMatch = path.match(/^\/api\/admin\/users\/(\d+)\/balance$/);
  if (balanceMatch && request.method === 'POST') {
    const userId = parseInt(balanceMatch[1]);
    
    try {
      const body = await request.json() as { amount: number; description?: string };
      
      if (!body.amount || typeof body.amount !== 'number') {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Valid amount is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Use processDeposit to add funds and record transaction
      // Admin deposits are auto-approved/completed
      const result = await processDeposit(
        env, 
        userId, 
        body.amount, 
        body.description || 'Admin Adjustment'
      );

      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 200 : 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to update balance'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({
    status: 'error',
    error: 'Not found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
