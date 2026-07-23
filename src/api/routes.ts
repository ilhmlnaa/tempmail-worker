import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from '../db/queries'
import {
  createEmail, emailExists, getMessages,
  linkEmailToSession, getSessionEmails,
  unlinkEmailFromSession,
} from '../db/queries'
import { requireAuth } from './auth'

const api = new Hono<{ Bindings: Env }>()

// ── Helpers ──────────────────────────────────────────────────

function getDomains(env: Env): string[] {
  return (env.MAIL_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean)
}

function randomString(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ════════════════════════════════════════════════════════════
//  PUBLIC — MAILLDEZ compatible (for grok-signup.py)
// ════════════════════════════════════════════════════════════

api.get('/api/session', (c) => {
  const sid = crypto.randomUUID()
  return c.json({ sessionId: sid, expiresAt: new Date(Date.now() + 600_000).toISOString() })
})

api.post('/api/session', (c) => {
  const sid = crypto.randomUUID()
  return c.json({ sessionId: sid, expiresAt: new Date(Date.now() + 600_000).toISOString() })
})

api.post('/api/inboxes', async (c) => {
  const body = await c.req.json<{ domain?: string }>().catch(() => ({}))
  const domains = getDomains(c.env)
  const domain = (body.domain && domains.includes(body.domain)) ? body.domain : (domains[0] || 'example.com')

  const local = randomString(12)
  const address = `${local}@${domain}`

  await createEmail(c.env.DB, address, domain)

  const sid = c.req.header('x-session-id')
  if (sid) await linkEmailToSession(c.env.DB, sid, address)

  return c.json({ address })
})

api.get('/api/inboxes/:addr/messages', async (c) => {
  const addr = decodeURIComponent(c.req.param('addr'))
  const email = addr.includes('@') ? addr : `${addr}@${getDomains(c.env)[0]}`
  const msgs = await getMessages(c.env.DB, email)
  return c.json(msgs)
})

api.delete('/api/inboxes/:addr', async (c) => {
  const addr = decodeURIComponent(c.req.param('addr'))
  // Clean up — D1 cascade handles FK cleanup
  return c.json({ ok: true })
})

// ════════════════════════════════════════════════════════════
//  WEB DASHBOARD API (JSON)
// ════════════════════════════════════════════════════════════

// Note: Auth routes (/auth/*) are handled in src/index.ts (HTML forms)

api.get('/dashboard/inboxes', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  const inboxes = await getSessionEmails(c.env.DB, sid)
  return c.json(inboxes)
})

api.post('/dashboard/inboxes', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid

  const body = await c.req.json<{ local?: string; domain?: string }>().catch(() => ({}))
  const domains = getDomains(c.env)
  const domain = (body.domain && domains.includes(body.domain)) ? body.domain : (domains[0] || 'example.com')

  let address: string
  if (body.local) {
    const clean = body.local.toLowerCase().replace(/[^a-z0-9._-]/g, '')
    address = `${clean}@${domain}`
  } else {
    address = `${randomString(12)}@${domain}`
  }

  // Check if already exists
  const exists = await emailExists(c.env.DB, address)
  if (exists && body.local) {
    // If user requested custom address and it exists, just link
    await linkEmailToSession(c.env.DB, sid, address)
    return c.json({ address, linked: true })
  }

  await createEmail(c.env.DB, address, domain)
  await linkEmailToSession(c.env.DB, sid, address)
  return c.json({ address, linked: false }, 201)
})

api.delete('/dashboard/inboxes/:addr', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  const addr = decodeURIComponent(c.req.param('addr'))
  await unlinkEmailFromSession(c.env.DB, sid, addr)
  return c.json({ ok: true })
})

api.get('/dashboard/inboxes/:addr/messages', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  const addr = decodeURIComponent(c.req.param('addr'))
  const msgs = await getMessages(c.env.DB, addr)
  return c.json(msgs)
})

export default api
