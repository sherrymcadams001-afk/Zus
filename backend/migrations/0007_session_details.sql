-- Migration 0007: Add session details for login history
-- Adds IP address and user agent tracking to user_sessions

ALTER TABLE user_sessions ADD COLUMN ip_address TEXT;
ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON user_sessions(created_at);
