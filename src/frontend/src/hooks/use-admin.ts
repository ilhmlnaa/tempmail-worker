import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { AdminBootstrapData, ApiKey, Inbox, Message } from '@/types/admin'

const invalidateAdmin = (client: ReturnType<typeof useQueryClient>) => client.invalidateQueries({ queryKey: ['admin'] })
export const useAdminBootstrap = () => useQuery({ queryKey: ['admin', 'bootstrap'], queryFn: () => api<AdminBootstrapData>('/api/admin/bootstrap') })
export const useInboxes = () => useQuery({ queryKey: ['admin', 'inboxes'], queryFn: () => api<{ total: number; totalMessages: number; emails: Inbox[] }>('/dashboard/inboxes') })
export const useApiKeys = () => useQuery({ queryKey: ['admin', 'keys'], queryFn: () => api<ApiKey[]>('/dashboard/apikeys') })
export const useMessages = (address?: string) => useQuery({ queryKey: ['admin', 'messages', address], enabled: Boolean(address), queryFn: () => api<Message[]>(`/dashboard/inboxes/${encodeURIComponent(address!)}/messages`) })
export function useAdminMutation<T, V>(path: string, method: 'POST' | 'DELETE' = 'POST') { const client = useQueryClient(); return useMutation({ mutationFn: (body: V) => api<T>(path, { method, body: method === 'DELETE' ? undefined : JSON.stringify(body) }), onSuccess: () => invalidateAdmin(client) }) }
export function useDeleteInbox() { const client = useQueryClient(); return useMutation({ mutationFn: (address: string) => api<{ ok: true }>(`/dashboard/inboxes/${encodeURIComponent(address)}`, { method: 'DELETE' }), onSuccess: () => invalidateAdmin(client) }) }
export function useDeleteKey() { const client = useQueryClient(); return useMutation({ mutationFn: (id: string) => api<{ ok: true }>(`/dashboard/apikeys/${id}`, { method: 'DELETE' }), onSuccess: () => invalidateAdmin(client) }) }
export function useSaveSettings() { const client = useQueryClient(); return useMutation({ mutationFn: (values: Record<string, unknown>) => api<{ ok: true }>('/api/settings', { method: 'POST', body: JSON.stringify(values) }), onSuccess: () => invalidateAdmin(client) }) }
