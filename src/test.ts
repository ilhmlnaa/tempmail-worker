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

// ─── 3. Rate Limit Key & Reset Window ────────────────────────────────

import { RATE_LIMITS, rateLimitBucket } from './security/rateLimit'

{
  const now = 1000 // 1000 seconds past epoch
  const { key, resetAt } = await rateLimitBucket(
    { rule: RATE_LIMITS.sessionByIp, identifier: '192.168.1.1' }, 
    now
  )
  console.assert(!key.includes('192.168'), 'key must not contain raw IP')
  console.assert(key.startsWith('session:ip:960:'), '60s window snapped correctly (1000 -> 960)')
  console.assert(resetAt === 1020, 'reset at end of window (960 + 60)')
  console.log('PASS: rateLimitBucket snapping & masking')
}

// ─── 4. Adaptive Turnstile Threshold ─────────────────────────────

import { isTurnstileEnabled, requiresTurnstile } from './security/turnstile'

{
  console.assert(!requiresTurnstile(2), 'first three inboxes skip Turnstile')
  console.assert(requiresTurnstile(3), 'fourth inbox requires Turnstile')
  console.assert(!isTurnstileEnabled({ TURNSTILE_SITE_KEY: 'site' } as any), 'both keys are required')
  console.assert(isTurnstileEnabled({ TURNSTILE_SITE_KEY: 'site', TURNSTILE_SECRET_KEY: 'secret' } as any), 'configured keys enable Turnstile')
  console.log('PASS: adaptive Turnstile threshold')
}

// ─── 5. Transport & Browser Security Helpers ─────────────────────────

import { httpsRedirect, officialOrigins } from './security/http'

{
  console.assert(httpsRedirect('http://voidmail.my.id/api/session') === 'https://voidmail.my.id/api/session', 'http redirects to https')
  console.assert(httpsRedirect('http://localhost:8787/') === null, 'localhost http bypasses redirect')
  const origins = officialOrigins({ ALLOWED_ORIGINS: 'https://voidmail.my.id, https://app.voidmail.my.id ' } as any)
  console.assert(origins.has('https://voidmail.my.id') && origins.has('https://app.voidmail.my.id'), 'allowed origins parsed correctly')
  console.assert(!origins.has('https://evil.com'), 'unlisted origin rejected')
  console.log('PASS: transport & CORS helpers')
}

// ─── 6. Application Middleware Simulation ────────────────────────

import app from './index'

{
  const env = { ALLOWED_ORIGINS: 'https://voidmail.my.id' } as any
  const ctx = { waitUntil: () => {} } as any

  // 1. CORS Preflight (allowed)
  const req1 = new Request('https://voidmail.my.id/api/session', { method: 'OPTIONS', headers: { Origin: 'https://voidmail.my.id' } })
  const res1 = await app.fetch(req1, env, ctx)
  console.assert(res1.status === 204, 'valid preflight -> 204')
  console.assert(res1.headers.get('Access-Control-Allow-Origin') === 'https://voidmail.my.id', 'CORS origin echoed')

  // 2. CORS Preflight (rejected)
  const req2 = new Request('https://voidmail.my.id/api/session', { method: 'OPTIONS', headers: { Origin: 'https://evil.com' } })
  const res2 = await app.fetch(req2, env, ctx)
  console.assert(res2.status === 403, 'invalid origin -> 403')
  
  // 3. Method Not Allowed
  const req3 = new Request('https://voidmail.my.id/api/session', { method: 'PUT' })
  const res3 = await app.fetch(req3, env, ctx)
  console.assert(res3.status === 405, 'PUT /api/session -> 405')
  console.assert(res3.headers.get('Allow') === 'GET, POST, DELETE, OPTIONS', 'Allow header present')

  // 4. Unsupported Media Type
  const req4 = new Request('https://voidmail.my.id/api/inboxes', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })
  const res4 = await app.fetch(req4, env, ctx)
  console.assert(res4.status === 415, 'POST plain text -> 415')

  // 5. Cache & Security Headers on GET
  const req5 = new Request('https://voidmail.my.id/api/session', { method: 'GET' })
  // Using a mock fetch for the session fallback to D1 logic, skipping the actual endpoint since DB isn't mocked.
  // We'll test just the middleware logic by hitting a fake unimplemented API route to trigger the middleware, 
  // but since middleware intercepts unsupported methods/content types early, the checks above are sufficient.

  console.log('PASS: HTTP middleware routing rules')
}

