/**
 * Admin Routes
 * 
 * Handles administrative operations including user management and system monitoring.
 */

import { Env } from '../types';
import { requireAdmin } from '../middleware/admin';
import { processDeposit, approveDeposit } from '../services/walletService';
import { sendApprovalEmail } from '../services/emailService';
import { processRoiPayout, getActiveStakesForPayout } from '../services/poolService';

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

  // GET /api/admin/deposits/pending - List pending deposits (legacy, kept for compatibility)
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

  // GET /api/admin/deposits - List all deposits with pagination (completed via NowPayments)
  if (path === '/api/admin/deposits' && request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
      const status = url.searchParams.get('status') || ''; // completed, pending, failed
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = ["t.type = 'deposit'"];
      const params: (string | number)[] = [];
      
      if (status && ['completed', 'pending', 'failed'].includes(status)) {
        conditions.push('t.status = ?');
        params.push(status);
      }
      
      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Get total count
      const countResult = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM transactions t ${whereClause}`
      ).bind(...params).first<{ total: number }>();
      const total = countResult?.total ?? 0;

      // Get paginated deposits
      const deposits = await env.DB.prepare(`
        SELECT 
          t.id,
          t.user_id,
          t.type,
          t.amount,
          t.status,
          t.description,
          t.metadata,
          t.created_at,
          t.updated_at,
          u.email as user_email
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: deposits.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Admin deposits list error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch deposits'
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

  // GET /api/admin/users - List users with pagination and search
  if (path === '/api/admin/users' && request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
      const search = url.searchParams.get('search')?.trim() || '';
      const status = url.searchParams.get('status') || ''; // active, suspended, banned
      const role = url.searchParams.get('role') || ''; // user, admin
      const offset = (page - 1) * limit;
      
      // Build dynamic WHERE clause
      const conditions: string[] = [];
      const params: (string | number)[] = [];
      
      if (search) {
        conditions.push('u.email LIKE ?');
        params.push(`%${search}%`);
      }
      if (status && ['active', 'suspended', 'banned'].includes(status)) {
        conditions.push('u.account_status = ?');
        params.push(status);
      }
      if (role && ['user', 'admin'].includes(role)) {
        conditions.push('u.role = ?');
        params.push(role);
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Get total count for pagination
      const countResult = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM users u ${whereClause}`
      ).bind(...params).first<{ total: number }>();
      const total = countResult?.total ?? 0;
      
      // Get paginated users
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
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: users.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        }
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

  // GET /api/admin/analytics - Platform analytics and KPIs
  if (path === '/api/admin/analytics' && request.method === 'GET') {
    try {
      const now = Math.floor(Date.now() / 1000);
      const dayAgo = now - 86400;
      const weekAgo = now - 604800;
      const monthAgo = now - 2592000;

      // Batch queries for efficiency
      const [
        userStats,
        volumeStats,
        transactionStats,
        stakingStats,
        recentActivity,
      ] = await Promise.all([
        // User statistics
        env.DB.prepare(`
          SELECT
            COUNT(*) as total_users,
            SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) as new_users_24h,
            SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) as new_users_7d,
            SUM(CASE WHEN account_status = 'active' OR account_status = 'approved' THEN 1 ELSE 0 END) as active_users,
            SUM(CASE WHEN account_status = 'pending' THEN 1 ELSE 0 END) as pending_users,
            SUM(CASE WHEN account_status = 'suspended' THEN 1 ELSE 0 END) as suspended_users
          FROM users
        `).bind(dayAgo, weekAgo).first(),

        // Volume statistics (deposits/withdrawals)
        env.DB.prepare(`
          SELECT
            COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_deposits,
            COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_withdrawals,
            COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' AND created_at > ? THEN amount ELSE 0 END), 0) as deposits_24h,
            COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'completed' AND created_at > ? THEN amount ELSE 0 END), 0) as withdrawals_24h,
            COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_deposits,
            COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_withdrawals
          FROM transactions
        `).bind(dayAgo, dayAgo).first(),

        // Transaction counts
        env.DB.prepare(`
          SELECT
            COUNT(*) as total_transactions,
            SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) as transactions_24h,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions
          FROM transactions
        `).bind(dayAgo).first(),

        // Staking/Pool statistics
        env.DB.prepare(`
          SELECT
            COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as total_staked,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stakes,
            COALESCE(SUM(CASE WHEN status = 'active' AND created_at > ? THEN amount ELSE 0 END), 0) as staked_24h
          FROM pool_stakes
        `).bind(dayAgo).first(),

        // Recent activity log (last 20 events)
        env.DB.prepare(`
          SELECT 
            t.id, t.type, t.amount, t.status, t.created_at, t.description,
            u.email as user_email
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          ORDER BY t.created_at DESC
          LIMIT 20
        `).all(),
      ]);

      // Calculate platform totals from wallets
      const walletTotals = await env.DB.prepare(`
        SELECT
          COALESCE(SUM(available_balance), 0) as total_available,
          COALESCE(SUM(locked_balance), 0) as total_locked,
          COALESCE(SUM(pending_balance), 0) as total_pending
        FROM wallets
      `).first<{ total_available: number; total_locked: number; total_pending: number }>();

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          users: userStats,
          volume: volumeStats,
          transactions: transactionStats,
          staking: stakingStats,
          platform: {
            totalAUM: (walletTotals?.total_available ?? 0) + (walletTotals?.total_locked ?? 0),
            availableBalance: walletTotals?.total_available ?? 0,
            lockedBalance: walletTotals?.total_locked ?? 0,
            pendingBalance: walletTotals?.total_pending ?? 0,
          },
          recentActivity: recentActivity.results,
          generatedAt: now,
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Admin analytics error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch analytics'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // GET /api/admin/withdrawals/pending - List pending withdrawals
  if (path === '/api/admin/withdrawals/pending' && request.method === 'GET') {
    try {
      const withdrawals = await env.DB.prepare(`
        SELECT 
          t.*,
          u.email as user_email,
          w.available_balance as user_balance
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN wallets w ON t.user_id = w.user_id
        WHERE t.type = 'withdraw' AND t.status = 'pending'
        ORDER BY t.created_at DESC
      `).all();

      return new Response(JSON.stringify({
        status: 'success',
        data: withdrawals.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch pending withdrawals'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/admin/withdrawals/:id/approve - Approve withdrawal
  const approveWithdrawalMatch = path.match(/^\/api\/admin\/withdrawals\/(\d+)\/approve$/);
  if (approveWithdrawalMatch && request.method === 'POST') {
    const txId = parseInt(approveWithdrawalMatch[1]);
    
    try {
      // Get transaction details
      const tx = await env.DB.prepare(
        'SELECT * FROM transactions WHERE id = ? AND type = ? AND status = ?'
      ).bind(txId, 'withdraw', 'pending').first<{ id: number; user_id: number; amount: number }>();

      if (!tx) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Pending withdrawal not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const timestamp = Math.floor(Date.now() / 1000);

      // Atomically: mark completed + move pending balance to 0
      await env.DB.batch([
        env.DB.prepare(
          'UPDATE transactions SET status = ?, updated_at = ? WHERE id = ?'
        ).bind('completed', timestamp, txId),
        env.DB.prepare(
          'UPDATE wallets SET pending_balance = pending_balance - ?, updated_at = ? WHERE user_id = ?'
        ).bind(tx.amount, timestamp, tx.user_id),
      ]);

      return new Response(JSON.stringify({
        status: 'success',
        message: 'Withdrawal approved',
        data: { txId, amount: tx.amount }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to approve withdrawal'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/admin/withdrawals/:id/reject - Reject withdrawal (refund to available)
  const rejectWithdrawalMatch = path.match(/^\/api\/admin\/withdrawals\/(\d+)\/reject$/);
  if (rejectWithdrawalMatch && request.method === 'POST') {
    const txId = parseInt(rejectWithdrawalMatch[1]);
    
    try {
      const body = await request.json() as { reason?: string };
      
      const tx = await env.DB.prepare(
        'SELECT * FROM transactions WHERE id = ? AND type = ? AND status = ?'
      ).bind(txId, 'withdraw', 'pending').first<{ id: number; user_id: number; amount: number }>();

      if (!tx) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Pending withdrawal not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const reason = body.reason || 'Rejected by admin';

      // Atomically: mark rejected + refund pending to available
      await env.DB.batch([
        env.DB.prepare(
          'UPDATE transactions SET status = ?, description = ?, updated_at = ? WHERE id = ?'
        ).bind('rejected', reason, timestamp, txId),
        env.DB.prepare(
          `UPDATE wallets 
           SET pending_balance = pending_balance - ?, 
               available_balance = available_balance + ?,
               updated_at = ? 
           WHERE user_id = ?`
        ).bind(tx.amount, tx.amount, timestamp, tx.user_id),
      ]);

      return new Response(JSON.stringify({
        status: 'success',
        message: 'Withdrawal rejected and funds returned',
        data: { txId, amount: tx.amount }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to reject withdrawal'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/admin/users/:id/status - Update user account status
  const updateStatusMatch = path.match(/^\/api\/admin\/users\/(\d+)\/status$/);
  if (updateStatusMatch && request.method === 'POST') {
    const userId = parseInt(updateStatusMatch[1]);
    
    try {
      const body = await request.json() as { status: string; reason?: string };
      const validStatuses = ['active', 'approved', 'suspended', 'banned', 'pending'];
      
      if (!body.status || !validStatuses.includes(body.status)) {
        return new Response(JSON.stringify({
          status: 'error',
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      
      await env.DB.prepare(
        'UPDATE users SET account_status = ?, updated_at = ? WHERE id = ?'
      ).bind(body.status, timestamp, userId).run();

      return new Response(JSON.stringify({
        status: 'success',
        message: `User status updated to ${body.status}`,
        data: { userId, newStatus: body.status }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to update user status'
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

  // POST /api/admin/roi/process - Manually trigger ROI payout processing
  if (path === '/api/admin/roi/process' && request.method === 'POST') {
    try {
      console.log('Admin triggered ROI payout processing');
      
      // Get all active stakes using shared function
      const stakes = await getActiveStakesForPayout(env);
      
      if (!stakes || stakes.length === 0) {
        return new Response(JSON.stringify({
          status: 'success',
          message: 'No active stakes found for ROI payout',
          data: { processed: 0, succeeded: 0, failed: 0 }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      let successCount = 0;
      let errorCount = 0;
      const results: Array<{ user_id: number; amount: number; status: string; error?: string }> = [];
      
      // Process each stake using the shared poolService function
      for (const stake of stakes) {
        try {
          const result = await processRoiPayout(env, stake);
          
          if (result.status === 'success') {
            successCount++;
            results.push({ user_id: stake.user_id, amount: result.data?.payout || 0, status: 'success' });
            console.log(`Processed ROI payout: User ${stake.user_id}, Amount: $${result.data?.payout.toFixed(2)}`);
          } else {
            errorCount++;
            results.push({ user_id: stake.user_id, amount: 0, status: 'failed', error: result.error });
            console.error(`Failed to process stake ${stake.id}: ${result.error}`);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.push({ user_id: stake.user_id, amount: 0, status: 'failed', error: errorMsg });
          console.error(`Error processing stake ${stake.id}:`, error);
        }
      }
      
      return new Response(JSON.stringify({
        status: 'success',
        message: `ROI payout processing complete: ${successCount} succeeded, ${errorCount} failed`,
        data: {
          processed: stakes.length,
          succeeded: successCount,
          failed: errorCount,
          results
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Manual ROI processing error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to process ROI payouts'
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
