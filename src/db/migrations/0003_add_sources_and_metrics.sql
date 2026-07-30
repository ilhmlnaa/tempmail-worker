-- Migration: 0003_add_sources_and_metrics.sql
-- Add source column to emails table and introduce app_metrics table for promotional stats.

ALTER TABLE emails ADD COLUMN source TEXT NOT NULL DEFAULT 'public';

CREATE TABLE IF NOT EXISTS app_metrics (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO app_metrics (key, value) VALUES ('lifetime_inboxes', 0), ('lifetime_messages', 0);
