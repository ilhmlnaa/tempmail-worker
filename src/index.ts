/**
 * VoidMail Worker — MAILLDEZ-compatible + Web Dashboard + Public Landing Page
 * 
 * Routes:
 *   /               → Public SaaS Landing Page (Instant Temp Mail Generator)
 *   /admin/*        → Admin Portal (Dashboard, Inboxes, Settings, API Docs)
 *   /api/*          → Public & Developer REST API
 *   /auth/*         → Admin Authentication
 *   email()         → Cloudflare Email Routing Inbound Handler
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import api from './api/routes'
import { handleEmail } from './email/handler'
import { requireAuth, setSessionCookie, clearSessionCookie, verifyPassword } from './api/auth'
import { getSessionEmails, getAllEmails, linkEmailToSession, createSession, getSetting, getDomainStats } from './db/queries'
import { LoginPage } from './web/login'
import { LandingPage } from './web/landing'
import { DashboardPage } from './web/dashboard'
import { InboxesListPage } from './web/inboxes-list'
import { DocsPage } from './web/docs'
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

app.get('/setup', async (c) => {
  const { isAppConfigured } = await import('./api/auth')
  if (await isAppConfigured(c)) return c.redirect('/login')
  const { SetupPage } = await import('./web/login')
  return c.html(SetupPage({}))
})

app.post('/setup', async (c) => {
  const { isAppConfigured } = await import('./api/auth')
  if (await isAppConfigured(c)) return c.redirect('/login')
  
  const body = await c.req.parseBody()
  const password = (body as Record<string, string>).password || ''
  const confirm = (body as Record<string, string>).confirm || ''
  
  const { SetupPage } = await import('./web/login')
  if (!password || password.length < 8 || password !== confirm) {
    return c.html(SetupPage({ error: 'Password must be at least 8 characters and match.' }))
  }
  
  const { updateSetting, createSession } = await import('./db/queries')
  await updateSetting(c.env.DB, 'auth_password', password)
  
  const sid = crypto.randomUUID()
  await createSession(c.env.DB, sid, true)
  setSessionCookie(c, sid)
  
  return c.redirect('/admin')
})

app.use('*', async (c, next) => {
  const path = c.req.path
  if (path.startsWith('/admin')) {
    const { isAppConfigured } = await import('./api/auth')
    if (!(await isAppConfigured(c))) {
      return c.redirect('/setup')
    }
  }
  await next()
})

// ── Mount API routes ──────────────────────────────────────────
app.route('/', api)

// ── Public SaaS Landing Page ──────────────────────────────────
app.get('/', async (c) => {
  const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')
  let domains = domainsStr.split(',').map(d => d.trim()).filter(Boolean)
  const publicAllowedDomainsStr = await getSetting(c.env.DB, 'public_allowed_domains', '*')
  if (publicAllowedDomainsStr !== '*') {
    const allowed = publicAllowedDomainsStr.split(',').map(d => d.trim()).filter(Boolean)
    domains = domains.filter(d => allowed.includes(d))
    if (domains.length === 0 && domainsStr) domains = [domainsStr.split(',')[0].trim()]
  }
  return c.html(LandingPage({ domains }))
})

// ── Auth pages ────────────────────────────────────────────────
app.get('/login', async (c) => {
  const { isAppConfigured } = await import('./api/auth')
  if (!(await isAppConfigured(c))) return c.redirect('/setup')
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
  await createSession(c.env.DB, sid, true)
  setSessionCookie(c, sid)
  
  if (contentType.includes('application/json')) {
    return c.json({ ok: true, redirect: '/admin' })
  }
  return c.redirect('/admin')
})

app.post('/auth/logout', (c) => {
  clearSessionCookie(c)
  return c.redirect('/login')
})

// ── Legacy Redirects ─────────────────────────────────────────
app.get('/dashboard', (c) => c.redirect('/admin'))

// ── Admin Portal Web Pages (auth required) ───────────────────
app.get('/admin/apikeys/:id', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
    const limit = 20
    const offset = (page - 1) * limit
    const apiKeyId = c.req.param('id')

    const { getSetting, getApiKeys, getEmailsByApiKey } = await import('./db/queries')
    const keys = await getApiKeys(c.env.DB)
    const keyInfo = keys.find((k: any) => k.id === apiKeyId)
    
    if (!keyInfo) return c.text('API Key not found', 404)

    const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')
    const domains = domainsStr.split(',').map(d => d.trim()).filter(Boolean)
    
    const { total, totalMessages, emails: inboxes } = await getEmailsByApiKey(c.env.DB, apiKeyId, limit, offset)

    return c.html(DashboardPage({
      inboxes: inboxes as any[], 
      apiKeys: keys as any[],
      domains, 
      totalInboxes: total, 
      totalMessages,
      currentPage: page,
      apiKeyFilter: keyInfo as any
    }))
  } catch (err: any) {
    console.error('[dash apikey] error:', err?.message)
    return c.text('Error loading data', 500)
  }
})

app.get('/admin', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
    const limit = 20
    const offset = (page - 1) * limit

    const { getSetting, getApiKeys, getAllEmails, getDomainStats } = await import('./db/queries')
    const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')
    const domains = domainsStr.split(',').map(d => d.trim()).filter(Boolean)
    
    const { total, totalMessages, emails: inboxes } = await getAllEmails(c.env.DB, limit, offset); 
    const apiKeys = await getApiKeys(c.env.DB)
    const domainStats = await getDomainStats(c.env.DB)

    return c.html(DashboardPage({
      inboxes: inboxes as any[], apiKeys: apiKeys as any[],
      domains, domainStats, totalInboxes: total, totalMessages, currentPage: page,
    }))
  } catch (err: any) {
    console.error('[admin] error:', err?.message)
    return c.html(DashboardPage({ inboxes: [], domains: [], apiKeys: [], domainStats: {}, totalInboxes: 0, totalMessages: 0, currentPage: 1 }))
  }
})

app.get('/admin/dashboard', (c) => c.redirect('/admin'))

app.get('/admin/settings', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  
  const { getSetting } = await import('./db/queries')
  const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')
  const publicEnabled = await getSetting(c.env.DB, 'public_tempmail_enabled', 'enabled')
  const publicMaxInboxes = parseInt(await getSetting(c.env.DB, 'public_max_inboxes_per_session', '5'), 10)
  const publicAllowedDomains = await getSetting(c.env.DB, 'public_allowed_domains', '*')
  
  return c.html(SettingsPage({ 
    domains: domainsStr, 
    hasAuthSecret: true,
    publicEnabled,
    publicMaxInboxes,
    publicAllowedDomains
  }))
})

app.get('/docs', (c) => c.html(DocsPage({ session: false })))
app.get('/admin/docs', (c) => c.html(DocsPage({ session: true })))

app.get('/admin/inboxes', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
    const limit = 20
    const offset = (page - 1) * limit

    const { getAllEmails } = await import('./db/queries')
    const { total, totalMessages, emails: inboxes } = await getAllEmails(c.env.DB, limit, offset)

    return c.html(InboxesListPage({
      inboxes: inboxes as any[], totalInboxes: total, totalMessages, currentPage: page,
    }))
  } catch (err: any) {
    console.error('[inboxes] error:', err?.message)
    return c.html(InboxesListPage({ inboxes: [], totalInboxes: 0, totalMessages: 0, currentPage: 1 }))
  }
})

app.get('/admin/inbox/:addr', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  const addr = decodeURIComponent(c.req.param('addr'))

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
