import { Hono } from 'hono'
import type { Env } from '../../db/queries'
import { updateSetting } from '../../db/queries'
import { requireAuth } from '../auth'

const settings = new Hono<{ Bindings: Env }>()

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
  
  return c.json({ ok: true })
}

settings.post('/api/settings', saveSettingsHandler)
settings.post('/dashboard/settings', saveSettingsHandler)

export default settings
