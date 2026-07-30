-- Migration: 0002_create_rate_limits.sql
-- Table to persist rate limit windows safely across isolates

CREATE TABLE IF NOT EXISTS rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER NOT NULL DEFAULT 1,
  reset_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

CREATE TABLE IF NOT EXISTS app_metrics (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO app_metrics (key, value) VALUES ('lifetime_inboxes', 0), ('lifetime_messages', 0);
