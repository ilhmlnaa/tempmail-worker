import { createEmail, insertMessage } from '../db/queries'
import type { Env } from '../db/queries'

function generateId(): string {
  return `${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`
}

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

export function parseEmail(rawText: string): { from: string; subject: string; textBody: string; htmlBody: string | null } {
  const headers: Record<string, string> = Object.create(null)
  const lines = rawText.split(/\r?\n/)
  let i = 0

  let lastKey = ''
  while (i < lines.length && lines[i] !== '') {
    const line = lines[i]
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (lastKey) headers[lastKey] += ' ' + line.trim()
    } else {
      const colon = line.indexOf(':')
      if (colon > 0) {
        const key = line.slice(0, colon).toLowerCase().trim()
        if (key !== '__proto__' && key !== 'constructor') {
          lastKey = key
          headers[key] = line.slice(colon + 1).trim().slice(0, 8192)
        }
      }
    }
    i++
  }

  const contentType = headers['content-type'] || ''
  const boundaryMatch = contentType.match(/boundary=["']?([^";]+)["']?/i)
  const boundary = boundaryMatch?.[1]

  let textBody = ''
  let htmlBody: string | null = null

  if (boundary) {
    const body = lines.slice(i + 1).join('\n')
    const parts = body.split(new RegExp(`--${escapeRegex(boundary)}(?:--)?\\s*`, 'g'))

    for (const part of parts) {
      if (!part.trim()) continue
      const partHeaders: Record<string, string> = Object.create(null)
      const partLines = part.split(/\r?\n/)
      let j = 0

      while (j < partLines.length && partLines[j] !== '') {
        const line = partLines[j]
        if (line.startsWith(' ') || line.startsWith('\t')) {
          const lastKey = Object.keys(partHeaders).pop()
          if (lastKey) partHeaders[lastKey] += ' ' + line.trim().slice(0, 8192)
        } else {
          const colon = line.indexOf(':')
          if (colon > 0) {
            const key = line.slice(0, colon).toLowerCase().trim()
            if (key !== '__proto__' && key !== 'constructor') partHeaders[key] = line.slice(colon + 1).trim().slice(0, 8192)
          }
        }
        j++
      }

      const partContentType = (partHeaders['content-type'] || '').toLowerCase()
      const partBody = partLines.slice(j + 1).join('\n').trim()
      const transferEncoding = (partHeaders['content-transfer-encoding'] || '').toLowerCase()

      let decodedBody = partBody
      if (transferEncoding === 'base64') {
        try {
          const clean = partBody.replace(/[^A-Za-z0-9+/=]/g, '')
          if (clean) decodedBody = atob(clean)
        } catch {}
      } else if (transferEncoding === 'quoted-printable') {
        decodedBody = decodeQuotedPrintable(partBody)
      }

      if (partContentType.includes('text/plain')) {
        if (!textBody) textBody = decodedBody
      } else if (partContentType.includes('text/html')) {
        htmlBody = decodedBody
      }
    }
  } else {
    const transferEncoding = (headers['content-transfer-encoding'] || '').toLowerCase()
    let body = lines.slice(i + 1).join('\n').trim()
    if (transferEncoding === 'base64') {
      try {
        const clean = body.replace(/[^A-Za-z0-9+/=]/g, '')
        if (clean) body = atob(clean)
      } catch {}
    } else if (transferEncoding === 'quoted-printable') {
      body = decodeQuotedPrintable(body)
    }

    if (contentType.toLowerCase().includes('text/html')) {
      htmlBody = body
    } else {
      textBody = body
    }
  }

  const from = headers['from'] || 'unknown'
  const subject = headers['subject'] || '(no subject)'

  return { from, subject, textBody: textBody || '(empty)', htmlBody }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function handleEmail(message: ForwardableEmailMessage, env: Env): Promise<void> {
  const to = message.to.toLowerCase()
  const domain = to.split('@')[1] || ''

  console.log('[email] received:', to, 'from:', message.from)

  try {
    await createEmail(env.DB, to, domain)

    const rawText = await new Response(message.raw).text()
    const { from, subject, textBody, htmlBody } = parseEmail(rawText)

    const msgId = generateId()
    await insertMessage(env.DB, {
      id: msgId,
      email: to,
      from,
      subject,
      body: textBody,
      html: htmlBody,
    })
    console.log('[email] stored:', msgId, htmlBody ? '(with HTML)' : '(plain)')
  } catch (err: any) {
    console.error('[email] error:', err?.message || err)
  }
}
