-- Migration: 0001_unique_inbox_ownership.sql
-- Enforce 1:1 inbox ownership by adding UNIQUE constraint to email_address on session_emails

CREATE TABLE IF NOT EXISTS session_emails_new (
  session_id    TEXT NOT NULL,
  email_address TEXT NOT NULL UNIQUE,
  linked_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, email_address),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (email_address) REFERENCES emails(address) ON DELETE CASCADE
);

INSERT OR IGNORE INTO session_emails_new (session_id, email_address, linked_at)
SELECT session_id, email_address, linked_at FROM session_emails;

DROP TABLE session_emails;
ALTER TABLE session_emails_new RENAME TO session_emails;