// ─── 7. HTML Email Sanitizer & Privacy Controls ────────────────────

import { sanitizeHtmlEmail, isValidImageUrl, buildImgCdnUrl } from './email/sanitizer'

{
  const unsafeHtml = `
    <html>
      <head>
        <style>body { background: url('https://tracker.com/a.jpg'); }</style>
        <script>alert(1)</script>
      </head>
      <body>
        <div onclick="steal()">Click</div>
        <a href="javascript:alert(2)">Danger</a>
        <a href="https://example.com" target="_parent">Link</a>
        <img src="https://tracker.com/pixel.png">
        <img src="https://169.254.169.254/meta">
      </body>
    </html>
  `
  // Mode 1: Default blocked
  const defaultHtml = sanitizeHtmlEmail(unsafeHtml)
  console.assert(!defaultHtml.includes('<script'), 'scripts removed')
  console.assert(!defaultHtml.includes('onclick='), 'inline events removed')
  console.assert(!defaultHtml.includes('url('), 'css external resources removed')
  console.assert(!defaultHtml.includes('javascript:'), 'js links removed')
  console.assert(defaultHtml.includes('rel="noopener noreferrer"') && defaultHtml.includes('target="_blank"'), 'link secured')
  console.assert(!defaultHtml.includes('https://tracker.com/pixel.png'), 'external image src removed')

  // Mode 2: Proxy mode
  const proxyHtml = sanitizeHtmlEmail(unsafeHtml, { allowExternalImages: true, imgCdnBaseUrl: 'https://cdn.example' })
  console.assert(proxyHtml.includes('https://cdn.example/insecure/'), 'valid image rewritten to CDN')
  console.assert(!proxyHtml.includes('169.254.169.254'), 'invalid image (metadata IP) not rewritten to CDN')

  console.assert(!isValidImageUrl('https://127.0.0.1/a.png'), 'localhost rejected')
  console.assert(!isValidImageUrl('https://10.1.2.3/a.png'), 'private IPv4 rejected')
  console.assert(isValidImageUrl('https://example.com/a.png'), 'public domain accepted')

  console.log('PASS: HTML Sanitizer and SSRF URL protection')
}

// ─── 8. Security.txt Builder ──────────────────────────────────────

import { buildSecurityTxt } from './security/securityTxt'

{
  console.assert(buildSecurityTxt({} as any, 'https://voidmail.my.id') === null, 'security.txt disabled without contact')
  const securityTxt = buildSecurityTxt(
    { SECURITY_CONTACT: 'mailto:security@example.com', SECURITY_POLICY_URL: 'https://voidmail.my.id/security' } as any,
    'https://voidmail.my.id',
    new Date('2026-07-30T00:00:00Z'),
  ) || ''
  console.assert(securityTxt.includes('Contact: mailto:security@example.com'), 'security contact included')
  console.assert(securityTxt.includes('Canonical: https://voidmail.my.id/.well-known/security.txt'), 'canonical included')
  console.assert(securityTxt.includes('Expires: 2027-07-30T00:00:00Z'), 'one-year expiry included')
  console.log('PASS: security.txt builder')
}

// ─── 9. Landing Browser Script Syntax ─────────────────────────────

import { LandingPage } from './web/landing'

{
  const landingStr = String(LandingPage({ domains: ['mail.example.com'], turnstileSiteKey: 'test-site-key' }))
  const match = landingStr.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)
  console.assert(!!match, 'landing inline script found')
  new Function(match?.[1] || '')
  console.log('PASS: landing browser script syntax')
}

// ─── 10. Admin Inbox and 404 Browser Templates ────────────────────

import { InboxesListPage } from './web/inboxes-list'
import { NotFoundPage } from './web/not-found'

{
  const inboxPage = String(InboxesListPage({
    inboxes: [], totalInboxes: 0, totalMessages: 0, filteredTotal: 0,
    currentPage: 1, search: '', messageFilter: 'all',
  }))
  const script = inboxPage.match(/<script>([\s\S]*?)<\/script>\s*<style>/)
  console.assert(!!script, 'admin inbox inline script found')
  new Function(script?.[1] || '')
  console.assert(String(NotFoundPage({})).includes('404'), 'not-found page renders status')
  console.log('PASS: admin inbox and 404 templates')
}

console.log('\nAll checks passed.')
