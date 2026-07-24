import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from '../db/queries'
import {
  createEmail, getMessages, emailExists, createSession,
  linkEmailToSession, unlinkEmailFromSession, getAllEmails,
  getApiKeyByValue
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

api.get('/api/session', async (c) => {
  const sid = crypto.randomUUID()
  await createSession(c.env.DB, sid)
  return c.json({ sessionId: sid, expiresAt: new Date(Date.now() + 600_000).toISOString() })
})

api.post('/api/session', async (c) => {
  const sid = crypto.randomUUID()
  await createSession(c.env.DB, sid)
  return c.json({ sessionId: sid, expiresAt: new Date(Date.now() + 600_000).toISOString() })
})

api.post('/api/inboxes', async (c) => {
  // API Key Check
  const authHeader = c.req.header('Authorization')
  let apiKeyRecord = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    apiKeyRecord = await getApiKeyByValue(c.env.DB, token)
    if (!apiKeyRecord) {
      return c.json({ error: 'Invalid API Key' }, 401)
    }
  }

  const body = await c.req.json<{ domain?: string; address?: string }>().catch(() => ({}))
  const domains = (await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'example.com')).split(',').map(d => d.trim())
  let domain = (body.domain && domains.includes(body.domain)) ? body.domain : (domains[0] || 'example.com')
  
  // Override/Filter if API key has restricted domains (and not '*')
  if (apiKeyRecord && apiKeyRecord.permittedDomains !== '*') {
    const allowed = apiKeyRecord.permittedDomains.split(',').map(d => d.trim())
    if (!allowed.includes(domain)) {
      if (allowed.length > 0) domain = allowed[0]
      else return c.json({ error: 'API key has no valid domain permissions' }, 403)
    }
  }

  let address: string
  if (body.address) {
    // Custom prefix — bersihin karakter aneh
    const clean = body.address.toLowerCase().replace(/[^a-z0-9._-]/g, '')
    address = `${clean}@${domain}`
    // Skip kalau kosong
    if (!clean) address = `${randomString(12)}@${domain}`
  } else {
    address = `${randomString(12)}@${domain}`
  }

  await createEmail(c.env.DB, address, domain)

  const sid = c.req.header('x-session-id')
  if (sid) await linkEmailToSession(c.env.DB, sid, address)
  
  // Link ke dashboard session juga kalau ada
  const dashSid = c.req.header('x-dashboard-sid')
  if (dashSid) await linkEmailToSession(c.env.DB, dashSid, address)

  return c.json({ address })
})

api.get('/api/inboxes/:addr/messages', async (c) => {
  const addr = decodeURIComponent(c.req.param('addr'))
  const email = addr.includes('@') ? addr : `${addr}@${(await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'example.com')).split(',')[0].trim()}`
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
  // Tampilkan semua email di DB — gak cuma yang ter-link ke session
  const inboxes = await getAllEmails(c.env.DB)
  return c.json(inboxes)
})

api.post('/dashboard/inboxes', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid

  const body = await c.req.json<{ local?: string; domain?: string }>().catch(() => ({}))
  const domains = (await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'example.com')).split(',').map(d => d.trim())
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

// ════════════════════════════════════════════════════════════
//  DASHBOARD API - API KEYS
// ════════════════════════════════════════════════════════════

import { getApiKeys, createApiKey, deleteApiKey } from '../db/queries'

api.get('/dashboard/apikeys', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  const keys = await getApiKeys(c.env.DB)
  return c.json(keys)
})

api.post('/dashboard/apikeys', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  
  const body = await c.req.json<{ domains?: string }>().catch(() => ({}))
  const permitted = body.domains && body.domains.trim() ? body.domains.trim() : '*'
  const keyStr = 'tm_' + crypto.randomUUID().replace(/-/g, '')
  
  await createApiKey(c.env.DB, crypto.randomUUID(), keyStr, permitted)
  return c.json({ key: keyStr, permittedDomains: permitted }, 201)
})

api.delete('/dashboard/apikeys/:id', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  await deleteApiKey(c.env.DB, c.req.param('id'))
  return c.json({ ok: true })
})
import { getSetting, updateSetting } from '../db/queries'

// ── Settings API ─────────────────────────────────────────────
api.post('/dashboard/settings', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  
  const body = await c.req.json<{ mail_domains?: string, auth_password?: string }>().catch(() => ({}))
  
  if (body.mail_domains !== undefined) {
    await updateSetting(c.env.DB, 'mail_domains', body.mail_domains)
  }
  if (body.auth_password !== undefined && body.auth_password.trim() !== '') {
    await updateSetting(c.env.DB, 'auth_password', body.auth_password)
  }
  
  return c.json({ ok: true })
})
