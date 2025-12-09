/**
 * Admin Routes
 * 
 * Handles administrative operations including user management and system monitoring.
 */

import { Env } from '../types';
import { requireAdmin } from '../middleware/admin';
import { processDeposit, getTransactionHistory } from '../services/walletService';

/**
 * Handle admin routes
 */
export async function handleAdminRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // All admin routes require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

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

  // Match /api/admin/users/:id
  const userMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
  if (userMatch && request.method === 'GET') {
    const userId = parseInt(userMatch[1]);
    
    try {
      // Get user details
      const user = await env.DB.prepare(
        'SELECT id, email, role, created_at, kyc_status, referral_code FROM users WHERE id = ?'
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
