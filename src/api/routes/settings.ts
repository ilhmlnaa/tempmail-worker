import { Hono } from 'hono'
import type { Env } from '../../db/queries'
import { updateSetting } from '../../db/queries'
import { requireAuth } from '../auth'

const settings = new Hono<{ Bindings: Env }>()

/** Worker berjalan di UTC, jadi nilai tanpa zona ditolak agar waktu tidak bergeser. */
export function parseInstant(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)
  if (!hasZone) return null
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

const saveSettingsHandler = async (c: any) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  
  const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
  
  if (body.mail_domains !== undefined) {
    await updateSetting(c.env.DB, 'mail_domains', String(body.mail_domains))
  }
  if (body.auth_password !== undefined && String(body.auth_password).trim() !== '') {
    await updateSetting(c.env.DB, 'auth_password', String(body.auth_password))
  }
  if (body.public_tempmail_enabled !== undefined) {
    await updateSetting(c.env.DB, 'public_tempmail_enabled', String(body.public_tempmail_enabled))
  }
  if (body.public_max_inboxes_per_session !== undefined) {
    await updateSetting(c.env.DB, 'public_max_inboxes_per_session', String(body.public_max_inboxes_per_session))
  }
  if (body.public_allowed_domains !== undefined) {
    await updateSetting(c.env.DB, 'public_allowed_domains', String(body.public_allowed_domains))
  }
  if (body.cleanup_enabled !== undefined) {
    await updateSetting(c.env.DB, 'cleanup_enabled', body.cleanup_enabled === 'enabled' ? 'enabled' : 'disabled')
  }
  if (body.cleanup_scope !== undefined) {
    await updateSetting(c.env.DB, 'cleanup_scope', body.cleanup_scope === 'all' ? 'all' : 'public')
  }
  if (body.cleanup_empty_hours !== undefined) {
    const hours = Math.floor(Number(body.cleanup_empty_hours))
    if (!Number.isInteger(hours) || hours < 1 || hours > 8760) return c.json({ error: 'invalid_cleanup_empty_hours' }, 400)
    await updateSetting(c.env.DB, 'cleanup_empty_hours', String(hours))
  }
  if (body.cleanup_retention_hours !== undefined) {
    const hours = Math.floor(Number(body.cleanup_retention_hours))
    if (!Number.isInteger(hours) || hours < 1 || hours > 8760) return c.json({ error: 'invalid_cleanup_retention_hours' }, 400)
    await updateSetting(c.env.DB, 'cleanup_retention_hours', String(hours))
  }
  if (body.timezone !== undefined) {
    const timezone = String(body.timezone)
    try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }) } catch { return c.json({ error: 'invalid_timezone' }, 400) }
    await updateSetting(c.env.DB, 'timezone', timezone)
  }
  if (body.time_format !== undefined) {
    await updateSetting(c.env.DB, 'time_format', body.time_format === '12' ? '12' : '24')
  }

  const hasMaintenanceSettings = Object.keys(body).some(key => key.startsWith('maintenance_'))
  if (hasMaintenanceSettings) {
    const startAt = String(body.maintenance_start_at || '')
    const endAt = String(body.maintenance_end_at || '')
    const start = startAt ? parseInstant(startAt) : null
    const end = endAt ? parseInstant(endAt) : null
    if (startAt && !start) {
      return c.json({ error: 'Maintenance start time must include a timezone offset.' }, 400)
    }
    if (endAt && !end) {
      return c.json({ error: 'Maintenance end time must include a timezone offset.' }, 400)
    }
    if (body.maintenance_enabled === 'enabled' && !start) {
      return c.json({ error: 'A valid maintenance start time is required.' }, 400)
    }
    if (start && end && start >= end) return c.json({ error: 'Maintenance end time must be after start time.' }, 400)

    const fields: Record<string, { key: string; max: number }> = {
      maintenance_banner_title: { key: 'maintenance_banner_title', max: 100 },
      maintenance_banner_message: { key: 'maintenance_banner_message', max: 300 },
      maintenance_page_title: { key: 'maintenance_page_title', max: 100 },
      maintenance_page_message: { key: 'maintenance_page_message', max: 500 },
    }
    for (const [field, rule] of Object.entries(fields)) {
      if (body[field] !== undefined) {
        const value = String(body[field]).trim()
        if (!value || value.length > rule.max) return c.json({ error: `${field} must be between 1 and ${rule.max} characters.` }, 400)
        await updateSetting(c.env.DB, rule.key, value)
      }
    }
    await updateSetting(c.env.DB, 'maintenance_enabled', body.maintenance_enabled === 'enabled' ? 'enabled' : 'disabled')
    await updateSetting(c.env.DB, 'maintenance_start_at', start ? start.toISOString() : '')
    await updateSetting(c.env.DB, 'maintenance_end_at', end ? end.toISOString() : '')
    await updateSetting(c.env.DB, 'maintenance_show_banner', body.maintenance_show_banner === 'disabled' ? 'disabled' : 'enabled')
    await updateSetting(c.env.DB, 'maintenance_allow_api', body.maintenance_allow_api === 'enabled' ? 'enabled' : 'disabled')
    await updateSetting(c.env.DB, 'maintenance_allow_inbox_reads', body.maintenance_allow_inbox_reads === 'enabled' ? 'enabled' : 'disabled')
  }
  
  return c.json({ ok: true })
}

settings.post('/api/settings', saveSettingsHandler)
settings.post('/dashboard/settings', saveSettingsHandler)

export default settings
