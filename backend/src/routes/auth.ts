/**
 * Authentication Routes
 * 
 * Handles user registration, login, logout, and token refresh.
 */

import { Env } from '../types';
import { registerUser, loginUser } from '../services/authService';
import { requireAuth } from '../middleware/auth';

/**
 * Handle authentication routes
 */
export async function handleAuthRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // POST /api/auth/register
  if (path === '/api/auth/register' && request.method === 'POST') {
    try {
      const body = await request.json() as { email?: string; password?: string; referralCode?: string };
      
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Email and password are required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const result = await registerUser(env, body.email, body.password, body.referralCode);
      
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
  
  // POST /api/auth/login
  if (path === '/api/auth/login' && request.method === 'POST') {
    try {
      const body = await request.json() as { email?: string; password?: string };
      
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Email and password are required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const result = await loginUser(env, body.email, body.password);
      
      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 200 : 401,
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
  
  // POST /api/auth/logout
  if (path === '/api/auth/logout' && request.method === 'POST') {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    // In a stateless JWT system, logout is handled client-side
    // The client should delete the token
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Logged out successfully',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  // GET /api/auth/me - Get current user info
  if (path === '/api/auth/me' && request.method === 'GET') {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    // Fetch full user details
    const user = await env.DB.prepare(
      'SELECT id, email, role, kyc_status, referral_code, created_at, updated_at FROM users WHERE id = ?'
    ).bind(authResult.user.userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'User not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({
      status: 'success',
      data: user,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
