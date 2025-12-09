/**
 * NowPayments Webhook Routes
 * 
 * Handles IPN callbacks from NowPayments for automatic deposit processing
 */

import type { Env } from '../types';
import { verifyIpnSignatureAsync, mapPaymentStatus, type NowPaymentsIPNPayload } from '../services/nowpaymentsService';
import { updateWalletBalance } from '../services/walletService';

/**
 * IPN Webhook Handler
 * POST /api/webhook/nowpayments
 */
export async function handleNowPaymentsWebhook(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-nowpayments-sig',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ status: 'error', message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const signature = request.headers.get('x-nowpayments-sig');
    const payload = await request.json() as NowPaymentsIPNPayload;

    console.log('NowPayments IPN received:', JSON.stringify(payload));

    // Verify signature if present
    if (signature && env.NOWPAYMENTS_IPN_SECRET) {
      const isValid = await verifyIpnSignatureAsync(
        payload as unknown as Record<string, unknown>,
        signature,
        env.NOWPAYMENTS_IPN_SECRET
      );

      if (!isValid) {
        console.error('Invalid IPN signature');
        return new Response(JSON.stringify({ status: 'error', message: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    const { payment_id, payment_status, order_id, price_amount, actually_paid } = payload;
    
    // Extract user_id and transaction_id from order_id (format: "user_{userId}_tx_{txId}")
    const orderMatch = order_id.match(/user_(\d+)_tx_(\d+)/);
    if (!orderMatch) {
      console.error('Invalid order_id format:', order_id);
      return new Response(JSON.stringify({ status: 'error', message: 'Invalid order format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const userId = parseInt(orderMatch[1], 10);
    const transactionId = parseInt(orderMatch[2], 10);
    const internalStatus = mapPaymentStatus(payment_status);

    // Update transaction status in database
    const updateResult = await env.DB.prepare(`
      UPDATE transactions 
      SET status = ?, 
          metadata = json_set(COALESCE(metadata, '{}'), 
            '$.payment_id', ?,
            '$.payment_status', ?,
            '$.actually_paid', ?
          ),
          completed_at = CASE WHEN ? = 'completed' THEN strftime('%s', 'now') ELSE completed_at END
      WHERE id = ? AND user_id = ?
    `).bind(
      internalStatus,
      String(payment_id),
      payment_status,
      actually_paid,
      internalStatus,
      transactionId,
      userId
    ).run();

    console.log('Transaction update result:', updateResult);

    // If payment is complete, credit the user's wallet
    if (internalStatus === 'completed') {
      const creditAmount = price_amount; // Use USD amount
      
      await updateWalletBalance(env, userId, creditAmount);
      
      console.log(`Credited $${creditAmount} to user ${userId} wallet`);
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('IPN processing error:', error);
    return new Response(JSON.stringify({ status: 'error', message: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
