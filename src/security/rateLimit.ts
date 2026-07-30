import type { Context } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import type { Env } from '../db/queries'

import { logSecurityEvent } from './logger'

interface RateLimitRule {
  scope: string
  limit: number
  windowSeconds: number
  message: string
}

export const RATE_LIMITS = {
  sessionByIp: { scope: 'session:ip', limit: 30, windowSeconds: 60, message: 'Too many session requests.' },
  inboxByIp: { scope: 'inbox:ip', limit: 10, windowSeconds: 600, message: 'Too many inbox creation requests.' },
  inboxBySession: { scope: 'inbox:session', limit: 10, windowSeconds: 600, message: 'Too many inbox creation requests for this session.' },
  inboxCooldownByIp: { scope: 'inbox:cooldown:ip', limit: 1, windowSeconds: 2, message: 'Please wait before creating another inbox.' },
  inboxCooldownBySession: { scope: 'inbox:cooldown:session', limit: 1, windowSeconds: 2, message: 'Please wait before creating another inbox.' },
  inboxByDomain: { scope: 'inbox:domain', limit: 100, windowSeconds: 60, message: 'This domain is temporarily at capacity.' },
  inboxGlobal: { scope: 'inbox:global', limit: 300, windowSeconds: 60, message: 'Inbox creation is temporarily at capacity.' },
  messagesByIp: { scope: 'messages:ip', limit: 120, windowSeconds: 60, message: 'Too many message polling requests.' },
  messagesBySession: { scope: 'messages:session', limit: 30, windowSeconds: 60, message: 'Too many message polling requests.' },
} as const satisfies Record<string, RateLimitRule>

export interface RateLimitCheck {
  identifier: string
  rule: RateLimitRule
}

export function clientIp(c: Context<{ Bindings: Env }>): string {
  return c.req.header('cf-connecting-ip')?.trim() || 'unknown'
}

async function hashIdentifier(identifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identifier))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function rateLimitBucket(check: RateLimitCheck, now: number) {
  const windowStart = Math.floor(now / check.rule.windowSeconds) * check.rule.windowSeconds
  return {
    key: `${check.rule.scope}:${windowStart}:${await hashIdentifier(check.identifier)}`,
    resetAt: windowStart + check.rule.windowSeconds,
  }
}

async function consume(db: D1Database, check: RateLimitCheck, now: number): Promise<number | null> {
  const { key, resetAt } = await rateLimitBucket(check, now)

  await db.prepare(`
    INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `).bind(key, resetAt).run()

  const row = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>()
  return Number(row?.count || 0) > check.rule.limit ? Math.max(1, resetAt - now) : null
}

export async function enforceRateLimits(
  c: Context<{ Bindings: Env }>,
  checks: RateLimitCheck[],
): Promise<Response | null> {
  const now = Math.floor(Date.now() / 1000)

  for (const check of checks) {
    const retryAfter = await consume(c.env.DB, check, now)
    if (retryAfter !== null) {
      c.header('Retry-After', String(retryAfter))
      c.header('Cache-Control', 'no-store')
      logSecurityEvent('inbox_rate_limited', { scope: check.rule.scope })
      return c.json({
        error: 'rate_limit_exceeded',
        message: check.rule.message,
        retryAfter,
      }, 429)
    }
  }

  if (crypto.getRandomValues(new Uint8Array(1))[0] === 0 && c.executionCtx) {
    c.executionCtx.waitUntil(cleanupExpiredRateLimits(c.env.DB))
  }

  return null
}

export async function cleanupExpiredRateLimits(db: D1Database): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now).run()
}
