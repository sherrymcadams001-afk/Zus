/**
 * Wallet Routes
 * 
 * Handles wallet operations including balance retrieval, deposits, and withdrawals.
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { getUserWallet, processDeposit, processWithdrawal, getTransactionHistory } from '../services/walletService';

/**
 * Handle wallet routes
 */
export async function handleWalletRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // All wallet routes require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  
  const { user } = authResult;
  
  // GET /api/wallet - Get user wallet
  if (path === '/api/wallet' && request.method === 'GET') {
    const wallet = await getUserWallet(env, user.userId);
    
    if (!wallet) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Wallet not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({
      status: 'success',
      data: wallet,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/wallet/deposit-address - Get system deposit address
  if (path === '/api/wallet/deposit-address' && request.method === 'GET') {
    try {
      const setting = await env.DB.prepare(
        "SELECT value FROM system_settings WHERE key = 'deposit_address_trc20'"
      ).first<{ value: string }>();

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          address: setting?.value || '',
          network: 'TRC20'
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch deposit address'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // POST /api/wallet/deposit - Deposit funds
  if (path === '/api/wallet/deposit' && request.method === 'POST') {
    try {
      const body = await request.json() as { 
        amount?: number; 
        description?: string;
        txHash?: string;
        network?: string;
      };
      
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Valid amount is required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // If txHash is provided, it's a user crypto deposit request (Pending)
      // If not, it's a direct system deposit (Completed) - usually restricted, but keeping logic flexible
      const isCryptoDeposit = !!body.txHash;
      const status = isCryptoDeposit ? 'pending' : 'completed';
      const description = body.description || (isCryptoDeposit ? `USDT Deposit (${body.network})` : 'Deposit');
      const metadata = isCryptoDeposit ? { txHash: body.txHash, network: body.network } : undefined;
      
      const result = await processDeposit(env, user.userId, body.amount, description, metadata, status);
      
      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 201 : 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Invalid request body',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }
  
  // POST /api/wallet/withdraw - Withdraw funds
  if (path === '/api/wallet/withdraw' && request.method === 'POST') {
    try {
      const body = await request.json() as { amount?: number; description?: string };
      
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Valid amount is required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const result = await processWithdrawal(env, user.userId, body.amount, body.description);
      
      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 201 : 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Invalid request body',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }
  
  // GET /api/wallet/transactions - Get transaction history
  if (path === '/api/wallet/transactions' && request.method === 'GET') {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const transactions = await getTransactionHistory(env, user.userId, limit, offset);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: transactions,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
