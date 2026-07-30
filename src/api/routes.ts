import { Hono } from 'hono'
import type { Env } from '../db/queries'
import { isValidSession, isEmailLinkedToSession, getEmailRecord, deleteEmail } from '../db/queries'
import { getPublicSessionCookie, requireAuth, setPublicSessionCookie, hashApiKey } from './auth'
import { clientIp, enforceRateLimits, RATE_LIMITS } from '../security/rateLimit'
import { sanitizeHtmlEmail } from '../email/sanitizer'
import { generateAnimeLocalPart } from '../email/address-generator'

import {
  createEmail, getMessages, emailExists, createSession,
  linkEmailToSession, unlinkEmailFromSession, getAllEmails,
  getApiKeyByValue, getApiKeyInboxCount, getApiKeyMessageCount,
  getApiKeys, createApiKey, deleteApiKey, getSetting, updateSetting
} from '../db/queries'


const api = new Hono<{ Bindings: Env }>()

function getDomains(env: Env): string[] {
  return (env.MAIL_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean)
}

function randomString(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function getOrCreatePublicSession(c: Parameters<typeof getPublicSessionCookie>[0]): Promise<string> {
  const sid = getPublicSessionCookie(c) || crypto.randomUUID()
  await createSession(c.env.DB, sid)
  if (!getPublicSessionCookie(c)) setPublicSessionCookie(c, sid)
  return sid
}

api.get('/api/session', async (c) => {
  const limited = await enforceRateLimits(c, [
    { rule: RATE_LIMITS.sessionByIp, identifier: clientIp(c) },
  ])
  if (limited) return limited

  await getOrCreatePublicSession(c)
  return c.json({ expiresAt: new Date(Date.now() + 2592000000).toISOString() })
})

api.post('/api/session', async (c) => {
  const limited = await enforceRateLimits(c, [
    { rule: RATE_LIMITS.sessionByIp, identifier: clientIp(c) },
  ])
  if (limited) return limited

  await getOrCreatePublicSession(c)
  return c.json({ expiresAt: new Date(Date.now() + 2592000000).toISOString() })
})

api.get('/api/session/inboxes', async (c) => {
  const sid = getPublicSessionCookie(c)
  if (!sid || !(await isValidSession(c.env.DB, sid))) return c.json([])
  const { getSessionEmails } = await import('../db/queries')
  return c.json(await getSessionEmails(c.env.DB, sid))
})

api.post('/api/inboxes', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { domain?: string; address?: string; turnstileToken?: string }
  let count = 0
  let sid: string | null = null
  const authHeader = c.req.header('Authorization')
  let apiKeyRecord = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    apiKeyRecord = await getApiKeyByValue(c.env.DB, token)
    if (!apiKeyRecord) return c.json({ error: 'Invalid API Key' }, 401)
  } else {
    const ipChecks: import('../security/rateLimit').RateLimitCheck[] = [
      { rule: RATE_LIMITS.inboxByIp, identifier: clientIp(c) },
    ]
    if (!body.turnstileToken) {
      ipChecks.unshift({ rule: RATE_LIMITS.inboxCooldownByIp, identifier: clientIp(c) })
    }
    const limited = await enforceRateLimits(c, ipChecks)
    if (limited) return limited

    const publicEnabled = await getSetting(c.env.DB, 'public_tempmail_enabled', 'enabled')
    if (publicEnabled === 'disabled') {
      return c.json({ error: 'Public temporary email creation is currently disabled by administrator.' }, 403)
    }

    sid = await getOrCreatePublicSession(c)
    const { getSessionInboxCount } = await import('../db/queries')
    count = await getSessionInboxCount(c.env.DB, sid)
    
    const maxPublicInboxes = parseInt(await getSetting(c.env.DB, 'public_max_inboxes_per_session', '5'), 10)
    if (maxPublicInboxes > 0 && count >= maxPublicInboxes) {
      return c.json({ error: `Public inbox limit reached (max: ${maxPublicInboxes} per session)` }, 429)
    }
  }

  const domains = (await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')).split(',').map(d => d.trim())
  let domain = (body.domain && domains.includes(body.domain)) ? body.domain : (domains[0] || 'voidmail.my.id')

  if (!apiKeyRecord) {
    const { isTurnstileEnabled, requiresTurnstile, verifyTurnstileToken } = await import('../security/turnstile')
    if (isTurnstileEnabled(c.env) && requiresTurnstile(count)) {
      if (!body.turnstileToken || !(await verifyTurnstileToken(c, body.turnstileToken))) {
        return c.json({ error: 'Please complete the captcha to create more inboxes.', requireCaptcha: true }, 403)
      }
    }
  }

  if (!apiKeyRecord) {
    const sessionChecks: import('../security/rateLimit').RateLimitCheck[] = [
      { rule: RATE_LIMITS.inboxBySession, identifier: sid! },
      { rule: RATE_LIMITS.inboxByDomain, identifier: domain },
      { rule: RATE_LIMITS.inboxGlobal, identifier: 'global' },
    ]
    if (!body.turnstileToken) {
      sessionChecks.unshift({ rule: RATE_LIMITS.inboxCooldownBySession, identifier: sid! })
    }
    const limited = await enforceRateLimits(c, sessionChecks)
    if (limited) return limited

    const publicAllowedDomainsStr = await getSetting(c.env.DB, 'public_allowed_domains', '*')
    if (publicAllowedDomainsStr !== '*') {
      const allowedPublicDomains = publicAllowedDomainsStr.split(',').map(d => d.trim()).filter(Boolean)
      if (!allowedPublicDomains.includes(domain)) {
        return c.json({ error: `Domain @${domain} is not permitted for public temp mail.` }, 403)
      }
    }
  }
  
  if (apiKeyRecord) {
    if (apiKeyRecord.permittedDomains !== '*') {
      const allowed = apiKeyRecord.permittedDomains.split(',').map(d => d.trim())
      if (!allowed.includes(domain)) {
        if (allowed.length > 0) domain = allowed[0]
        else return c.json({ error: 'API key has no valid domain permissions' }, 403)
      }
    }
    if (apiKeyRecord.maxInboxes > 0) {
      const currentInboxCount = await getApiKeyInboxCount(c.env.DB, apiKeyRecord.id)
      if (currentInboxCount >= apiKeyRecord.maxInboxes) {
        return c.json({ error: `Inbox limit reached for this API key (max: ${apiKeyRecord.maxInboxes})` }, 429)
      }
    }
  }

  let address = ''
  if (body.address) {
    const clean = body.address.toLowerCase().replace(/[^a-z0-9._-]/g, '')
    if (clean) address = `${clean}@${domain}`
  }

  // If not provided or completely stripped, generate anime name pattern
  if (!address) {
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = `${generateAnimeLocalPart()}@${domain}`
      if (!(await emailExists(c.env.DB, candidate))) {
        address = candidate
        break
      }
    }
    // Fallback if extremely unlucky (should be very rare with 19k names * 256 suffixes)
    if (!address) address = `${randomString(12)}@${domain}`
  }

  if (!apiKeyRecord && await emailExists(c.env.DB, address)) {
    return c.json({ error: 'This inbox address is already in use. Choose another address.' }, 409)
  }

  await createEmail(c.env.DB, address, domain, apiKeyRecord ? apiKeyRecord.id : null)

  if (sid && !(await linkEmailToSession(c.env.DB, sid, address))) {
    return c.json({ error: 'This inbox address is already owned by another session.' }, 409)
  }

  return c.json({ address })
})

