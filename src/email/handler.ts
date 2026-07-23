import { createEmail, insertMessage } from '../db/queries'
import type { Env } from '../db/queries'

function generateId(): string {
  return `${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`
}

/** Parse raw email text into from, subject, body */
function parseRaw(rawText: string): { from: string; subject: string; body: string } {
  const lines = rawText.split(/\r?\n/)
  let from = '', subject = '', inHeaders = true, bodyLines: string[] = []

  for (const line of lines) {
    if (inHeaders) {
      if (line === '') { inHeaders = false; continue }
      const lc = line.toLowerCase()
      if (lc.startsWith('from:')) from = line.slice(5).trim()
      else if (lc.startsWith('subject:')) subject = line.slice(8).trim()
    } else if (bodyLines.length < 2000) {
      bodyLines.push(line)
    }
  }

  return { from: from || 'unknown', subject: subject || '(no subject)', body: bodyLines.join('\n').trim() || '(empty)' }
}

export async function handleEmail(message: ForwardableEmailMessage, env: Env): Promise<void> {
  const to = message.to.toLowerCase()
  const domain = to.split('@')[1] || ''

  console.log('[email] received:', to, 'from:', message.from)

  try {
    // Ensure email record exists
    await createEmail(env.DB, to, domain)

    // Parse
    const rawText = await new Response(message.raw).text()
    const { from, subject, body } = parseRaw(rawText)

    // Store
    const msgId = generateId()
    await insertMessage(env.DB, { id: msgId, email: to, from, subject, body })
    console.log('[email] stored:', msgId)
  } catch (err: any) {
    console.error('[email] error:', err?.message || err)
  }
}
