import { useEffect, useState, type FormEvent } from 'react'
import { Save, Globe, RotateCcw, ShieldCheck, Clock, KeyRound, Plus, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminBootstrap, useSaveSettings } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export function SettingsPage() {
  const bootstrap = useAdminBootstrap()
  const save = useSaveSettings()
  const [values, setValues] = useState<Record<string, string>>({})
  const [newMailDomain, setNewMailDomain] = useState('')

  useEffect(() => {
    if (bootstrap.data) {
      setValues(Object.fromEntries(Object.entries(bootstrap.data.settings).map(([key, value]) => [key, String(value)])))
    }
  }, [bootstrap.data])

  if (bootstrap.isLoading) return <PageState text="Loading system configuration" />
  if (bootstrap.isError) return <PageState text="Unable to load settings" error />

  const set = (key: string, value: string) => setValues(prev => ({ ...prev, [key]: value }))

  // Helper functions for Mail Domains tag management
  const mailDomainsList = (values.mail_domains || '').split(',').map(d => d.trim()).filter(Boolean)

  const handleAddMailDomain = (e?: FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newMailDomain.trim().toLowerCase().replace(/^@/, '')
    if (!trimmed) return
    if (mailDomainsList.includes(trimmed)) {
      toast.error('Domain already exists in receiving list')
      return
    }
    const updated = [...mailDomainsList, trimmed].join(', ')
    set('mail_domains', updated)
    setNewMailDomain('')
  }

  const handleRemoveMailDomain = (domainToRemove: string) => {
    const updated = mailDomainsList.filter(d => d !== domainToRemove).join(', ')
    set('mail_domains', updated)
    // If public allowed list contained this domain, clean it up if not wildcard
    const publicAllowed = (values.public_allowed_domains || '*').split(',').map(d => d.trim()).filter(Boolean)
    if (publicAllowed.length > 0 && publicAllowed[0] !== '*') {
      const updatedPublic = publicAllowed.filter(d => d !== domainToRemove).join(', ')
      set('public_allowed_domains', updatedPublic || '*')
    }
  }

  // Helper for Public Allowed Domains toggle/chips
  const isPublicAllDomains = (values.public_allowed_domains || '*').trim() === '*'
  const publicAllowedList = isPublicAllDomains
    ? []
    : (values.public_allowed_domains || '').split(',').map(d => d.trim()).filter(Boolean)

  const togglePublicDomainAllowed = (domain: string) => {
    let updated: string[]
    if (isPublicAllDomains) {
      // Switch from wildcard to specific list, containing all except target
      updated = mailDomainsList.filter(d => d !== domain)
    } else {
      if (publicAllowedList.includes(domain)) {
        updated = publicAllowedList.filter(d => d !== domain)
      } else {
        updated = [...publicAllowedList, domain]
      }
    }

    if (updated.length === 0 || updated.length === mailDomainsList.length) {
      set('public_allowed_domains', '*')
    } else {
      set('public_allowed_domains', updated.join(', '))
    }
  }

  const handleSetPublicAll = (allowAll: boolean) => {
    if (allowAll) {
      set('public_allowed_domains', '*')
    } else {
      // Set to first domain or empty
      set('public_allowed_domains', mailDomainsList[0] || '*')
    }
  }

  const saveCard = (cardFields: Record<string, string>, successMsg: string) => {
    save.mutate(cardFields, {
      onSuccess: () => toast.success(successMsg),
      onError: err => toast.error(err.message)
    })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(values, {
      onSuccess: () => toast.success('All system settings saved successfully'),
      onError: err => toast.error(err.message)
    })
  }

  return (
    <form className="page-stack" onSubmit={submit}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>System Configuration</h2>
          <p>Configure public access rules, receiving domains, data retention, locale, and security credentials.</p>
        </div>
        <Button type="submit" variant="default" disabled={save.isPending}>
          <Save className="w-4 h-4 mr-1.5" />
          {save.isPending ? 'Saving changes…' : 'Save Changes'}
        </Button>
      </div>

      {/* Full Width Top Section & 2-Column Grid */}
      <div className="space-y-6">
        {/* Full Width Card 1: Mail Domains & Public Access Rules */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="w-4 h-4 text-primary" /> Mail Domains & Public Access Rules
              </CardTitle>
              <CardDescription>Configure receiving email suffixes, public generator permissions, and allowed domains</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={save.isPending}
              onClick={() => saveCard({
                mail_domains: values.mail_domains || '',
                public_allowed_domains: values.public_allowed_domains || '*',
                public_tempmail_enabled: values.public_tempmail_enabled || 'enabled',
                public_max_inboxes_per_session: values.public_max_inboxes_per_session || '5'
              }, 'Mail domain rules saved')}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Domain Rules
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Active Receiving Domains Tag Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground block">Active Receiving Domains</label>
                <span className="text-[11px] text-muted-foreground font-mono">{mailDomainsList.length} registered</span>
              </div>

              {/* Tag Chips Container */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-wrap items-center gap-2.5 min-h-16">
                {mailDomainsList.map(domain => (
                  <Badge
                    key={domain}
                    variant="outline"
                    className="px-3 py-1.5 text-xs font-mono font-bold bg-primary/10 border-primary/30 text-primary flex items-center gap-2 shadow-xs transition-all hover:bg-primary/15"
                  >
                    <span>@{domain}</span>
                    {mailDomainsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMailDomain(domain)}
                        className="text-primary/70 hover:text-red-400 ml-0.5 transition-colors"
                        title="Remove domain"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>

              {/* Add Domain Input Bar */}
              <div className="flex items-center gap-2 max-w-xl">
                <Input
                  value={newMailDomain}
                  onChange={e => setNewMailDomain(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMailDomain(); } }}
                  placeholder="Add receiving domain suffix (e.g. domain.com)..."
                  className="h-9 text-xs font-mono flex-1"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddMailDomain} className="h-9 shrink-0">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Domain
                </Button>
              </div>
              <span className="text-[11px] text-muted-foreground block">Domains must be bound to Cloudflare Email Routing to receive incoming emails.</span>
            </div>

            {/* Public Generator Controls & Permitted Suffixes */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-semibold text-foreground block">Enable Public Address Generator</span>
                    <span className="text-[11px] text-muted-foreground block">Allow anonymous web visitors to generate temporary inboxes.</span>
                  </div>
                  <Switch
                    checked={values.public_tempmail_enabled === 'enabled'}
                    onCheckedChange={checked => set('public_tempmail_enabled', checked ? 'enabled' : 'disabled')}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-semibold text-foreground block">Allow All Domains for Public</span>
                    <span className="text-[11px] text-muted-foreground block">Expose all active receiving domains to public web visitors (*).</span>
                  </div>
                  <Switch
                    checked={isPublicAllDomains}
                    onCheckedChange={handleSetPublicAll}
                  />
                </div>
              </div>

              <div className="max-w-xs space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Max Inboxes Per Session</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={values.public_max_inboxes_per_session || '5'}
                  onChange={e => set('public_max_inboxes_per_session', e.target.value)}
                />
                <span className="text-[11px] text-muted-foreground block">Max active inboxes per web session.</span>
              </div>

              {!isPublicAllDomains && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-foreground block">Select Public Permitted Suffixes</label>
                  <div className="p-3.5 rounded-xl border border-border bg-background space-y-2">
                    <span className="text-[11px] text-muted-foreground block">Click domain chips below to toggle public access:</span>
                    <div className="flex flex-wrap gap-2">
                      {mailDomainsList.map(domain => {
                        const isAllowed = publicAllowedList.includes(domain)
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => togglePublicDomainAllowed(domain)}
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
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 2: Automatic Cleanup */}
          <Card className="h-full border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RotateCcw className="w-4 h-4 text-primary" /> Automatic Database Cleanup
                </CardTitle>
                <CardDescription>Set automated retention rules to purge stale inboxes and messages</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={save.isPending}
                onClick={() => saveCard({
                  cleanup_enabled: values.cleanup_enabled || 'disabled',
                  cleanup_scope: values.cleanup_scope || 'public',
                  cleanup_empty_hours: values.cleanup_empty_hours || '6',
                  cleanup_retention_hours: values.cleanup_retention_hours || '24'
                }, 'Cleanup retention settings saved')}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Cleanup
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground block">Enable Scheduled Cron Cleanup</span>
                  <span className="text-xs text-muted-foreground block">Execute automated retention cleanup on hourly schedule.</span>
                </div>
                <Switch
                  checked={values.cleanup_enabled === 'enabled'}
                  onCheckedChange={checked => set('cleanup_enabled', checked ? 'enabled' : 'disabled')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Cleanup Scope</label>
                <Select value={values.cleanup_scope || 'public'} onValueChange={v => set('cleanup_scope', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public inboxes only (preserve API & admin inboxes)</SelectItem>
                    <SelectItem value="all">All inboxes (global database purge)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Empty After (Hours)</label>
                  <Input
                    type="number"
                    min="1"
                    max="8760"
                    value={values.cleanup_empty_hours || '6'}
                    onChange={e => set('cleanup_empty_hours', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Max Retention (Hours)</label>
                  <Input
                    type="number"
                    min="1"
                    max="8760"
                    value={values.cleanup_retention_hours || '24'}
                    onChange={e => set('cleanup_retention_hours', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Locale & Security Credentials */}
          <Card className="h-full border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Locale & Credentials
                </CardTitle>
                <CardDescription>Configure display timezone and update admin password</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={save.isPending}
                onClick={() => saveCard({
                  timezone: values.timezone || 'Asia/Jakarta',
                  time_format: values.time_format || '24',
                  ...(values.auth_password ? { auth_password: values.auth_password } : {})
                }, 'Credentials & locale saved')}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Credentials
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Timezone
                  </label>
                  <Input value={values.timezone || 'Asia/Jakarta'} onChange={e => set('timezone', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Clock Format</label>
                  <Select value={values.time_format || '24'} onValueChange={v => set('time_format', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24-Hour (14:30)</SelectItem>
                      <SelectItem value="12">12-Hour (02:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground" /> Rotate Administrator Password
                </label>
                <Input
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={values.auth_password || ''}
                  placeholder="Leave blank to preserve current password"
                  onChange={e => set('auth_password', e.target.value)}
                />
                <span className="text-[11px] text-muted-foreground block">Minimum 8 characters required if updating password.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
