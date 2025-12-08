/**
 * Referral Routes
 * 
 * Handles referral system operations.
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import {
  getDirectReferrals,
  getReferralNetwork,
  getPartnerVolume,
  getVolumeByLevel,
  getReferralStats,
} from '../services/referralService';

/**
 * Handle referral routes
 */
export async function handleReferralRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // All referral routes require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  
  const { user } = authResult;
  
  // GET /api/referrals - Get direct referrals
  if (path === '/api/referrals' && request.method === 'GET') {
    const referrals = await getDirectReferrals(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: referrals,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/referrals/network - Get full referral network (all levels)
  if (path === '/api/referrals/network' && request.method === 'GET') {
    const network = await getReferralNetwork(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: network,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/referrals/volume - Get total partner volume
  if (path === '/api/referrals/volume' && request.method === 'GET') {
    const totalVolume = await getPartnerVolume(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: {
        total_volume: totalVolume,
      },
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/referrals/volume/breakdown - Get volume by level
  if (path === '/api/referrals/volume/breakdown' && request.method === 'GET') {
    const volumeByLevel = await getVolumeByLevel(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: volumeByLevel,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/referrals/stats - Get comprehensive referral stats
  if (path === '/api/referrals/stats' && request.method === 'GET') {
    const stats = await getReferralStats(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: stats,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
