type SecurityEvent =
  | 'session_created'
  | 'session_rejected'
  | 'inbox_created'
  | 'inbox_conflict'
  | 'inbox_rate_limited'
  | 'unauthorized_access'
  | 'invalid_domain'

export function logSecurityEvent(event: SecurityEvent, context: Record<string, string | number | boolean>) {
  // Strip potentially sensitive keys
  const safeContext = { ...context }
  delete safeContext['authorization']
  delete safeContext['cookie']
  delete safeContext['body']
  delete safeContext['emailBody']

  console.log(
    JSON.stringify({
      level: 'SECURITY',
      event,
      timestamp: new Date().toISOString(),
      ...safeContext,
    })
  )
}
