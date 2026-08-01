import { Hono } from 'hono'
import type { Env } from '../../db/queries'
import { createEmail, deleteEmail, emailExists, getAllEmails, getMessages, getSetting, linkEmailToSession } from '../../db/queries'
import { generateAnimeLocalPart } from '../../email/address-generator'
import { sanitizeHtmlEmail } from '../../email/sanitizer'
import { requireAuth } from '../auth'
import { randomString } from './shared'

const adminInboxes = new Hono<{ Bindings: Env }>()

adminInboxes.get('/', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const inboxes = await getAllEmails(c.env.DB)
  return c.json(inboxes)
})

adminInboxes.post('/', async (c) => {
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

  await createEmail(c.env.DB, address, domain, null, 'admin')
  await linkEmailToSession(c.env.DB, sid, address)
  return c.json({ address, linked: false }, 201)
})

adminInboxes.delete('/:addr', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const addr = decodeURIComponent(c.req.param('addr'))
  await deleteEmail(c.env.DB, addr)
  return c.json({ ok: true })
})

adminInboxes.post('/bulk-delete', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid

  const body = (await c.req.json().catch(() => ({}))) as { mode?: string; days?: number }
  const { deleteEmptyEmails, deleteOldEmails } = await import('../../db/queries')

  if (body.mode === 'empty') {
    return c.json({ ok: true, deleted: await deleteEmptyEmails(c.env.DB, 'all', 0) })
  }

  if (body.mode === 'older-than') {
    const days = Math.floor(Number(body.days))
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return c.json({ error: 'days must be an integer between 1 and 365' }, 400)
    }
    return c.json({ ok: true, deleted: await deleteOldEmails(c.env.DB, 'all', days * 24) })
  }

  return c.json({ error: 'unsupported_bulk_delete_mode' }, 400)
})

adminInboxes.get('/:addr/messages', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const addr = decodeURIComponent(c.req.param('addr'))
  const msgs = await getMessages(c.env.DB, addr)
  const allowExternalImages = c.req.query('images') === 'proxy'
  return c.json(msgs.map((message: any) => ({
    ...message,
    html: message.html
      ? sanitizeHtmlEmail(message.html, {
          allowExternalImages,
          imgCdnBaseUrl: c.env.IMGCDN_BASE_URL,
        })
      : null,
  })))
})

export default adminInboxes
