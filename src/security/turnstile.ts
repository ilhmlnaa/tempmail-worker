import type { Context } from 'hono'
import type { Env } from '../db/queries'

interface TurnstileResponse {
  success: boolean
  hostname?: string
  'error-codes'?: string[]
}

export function isTurnstileEnabled(env: Env): boolean {
  return !!env.TURNSTILE_SECRET_KEY?.trim() && !!env.TURNSTILE_SITE_KEY?.trim()
}

export function requiresTurnstile(inboxCount: number): boolean {
  return inboxCount >= 3
}

export async function verifyTurnstileToken(
  c: Context<{ Bindings: Env }>,
  token: string | undefined,
): Promise<boolean> {
  const secret = c.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) return true
  if (!token) return false

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  const ip = c.req.header('cf-connecting-ip')
  if (ip) form.append('remoteip', ip)

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    if (!response.ok) return false
    const result = await response.json<TurnstileResponse>()
    return result.success
  } catch {
    return false
  }
}
