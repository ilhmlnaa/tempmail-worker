export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  })
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.location.href = '/admin/login'
    }
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null
    throw new ApiError(body?.error || body?.message || 'Request failed', response.status)
  }
  return response.json() as Promise<T>
}
