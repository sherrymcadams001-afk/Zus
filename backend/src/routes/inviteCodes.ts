/**
 * Invite Code Routes
 * 
 * Handles invite code generation, validation, and tracking.
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import {
  createInviteCode,
  getUserInviteCodes,
  getActiveInviteCodes,
  validateInviteCode,
  getInviteCodeStats,
} from '../services/inviteCodeService';

/**
 * Handle invite code routes
 */
export async function handleInviteCodeRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // POST /api/invite-codes/validate - Validate an invite code (no auth required for registration flow)
  if (path === '/api/invite-codes/validate' && request.method === 'POST') {
    try {
      const body = await request.json() as { code: string };
      
      if (!body.code) {
        return new Response(JSON.stringify({
          status: 'error',
          error: 'Invite code is required',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const result = await validateInviteCode(env, body.code);
      
      return new Response(JSON.stringify(result), {
        status: result.status === 'success' ? 200 : 400,
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

  // All other invite code routes require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user } = authResult;

  // POST /api/invite-codes - Create a new invite code
  if (path === '/api/invite-codes' && request.method === 'POST') {
    const result = await createInviteCode(env, user.userId);
    
    return new Response(JSON.stringify(result), {
      status: result.status === 'success' ? 201 : 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // GET /api/invite-codes - Get all user's invite codes
  if (path === '/api/invite-codes' && request.method === 'GET') {
    const codes = await getUserInviteCodes(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: codes,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // GET /api/invite-codes/active - Get only active invite codes
  if (path === '/api/invite-codes/active' && request.method === 'GET') {
    const codes = await getActiveInviteCodes(env, user.userId);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: codes,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // GET /api/invite-codes/stats - Get invite code statistics
  if (path === '/api/invite-codes/stats' && request.method === 'GET') {
    const stats = await getInviteCodeStats(env, user.userId);
    
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
