-- Invite Codes System
-- Migration 0003: Invite codes with 3-day expiry and usage tracking

-- ============================================
-- Invite Codes Table
-- ============================================

-- Invite codes for user network expansion
-- Codes expire after 3 days if unused
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  used_by_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (used_by_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_creator_id ON invite_codes(creator_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);
