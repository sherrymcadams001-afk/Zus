/**
 * Authentication Routes
 * 
 * Handles user registration, login, logout, and token refresh.
 */

import { Env } from '../types';
import { registerUser, loginUser, changePassword, logSession, getSessionHistory } from '../services/authService';
import { requireAuth } from '../middleware/auth';
import { sendWelcomeEmail, sendRequestReceivedEmail } from '../services/emailService';

/**
 * Handle authentication routes
 * @param ctx - ExecutionContext for background tasks (emails via waitUntil)
 */
export async function handleAuthRoutes(
  request: Request, 
  env: Env, 
  path: string,
  ctx: ExecutionContext
): Promise<Response> {
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
      
      // Send appropriate email immediately in background (non-blocking)
      if (result.status === 'success' && result.data) {
        if (result.data.waitlisted) {
          // Pending approval - send "request received" email
          ctx.waitUntil(
            sendRequestReceivedEmail(env, result.data.user.email).catch(err => 
              console.error('Failed to send request received email:', err)
            )
          );
        } else {
          // Approved via invite code - send welcome email
          ctx.waitUntil(
            sendWelcomeEmail(env, result.data.user.email).catch(err => 
              console.error('Failed to send welcome email:', err)
            )
          );
        }
      }
      
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
      
      // Log session on successful login (non-blocking)
      if (result.status === 'success' && result.data) {
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        ctx.waitUntil(
          logSession(env, result.data.user.id, result.data.token, ip, userAgent).catch(err =>
            console.error('Failed to log session:', err)
          )
        );
      }
      
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
    const authResult = await requireAuth(request, env);
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
    const authResult = await requireAuth(request, env);
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
  
  // POST /api/auth/change-password - Change user password
  if (path === '/api/auth/change-password' && request.method === 'POST') {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) return authResult;
    
    try {
      const body = await request.json() as { currentPassword?: string; newPassword?: string };
      
      if (!body.currentPassword || !body.newPassword) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Current password and new password are required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const result = await changePassword(env, authResult.user.userId, body.currentPassword, body.newPassword);
      
      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 200 : 400,
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
  
  // GET /api/auth/sessions - Get user's login history
  if (path === '/api/auth/sessions' && request.method === 'GET') {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) return authResult;
    
    const sessions = await getSessionHistory(env, authResult.user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: sessions,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
