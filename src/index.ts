/**
 * MAILLDEZ-compatible Temp Mail API — Cloudflare Email Worker
 *
 * Mirrors the MAILLDEZ API surface used by Auto-sign-up-grok-dezz:
 *   GET  /api/session                    → { sessionId, expiresAt }
 *   POST /api/inboxes  { domain }        → { address }
 *   GET  /api/inboxes/{addr}/messages    → [ { id, subject, body, from, ... } ]
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import PostalMime from 'postal-mime'

// ── Types ──────────────────────────────────────────────────────

interface Message {
  id: string
  from: string
  subject: string
  body: string
  intro: string
  createdAt: string
}

interface InboxRecord {
  address: string
  sessionId: string
  domain: string
  createdAt: number
}

// ── Env ────────────────────────────────────────────────────────

interface Env {
  MAIL_LITE: KVNamespace
  AUTH_SECRET?: string
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function randomString(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateId(): string {
  return `${randomString(8)}-${randomString(4)}-${randomString(4)}`
}

// ═══════════════════════════════════════════════════════════════
//  KV STORE HELPERS
// ═══════════════════════════════════════════════════════════════

async function appendMessage(
  kv: KVNamespace,
  addr: string,
  msg: { from: string; subject: string; body: string },
): Promise<void> {
  const key = `msgs:${addr}`
  const raw = await kv.get(key)
  const messages: Message[] = raw ? JSON.parse(raw) : []

  messages.push({
    id: generateId(),
    from: msg.from,
    subject: msg.subject,
    body: msg.body,
    intro: msg.subject,
    createdAt: new Date().toISOString(),
  })

  await kv.put(key, JSON.stringify(messages), { expirationTtl: 600 })
  console.log(`[mail] stored for ${addr} (${messages.length} total)`)
}

// ═══════════════════════════════════════════════════════════════
//  HONO API
// ═══════════════════════════════════════════════════════════════

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

// Health check
app.get('/', (c) => c.json({ ok: true, service: 'tempmail-worker' }))

// ── GET|POST /api/session ─────────────────────────────────────
const sessionHandler = async (c: any) => {
  const sessionId = generateId()
  const session = {
    sessionId,
    inboxes: [] as string[],
    createdAt: Date.now(),
  }
  await c.env.MAIL_LITE.put(`sess:${sessionId}`, JSON.stringify(session), { expirationTtl: 600 })
  return c.json({ sessionId, expiresAt: new Date(Date.now() + 600_000).toISOString() })
}
app.get('/api/session', sessionHandler)
app.post('/api/session', sessionHandler)

// ── POST /api/inboxes ─────────────────────────────────────────
app.post('/api/inboxes', async (c) => {
  const sessionId = c.req.header('x-session-id') || ''
  const body = await c.req.json<{ domain?: string }>()
  const domain = body.domain || 'zenime.online'

  const local = randomString(12)
  const address = `${local}@${domain}`

  const inbox: InboxRecord = { address, sessionId, domain, createdAt: Date.now() }
  await c.env.MAIL_LITE.put(`inbox:${local}`, JSON.stringify(inbox), { expirationTtl: 600 })

  // Tie to session
  if (sessionId) {
    const raw = await c.env.MAIL_LITE.get(`sess:${sessionId}`)
    if (raw) {
      const s = JSON.parse(raw)
      s.inboxes.push(address)
      await c.env.MAIL_LITE.put(`sess:${sessionId}`, JSON.stringify(s), { expirationTtl: 600 })
    }
  }

  console.log(`[api] inbox: ${address}`)
  return c.json({ address })
})

// ── GET /api/inboxes/:addr/messages ───────────────────────────
app.get('/api/inboxes/:addr/messages', async (c) => {
  const addrParam = c.req.param('addr')
  const local = addrParam.includes('@') ? addrParam.split('@')[0].toLowerCase() : addrParam.toLowerCase()

  const raw = await c.env.MAIL_LITE.get(`msgs:${local}`)
  return c.json(raw ? JSON.parse(raw) : [])
})

// ── DELETE /api/inboxes/:addr ─────────────────────────────────
app.delete('/api/inboxes/:addr', async (c) => {
  const addrParam = c.req.param('addr')
  const local = addrParam.includes('@') ? addrParam.split('@')[0].toLowerCase() : addrParam.toLowerCase()

  await c.env.MAIL_LITE.delete(`msgs:${local}`)
  await c.env.MAIL_LITE.delete(`inbox:${local}`)
  return c.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    // Parse raw MIME email
    const raw = new Uint8Array(await message.raw.arrayBuffer())
    const parser = new PostalMime()
    const parsed = await parser.parse(raw)

    const to = message.to
    const local = to.split('@')[0].toLowerCase()
    const from = parsed.from?.text ?? message.from ?? '(unknown)'
    const subject = parsed.subject ?? '(no subject)'
    const body = parsed.text ?? '(empty)'

    await appendMessage(env.MAIL_LITE, local, { from, subject, body })
  },
}
