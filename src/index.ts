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

import api from './api/routes'
import { handleEmail } from './email/handler'
import { requireAuth, setSessionCookie, clearSessionCookie, verifyPassword } from './api/auth'
import { getSessionEmails, getAllEmails, linkEmailToSession, createSession, getSetting, getDomainStats, getAppMetrics, getMaintenanceConfig, deleteEmptyEmails, deleteOldEmails, updateSetting } from './db/queries'
import { LoginPage } from './web/public/login'
import { LandingPage } from './web/public/landing'
import { DashboardPage } from './web/admin/dashboard'
import { InboxesListPage } from './web/admin/inboxes-list'
import { DocsPage } from './web/public/docs'
import { SettingsPage } from './web/admin/settings'
import { MaintenanceSettingsPage } from './web/admin/maintenance-settings'
import { MaintenancePage } from './web/public/maintenance'
import { InboxPage } from './web/admin/inbox'
import { NotFoundPage } from './web/public/not-found'
import { css } from './web/styles'
import { logoBytes } from './web/logoData'
import type { Env } from './db/queries'
import { securityMiddleware } from './security/http'
import { buildSecurityTxt } from './security/securityTxt'

const app = new Hono<{ Bindings: Env }>()

app.use('*', securityMiddleware)

app.use('*', async (c, next) => {
  const isBypassedPath = c.req.path.startsWith('/admin') || c.req.path.startsWith('/auth') || c.req.path.startsWith('/vendor/') || c.req.path === '/setup' || c.req.path === '/styles.css' || c.req.path === '/logo.png' || c.req.path === '/.well-known/security.txt'
  if (!isBypassedPath) {
    const { getMaintenanceConfig } = await import('./db/queries')
    const config = await getMaintenanceConfig(c.env.DB)

    if (c.req.query('preview_maintenance') === 'true' && c.req.path === '/') {
      const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
      const timeFormat = await getSetting(c.env.DB, 'time_format', '24')
      return c.html(MaintenancePage({ config, timezone, timeFormat }))
    }

    if (config.status === 'active') {
      const isApi = c.req.path.startsWith('/api')
      if (isApi) {
        if (!config.allowApi && c.req.method !== 'OPTIONS') {
          if (c.req.path.endsWith('/messages') && config.allowInboxReads) {
          } else {
            const retryAfter = config.endAt ? Math.max(1, Math.ceil((new Date(config.endAt).getTime() - Date.now()) / 1000)) : 3600
            c.header('Retry-After', String(retryAfter))
            return c.json({ error: 'maintenance', message: config.pageMessage, estimatedReturn: config.endAt || null }, 503)
          }
        }
      } else {
        const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
        const timeFormat = await getSetting(c.env.DB, 'time_format', '24')
        const retryAfter = config.endAt ? Math.max(1, Math.ceil((new Date(config.endAt).getTime() - Date.now()) / 1000)) : 3600
        c.header('Retry-After', String(retryAfter))
        return c.html(MaintenancePage({ config, timezone, timeFormat }), 503)
      }
    }
  }
  await next()
})

// ── Static assets ─────────────────────────────────────────────
app.get('/styles.css', (c) => {
  return c.text(css, 200, { 'Content-Type': 'text/css; charset=utf-8' })
})

app.get('/logo.png', (c) => {
  return new Response(logoBytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
})

app.get('/.well-known/security.txt', (c) => {
  const content = buildSecurityTxt(c.env, new URL(c.req.url).origin)
  if (!content) return c.text('Security contact is not configured.', 404)
  return c.text(content, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  })
})



app.get('/setup', async (c) => {
  const { isAppConfigured } = await import('./api/auth')
  if (await isAppConfigured(c)) return c.redirect('/login')
  const { SetupPage } = await import('./web/public/login')
  return c.html(SetupPage({}))
})

