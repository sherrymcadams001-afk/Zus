/**
 * NowPayments Service
 * 
 * Integration with NowPayments API for crypto deposit processing
 */

import type { Env } from '../types';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// Supported currencies for deposits
export const SUPPORTED_CURRENCIES = ['btc', 'eth', 'ltc', 'usdttrc20'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export interface NowPaymentsEnv {
  NOWPAYMENTS_API_KEY: string;
  NOWPAYMENTS_IPN_SECRET?: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: SupportedCurrency;
  orderId: string;
  orderDescription?: string;
}

export interface NowPaymentsPaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: number;
  expiration_estimate_date: string;
  network: string;
  network_precision: number;
}

export interface NowPaymentsIPNPayload {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  actually_paid: number;
  order_id: string;
  order_description: string;
  purchase_id: number;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

/**
 * Create a payment via NowPayments API
 */
export async function createPayment(
  env: NowPaymentsEnv,
  request: CreatePaymentRequest,
  ipnCallbackUrl: string
): Promise<NowPaymentsPaymentResponse> {
  const url = NOWPAYMENTS_API_URL + '/payment';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: request.amount,
      price_currency: 'usd',
      pay_currency: request.currency,
      ipn_callback_url: ipnCallbackUrl,
      order_id: request.orderId,
      order_description: request.orderDescription || 'CapWheel Deposit - ' + request.orderId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('NowPayments createPayment error:', response.status, errorText);
    throw new Error(`NowPayments API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as NowPaymentsPaymentResponse;
  console.log('NowPayments payment created:', JSON.stringify(data));
  return data;
}

/**
 * Get payment status from NowPayments
 */
export async function getPaymentStatus(
  env: NowPaymentsEnv,
  paymentId: number
): Promise<NowPaymentsPaymentResponse> {
  const url = NOWPAYMENTS_API_URL + '/payment/' + paymentId;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': env.NOWPAYMENTS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('NowPayments API error:', error);
    throw new Error('NowPayments API error: ' + response.status);
  }

  return response.json();
}

/**
 * Verify IPN signature using async Web Crypto API
 * NowPayments uses HMAC-SHA512 for signature verification
 */
export async function verifyIpnSignatureAsync(
  payload: Record<string, unknown>,
  signature: string,
  ipnSecret: string
): Promise<boolean> {
  try {
    // Sort payload keys and create string representation
    const sortedKeys = Object.keys(payload).sort();
    const sortedPayload: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedPayload[key] = payload[key];
    }
    const payloadString = JSON.stringify(sortedPayload);
    
    // Create HMAC-SHA512 signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ipnSecret);
    const messageData = encoder.encode(payloadString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return calculatedSignature === signature.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Map NowPayments status to internal status
 */
export function mapPaymentStatus(nowPaymentsStatus: string): string {
  const statusMap: Record<string, string> = {
    waiting: 'pending',
    confirming: 'pending',
    confirmed: 'pending',
    sending: 'pending',
    partially_paid: 'pending',
    finished: 'completed',
    failed: 'failed',
    refunded: 'failed',
    expired: 'failed',
  };
  
  return statusMap[nowPaymentsStatus] || 'pending';
}
