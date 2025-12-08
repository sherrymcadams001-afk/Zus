/**
 * Authentication Service
 * 
 * Handles user authentication, JWT token generation, and password hashing.
 * Uses Web Crypto API available in Cloudflare Workers.
 */

import { Env, User, AuthResponse } from '../types';

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Generate a random referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, hashHex] = hash.split(':');
  if (!saltHex || !hashHex) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHashHex === hashHex;
}

/**
 * Generate a JWT token
 */
export async function generateJWT(userId: number, email: string, role: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  const encoder = new TextEncoder();
  const headerStr = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadStr = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const data = `${headerStr}.${payloadStr}`;
  
  // Use a secret key (in production, this should be in environment variables)
  const secret = encoder.encode('your-secret-key-change-in-production');
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureStr = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${data}.${signatureStr}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string): Promise<{ userId: number; email: string; role: string } | null> {
  try {
    const [headerStr, payloadStr, signatureStr] = token.split('.');
    if (!headerStr || !payloadStr || !signatureStr) return null;
    
    const encoder = new TextEncoder();
    const data = `${headerStr}.${payloadStr}`;
    
    // Verify signature
    const secret = encoder.encode('your-secret-key-change-in-production');
    const key = await crypto.subtle.importKey(
      'raw',
      secret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureStr), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!valid) return null;
    
    // Decode payload
    const payload = JSON.parse(atob(payloadStr));
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(
  env: Env,
  email: string,
  password: string,
  referralCode?: string
): Promise<AuthResponse> {
  try {
    // Validate email format first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { status: 'error', error: 'Invalid email format' };
    }
    
    // Normalize email after validation
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email length
    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      return { status: 'error', error: `Email too long (max ${MAX_EMAIL_LENGTH} characters)` };
    }
    
    // Validate password strength
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { status: 'error', error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }
    
    if (password.length > MAX_PASSWORD_LENGTH) {
      return { status: 'error', error: `Password too long (max ${MAX_PASSWORD_LENGTH} characters)` };
    }
    
    // Check if email already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();
    
    if (existing) {
      return { status: 'error', error: 'Email already registered' };
    }
    
    // Find referrer if code provided
    let referrerId: number | null = null;
    if (referralCode) {
      const referrer = await env.DB.prepare(
        'SELECT id FROM users WHERE referral_code = ?'
      ).bind(referralCode).first<{ id: number }>();
      
      if (referrer) {
        referrerId = referrer.id;
      }
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate unique referral code
    let userReferralCode = generateReferralCode();
    let codeExists = true;
    while (codeExists) {
      const check = await env.DB.prepare(
        'SELECT id FROM users WHERE referral_code = ?'
      ).bind(userReferralCode).first();
      if (!check) {
        codeExists = false;
      } else {
        userReferralCode = generateReferralCode();
      }
    }
    
    // Create user
    const timestamp = Math.floor(Date.now() / 1000);
    const result = await env.DB.prepare(
      `INSERT INTO users (email, password_hash, role, kyc_status, referrer_id, referral_code, created_at, updated_at)
       VALUES (?, ?, 'user', 'pending', ?, ?, ?, ?)
       RETURNING id, email, role, kyc_status, referral_code, created_at`
    ).bind(normalizedEmail, passwordHash, referrerId, userReferralCode, timestamp, timestamp).first<User>();
    
    if (!result) {
      return { status: 'error', error: 'Failed to create user' };
    }
    
    // Create wallet for user
    await env.DB.prepare(
      `INSERT INTO wallets (user_id, available_balance, locked_balance, pending_balance, currency, updated_at)
       VALUES (?, 0, 0, 0, 'USD', ?)`
    ).bind(result.id, timestamp).run();
    
    // Create portfolio for user
    await env.DB.prepare(
      `INSERT INTO portfolios (user_id, total_invested, total_pnl, total_trades, winning_trades, losing_trades, updated_at)
       VALUES (?, 0, 0, 0, 0, 0, ?)`
    ).bind(result.id, timestamp).run();
    
    // If user was referred, create referral relationships
    if (referrerId) {
      await createReferralChain(env, referrerId, result.id);
    }
    
    // Generate JWT
    const token = await generateJWT(result.id, result.email, result.role);
    
    return {
      status: 'success',
      data: {
        user: {
          id: result.id,
          email: result.email,
          role: result.role,
          kyc_status: result.kyc_status,
          referrer_id: referrerId,
          referral_code: result.referral_code,
          created_at: result.created_at,
          updated_at: result.created_at,
        },
        token,
      },
    };
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error', error);
    return { status: 'error', error: 'Registration failed' };
  }
}

/**
 * Create referral chain (up to 5 levels)
 */
async function createReferralChain(env: Env, referrerId: number, newUserId: number): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Level 1: Direct referral
  await env.DB.prepare(
    'INSERT INTO referrals (referrer_id, referred_id, level, created_at) VALUES (?, ?, 1, ?)'
  ).bind(referrerId, newUserId, timestamp).run();
  
  // Levels 2-5: Indirect referrals
  // Find the upline chain of the direct referrer to create multi-level referral relationships.
  // Query explanation: WHERE referred_id = referrerId finds all records where someone referred
  // the direct referrer, giving us their upline chain (ancestors in the referral tree).
  // Example: If Alice referred Bob, and Bob refers Carol:
  //   - referrerId = Bob's ID
  //   - Query returns: (referrer_id=Alice, referred_id=Bob, level=1)
  //   - Creates: (referrer_id=Alice, referred_id=Carol, level=2)
  const upline = await env.DB.prepare(
    'SELECT referrer_id, level FROM referrals WHERE referred_id = ? AND level < 5 ORDER BY level ASC'
  ).bind(referrerId).all<{ referrer_id: number; level: number }>();
  
  for (const ancestor of upline.results) {
    const level = ancestor.level + 1;
    if (level <= 5) {
      await env.DB.prepare(
        'INSERT INTO referrals (referrer_id, referred_id, level, created_at) VALUES (?, ?, ?, ?)'
      ).bind(ancestor.referrer_id, newUserId, level, timestamp).run();
    }
  }
}

/**
 * Login user
 */
export async function loginUser(
  env: Env,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Normalize email for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(normalizedEmail).first<User>();
    
    if (!user) {
      return { status: 'error', error: 'Invalid email or password' };
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return { status: 'error', error: 'Invalid email or password' };
    }
    
    // Generate JWT
    const token = await generateJWT(user.id, user.email, user.role);
    
    return {
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          kyc_status: user.kyc_status,
          referrer_id: user.referrer_id,
          referral_code: user.referral_code,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        token,
      },
    };
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error', error);
    return { status: 'error', error: 'Login failed' };
  }
}