app.post('/setup', async (c) => {
  const { isAppConfigured } = await import('./api/auth')
  if (await isAppConfigured(c)) return c.redirect('/login')
  
  const body = await c.req.parseBody()
  const password = (body as Record<string, string>).password || ''
  const confirm = (body as Record<string, string>).confirm || ''
  
  const { SetupPage } = await import('./web/public/login')
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
  const metrics = await getAppMetrics(c.env.DB)
  const config = await getMaintenanceConfig(c.env.DB)
  const retentionHours = parseInt(await getSetting(c.env.DB, 'cleanup_retention_hours', '24'), 10)
  const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
  const timeFormat = await getSetting(c.env.DB, 'time_format', '24')
  return c.html(LandingPage({ domains, turnstileSiteKey: c.env.TURNSTILE_SITE_KEY || '', metrics, retentionHours, timezone, timeFormat, maintenanceConfig: config }))
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

    const { getSetting, getApiKeys, getAllEmails, getDomainStats, getAppMetrics } = await import('./db/queries')
    const domainsStr = await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')
    const domains = domainsStr.split(',').map(d => d.trim()).filter(Boolean)
    
    const { total, totalMessages, emails: inboxes } = await getAllEmails(c.env.DB, limit, offset); 
    const apiKeys = await getApiKeys(c.env.DB)
    const domainStats = await getDomainStats(c.env.DB)
    const metrics = await getAppMetrics(c.env.DB)
    const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
    const timeFormat = await getSetting(c.env.DB, 'time_format', '24')

    return c.html(DashboardPage({
      inboxes: inboxes as any[], apiKeys: apiKeys as any[],
      domains, domainStats, totalInboxes: total, totalMessages, currentPage: page, metrics, timezone, timeFormat,
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
  const cleanupEnabled = await getSetting(c.env.DB, 'cleanup_enabled', 'enabled')
  const cleanupScope = await getSetting(c.env.DB, 'cleanup_scope', 'public')
  const cleanupEmptyHours = parseInt(await getSetting(c.env.DB, 'cleanup_empty_hours', '6'), 10)
  const cleanupRetentionHours = parseInt(await getSetting(c.env.DB, 'cleanup_retention_hours', '24'), 10)
  const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
  const timeFormat = await getSetting(c.env.DB, 'time_format', '24')
  const lastCleanupAt = await getSetting(c.env.DB, 'cleanup_last_at', '')
  const lastCleanupDeleted = parseInt(await getSetting(c.env.DB, 'cleanup_last_deleted', '0'), 10)
  
  return c.html(SettingsPage({ 
    domains: domainsStr, 
    hasAuthSecret: true,
    publicEnabled,
    publicMaxInboxes,
    publicAllowedDomains,
    cleanupEnabled,
    cleanupScope,
    cleanupEmptyHours,
    cleanupRetentionHours,
    timezone,
    timeFormat,
    lastCleanupAt,
    lastCleanupDeleted
  }))
})

app.get('/docs', (c) => c.html(DocsPage({ session: false })))
app.get('/admin/docs', (c) => c.html(DocsPage({ session: true })))

app.get('/admin/inboxes', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
    const search = (c.req.query('q') || '').trim().slice(0, 100)
    const requestedFilter = c.req.query('messages') || 'all'
    const messageFilter = ['all', 'empty', 'has-messages'].includes(requestedFilter)
      ? requestedFilter as 'all' | 'empty' | 'has-messages'
      : 'all'
    const limit = 20
    const offset = (page - 1) * limit

    const { getAllEmails, searchEmails } = await import('./db/queries')
    const stats = await getAllEmails(c.env.DB, 1, 0)
    const filtered = await searchEmails(c.env.DB, search, messageFilter, limit, offset)

    const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
    const timeFormat = await getSetting(c.env.DB, 'time_format', '24')
    return c.html(InboxesListPage({
      inboxes: filtered.emails as any[],
      totalInboxes: stats.total,
      totalMessages: stats.totalMessages,
      filteredTotal: filtered.total,
      currentPage: page,
      search,
      messageFilter,
      timezone,
      timeFormat,
    }))
  } catch (err: any) {
    console.error('[inboxes] error:', err?.message)
    return c.html(InboxesListPage({ inboxes: [], totalInboxes: 0, totalMessages: 0, filteredTotal: 0, currentPage: 1, search: '', messageFilter: 'all' }))
  }
})

app.get('/admin/inbox/:addr', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  const addr = decodeURIComponent(c.req.param('addr'))

  const { getMessages } = await import('./db/queries')
  const msgs = await getMessages(c.env.DB, addr)

  const timezone = await getSetting(c.env.DB, 'timezone', 'Asia/Jakarta')
  const timeFormat = await getSetting(c.env.DB, 'time_format', '24')
  return c.html(InboxPage({ address: addr, messages: msgs as any[], timezone, timeFormat }))
})

app.notFound((c) => {
  const session = c.req.path.startsWith('/admin')
  return c.html(NotFoundPage({ session }), 404)
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

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    if (await getSetting(env.DB, 'cleanup_enabled', 'enabled') !== 'enabled') return
    const scope = await getSetting(env.DB, 'cleanup_scope', 'public') === 'all' ? 'all' : 'public'
    const emptyHours = parseInt(await getSetting(env.DB, 'cleanup_empty_hours', '6'), 10)
    const retentionHours = parseInt(await getSetting(env.DB, 'cleanup_retention_hours', '24'), 10)
    const deletedEmpty = await deleteEmptyEmails(env.DB, scope, emptyHours)
    const deletedOld = await deleteOldEmails(env.DB, scope, retentionHours)
    await updateSetting(env.DB, 'cleanup_last_at', new Date().toISOString())
    await updateSetting(env.DB, 'cleanup_last_deleted', String(deletedEmpty + deletedOld))
  },
}
