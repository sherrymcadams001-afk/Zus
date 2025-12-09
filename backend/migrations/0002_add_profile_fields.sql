-- Migration 0002: Add Profile Fields
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

