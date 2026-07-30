import type { Env } from '../db/queries'

export interface SanitizeOptions {
  allowExternalImages?: boolean
  imgCdnBaseUrl?: string
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function buildImgCdnUrl(sourceUrl: string, baseUrl = 'https://imgcdn.arm.hamdiv.me'): string {
  const encoded = toBase64Url(sourceUrl)
  return `${baseUrl.replace(/\/+$/, '')}/insecure/size:1920:0/resizing_type:fit/quality:85/sharpen:0.5/${encoded}.webp`
}

export function isValidImageUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    
    // Block private / local / loopback IPs and internal hostnames
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === '169.254.169.254'
    ) {
      return false
    }

    // IP range checks (IPv4)
    const ipMatch = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number)
      if (a === 10) return false // 10.0.0.0/8
      if (a === 127) return false // 127.0.0.0/8
      if (a === 169 && b === 254) return false // 169.254.0.0/16
      if (a === 172 && b >= 16 && b <= 31) return false // 172.16.0.0/12
      if (a === 192 && b === 168) return false // 192.168.0.0/16
    }

    return true
  } catch {
    return false
  }
}

export function sanitizeHtmlEmail(html: string, options: SanitizeOptions = {}): string {
  if (!html) return ''

  const baseUrl = options.imgCdnBaseUrl || 'https://imgcdn.arm.hamdiv.me'

  // 1. Remove dangerous active tags: script, iframe, object, embed, form, input, button, select, meta, base, link, video, audio
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    .replace(/<base\b[^<]*>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // 2. Strip inline event handlers and style URLs that could load external resources.
  cleaned = cleaned
    .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/\s+style\s*=\s*(?:'[^']*url\([^)]*\)[^']*'|"[^"]*url\([^)]*\)[^"]*"|[^\s>]+)/gi, '')

  // 3. Strip dangerous URL protocols (javascript:, vbscript:, data:text/html)
  cleaned = cleaned.replace(/(href|src|action)\s*=\s*["']?\s*(?:javascript|vbscript|data:text\/html):[^"'>\s]*/gi, '$1="#"')

  // 4. Secure <a> links: force target="_blank" and rel="noopener noreferrer"
  cleaned = cleaned.replace(/<a\b([^>]*)>/gi, (match, p1) => {
    let attrs = p1
    if (!/rel=/i.test(attrs)) {
      attrs += ' rel="noopener noreferrer"'
    } else {
      attrs = attrs.replace(/rel=["']([^"']*)["']/i, 'rel="noopener noreferrer"')
    }
    if (!/target=/i.test(attrs)) {
      attrs += ' target="_blank"'
    } else {
      attrs = attrs.replace(/target=["']([^"']*)["']/i, 'target="_blank"')
    }
    return `<a ${attrs.trim()}>`
  })

  // 5. Rewrite or block <img> src attributes
  cleaned = cleaned.replace(/<img\b([^>]*)>/gi, (match, p1) => {
    let attrs = p1
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    if (srcMatch) {
      const origSrc = srcMatch[1]
      if (options.allowExternalImages && isValidImageUrl(origSrc)) {
        const proxiedUrl = buildImgCdnUrl(origSrc, baseUrl)
        attrs = attrs.replace(/src=["']([^"']+)["']/i, `src="${proxiedUrl}"`) 
      } else {
        // Replace with a transparent/placeholder or privacy notice
        attrs = attrs.replace(/src=["']([^"']+)["']/i, 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="')
      }
    }
    return `<img ${attrs.trim()}>`
  })

  // 6. Prepend restrictive CSP meta for the inner srcdoc frame
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${baseUrl} data:; style-src 'unsafe-inline'; font-src 'none'; media-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';"><meta name="referrer" content="no-referrer">`

  return `${cspMeta}${cleaned}`
}
