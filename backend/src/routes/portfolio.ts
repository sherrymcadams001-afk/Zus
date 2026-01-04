/**
 * Portfolio Routes
 * 
 * Handles portfolio and trading history operations.
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { getUserPortfolio, getTradeHistory } from '../services/portfolioService';

/**
 * Handle portfolio routes
 */
export async function handlePortfolioRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // All portfolio routes require authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) return authResult;
  
  const { user } = authResult;
  
  // GET /api/portfolio - Get user portfolio
  if (path === '/api/portfolio' && request.method === 'GET') {
    const portfolio = await getUserPortfolio(env, user.userId);
    
    if (!portfolio) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Portfolio not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({
      status: 'success',
      data: portfolio,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/portfolio/trades - Get trade history
  if (path === '/api/portfolio/trades' && request.method === 'GET') {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const trades = await getTradeHistory(env, user.userId, limit, offset);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: trades,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
