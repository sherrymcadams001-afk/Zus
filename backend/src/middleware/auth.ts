/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and extracts user information from requests.
 */

import type { Env } from '../types';
import { verifyJWT } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

/**
 * Extract token from Authorization header
 */
function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

/**
 * Authenticate request
 * Validates JWT and attaches user info to request
 */
export async function authenticateWithEnv(
  request: Request,
  env: Env
): Promise<AuthenticatedRequest | Response> {
  const token = extractToken(request);

  if (!token) {
    return new Response(JSON.stringify({
      status: 'error',
      error: 'Missing authentication token'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({
      status: 'error',
      error: 'Server misconfiguration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await verifyJWT(token, env.JWT_SECRET);
  
  if (!user) {
    return new Response(JSON.stringify({ 
      status: 'error', 
      error: 'Invalid or expired token' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Attach user to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = user;
  
  return authenticatedRequest;
}

/**
 * Require authentication middleware
 * Returns error response if not authenticated
 */
export async function requireAuth(
  request: Request,
  env: Env
): Promise<{ user: { userId: number; email: string; role: string }; request: Request } | Response> {
  const result = await authenticateWithEnv(request, env);
  
  if (result instanceof Response) {
    return result; // Return error response
  }
  
  if (!result.user) {
    return new Response(JSON.stringify({ 
      status: 'error', 
      error: 'Authentication required' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return { user: result.user, request: result };
}
