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

function parseEmail(rawText: string): { from: string; subject: string; body: string } {
  const lines = rawText.split(/\r?\n/)
  let from = ''
  let subject = ''
  let inHeaders = true
  let bodyLines: string[] = []
  let headerValue = ''

  for (const line of lines) {
    if (inHeaders) {
      if (line === '') {
        // End of headers
        inHeaders = false
        if (from) from = from.trim()
        if (subject) subject = subject.trim()
        continue
      }
      // Header continuation (starts with space/tab)
      if ((line.startsWith(' ') || line.startsWith('\t')) && headerValue) {
        headerValue += ' ' + line.trim()
        continue
      }
      const lc = line.toLowerCase()
      if (lc.startsWith('from:')) {
        from = line.substring(5).trim()
        headerValue = from
      } else if (lc.startsWith('subject:')) {
        subject = line.substring(8).trim()
        headerValue = subject
      }
    } else if (bodyLines.length < 2000) {
      // Cap body at ~2000 lines to prevent KV overflow
      bodyLines.push(line)
    }
  }

  // Decode MIME encoded words (=?UTF-8?B?...?=)
  const decodeMime = (s: string): string => {
    return s.replace(/=\?[^?]+\?[Bb]\?([^?]*)\?=/g, (_, enc) => {
      try {
        return atob(enc.replace(/\s/g, ''))
      } catch {
        return enc
      }
    }).replace(/_/g, ' ')
  }

  return {
    from: decodeMime(from),
    subject: decodeMime(subject || '(no subject)'),
    body: bodyLines.join('\n').trim() || '(empty)',
  }
}

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

  // Keep max 20 messages per inbox
  const trimmed = messages.slice(-20)
  await kv.put(key, JSON.stringify(trimmed), { expirationTtl: 600 })
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

  if (sessionId) {
    const raw = await c.env.MAIL_LITE.get(`sess:${sessionId}`)
    if (raw) {
      const s = JSON.parse(raw)
      s.inboxes.push(address)
      await c.env.MAIL_LITE.put(`sess:${sessionId}`, JSON.stringify(s), { expirationTtl: 600 })
    }
  }

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
    try {
      console.log('[email] RECEIVED:', message.to, 'from:', message.from)

      // Quick KV test — can we write at all?
      const to = message.to
      const local = to.split('@')[0].toLowerCase()
      console.log('[email] local part:', local)

      // Try simple KV write first
      try {
        await env.MAIL_LITE.put(`msgs:${local}`, JSON.stringify([{
          id: generateId(),
          from: message.from || 'unknown',
          subject: 'raw test',
          body: 'test body',
          intro: 'raw test',
          createdAt: new Date().toISOString(),
        }]), { expirationTtl: 600 })
        console.log('[email] KV write success for', local)
      } catch (kvErr: any) {
        console.error('[email] KV write failed:', kvErr?.message || kvErr)
      }

      // Now try full parse + append
      try {
        const rawText = await message.raw.text()
        console.log('[email] raw text length:', rawText?.length || 0)
        const { from, subject, body } = parseEmail(rawText)
        await appendMessage(env.MAIL_LITE, local, { from, subject, body })
        console.log('[email] FULL SUCCESS for', local)
      } catch (parseErr: any) {
        console.error('[email] parse error:', parseErr?.message || parseErr, 'stack:', parseErr?.stack)
      }
    } catch (err: any) {
      console.error('[email] TOP error:', err?.message || err, 'stack:', err?.stack)
    }
  },
}
