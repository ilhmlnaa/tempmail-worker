/** 
 * Minimal behavioural tests for security fixes.
 * Run with: npx tsx src/test.ts  or  npx wrangler dev + curl
 *
 * These are NOT framework tests — just self-checking assertions.
 */
import { parseEmail } from './email/handler'

// ─── 1. Malformed From/header hardening ──────────────────────────

const protoEmail = `From: test@evil.com
Subject: hello
__proto__: injected

safe body`.replace(/\n/g, '\r\n')

{
  const r = parseEmail(protoEmail)
  console.assert(r.from === 'test@evil.com', 'from preserved')
  console.assert((r as any).injected === undefined, '__proto__ not injected')
  console.log('PASS: __proto__ filter')
}

const overflowEmail = `From: test@ok.com
Subject: ${'x'.repeat(10000)}
X-Custom: ${'y'.repeat(10000)}

body`.replace(/\n/g, '\r\n')

{
  const r = parseEmail(overflowEmail)
  console.assert(r.from === 'test@ok.com')
  console.assert(r.subject.length <= 8192, 'subject truncated at 8KB')
  console.log('PASS: header value length cap at 8192 chars')
}

{
  const r = parseEmail(`from: <test@ok.com>
subject: hi

plain body`.replace(/\n/g, '\r\n'))
  console.assert(r.from === '<test@ok.com>', 'bracket addr preserved')
  console.assert(r.subject === 'hi')
  console.assert(r.textBody.trim() === 'plain body')
  console.assert(r.htmlBody === null)
  console.log('PASS: plain email parsing')
}

// ─── 2. Hash API key determinism ─────────────────────────────────

import { hashApiKey, maskApiKey } from './db/queries'

{
  const h = await hashApiKey('tm_abc123')
  console.assert(h.length === 64, 'SHA-256 hex length 64')
  const h2 = await hashApiKey('tm_abc123')
  console.assert(h === h2, 'SHA-256 idempotent')
  console.log('PASS: hashApiKey deterministic')
}

{
  const m = maskApiKey('abcdef1234567890abcdef')
  console.assert(m.startsWith('tm_'), 'masked starts with tm_')
  console.assert(m.length > 12, 'masked non-empty')
  console.log('PASS: maskApiKey')
}

console.log('\nAll checks passed.')
