import { useEffect, useState, type FormEvent } from 'react'
import { Save, Globe, Zap, RotateCcw, ShieldCheck, Clock, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminBootstrap, useSaveSettings } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function SettingsPage() {
  const bootstrap = useAdminBootstrap()
  const save = useSaveSettings()
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (bootstrap.data) {
      setValues(Object.fromEntries(Object.entries(bootstrap.data.settings).map(([key, value]) => [key, String(value)])))
    }
  }, [bootstrap.data])

  if (bootstrap.isLoading) return <PageState text="Loading system configuration" />
  if (bootstrap.isError) return <PageState text="Unable to load settings" error />

  const set = (key: string, value: string) => setValues(prev => ({ ...prev, [key]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(values, {
      onSuccess: () => toast.success('System settings saved successfully'),
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

      {/* 2x2 Symmetric Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Mail Domains */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-primary" /> Mail Domains
            </CardTitle>
            <CardDescription>Configure active and public-facing email receiving suffixes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Active Receiving Domains</label>
              <Input
                required
                value={values.mail_domains || ''}
                onChange={e => set('mail_domains', e.target.value)}
                placeholder="domain1.com, domain2.com"
              />
              <span className="text-[11px] text-muted-foreground block">Comma-separated list of domains bound to Cloudflare Email Routing.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Public Allowed Domains</label>
              <Input
                value={values.public_allowed_domains || '*'}
                onChange={e => set('public_allowed_domains', e.target.value)}
                placeholder="*"
              />
              <span className="text-[11px] text-muted-foreground block">Use * for all active domains or specify allowed suffixes for public visitors.</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Public Generator */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-primary" /> Public Generator Rules
            </CardTitle>
            <CardDescription>Control anonymous inbox creation permissions on the public website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground block">Enable Public Address Generator</span>
                <span className="text-xs text-muted-foreground block">Allow anonymous web visitors to generate temporary inboxes.</span>
              </div>
              <Switch
                checked={values.public_tempmail_enabled === 'enabled'}
                onCheckedChange={checked => set('public_tempmail_enabled', checked ? 'enabled' : 'disabled')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Max Inboxes Per Session</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={values.public_max_inboxes_per_session || '5'}
                onChange={e => set('public_max_inboxes_per_session', e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground block">Maximum number of active addresses a single user session can hold.</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Automatic Cleanup */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="w-4 h-4 text-primary" /> Automatic Database Cleanup
            </CardTitle>
            <CardDescription>Set automated retention rules to purge stale inboxes and messages</CardDescription>
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

        {/* Card 4: Locale & Security */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-4 h-4 text-primary" /> Locale & Security Credentials
            </CardTitle>
            <CardDescription>Configure display timezone and update administrator authentication password</CardDescription>
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
    </form>
  )
}
