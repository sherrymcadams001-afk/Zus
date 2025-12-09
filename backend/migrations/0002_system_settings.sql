-- Migration 0002: System Settings

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Insert default empty deposit address
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('deposit_address_trc20', '');
