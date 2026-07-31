import { useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminMutation, useApiKeys, useDeleteKey } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ApiKeysPage() {
  const keys = useApiKeys()
  const revoke = useDeleteKey()
  const generate = useAdminMutation<{ key: string; permittedDomains: string; maxInboxes: number; maxMessages: number }, { domains: string; maxInboxes: number; maxMessages: number }>('/dashboard/apikeys')
  const [open, setOpen] = useState(false); const [domains, setDomains] = useState('*'); const [maxInboxes, setMaxInboxes] = useState('0'); const [maxMessages, setMaxMessages] = useState('0'); const [secret, setSecret] = useState('')
  if (keys.isLoading) return <PageState text="Loading credentials" />
  if (keys.isError) return <PageState text="Unable to load API keys" error />
  const submit = () => generate.mutate({ domains, maxInboxes: Number(maxInboxes) || 0, maxMessages: Number(maxMessages) || 0 }, { onSuccess: result => { setSecret(result.key); setDomains('*'); setMaxInboxes('0'); setMaxMessages('0') }, onError: error => toast.error(error.message) })
  return <div className="page-stack">
    <div className="page-header">
      <div><h2>API credentials</h2><p>Manage application access limits and scope.</p></div>
      <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setSecret('') }}>
        <DialogTrigger asChild><Button><Plus />Generate new key</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{secret ? 'Secret generated' : 'Create new credentials'}</DialogTitle><DialogDescription>{secret ? 'Copy this secret now. You will not be able to see it again.' : 'Limit domains or numbers of objects this key can generate.'}</DialogDescription></DialogHeader>
          {secret ? <div className="secret-display"><p><code>{secret}</code></p><Button onClick={() => navigator.clipboard.writeText(secret).then(() => toast.success('Key copied'))}><Copy />Copy key</Button></div> : <div className="form-stack">
            <label><span>Permitted domains</span><Input value={domains} onChange={e => setDomains(e.target.value)} placeholder="*" /></label>
            <label><span>Max inboxes (0 = infinite)</span><Input type="number" min="0" value={maxInboxes} onChange={e => setMaxInboxes(e.target.value)} /></label>
            <label><span>Max messages per inbox</span><Input type="number" min="0" value={maxMessages} onChange={e => setMaxMessages(e.target.value)} /></label>
          </div>}
          <DialogFooter>{!secret && <Button onClick={submit} disabled={generate.isPending}>{generate.isPending ? 'Generating…' : 'Generate'}</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    {keys.data!.length === 0 ? <Card><CardContent className="empty-state">No credentials found.</CardContent></Card> : <div className="list-cards">
      {keys.data!.map(item => <Card key={item.id}><CardContent className="key-item">
        <div className="key-info"><strong>{item.keyValue}</strong><span>Created {new Date(item.createdAt).toLocaleDateString()}</span></div>
        <div className="key-limits"><span>Domains: <code>{item.permittedDomains}</code></span><span>Inboxes: {item.maxInboxes || '∞'}</span><span>Msgs: {item.maxMessages || '∞'}</span></div>
        <Button variant="ghost" className="danger-text" size="icon" aria-label="Revoke" onClick={() => confirm('Revoke this key? All applications using it will lose access immediately.') && revoke.mutate(item.id, { onSuccess: () => toast.success('Key revoked'), onError: err => toast.error(err.message) })}><Trash2 /></Button>
      </CardContent></Card>)}
    </div>}
  </div>
}
