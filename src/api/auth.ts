import type { Context } from 'hono'
import type { Env } from '../db/queries'

const SESSION_COOKIE = 'tm_sid'

export function requireAuth(c: Context<{ Bindings: Env }>) {
  const sid = c.req.header('x-session-id') || getCookie(c, SESSION_COOKIE)
  if (!sid) {
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

export function verifyPassword(c: Context<{ Bindings: Env }>, password: string): boolean {
  return password === c.env.AUTH_SECRET
}

function getCookie(c: Context, name: string): string | null {
  const cookie = c.req.header('cookie')
  if (!cookie) return null
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
