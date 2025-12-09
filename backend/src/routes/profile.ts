import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { getUserProfile, updateUserProfile } from '../services/profileService';
import { BOT_TIERS } from '../engine/BotTiers';

export async function handleProfileRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

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
