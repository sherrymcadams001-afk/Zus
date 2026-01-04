/**
 * Pool Routes
 * 
 * Handles staking pool operations.
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import {
  getActivePools,
  getUserStakes,
  getUserActiveStakes,
  createStake,
  getTotalStaked,
  getTotalEarned,
} from '../services/poolService';
import { getUserWallet, updateWalletBalance } from '../services/walletService';

/**
 * Handle pool routes
 */
export async function handlePoolRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // GET /api/pools - Get all active pools (public)
  if (path === '/api/pools' && request.method === 'GET') {
    const cacheKey = new Request('https://cache.local/pools', { method: 'GET' });
    const cached = await caches.default.match(cacheKey);
    if (cached) {
      return cached;
    }

    const pools = await getActivePools(env);

    const response = new Response(JSON.stringify({
      status: 'success',
      data: pools,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        ...corsHeaders,
      },
    });

    await caches.default.put(cacheKey, response.clone());
    return response;
  }
  
  // All other pool routes require authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) return authResult;
  
  const { user } = authResult;
  
  // GET /api/pools/stakes - Get user's stakes
  if (path === '/api/pools/stakes' && request.method === 'GET') {
    const stakes = await getUserStakes(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: stakes,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/pools/stakes/active - Get user's active stakes only
  if (path === '/api/pools/stakes/active' && request.method === 'GET') {
    const stakes = await getUserActiveStakes(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: stakes,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/pools/summary - Get user's staking summary
  if (path === '/api/pools/summary' && request.method === 'GET') {
    const [totalStaked, totalEarned, activeStakes] = await Promise.all([
      getTotalStaked(env, user.userId),
      getTotalEarned(env, user.userId),
      getUserActiveStakes(env, user.userId),
    ]);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: {
        total_staked: totalStaked,
        total_earned: totalEarned,
        active_stakes_count: activeStakes.length,
      },
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // POST /api/pools/stake - Create a new stake
  if (path === '/api/pools/stake' && request.method === 'POST') {
    try {
      const body = await request.json() as { pool_id?: number; amount?: number };
      
      if (typeof body.pool_id !== 'number' || typeof body.amount !== 'number') {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'pool_id and amount are required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      if (body.amount <= 0) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Amount must be positive',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      // Check user has sufficient balance
      const wallet = await getUserWallet(env, user.userId);
      if (!wallet || wallet.available_balance < body.amount) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Insufficient balance',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      // Deduct from wallet
      await updateWalletBalance(env, user.userId, -body.amount, body.amount);
      
      // Create stake
      const result = await createStake(env, user.userId, body.pool_id, body.amount);
      
      if (result.status === 'error') {
        // Refund if stake creation failed
        await updateWalletBalance(env, user.userId, body.amount, -body.amount);
      }
      
      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 201 : 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Invalid request body',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
