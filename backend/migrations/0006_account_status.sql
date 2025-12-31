-- Account Status for Admin Approval Flow
-- Migration 0006: Add account_status column to users table
-- 
-- Users with valid invite codes get 'approved' status immediately
-- Users without invite codes get 'pending' status and require admin approval

-- Add account_status column
-- Default to 'approved' so existing users aren't locked out
ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'approved';

-- Create index for querying pending users
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
