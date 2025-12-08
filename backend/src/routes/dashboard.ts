/**
 * Dashboard Aggregate Route
 * 
 * SINGLE API call returns ALL dashboard data
 * Reduces 6 API calls to 1 for massive free-tier efficiency
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { getUserWallet, getTransactionHistory } from '../services/walletService';
import { getUserPortfolio, getTradeHistory } from '../services/portfolioService';
import { getUserActiveStakes, getTotalStaked, getTotalEarned } from '../services/poolService';
import { getPartnerVolume, getReferralStats } from '../services/referralService';

/**
 * Handle dashboard aggregate route
 * GET /api/dashboard - Returns all dashboard data in ONE call
 */
export async function handleDashboardRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // All dashboard routes require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  
  const { user } = authResult;
  
  // GET /api/dashboard - Aggregate all dashboard data
  if (path === '/api/dashboard' && request.method === 'GET') {
    try {
      // Parallel fetch all data in ONE Worker request
      const [
        wallet,
        portfolio,
        trades,
        transactions,
        activeStakes,
        totalStaked,
        totalEarned,
        partnerVolume,
        referralStats,
      ] = await Promise.all([
        getUserWallet(env, user.userId),
        getUserPortfolio(env, user.userId),
        getTradeHistory(env, user.userId, 50), // Increased for chart density
        getTransactionHistory(env, user.userId, 100), // Increased for wealth chart history
        getUserActiveStakes(env, user.userId),
        getTotalStaked(env, user.userId),
        getTotalEarned(env, user.userId),
        getPartnerVolume(env, user.userId),
        getReferralStats(env, user.userId),
      ]);
      
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          wallet,
          portfolio,
          trades,
          transactions,
          staking: {
            activeStakes,
            totalStaked,
            totalEarned,
          },
          referrals: {
            partnerVolume,
            stats: referralStats,
          },
          timestamp: Math.floor(Date.now() / 1000),
        },
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=10', // Client-side cache for 10s
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error('Dashboard aggregate error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Failed to fetch dashboard data',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
