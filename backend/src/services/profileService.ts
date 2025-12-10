import { Env, BotTier } from '../types';
import { isValidBotTier } from '../engine/BotTiers';

export async function getUserProfile(env: Env, userId: number) {
  const stmt = env.DB.prepare('SELECT id, email, role, kyc_status, referral_code, username, avatar_url, bio, created_at FROM users WHERE id = ?');
  return await stmt.bind(userId).first();
}

export async function getUserStrategy(env: Env, userId: number): Promise<BotTier | null> {
  const stmt = env.DB.prepare('SELECT current_bot_tier FROM portfolios WHERE user_id = ?');
  const result = await stmt.bind(userId).first<{ current_bot_tier: string | null }>();
  return result?.current_bot_tier as BotTier | null;
}

export async function updateUserStrategy(env: Env, userId: number, tier: BotTier): Promise<{ tier: BotTier }> {
  if (!isValidBotTier(tier)) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  // Upsert into portfolios table
  await env.DB.prepare(`
    INSERT INTO portfolios (user_id, current_bot_tier, updated_at)
    VALUES (?, ?, strftime('%s', 'now'))
    ON CONFLICT(user_id) DO UPDATE SET
      current_bot_tier = excluded.current_bot_tier,
      updated_at = strftime('%s', 'now')
  `).bind(userId, tier).run();

  return { tier };
}

export async function updateUserProfile(env: Env, userId: number, data: { username?: string; avatar_url?: string; bio?: string }) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.username !== undefined) {
    updates.push('username = ?');
    values.push(data.username);
  }
  if (data.avatar_url !== undefined) {
    updates.push('avatar_url = ?');
    values.push(data.avatar_url);
  }
  if (data.bio !== undefined) {
    updates.push('bio = ?');
    values.push(data.bio);
  }

  if (updates.length === 0) return null;

  values.push(userId);
  const query = `UPDATE users SET ${updates.join(', ')}, updated_at = strftime('%s', 'now') WHERE id = ?`;
  
  await env.DB.prepare(query).bind(...values).run();
  return getUserProfile(env, userId);
}
