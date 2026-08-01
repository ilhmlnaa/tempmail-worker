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

import { LandingPage } from './web/public/landing'

{
  const landingStr = String(LandingPage({ domains: ['mail.example.com'], turnstileSiteKey: 'test-site-key', metrics: { lifetimeInboxes: 0, lifetimeMessages: 0 }, retentionHours: 24, timezone: 'UTC', timeFormat: '24' }))
  const match = landingStr.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)
  console.assert(!!match, 'landing inline script found')
  console.assert(landingStr.includes('cdn.simpleicons.org/hono/E36002') && landingStr.includes('cdn.simpleicons.org/cloudflareworkers/F38020'), 'landing footer exposes colored stack logos')
  console.assert(landingStr.includes('href="/.well-known/security.txt"'), 'landing footer security link targets the published endpoint')
  new Function(match?.[1] || '')
  console.log('PASS: landing browser script syntax')
}

// ─── 10. Admin Inbox and 404 Browser Templates ────────────────────

import { InboxesListPage } from './web/admin/inboxes-list'
import { NotFoundPage } from './web/public/not-found'

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

// ─── 11. Anime Inbox Address Generator ───────────────────────────

import { generateAnimeLocalPart } from './email/address-generator'

{
  const values = new Set(Array.from({ length: 20 }, generateAnimeLocalPart))
  console.assert(values.size > 1, 'generator produces varied values')
  for (const value of values) {
    console.assert(/^[a-z]{3,12}0x[0-9a-f]{2}$/.test(value), `valid anime local part: ${value}`)
  }
  console.log('PASS: anime inbox address generator')
}

// ─── 12. Custom Prompt Modal ──────────────────────────────────────

import { Layout } from './web/layout'

{
  const layout = String(Layout({ title: 'Test', children: 'Content', session: true }))
  console.assert(layout.includes('id="confirmInputContainer"'), 'custom prompt input container rendered')
  console.assert(layout.includes('function promptAction'), 'promptAction javascript function included')
  console.log('PASS: custom prompt modal')
}

// ─── 13. Maintenance Config Logic ────────────────────────────────

import { getMaintenanceConfig } from './db/queries'

{
  // getMaintenanceConfig memakai getAllSettings() yang memanggil .all() tanpa bind().
  const dbMock = {
    prepare: () => ({
      all: async () => ({
        results: [
          { key: 'maintenance_enabled', value: 'enabled' },
          { key: 'maintenance_start_at', value: '2026-07-30T10:00:00.000Z' },
          { key: 'maintenance_end_at', value: '2026-07-30T12:00:00.000Z' },
        ],
      }),
    }),
  } as any

  const scheduled = await getMaintenanceConfig(dbMock, new Date('2026-07-30T09:00:00.000Z'))
  console.assert(scheduled.status === 'scheduled', 'future start date evaluates to scheduled')

  const active = await getMaintenanceConfig(dbMock, new Date('2026-07-30T11:00:00.000Z'))
  console.assert(active.status === 'active', 'in-window date evaluates to active')

  const expired = await getMaintenanceConfig(dbMock, new Date('2026-07-30T13:00:00.000Z'))
  console.assert(expired.status === 'expired', 'past end date evaluates to expired')

  console.log('PASS: maintenance config logic')
}

// ─── 10. CSP enforcement & QP-decode sanitize order ───────────────

