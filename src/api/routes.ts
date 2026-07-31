import { Hono } from 'hono'
import type { Env } from '../db/queries'
import { requireAuth } from './auth'
import { getAllEmails, getApiKeys, getDomainStats, getAppMetrics, getAllSettings, parseMaintenanceConfig } from '../db/queries'

import publicApi from './routes/public'
import adminInboxes from './routes/admin-inboxes'
import apiKeys from './routes/api-keys'
import settings from './routes/settings'

const api = new Hono<{ Bindings: Env }>()

api.route('/api', publicApi)
api.route('/dashboard/inboxes', adminInboxes)
api.route('/dashboard/apikeys', apiKeys)
api.route('/', settings)

api.get('/api/admin/bootstrap', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  try {
    const [emailsData, keys, domainStats, metrics, settingsMap] = await Promise.all([
      getAllEmails(c.env.DB, 1, 0),
      getApiKeys(c.env.DB),
      getDomainStats(c.env.DB),
      getAppMetrics(c.env.DB),
      getAllSettings(c.env.DB)
    ])

    const getS = (k: string, fallback: string) => settingsMap[k] !== undefined ? settingsMap[k] : fallback

    const domainsStr = getS('mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')
    const publicEnabled = getS('public_tempmail_enabled', 'enabled')
    const publicMaxInboxes = parseInt(getS('public_max_inboxes_per_session', '5'), 10)
    const publicAllowedDomains = getS('public_allowed_domains', '*')

    const cleanupEnabled = getS('cleanup_enabled', 'enabled')
    const cleanupScope = getS('cleanup_scope', 'public')
    const cleanupEmptyHours = parseInt(getS('cleanup_empty_hours', '6'), 10)
    const cleanupRetentionHours = parseInt(getS('cleanup_retention_hours', '24'), 10)
    const lastCleanupAt = getS('cleanup_last_at', '')
    const lastCleanupDeleted = parseInt(getS('cleanup_last_deleted', '0'), 10)

    const timezone = getS('timezone', 'Asia/Jakarta')
    const timeFormat = getS('time_format', '24')

    const maintenance = parseMaintenanceConfig(settingsMap)

    return c.json({
      metrics: {
        totalInboxes: emailsData.total,
        totalMessages: emailsData.totalMessages,
        lifetimeInboxes: metrics.lifetimeInboxes,
        lifetimeMessages: metrics.lifetimeMessages,
      },
      keysCount: keys.length,
      domains: domainsStr.split(',').map(d => d.trim()).filter(Boolean),
      domainStats,
      settings: {
        mail_domains: domainsStr,
        public_tempmail_enabled: publicEnabled,
        public_max_inboxes_per_session: publicMaxInboxes,
        public_allowed_domains: publicAllowedDomains,
        cleanup_enabled: cleanupEnabled,
        cleanup_scope: cleanupScope,
        cleanup_empty_hours: cleanupEmptyHours,
        cleanup_retention_hours: cleanupRetentionHours,
        last_cleanup_at: lastCleanupAt,
        last_cleanup_deleted: lastCleanupDeleted,
        timezone,
        time_format: timeFormat
      },
      maintenance
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default api
