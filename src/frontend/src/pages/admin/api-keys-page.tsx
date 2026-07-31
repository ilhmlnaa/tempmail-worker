import { useState } from 'react'
import { Copy, Plus, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminMutation, useApiKeys, useDeleteKey, useAdminBootstrap } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export function ApiKeysPage() {
  const keys = useApiKeys()
  const revoke = useDeleteKey()
  const bootstrap = useAdminBootstrap()
  
  const generate = useAdminMutation<{ key: string; permittedDomains: string; maxInboxes: number; maxMessages: number }, { domains: string; maxInboxes: number; maxMessages: number }>('/dashboard/apikeys')
  
  const [open, setOpen] = useState(false)
  const [isAllDomains, setIsAllDomains] = useState(true)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [maxInboxes, setMaxInboxes] = useState('0')
  const [maxMessages, setMaxMessages] = useState('0')
  const [secret, setSecret] = useState('')

  if (keys.isLoading || bootstrap.isLoading) return <PageState text="Loading credentials" />
  if (keys.isError || bootstrap.isError) return <PageState text="Unable to load API keys" error />

  const mailDomainsList = (bootstrap.data?.settings.mail_domains || '').split(',').map(d => d.trim()).filter(Boolean)

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    )
  }

  const submit = () => {
    let finalDomains = '*'
    if (!isAllDomains) {
      if (selectedDomains.length === 0) {
        toast.error('Please select at least one domain, or enable Allow All Domains.')
        return
      }
      finalDomains = selectedDomains.join(', ')
    }

    generate.mutate(
      { domains: finalDomains, maxInboxes: Number(maxInboxes) || 0, maxMessages: Number(maxMessages) || 0 }, 
      { 
        onSuccess: result => { 
          setSecret(result.key)
          setIsAllDomains(true)
          setSelectedDomains([])
          setMaxInboxes('0')
          setMaxMessages('0')
        }, 
        onError: error => toast.error(error.message) 
      }
    )
  }

  return <div className="page-stack">
    <div className="page-header">
      <div><h2>API credentials</h2><p>Manage application access limits and scope.</p></div>
      <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setSecret('') }}>
        <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> Generate new key</Button></DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{secret ? 'Secret generated successfully' : 'Create API Credentials'}</DialogTitle>
            <DialogDescription>{secret ? 'Copy this secret now. You will not be able to see it again.' : 'Configure permitted domains and limits for this API key.'}</DialogDescription>
          </DialogHeader>
          
          {secret ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 my-2">
              <span className="text-xs font-semibold text-emerald-400 block">Your API Key Secret:</span>
              <div className="flex items-center justify-between gap-3 font-mono text-sm text-emerald-300 font-bold bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                <span className="truncate flex-1">{secret}</span>
                <Button size="sm" variant="default" onClick={() => navigator.clipboard.writeText(secret).then(() => toast.success('Key copied'))}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Domain Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-sm font-semibold text-foreground block">Allow All Active Domains (*)</span>
                    <span className="text-xs text-muted-foreground block">API key can create inboxes on any active receiving domain.</span>
                  </div>
                  <Switch
                    checked={isAllDomains}
                    onCheckedChange={setIsAllDomains}
                  />
                </div>

                {!isAllDomains && (
                  <div className="p-3.5 rounded-xl border border-border bg-background space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="text-xs font-semibold text-foreground block">Select Permitted Domains</span>
                    <span className="text-[11px] text-muted-foreground block mb-2">Click domain chips below to grant access for this API key:</span>
                    <div className="flex flex-wrap gap-2">
                      {mailDomainsList.map(domain => {
                        const isAllowed = selectedDomains.includes(domain)
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => toggleDomain(domain)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAllowed
                                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            <span>@{domain}</span>
                            {isAllowed ? <Check className="w-3.5 h-3.5 text-primary" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Resource Limits */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">Max Inboxes Limit</label>
                  <Input type="number" min="0" value={maxInboxes} onChange={e => setMaxInboxes(e.target.value)} className="font-mono" />
                  <span className="text-[11px] text-muted-foreground block">Set to 0 for unlimited.</span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">Max Messages / Inbox</label>
                  <Input type="number" min="0" value={maxMessages} onChange={e => setMaxMessages(e.target.value)} className="font-mono" />
                  <span className="text-[11px] text-muted-foreground block">Set to 0 for unlimited.</span>
                </div>
              </div>
            </div>
          )}
          
          {!secret && (
            <DialogFooter className="pt-2">
              <Button onClick={submit} disabled={generate.isPending} className="w-full sm:w-auto">
                {generate.isPending ? 'Generating Key…' : 'Generate API Key'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>

    {keys.data!.length === 0 ? (
      <Card><CardContent className="p-8 text-center text-muted-foreground">No credentials found. Create one to use the REST API.</CardContent></Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keys.data!.map(item => (
          <Card key={item.id} className="border-border/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col h-full gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <strong className="text-sm font-mono text-primary truncate block">{item.keyValue}</strong>
                  <span className="text-[11px] text-muted-foreground block">Created {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 shrink-0" 
                  aria-label="Revoke" 
                  onClick={() => confirm('Revoke this key? All applications using it will lose access immediately.') && revoke.mutate(item.id, { onSuccess: () => toast.success('Key revoked'), onError: err => toast.error(err.message) })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2 flex flex-col gap-1 mb-1">
                  <span className="text-muted-foreground font-medium">Permitted Domains:</span>
                  <code className="text-[11px] bg-muted/40 px-2 py-1 rounded truncate border border-border/50">{item.permittedDomains}</code>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground font-medium">Inboxes limit:</span>
                  <span className="font-bold">{item.maxInboxes || 'Unlimited'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground font-medium">Msg per inbox:</span>
                  <span className="font-bold">{item.maxMessages || 'Unlimited'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
}
