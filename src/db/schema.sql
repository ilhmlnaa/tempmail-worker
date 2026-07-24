CREATE TABLE IF NOT EXISTS emails (
  address     TEXT PRIMARY KEY,
  domain      TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  email_address   TEXT NOT NULL,
  from_address    TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT '(no subject)',
  body            TEXT NOT NULL DEFAULT '',
  html_body       TEXT,
  received_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (email_address) REFERENCES emails(address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_email ON messages(email_address, received_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_emails (
  session_id    TEXT NOT NULL,
  email_address TEXT NOT NULL,
  linked_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, email_address),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (email_address) REFERENCES emails(address) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  key_value TEXT NOT NULL UNIQUE,
  permitted_domains TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE emails ADD COLUMN api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL;