api.get('/api/inboxes/:addr/messages', async (c) => {
  const addr = decodeURIComponent(c.req.param('addr'))
  const email = addr.includes('@') ? addr : `${addr}@${(await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'voidmail.my.id')).split(',')[0].trim()}`
  
  const authHeader = c.req.header('Authorization')
  let allowed = false
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const apiKeyRecord = await getApiKeyByValue(c.env.DB, token)
    if (!apiKeyRecord) return c.json({ error: 'Invalid API Key' }, 401)
    
    const inbox = await getEmailRecord(c.env.DB, email)
    allowed = !!inbox && inbox.api_key_id === apiKeyRecord.id
    
    if (apiKeyRecord.maxMessages > 0) {
      const currentMsgCount = await getApiKeyMessageCount(c.env.DB, apiKeyRecord.id)
      if (currentMsgCount >= apiKeyRecord.maxMessages) {
        return c.json({ error: `Message limit reached for this API key (max: ${apiKeyRecord.maxMessages})` }, 429)
      }
    }
  } else {
    const sid = getPublicSessionCookie(c)
    if (sid) {
      const limited = await enforceRateLimits(c, [
        { rule: RATE_LIMITS.messagesBySession, identifier: sid },
        { rule: RATE_LIMITS.messagesByIp, identifier: clientIp(c) },
      ])
      if (limited) return limited
    }
    allowed = !!sid && await isValidSession(c.env.DB, sid) && await isEmailLinkedToSession(c.env.DB, sid, email)
  }
  
  if (!allowed) return c.json({ error: 'Forbidden' }, 403)

  const msgs = await getMessages(c.env.DB, email)
  const allowExternalImages = c.req.query('images') === 'proxy'
  const sanitizedMessages = msgs.map((message: any) => ({
    ...message,
    html: message.html
      ? sanitizeHtmlEmail(message.html, {
          allowExternalImages,
          imgCdnBaseUrl: c.env.IMGCDN_BASE_URL,
        })
      : null,
  }))
  return c.json(sanitizedMessages)
})