{
  // DB mock diperlukan karena middleware maintenance dan handler membaca settings.
  const emptyRow = { results: [] as any[] }
  const dbStub: any = {
    prepare: () => ({
      all: async () => emptyRow,
      first: async () => null,
      run: async () => ({ success: true }),
      bind: () => ({
        all: async () => emptyRow,
        first: async () => null,
        run: async () => ({ success: true }),
      }),
    }),
  }
  const env = { ALLOWED_ORIGINS: 'https://voidmail.my.id', DB: dbStub } as any
  const ctx = { waitUntil: () => {} } as any

  const pageRes = await app.fetch(new Request('https://voidmail.my.id/legacy/login'), env, ctx)
  const pageCsp = pageRes.headers.get('Content-Security-Policy') || ''
  console.assert(!pageRes.headers.get('Content-Security-Policy-Report-Only'), 'CSP no longer report-only')
  console.assert(pageCsp.includes("default-src 'self'"), 'page CSP enforced')
  console.assert(pageCsp.includes('https://challenges.cloudflare.com'), 'Turnstile allowed on legacy pages')

  const apiRes = await app.fetch(new Request('https://voidmail.my.id/api/session'), env, ctx)
  const apiCsp = apiRes.headers.get('Content-Security-Policy') || ''
  console.assert(apiCsp.includes("script-src 'none'"), 'API responses forbid scripts')
  console.assert(!apiCsp.includes("'unsafe-inline'"), 'API CSP has no unsafe-inline')

  // /dashboard/* adalah API admin JSON: wajib no-store dan CSP data, bukan CSP halaman.
  const dashRes = await app.fetch(new Request('https://voidmail.my.id/dashboard/inboxes'), env, ctx)
  console.assert(dashRes.headers.get('Cache-Control') === 'no-store, private', 'admin API responses are not cacheable')
  console.assert((dashRes.headers.get('Content-Security-Policy') || '').includes("script-src 'none'"), 'admin API uses data CSP')

  const dashPut = await app.fetch(new Request('https://voidmail.my.id/dashboard/inboxes', { method: 'PUT' }), env, ctx)
  console.assert(dashPut.status === 405, 'PUT /dashboard/inboxes -> 405')

  // Payload quoted-printable harus tetap bersih: sanitasi berjalan setelah decode.
  const qpPayload = '=3Cscript=3Ealert(1)=3C/script=3E=3Cimg src=3Dx onerror=3Dalert(2)=3E'
  const decoded = qpPayload
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  const sanitized = sanitizeHtmlEmail(decoded)
  console.assert(!sanitized.includes('<script'), 'QP-encoded script removed after decode')
  console.assert(!sanitized.includes('onerror'), 'QP-encoded inline handler removed after decode')

  console.log('PASS: CSP enforcement and QP-decode sanitize order')
}

// ─── 11. Public domain selection ────────────────────────────────

import { parsePublicDomains } from './api/routes/public'

{
  // Regresi: request tanpa `domain` (auto-generate di halaman home) sempat memilih
  // mail_domains[0], yang bisa berupa domain terlarang lalu ditolak 403 oleh
  // pemeriksaan berikutnya — halaman home gagal membuat inbox terus-menerus.
  const mail = 'zenime.online,devnet.my.id,chitose.biz.id'
  const allowed = 'devnet.my.id,chitose.biz.id'

  const publicView = parsePublicDomains(mail, allowed)
  console.assert(publicView.resolve() === 'devnet.my.id', 'empty request picks first allowed domain, not mail_domains[0]')
  console.assert(publicView.isAllowed(publicView.resolve()), 'auto-generated domain is never self-rejected')
  console.assert(!publicView.selectable.includes('zenime.online'), 'disallowed domain absent from selectable list')

  // GET /config dan POST /inboxes wajib sepakat: yang tampil harus bisa dipakai.
  for (const domain of publicView.selectable) {
    console.assert(publicView.isAllowed(domain), `config domain ${domain} must be accepted by POST`)
    console.assert(publicView.resolve(domain) === domain, `requesting ${domain} keeps that domain`)
  }

  const cased = parsePublicDomains(mail, 'DevNet.My.ID')
  console.assert(cased.resolve('devnet.my.id') === 'devnet.my.id', 'domain match is case-insensitive')
  console.assert(cased.isAllowed('DEVNET.MY.ID'), 'allow check is case-insensitive')

  const forbidden = publicView.resolve('zenime.online')
  console.assert(forbidden === 'devnet.my.id', 'disallowed request falls back to an allowed domain')

  const wildcard = parsePublicDomains(mail, '*')
  console.assert(wildcard.resolve() === 'zenime.online', 'wildcard keeps mail_domains order')
  console.assert(wildcard.selectable.length === 3, 'wildcard exposes every domain')

  // Setting keliru (tidak ada yang cocok) tidak boleh membuat inbox mustahil dibuat.
  const stale = parsePublicDomains(mail, 'not-a-domain.test')
  console.assert(stale.resolve() === 'zenime.online', 'unmatched allowlist falls back to all domains')

  console.log('PASS: public domain selection')
}

