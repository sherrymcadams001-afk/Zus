import { Env, BotTier } from '../types';
import { requireAuth } from '../middleware/auth';
import { getUserProfile, updateUserProfile, getUserStrategy, updateUserStrategy } from '../services/profileService';
import { BOT_TIERS, isValidBotTier, VALID_BOT_TIERS } from '../engine/BotTiers';

export async function handleProfileRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  // POST /api/profile/strategy - Update user's selected strategy
  if (path === '/api/profile/strategy' && request.method === 'POST') {
    try {
      const body = await request.json() as { tier?: string };
      
      if (!body.tier || !isValidBotTier(body.tier)) {
        return new Response(JSON.stringify({
          status: 'error',
          error: `Invalid tier. Valid tiers: ${VALID_BOT_TIERS.join(', ')}`
        }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const result = await updateUserStrategy(env, user.userId, body.tier as BotTier);

      return new Response(JSON.stringify({
        status: 'success',
        data: result
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to update strategy'
      }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  }

  // GET /api/profile/strategy - Get user's current strategy
  if (path === '/api/profile/strategy' && request.method === 'GET') {
    const tier = await getUserStrategy(env, user.userId);
    return new Response(JSON.stringify({
      status: 'success',
      data: { tier: tier || 'delta' } // Default to delta if no strategy set
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  if (request.method === 'GET') {
    const profile = await getUserProfile(env, user.userId);
    
    const tiers = Object.entries(BOT_TIERS).map(([id, config]) => ({
      id,
      ...config,
      eligible: true 
    }));

    return new Response(JSON.stringify({
      status: 'success',
      data: {
        profile,
        tiers
      }
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  if (request.method === 'PUT') {
    const body = await request.json() as any;
    const updatedProfile = await updateUserProfile(env, user.userId, body);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: updatedProfile
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
