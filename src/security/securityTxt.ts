import type { Env } from '../db/queries'

export function buildSecurityTxt(env: Env, origin: string, now = new Date()): string | null {
  const contact = env.SECURITY_CONTACT?.trim()
  if (!contact) return null

  const expires = new Date(now)
  expires.setUTCFullYear(expires.getUTCFullYear() + 1)
  const canonical = `${origin}/.well-known/security.txt`
  const policy = env.SECURITY_POLICY_URL?.trim()

  return [
    `Contact: ${contact}`,
    'Preferred-Languages: id, en',
    `Canonical: ${canonical}`,
    ...(policy ? [`Policy: ${policy}`] : []),
    `Expires: ${expires.toISOString().replace('.000Z', 'Z')}`,
    '',
  ].join('\n')
}
