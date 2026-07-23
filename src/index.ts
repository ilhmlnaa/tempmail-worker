/**
 * TempMail Worker — MAILLDEZ-compatible + Web Dashboard
 * 
 * Routes:
 *   /api/*          → MAILLDEZ API + Dashboard API
 *   /auth/*         → Auth endpoints
 *   /               → Dashboard (auth required)
 *   /login          → Login page
 *   /inbox/:addr    → Inbox viewer
 *   email()         → Inbound email handler
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import api from './api/routes'
import { handleEmail } from './email/handler'
import { requireAuth, setSessionCookie, clearSessionCookie, verifyPassword } from './api/auth'
import { getSessionEmails, linkEmailToSession, createSession } from './db/queries'
import { LoginPage } from './web/login'
import { DashboardPage } from './web/dashboard'
import { InboxPage } from './web/inbox'
import { css } from './web/styles'
import type { Env } from './db/queries'

const app = new Hono<{ Bindings: Env }>()

// ── Static assets ─────────────────────────────────────────────
app.get('/styles.css', (c) => {
  return c.text(css, 200, { 'Content-Type': 'text/css; charset=utf-8' })
})

// ── Global CORS for API ───────────────────────────────────────
app.use('/api/*', cors())

// ── Mount API routes ──────────────────────────────────────────
app.route('/', api)

// ── Auth pages ────────────────────────────────────────────────
app.get('/login', (c) => {
  return c.html(LoginPage({}))
})

app.post('/auth/login', async (c) => {
  const body = await c.req.parseBody()
  const password = body.password as string || ''

  if (!verifyPassword(c, password)) {
    return c.html(LoginPage({ error: 'Invalid password' }))
  }

  const sid = crypto.randomUUID()
  await createSession(c.env.DB, sid)
  setSessionCookie(c, sid)
  return c.redirect('/')
})

app.post('/auth/logout', (c) => {
  clearSessionCookie(c)
  return c.redirect('/login')
})

// ── Web pages (auth required) ─────────────────────────────────
app.get('/', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid // redirect to login

  const domains = (c.env.MAIL_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean)
  const inboxes = await getSessionEmails(c.env.DB, sid)

  return c.html(DashboardPage({
    inboxes: inboxes as any[],
    domains,
  }))
})

app.get('/inbox/:addr', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid

  const addr = decodeURIComponent(c.req.param('addr'))

  // Fetch messages via the queries module
  const { getMessages } = await import('./db/queries')
  const msgs = await getMessages(c.env.DB, addr)

  return c.html(InboxPage({ address: addr, messages: msgs as any[] }))
})

// ═══════════════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    await handleEmail(message, env)
  },
}
