/**
 * Wallet Routes
 * 
 * Handles wallet operations including balance retrieval, deposits, and withdrawals.
 * Integrated with NowPayments for crypto deposits.
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { getUserWallet, processDeposit, processWithdrawal, getTransactionHistory } from '../services/walletService';
import { createPayment, SUPPORTED_CURRENCIES, type SupportedCurrency } from '../services/nowpaymentsService';

const IPN_CALLBACK_URL = 'https://trading-agent-engine.sherry-mcadams001.workers.dev/api/webhook/nowpayments';

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
  const authResult = await requireAuth(request, env);
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
  
  // GET /api/wallet/deposit-address - Get system deposit address (legacy)
  if (path === '/api/wallet/deposit-address' && request.method === 'GET') {
    try {
      const cacheKey = new Request('https://cache.local/system/deposit-address-trc20', { method: 'GET' });
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        return cached;
      }

      const setting = await env.DB.prepare(
        "SELECT value FROM system_settings WHERE key = 'deposit_address_trc20'"
      ).first<{ value: string }>();

      const response = new Response(JSON.stringify({
        status: 'success',
        data: {
          address: setting?.value || '',
          network: 'TRC20'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          ...corsHeaders,
        }
      });

      await caches.default.put(cacheKey, response.clone());
      return response;
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

  // POST /api/wallet/create-payment - Create NowPayments payment request
  if (path === '/api/wallet/create-payment' && request.method === 'POST') {
    try {
      const body = await request.json() as { amount?: number; currency?: SupportedCurrency };
      
      // Validate amount (NowPayments minimum is ~$19.20 USD)
      if (typeof body.amount !== 'number' || body.amount < 20) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Minimum deposit is $20',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Validate currency
      const validCurrency = SUPPORTED_CURRENCIES.includes(body.currency as SupportedCurrency);
      if (!body.currency || !validCurrency) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Invalid currency. Supported: btc, eth, ltc, usdttrc20',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Create pending transaction first to get ID for order_id
      const txResult = await env.DB.prepare(`
        INSERT INTO transactions (user_id, type, amount, status, description, metadata)
        VALUES (?, 'deposit', ?, 'pending', ?, ?)
      `).bind(
        user.userId,
        body.amount,
        `${body.currency.toUpperCase()} Deposit`,
        JSON.stringify({ currency: body.currency, payment_method: 'nowpayments' })
      ).run();

      const transactionId = txResult.meta.last_row_id;
      const orderId = `user_${user.userId}_tx_${transactionId}`;

      // Create payment with NowPayments
      const payment = await createPayment(
        { 
          NOWPAYMENTS_API_KEY: env.NOWPAYMENTS_API_KEY,
          NOWPAYMENTS_IPN_SECRET: env.NOWPAYMENTS_IPN_SECRET 
        },
        { amount: body.amount, currency: body.currency, orderId },
        IPN_CALLBACK_URL
      );

      // Update transaction with payment details
      await env.DB.prepare(`
        UPDATE transactions 
        SET metadata = json_set(metadata, 
          '$.payment_id', ?,
          '$.pay_address', ?,
          '$.pay_amount', ?,
          '$.pay_currency', ?
        )
        WHERE id = ?
      `).bind(
        payment.payment_id,
        payment.pay_address,
        payment.pay_amount,
        payment.pay_currency,
        transactionId
      ).run();

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          transactionId,
          paymentId: payment.payment_id,
          payAddress: payment.pay_address,
          payAmount: payment.pay_amount,
          payCurrency: payment.pay_currency.toUpperCase(),
          priceAmount: payment.price_amount,
          priceCurrency: payment.price_currency.toUpperCase(),
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Create payment error:', errorMessage);
      return new Response(JSON.stringify({
        status: 'error',
        error: errorMessage.includes('NowPayments') 
          ? errorMessage 
          : 'Failed to create payment. Please try again.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // GET /api/wallet/payment-status/:paymentId - Check payment status
  if (path.startsWith('/api/wallet/payment-status/') && request.method === 'GET') {
    try {
      const paymentId = path.replace('/api/wallet/payment-status/', '');
      
      // Get transaction from DB
      const tx = await env.DB.prepare(`
        SELECT * FROM transactions 
        WHERE user_id = ? AND json_extract(metadata, '$.payment_id') = ?
      `).bind(user.userId, paymentId).first();

      if (!tx) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Payment not found',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          transactionId: tx.id,
          status: tx.status,
          amount: tx.amount,
          metadata: JSON.parse(tx.metadata as string || '{}'),
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to get payment status',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
