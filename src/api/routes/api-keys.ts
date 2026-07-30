import { Hono } from 'hono'
import type { Env } from '../../db/queries'
import { createApiKey, deleteApiKey, getApiKeys } from '../../db/queries'
import { hashApiKey, requireAuth } from '../auth'

const apiKeys = new Hono<{ Bindings: Env }>()

apiKeys.get('/', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  const keys = await getApiKeys(c.env.DB)
  return c.json(keys)
})

apiKeys.post('/', async (c) => {
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

apiKeys.delete('/:id', async (c) => {
  const sid = await requireAuth(c)
  if (typeof sid === 'object') return sid
  await deleteApiKey(c.env.DB, c.req.param('id'))
  return c.json({ ok: true })
})

export default apiKeys
