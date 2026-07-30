import type { Context } from 'hono'
import type { Env } from '../../db/queries'
import { createSession } from '../../db/queries'
import { getPublicSessionCookie, setPublicSessionCookie } from '../auth'

export function randomString(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function getOrCreatePublicSession(c: Context<{ Bindings: Env }>): Promise<string> {
  const sid = getPublicSessionCookie(c) || crypto.randomUUID()
  await createSession(c.env.DB, sid)
  if (!getPublicSessionCookie(c)) setPublicSessionCookie(c, sid)
  return sid
}
