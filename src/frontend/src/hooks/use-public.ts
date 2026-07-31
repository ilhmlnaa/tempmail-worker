import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Message, MaintenanceConfig } from '@/types/admin'

export interface PublicConfig {
  domains: string[]
  primaryDomain: string
  retentionHours: number
  lifetimeMessages: number
  totalInboxes: number
  turnstileSiteKey: string | null
  publicEnabled: boolean
  maintenance?: MaintenanceConfig
}

export interface SessionInbox {
  address: string
  domain: string
  source: string
  createdAt: string
  messageCount: number
  lastMessageAt: string | null
}

const invalidatePublic = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ['public'] })
}

export const usePublicConfig = () =>
  useQuery({
    queryKey: ['public', 'config'],
    queryFn: () => api<PublicConfig>('/api/config')
  })

export const useSessionInboxes = () =>
  useQuery({
    queryKey: ['public', 'session-inboxes'],
    queryFn: () => api<SessionInbox[]>('/api/session/inboxes')
  })

export const useInboxMessages = (address?: string) =>
  useQuery({
    queryKey: ['public', 'messages', address],
    enabled: Boolean(address),
    refetchInterval: 5000,
    queryFn: () => api<Message[]>(`/api/inboxes/${encodeURIComponent(address!)}/messages`)
  })

export function useCreatePublicInbox() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: { domain?: string; address?: string; turnstileToken?: string }) =>
      api<{ address: string }>('/api/inboxes', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: () => invalidatePublic(client)
  })
}

export function useDeletePublicInbox() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (address: string) =>
      api<{ ok: true }>(`/api/inboxes/${encodeURIComponent(address)}`, {
        method: 'DELETE'
      }),
    onSuccess: () => invalidatePublic(client)
  })
}
