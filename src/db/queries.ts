import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  AUTH_SECRET: string
  MAIL_DOMAINS: string
}

export interface Inbox {
  address: string
  domain: string
  createdAt: string
  messageCount: number
  lastMessageAt: string | null
}

// ── Emails ─────────────────────────────────────────────────

export async function createEmail(db: D1Database, address: string, domain: string, apiKeyId: string | null = null) {
  if (apiKeyId) {
    // Karena SQLite ngga bisa INSERT OR IGNORE kalo mau UPDATE kolom tambahan saat exist, kita pakai upsert
    await db.prepare(`
      INSERT INTO emails (address, domain, api_key_id) VALUES (?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET api_key_id = excluded.api_key_id
    `).bind(address.toLowerCase(), domain, apiKeyId).run()
  } else {
    await db.prepare(
      'INSERT OR IGNORE INTO emails (address, domain) VALUES (?, ?)'
    ).bind(address.toLowerCase(), domain).run()
  }
}

export async function emailExists(db: D1Database, address: string): Promise<boolean> {
  const r = await db.prepare(
    'SELECT 1 FROM emails WHERE address = ?'
  ).bind(address.toLowerCase()).first()
  return !!r
}

// ── Messages ───────────────────────────────────────────────


export async function insertMessage(db: D1Database, 
  msg: { id: string; email: string; from: string; subject: string; body: string; html?: string | null }
) {
  await db.prepare(
    'INSERT INTO messages (id, email_address, from_address, subject, body, html_body) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(msg.id, msg.email.toLowerCase(), msg.from, msg.subject, msg.body, msg.html || null).run()
}

export async function getMessages(db: D1Database, address: string, limit = 50) {
  const r = await db.prepare(
    'SELECT id, from_address AS "from", subject, body, html_body AS html, received_at AS createdAt FROM messages WHERE email_address = ? ORDER BY received_at DESC LIMIT ?'
  ).bind(address.toLowerCase(), limit).all()
  return r.results
}

// ── Sessions (web dashboard) ───────────────────────────────

export async function createSession(db: D1Database, id: string, isAdmin = false) {
  await db.prepare('INSERT OR IGNORE INTO sessions (id, is_admin) VALUES (?, ?)').bind(id, isAdmin ? 1 : 0).run()
}

export async function linkEmailToSession(db: D1Database, sid: string, address: string) {
  await db.prepare(
    'INSERT OR IGNORE INTO session_emails (session_id, email_address) VALUES (?, ?)'
  ).bind(sid, address.toLowerCase()).run()
}

export async function getSessionEmails(db: D1Database, sid: string) {
  const r = await db.prepare(
    `SELECT e.address, e.domain, e.created_at as createdAt,
            (SELECT COUNT(*) FROM messages m WHERE m.email_address = e.address) as messageCount,
            (SELECT MAX(m.received_at) FROM messages m WHERE m.email_address = e.address) as lastMessageAt
     FROM session_emails se
     JOIN emails e ON se.email_address = e.address
     WHERE se.session_id = ?
     ORDER BY se.linked_at DESC`
  ).bind(sid).all()
  return r.results
}

export async function getAllEmails(db: D1Database, limit: number = 20, offset: number = 0) {
  const countResult = await db.prepare('SELECT COUNT(*) as total FROM emails').first()
  const total = countResult ? (countResult.total as number) : 0

  const msgsResult = await db.prepare('SELECT COUNT(*) as totalMsgs FROM messages').first()
  const totalMessages = msgsResult ? (msgsResult.totalMsgs as number) : 0

  const r = await db.prepare(
    `SELECT e.address, e.domain, e.created_at as createdAt,
            (SELECT COUNT(*) FROM messages m WHERE m.email_address = e.address) as messageCount,
            (SELECT MAX(m.received_at) FROM messages m WHERE m.email_address = e.address) as lastMessageAt
     FROM emails e
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all()
  
  return {
    total,
    totalMessages,
    emails: r.results
  }
}

export async function getEmailsByApiKey(db: D1Database, apiKeyId: string, limit: number = 20, offset: number = 0) {
  const countResult = await db.prepare('SELECT COUNT(*) as total FROM emails WHERE api_key_id = ?').bind(apiKeyId).first()
  const total = countResult ? (countResult.total as number) : 0

  const msgsResult = await db.prepare('SELECT COUNT(m.id) as totalMsgs FROM messages m JOIN emails e ON m.email_address = e.address WHERE e.api_key_id = ?').bind(apiKeyId).first()
  const totalMessages = msgsResult ? (msgsResult.totalMsgs as number) : 0

  const r = await db.prepare(
    `SELECT e.address, e.domain, e.created_at as createdAt,
            (SELECT COUNT(*) FROM messages m WHERE m.email_address = e.address) as messageCount,
            (SELECT MAX(m.received_at) FROM messages m WHERE m.email_address = e.address) as lastMessageAt
     FROM emails e
     WHERE e.api_key_id = ?
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(apiKeyId, limit, offset).all()

  return {
    total,
    totalMessages,
    emails: r.results
  }
}

export async function unlinkEmailFromSession(db: D1Database, sid: string, address: string) {
  await db.prepare(
    'DELETE FROM session_emails WHERE session_id = ? AND email_address = ?'
  ).bind(sid, address.toLowerCase()).run()
}

export interface ApiKey {
  id: string;
  keyValue: string;
  permittedDomains: string;
  maxInboxes: number;
  maxMessages: number;
  createdAt: string;
}

export async function createApiKey(
  db: D1Database, 
  id: string, 
  keyValue: string, 
  permittedDomains: string,
  maxInboxes: number = 0,
  maxMessages: number = 0
) {
  try {
    await db.prepare('INSERT INTO api_keys (id, key_value, permitted_domains, max_inboxes, max_messages) VALUES (?, ?, ?, ?, ?)')
      .bind(id, keyValue, permittedDomains, maxInboxes, maxMessages)
      .run()
  } catch {
    await db.prepare('INSERT INTO api_keys (id, key_value, permitted_domains) VALUES (?, ?, ?)')
      .bind(id, keyValue, permittedDomains)
      .run()
  }
}

export async function getApiKeys(db: D1Database): Promise<ApiKey[]> {
  const { results } = await db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all()
  return results.map((r: any) => ({
    id: r.id,
    keyValue: maskApiKey(r.key_value),
    permittedDomains: r.permitted_domains,
    maxInboxes: Number(r.max_inboxes || 0),
    maxMessages: Number(r.max_messages || 0),
    createdAt: r.created_at
  }))
}

export async function hashApiKey(key: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Non-secret display form of a stored key: last 6 chars only. */
export function maskApiKey(stored: string): string {
  return 'tm_' + '•'.repeat(8) + (stored || '').slice(-6)
}

export async function getApiKeyByValue(db: D1Database, key: string): Promise<ApiKey | null> {
  if (!key) return null
  const hashed = await hashApiKey(key)
  // Try hashed match first, then legacy plaintext (lazy-migrate on hit).
  let r = await db.prepare('SELECT * FROM api_keys WHERE key_value = ?').bind(hashed).first()
  if (!r) {
    r = await db.prepare('SELECT * FROM api_keys WHERE key_value = ?').bind(key).first()
    if (r) {
      // Lazy migration: upgrade plaintext row to hashed.
      await db.prepare('UPDATE api_keys SET key_value = ? WHERE id = ?').bind(hashed, r.id).run()
    }
  }
  if (!r) return null
  return {
    id: r.id as string,
    keyValue: r.key_value as string,
    permittedDomains: r.permitted_domains as string,
    maxInboxes: Number(r.max_inboxes || 0),
    maxMessages: Number(r.max_messages || 0),
    createdAt: r.created_at as string
  }
}

export async function getApiKeyInboxCount(db: D1Database, apiKeyId: string): Promise<number> {
  const r = await db.prepare('SELECT COUNT(*) as total FROM emails WHERE api_key_id = ?').bind(apiKeyId).first()
  return r ? Number(r.total || 0) : 0
}

export async function getApiKeyMessageCount(db: D1Database, apiKeyId: string): Promise<number> {
  const r = await db.prepare(
    'SELECT COUNT(m.id) as total FROM messages m JOIN emails e ON m.email_address = e.address WHERE e.api_key_id = ?'
  ).bind(apiKeyId).first()
  return r ? Number(r.total || 0) : 0
}

export async function deleteApiKey(db: D1Database, id: string) {
  await db.prepare('DELETE FROM api_keys WHERE id = ?').bind(id).run()
}

// ── Settings ────────────────────────────────────────────────
export async function getSetting(db: D1Database, key: string, fallback: string): Promise<string> {
  const r = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first()
  if (r) return r.value as string
  return fallback
}

export async function updateSetting(db: D1Database, key: string, value: string) {
  await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
    .bind(key, value, value).run()
}

export async function deleteEmail(db: D1Database, address: string) {
  // CASCADE deletes messages + session_emails links via FK
  await db.prepare('DELETE FROM emails WHERE address = ?').bind(address.toLowerCase()).run()
}

export async function isValidSession(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare('SELECT 1 FROM sessions WHERE id = ?').bind(id).first()
  return !!r
}

export async function isValidAdminSession(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare('SELECT 1 FROM sessions WHERE id = ? AND is_admin = 1').bind(id).first()
  return !!r
}

export async function getEmailRecord(db: D1Database, address: string): Promise<{address: string, api_key_id: string | null} | null> {
  const r = await db.prepare('SELECT address, api_key_id FROM emails WHERE address = ?').bind(address.toLowerCase()).first()
  return r as any
}

export async function isEmailLinkedToSession(db: D1Database, sid: string, address: string): Promise<boolean> {
  const r = await db.prepare('SELECT 1 FROM session_emails WHERE session_id = ? AND email_address = ?').bind(sid, address.toLowerCase()).first()
  return !!r
}
