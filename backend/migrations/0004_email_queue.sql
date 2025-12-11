-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  template_alias TEXT NOT NULL,
  template_model TEXT, -- JSON string
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  scheduled_at INTEGER NOT NULL, -- Timestamp when to send
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Index for finding pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, scheduled_at);
