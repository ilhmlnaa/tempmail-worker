import type { Context, Next } from 'hono'
import type { Env } from '../db/queries'

const API_METHODS = new Set(['GET', 'POST', 'DELETE', 'OPTIONS'])
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

export function officialOrigins(env: Env): Set<string> {
  return new Set((env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean))
}

export function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function httpsRedirect(requestUrl: string): string | null {
  const url = new URL(requestUrl)
  if (url.protocol === 'https:' || isLocalHostname(url.hostname)) return null
  url.protocol = 'https:'
  return url.toString()
}

function applyCors(c: Context<{ Bindings: Env }>): void {
  const origin = c.req.header('origin')
  if (!origin || !officialOrigins(c.env).has(origin)) return

  c.header('Access-Control-Allow-Origin', origin)
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Max-Age', '86400')
  c.header('Vary', 'Origin', { append: true })
}

function applySecurityHeaders(c: Context<{ Bindings: Env }>): void {
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('Content-Security-Policy-Report-Only', CSP)
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  c.header('Cross-Origin-Opener-Policy', 'same-origin')
  c.header('X-Frame-Options', 'DENY')
}

export async function securityMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const redirect = httpsRedirect(c.req.url)
  if (redirect) return c.redirect(redirect, 301)

  applySecurityHeaders(c)
  if (c.req.path.startsWith('/api/')) {
    c.header('Cache-Control', 'no-store, private')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')

    if (!API_METHODS.has(c.req.method)) {
      c.header('Allow', 'GET, POST, DELETE, OPTIONS')
      return c.json({ error: 'method_not_allowed' }, 405)
    }

    const origin = c.req.header('origin')
    if (c.req.method === 'OPTIONS') {
      if (!origin || !officialOrigins(c.env).has(origin)) {
        return c.json({ error: 'origin_not_allowed' }, 403)
      }
      applyCors(c)
      return c.body(null, 204)
    }

    if (c.req.method === 'POST') {
      const contentType = c.req.header('content-type') || ''
      if (!contentType.toLowerCase().startsWith('application/json')) {
        return c.json({ error: 'unsupported_media_type' }, 415)
      }
    }
  }

  await next()

  if (c.req.path.startsWith('/api/')) applyCors(c)
}
