import { useEffect, useState, type FormEvent } from 'react'
import { Save, ShieldAlert, Calendar, ShieldCheck, MessageSquare, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminBootstrap, useSaveSettings } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

function localDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/** datetime-local tidak menyertakan zona; worker di UTC akan salah menafsirkannya. */
function toUtcIso(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export function MaintenancePage() {
  const bootstrap = useAdminBootstrap()
  const save = useSaveSettings()
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const m = bootstrap.data?.maintenance
    if (m)
      setValues({
        maintenance_enabled: m.enabled ? 'enabled' : 'disabled',
        maintenance_start_at: localDate(m.startAt),
        maintenance_end_at: localDate(m.endAt),
        maintenance_show_banner: m.showBanner ? 'enabled' : 'disabled',
        maintenance_allow_api: m.allowApi ? 'enabled' : 'disabled',
        maintenance_allow_inbox_reads: m.allowInboxReads ? 'enabled' : 'disabled',
        maintenance_banner_title: m.bannerTitle,
        maintenance_banner_message: m.bannerMessage,
        maintenance_page_title: m.pageTitle,
        maintenance_page_message: m.pageMessage
      })
  }, [bootstrap.data])

  if (bootstrap.isLoading) return <PageState text="Loading maintenance configuration" />
  if (bootstrap.isError) return <PageState text="Unable to load maintenance settings" error />

  const set = (key: string, value: string) => setValues(prev => ({ ...prev, [key]: value }))

  // Waktu mulai di masa lalu + toggle aktif = situs langsung down begitu disimpan.
  const startsAt = values.maintenance_start_at ? new Date(values.maintenance_start_at) : null
  const willActivateOnSave =
    values.maintenance_enabled === 'enabled' &&
    !!startsAt &&
    !Number.isNaN(startsAt.getTime()) &&
    startsAt.getTime() <= Date.now()

  const payload = (extra?: Record<string, string>) => ({
    ...values,
    maintenance_start_at: toUtcIso(values.maintenance_start_at || ''),
    maintenance_end_at: toUtcIso(values.maintenance_end_at || ''),
    ...extra,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(payload(), {
      onSuccess: () => toast.success('Maintenance settings saved successfully'),
      onError: err => toast.error(err.message)
    })
  }

  const endNow = () =>
    save.mutate(
      payload({ maintenance_enabled: 'disabled' }),
      {
        onSuccess: () => toast.success('Maintenance window ended'),
        onError: err => toast.error(err.message)
      }
    )

  const status = bootstrap.data!.maintenance.status

  return (
    <form className="page-stack" onSubmit={submit}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Maintenance Controls</h2>
          <p>Schedule service windows, status banners, and define public capabilities during maintenance.</p>
        </div>
        <div className="flex gap-2">
          {status === 'active' && (
            <Button type="button" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={endNow}>
              End Maintenance Now
            </Button>
          )}
          <Button type="submit" variant="default" disabled={save.isPending}>
            <Save className="w-4 h-4 mr-1.5" />
            {save.isPending ? 'Saving schedule…' : 'Save Schedule'}
          </Button>
        </div>
      </div>

      {/* Status Banner Widget */}
      <Card className="border-primary/20 bg-secondary/20 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${status === 'active' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-foreground">Current Status:</span>
                <Badge
                  variant="outline"
                  className={`capitalize px-2.5 py-0.5 font-bold ${
                    status === 'active'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : status === 'scheduled'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === 'active'
                  ? 'Public traffic is restricted. Configured permissions apply.'
                  : status === 'scheduled'
                    ? 'Maintenance window is scheduled for a future time.'
                    : 'System is running normally. Public access is fully active.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Schedule */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" /> Service Window Schedule
            </CardTitle>
            <CardDescription>Set maintenance timeline or enable immediate maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
              <div className="space-0.5">
                <span className="text-sm font-semibold text-foreground block">Enable Maintenance Window</span>
                <span className="text-xs text-muted-foreground block">Requires a valid start time to activate.</span>
              </div>
              <Switch
                checked={values.maintenance_enabled === 'enabled'}
                onCheckedChange={checked => set('maintenance_enabled', checked ? 'enabled' : 'disabled')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Starts At</label>
              <Input
                type="datetime-local"
                value={values.maintenance_start_at || ''}
                onChange={e => set('maintenance_start_at', e.target.value)}
              />
              {willActivateOnSave && (
                <p className="flex items-start gap-1.5 text-xs text-amber-500 pt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <span>This start time is in the past, so saving takes the site down immediately.</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Ends At (Optional)</label>
              <Input
                type="datetime-local"
                value={values.maintenance_end_at || ''}
                onChange={e => set('maintenance_end_at', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Service Permissions */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-4 h-4 text-primary" /> Service Permissions
            </CardTitle>
            <CardDescription>Keep selected capabilities online during maintenance windows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
              <div className="space-y-0.5 pr-2">
                <span className="text-sm font-semibold text-foreground block">Allow Public API Access</span>
                <span className="text-xs text-muted-foreground block">Keep developer REST API requests operational.</span>
              </div>
              <Switch
                checked={values.maintenance_allow_api === 'enabled'}
                onCheckedChange={checked => set('maintenance_allow_api', checked ? 'enabled' : 'disabled')}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
              <div className="space-y-0.5 pr-2">
                <span className="text-sm font-semibold text-foreground block">Allow Inbox Reads</span>
                <span className="text-xs text-muted-foreground block">Existing inboxes can still fetch messages.</span>
              </div>
              <Switch
                checked={values.maintenance_allow_inbox_reads === 'enabled'}
                onCheckedChange={checked => set('maintenance_allow_inbox_reads', checked ? 'enabled' : 'disabled')}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
              <div className="space-y-0.5 pr-2">
                <span className="text-sm font-semibold text-foreground block">Show Status Banner</span>
                <span className="text-xs text-muted-foreground block">Display notification banner when scheduled.</span>
              </div>
              <Switch
                checked={values.maintenance_show_banner === 'enabled'}
                onCheckedChange={checked => set('maintenance_show_banner', checked ? 'enabled' : 'disabled')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Status Banner */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4 text-primary" /> Status Banner Content
            </CardTitle>
            <CardDescription>Compact notification message displayed at top of public site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Banner Title</label>
              <Input
                required
                maxLength={100}
                value={values.maintenance_banner_title || ''}
                onChange={e => set('maintenance_banner_title', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Banner Description Message</label>
              <Input
                required
                maxLength={300}
                value={values.maintenance_banner_message || ''}
                onChange={e => set('maintenance_banner_message', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Full Maintenance Page */}
        <Card className="h-full border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-primary" /> Full Maintenance Page Notice
            </CardTitle>
            <CardDescription>Display text when public web access is completely blocked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Page Heading Title</label>
              <Input
                required
                maxLength={100}
                value={values.maintenance_page_title || ''}
                onChange={e => set('maintenance_page_title', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Page Body Message</label>
              <textarea
                required
                rows={3}
                maxLength={500}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={values.maintenance_page_message || ''}
                onChange={e => set('maintenance_page_message', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
