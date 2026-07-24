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
import { getSessionEmails, getAllEmails, linkEmailToSession, createSession } from './db/queries'
import { LoginPage } from './web/login'
import { DashboardPage } from './web/dashboard'
import { SettingsPage } from './web/settings'
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
  const contentType = c.req.header('content-type') || ''
  let password = ''

  if (contentType.includes('application/json')) {
    const body = await c.req.json<{ password: string }>().catch(() => ({ password: '' }))
    password = body.password || ''
  } else {
    const body = await c.req.parseBody()
    password = (body as Record<string, string>).password || ''
  }

  const isValid = await verifyPassword(c, password)
  if (!isValid) {
    if (contentType.includes('application/json')) {
      return c.json({ error: 'Invalid password' }, 401)
    }
    return c.html(LoginPage({ error: 'Invalid password' }))
  }

  const sid = crypto.randomUUID()
  await createSession(c.env.DB, sid)
  setSessionCookie(c, sid)
  
  // If JSON (AJAX), return success; if form, redirect
  if (contentType.includes('application/json')) {
    return c.json({ ok: true })
  }
  return c.redirect('/')
})

app.post('/auth/logout', (c) => {
  clearSessionCookie(c)
  return c.redirect('/login')
})

// ── Web pages (auth required) ─────────────────────────────────
app.get('/dashboard', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid

  try {
    const { getSetting, getApiKeys } = await import('./db/queries')
    const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'example.com')
    const domains = domainsStr.split(',').map(d => d.trim()).filter(Boolean)
    
    const inboxes = await getAllEmails(c.env.DB); 
    const apiKeys = await getApiKeys(c.env.DB)

    return c.html(DashboardPage({
      inboxes: inboxes as any[], apiKeys: apiKeys as any[],
      domains,
    }))
  } catch (err: any) {
    console.error('[dash] error:', err?.message)
    return c.html(DashboardPage({ inboxes: [], domains: [], apiKeys: [] }))
  }
})

app.get('/', (c) => c.redirect('/dashboard'))

app.get('/settings', async (c) => {
  const sid = requireAuth(c)
  if (typeof sid === 'object') return sid
  
  const { getSetting } = await import('./db/queries')
  const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'example.com')
  
  return c.html(SettingsPage({ domains: domainsStr, hasAuthSecret: true }))
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