api.delete('/api/inboxes/:addr', async (c) => {
  const addr = decodeURIComponent(c.req.param('addr'))
  const auth = c.req.header('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const key = await getApiKeyByValue(c.env.DB, auth.slice(7))
    const inbox = await getEmailRecord(c.env.DB, addr)
    if (!key || !inbox || inbox.api_key_id !== key.id) return c.json({ error: 'Forbidden' }, 403)
    await deleteEmail(c.env.DB, addr)
    return c.json({ ok: true })
  }
  const sid = getPublicSessionCookie(c)
  if (!sid || !(await isValidSession(c.env.DB, sid)) || !(await isEmailLinkedToSession(c.env.DB, sid, addr))) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await unlinkEmailFromSession(c.env.DB, sid, addr)
  return c.json({ ok: true })
})

api.get('/dashboard/inboxes', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const inboxes = await getAllEmails(c.env.DB)
  return c.json(inboxes)
})

api.post('/dashboard/inboxes', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  const body = (await c.req.json().catch(() => ({}))) as { local?: string; domain?: string }
  const domains = (await getSetting(c.env.DB, 'mail_domains', c.env.MAIL_DOMAINS || 'example.com')).split(',').map(d => d.trim())
  const domain = (body.domain && domains.includes(body.domain)) ? body.domain : (domains[0] || 'example.com')

  let address = ''
  if (body.local) {
    const clean = body.local.toLowerCase().replace(/[^a-z0-9._-]/g, '')
    if (clean) address = `${clean}@${domain}`
  }
  
  if (!address) {
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = `${generateAnimeLocalPart()}@${domain}`
      if (!(await emailExists(c.env.DB, candidate))) {
        address = candidate
        break
      }
    }
    if (!address) address = `${randomString(12)}@${domain}`
  }

  const exists = await emailExists(c.env.DB, address)
  if (exists && body.local) {
    await linkEmailToSession(c.env.DB, sid, address)
    return c.json({ address, linked: true })
  }

  await createEmail(c.env.DB, address, domain)
  await linkEmailToSession(c.env.DB, sid, address)
  return c.json({ address, linked: false }, 201)
})

api.delete('/dashboard/inboxes/:addr', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const addr = decodeURIComponent(c.req.param('addr'))
  await deleteEmail(c.env.DB, addr)
  return c.json({ ok: true })
})

api.post('/dashboard/inboxes/bulk-delete', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  const body = (await c.req.json().catch(() => ({}))) as { mode?: string; days?: number }
  const { deleteEmptyEmails, deleteOldEmails } = await import('../db/queries')

  if (body.mode === 'empty') {
    return c.json({ ok: true, deleted: await deleteEmptyEmails(c.env.DB) })
  }

  if (body.mode === 'older-than') {
    const days = Math.floor(Number(body.days))
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return c.json({ error: 'days must be an integer between 1 and 365' }, 400)
    }
    return c.json({ ok: true, deleted: await deleteOldEmails(c.env.DB, days) })
  }

  return c.json({ error: 'unsupported_bulk_delete_mode' }, 400)
})

api.get('/dashboard/inboxes/:addr/messages', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const addr = decodeURIComponent(c.req.param('addr'))
  const msgs = await getMessages(c.env.DB, addr)
  return c.json(msgs)
})

api.get('/dashboard/apikeys', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const keys = await getApiKeys(c.env.DB)
  return c.json(keys)
})

api.post('/dashboard/apikeys', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  
  const body = (await c.req.json().catch(() => ({}))) as { domains?: string; maxInboxes?: number; maxMessages?: number }
  const permitted = body.domains && body.domains.trim() ? body.domains.trim() : '*'
  const maxInboxes = Math.max(0, Number(body.maxInboxes || 0))
  const maxMessages = Math.max(0, Number(body.maxMessages || 0))
  const keyStr = 'tm_' + crypto.randomUUID().replace(/-/g, '')
  
  await createApiKey(c.env.DB, crypto.randomUUID(), await hashApiKey(keyStr), permitted, maxInboxes, maxMessages)
  return c.json({ key: keyStr, permittedDomains: permitted, maxInboxes, maxMessages }, 201)
})

api.delete('/dashboard/apikeys/:id', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  await deleteApiKey(c.env.DB, c.req.param('id'))
  return c.json({ ok: true })
})

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
  
  return c.json({ ok: true })
}

api.post('/api/settings', saveSettingsHandler)
api.post('/dashboard/settings', saveSettingsHandler)

export default api