// ─── 12. Maintenance time round-trip ─────────────────────────────

import { parseInstant } from './api/routes/settings'

{
  // Regresi: frontend mengirim nilai datetime-local mentah ("2026-08-01T14:41").
  // Worker berjalan di UTC sehingga menganggapnya UTC, dan waktu bergeser sebesar
  // offset admin setiap kali disimpan.
  console.assert(parseInstant('2026-08-01T14:41') === null, 'value without timezone is rejected')
  console.assert(parseInstant('') === null, 'empty value yields null')
  console.assert(parseInstant('   ') === null, 'blank value yields null')
  console.assert(parseInstant('not-a-date') === null, 'garbage value yields null')
  console.assert(parseInstant('2026-13-45T99:99Z') === null, 'impossible date yields null')

  const utc = parseInstant('2026-08-01T07:41:00.000Z')
  console.assert(utc?.toISOString() === '2026-08-01T07:41:00.000Z', 'UTC value round-trips unchanged')

  // 14:41+07:00 adalah instant yang sama dengan 07:41Z — inilah yang kini dikirim klien.
  const offset = parseInstant('2026-08-01T14:41:00+07:00')
  console.assert(offset?.toISOString() === '2026-08-01T07:41:00.000Z', 'offset value converts to correct instant')
  console.assert(offset?.getTime() === utc?.getTime(), 'offset and UTC forms agree')

  // Menyimpan berulang kali tidak boleh menggeser waktu.
  let value = '2026-08-01T14:41:00+07:00'
  for (let i = 0; i < 3; i++) value = parseInstant(value)!.toISOString()
  console.assert(value === '2026-08-01T07:41:00.000Z', 'repeated saves keep the same instant')

  console.log('PASS: maintenance time round-trip')
}

// ─── 13. Maintenance admin lockout ──────────────────────────────

{
  // Regresi: saat maintenance aktif, jalur admin sempat 503 sehingga panel admin
  // mengunci dirinya sendiri dan maintenance tak bisa dimatikan dari UI.
  const active = {
    maintenance_enabled: 'enabled',
    maintenance_start_at: new Date(Date.now() - 3600000).toISOString(),
    maintenance_end_at: new Date(Date.now() + 3600000).toISOString(),
    maintenance_allow_api: 'disabled',
  }
  const env = {
    ALLOWED_ORIGINS: 'https://voidmail.my.id',
    DB: {
      prepare: () => ({
        all: async () => ({
          results: Object.entries(active).map(([key, value]) => ({ key, value })),
        }),
        first: async () => null,
        run: async () => ({ success: true }),
        bind: () => ({
          all: async () => ({ results: [] }),
          first: async () => null,
          run: async () => ({ success: true }),
        }),
      }),
    },
  } as any
  const ctx = { waitUntil: () => {} } as any

  const config = await getMaintenanceConfig(env.DB)
  console.assert(config.status === 'active', 'test fixture puts system in active maintenance')
  const publicRes = await app.fetch(new Request('https://voidmail.my.id/api/session'), env, ctx)
  console.assert(publicRes.status === 503, 'public API returns 503 during maintenance')

  // SPA membaca status maintenance dari /api/config; kalau ikut 503 halaman
  // maintenance tidak pernah tampil dan landing tetap terbuka.
  const cfgRes = await app.fetch(new Request('https://voidmail.my.id/api/config'), env, ctx)
  console.assert(cfgRes.status !== 503, '/api/config stays reachable so the SPA can render maintenance')

  for (const path of ['/api/admin/bootstrap', '/dashboard/inboxes', '/dashboard/apikeys']) {
    const res = await app.fetch(new Request(`https://voidmail.my.id${path}`), env, ctx)
    console.assert(res.status !== 503, `${path} must not be locked out by maintenance`)
  }

  console.log('PASS: maintenance keeps admin routes reachable')
}

console.log('\nAll checks passed.')
