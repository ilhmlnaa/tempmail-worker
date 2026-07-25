import type { Context } from 'hono'
import type { Env } from '../db/queries'
import { getSetting } from '../db/queries'

const SESSION_COOKIE = 'tm_sid'

export async function requireAuth(c: Context<{ Bindings: Env }>) {
  const sid = c.req.header('x-session-id') || getCookie(c, SESSION_COOKIE)
  if (!sid) {
    if (c.req.header('accept')?.includes('text/html')) {
      return c.redirect('/login')
    }
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const { isValidAdminSession } = await import('../db/queries')
  if (!(await isValidAdminSession(c.env.DB, sid))) {
    clearSessionCookie(c)
    if (c.req.header('accept')?.includes('text/html')) {
      return c.redirect('/login')
    }
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return sid
}

export function setSessionCookie(c: Context<{ Bindings: Env }>, sid: string) {
  c.header('Set-Cookie', `${SESSION_COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`)
}

export function clearSessionCookie(c: Context<{ Bindings: Env }>) {
  c.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

export async function verifyPassword(c: Context<{ Bindings: Env }>, password: string): Promise<boolean> {
  const expected = await getSetting(c.env.DB, 'auth_password', c.env.AUTH_SECRET || '')
  return password === expected
}

// API key hashing lives in db/queries.ts (single source of truth).
export { hashApiKey } from '../db/queries'

// ─── Setup detection ──────────────────────────────────────────

export async function isAppConfigured(c: Context<{ Bindings: Env }>): Promise<boolean> {
  const password = await getSetting(c.env.DB, 'auth_password', '')
  return password.trim() !== '' || !!(c.env.AUTH_SECRET && c.env.AUTH_SECRET.trim() !== '')
}

// ─── Cookie helper ────────────────────────────────────────────

function getCookie(c: Context, name: string): string | null {
  const cookie = c.req.header('cookie')
  if (!cookie) return null
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
