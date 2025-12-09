import { Env } from '../types';

export async function getUserProfile(env: Env, userId: number) {
  const stmt = env.DB.prepare('SELECT id, email, role, kyc_status, referral_code, username, avatar_url, bio, created_at FROM users WHERE id = ?');
  return await stmt.bind(userId).first();
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
