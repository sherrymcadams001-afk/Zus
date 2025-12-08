/**
 * Admin Middleware
 * 
 * Validates that the authenticated user has admin role.
 */

import { requireAuth } from './auth';

/**
 * Require admin role
 * Returns error response if not admin
 */
export async function requireAdmin(request: Request): Promise<{ user: { userId: number; email: string; role: string }; request: Request } | Response> {
  const authResult = await requireAuth(request);
  
  // If authentication failed, return error response
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Check if user is admin
  if (authResult.user.role !== 'admin') {
    return new Response(JSON.stringify({ 
      status: 'error', 
      error: 'Admin access required' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return authResult;
}
