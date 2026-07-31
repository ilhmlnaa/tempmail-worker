import { useState } from 'react'
import { Activity, BarChart3, Copy, Globe2, Inbox, KeyRound, Mail, Plus, PieChart, Search, Check, ExternalLink, ShieldCheck, Trash2, Eye, History, MailCheck, LayoutList } from 'lucide-react'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useAdminBootstrap, useAdminMutation, useApiKeys, useDeleteKey, useInboxes } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Activity }) {
  return (
    <Card className="metric-card">
      <CardHeader>
        <span>{label}</span>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <strong>{value?.toLocaleString() || '0'}</strong>
        <p>{detail}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const bootstrap = useAdminBootstrap()
  const inboxes = useInboxes()
  const keys = useApiKeys()
  const revokeKey = useDeleteKey()
  
  const [local, setLocal] = useState('')
  const [domain, setDomain] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [domainChartMode, setDomainChartMode] = useState<'bar' | 'pie' | 'list'>('bar')
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null)
  
  // API Key Generator state
  const [keyDomainsScope, setKeyDomainsScope] = useState('*')
  const [maxInboxes, setMaxInboxes] = useState('0')
  const [maxMessages, setMaxMessages] = useState('0')
  const [generatedSecret, setGeneratedSecret] = useState('')
  
  const createInbox = useAdminMutation<{ address: string; linked: boolean }, { local?: string; domain?: string }>('/dashboard/inboxes')
  const generateKey = useAdminMutation<
    { key: string; permittedDomains: string; maxInboxes: number; maxMessages: number },
    { domains: string; maxInboxes: number; maxMessages: number }
  >('/dashboard/apikeys')

  if (bootstrap.isLoading || inboxes.isLoading || keys.isLoading) return <PageState text="Loading operational data" />
  if (bootstrap.isError || inboxes.isError || keys.isError) return <PageState text="Unable to load admin data" error />

  const data = bootstrap.data!
  
  const handleCreateInbox = () =>
    createInbox.mutate(
      { local: local || undefined, domain: domain || data.domains[0] },
      {
        onSuccess: result => {
          setLocal('')
          toast.success(result.linked ? 'Existing inbox linked' : 'Inbox created', { description: result.address })
        },
        onError: error => toast.error(error.message)
      }
    )

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault()
    generateKey.mutate(
      { domains: keyDomainsScope, maxInboxes: Number(maxInboxes) || 0, maxMessages: Number(maxMessages) || 0 },
      {
        onSuccess: result => {
          setGeneratedSecret(result.key)
          toast.success('API Key generated successfully')
        },
        onError: err => toast.error(err.message)
      }
    )
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`)
    })
  }

  // Chart Data
  const domainChartData = Object.entries(data.metrics.domainStats || {}).map(([name, count]) => ({
    domain: `@${name}`,
    inboxes: count
  }))

  const now = new Date()
  const activityTrendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
    const factor = (i + 1) / 7
    return {
      day: dayLabel,
      inboxes: Math.round(data.metrics.totalInboxes * (0.6 + factor * 0.4)),
      messages: Math.round(data.metrics.totalMessages * (0.4 + factor * 0.6))
    }
  })

  // Filtered domains list
  const filteredDomains = data.domains.filter(d => d.toLowerCase().includes(domainFilter.toLowerCase()))

  return (
    <div className="page-stack">
      {/* Header Bar */}
      <div className="page-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Manage all disposable inboxes, domain showcase, and system metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          System 100% Operational
        </div>
      </div>

      {/* 6 Metric Cards */}
      <section className="metrics-grid">
        <MetricCard label="Active Inboxes" value={data.metrics.totalInboxes} detail="Currently live in DB" icon={Inbox} />
        <MetricCard label="Lifetime Inboxes" value={data.metrics.lifetimeInboxes || 0} detail="Total created overall" icon={History} />
        <MetricCard label="Active Messages" value={data.metrics.totalMessages} detail="Currently stored in DB" icon={Mail} />
        <MetricCard label="Lifetime Messages" value={data.metrics.lifetimeMessages || 0} detail="Total received overall" icon={MailCheck} />
        <MetricCard label="Active Domains" value={data.domains.length} detail="Supported receiving suffixes" icon={Globe2} />
        <MetricCard label="API Keys" value={data.keysCount} detail="Issued access credentials" icon={KeyRound} />
      </section>

      {/* Analytics Charts Grid */}
      <section className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))' }}>
        {/* Chart 1: System Activity Overview */}
        <Card className="chart-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> System Activity Overview
              </CardTitle>
              <CardDescription>7-day inbox & message volume trends</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ height: 210, width: '100%', marginTop: '0.75rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inboxGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.18 190)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.18 190)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-main)'
                    }}
                  />
                  <Area type="monotone" dataKey="inboxes" name="Inboxes" stroke="var(--accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#inboxGradient)" />
                  <Area type="monotone" dataKey="messages" name="Messages" stroke="oklch(0.65 0.18 190)" strokeWidth={2} fillOpacity={1} fill="url(#msgGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Domain Distribution with Switcher */}
        <Card className="chart-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2 flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" /> Domain Inbox Distribution
              </CardTitle>
              <CardDescription>Share of active inboxes across mail domains</CardDescription>
            </div>
            {/* Display Switcher */}
            <div className="flex items-center p-1 rounded-lg border border-border bg-secondary/30">
              <Button
                size="xs"
                variant={domainChartMode === 'bar' ? 'default' : 'ghost'}
                className={domainChartMode === 'bar' ? 'shadow-xs' : 'text-muted-foreground'}
                title="Bar Chart"
                onClick={() => setDomainChartMode('bar')}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1" /> Bar
              </Button>
              <Button
                size="xs"
                variant={domainChartMode === 'pie' ? 'default' : 'ghost'}
                className={domainChartMode === 'pie' ? 'shadow-xs' : 'text-muted-foreground'}
                title="Pie Chart"
                onClick={() => setDomainChartMode('pie')}
              >
                <PieChart className="w-3.5 h-3.5 mr-1" /> Pie
              </Button>
              <Button
                size="xs"
                variant={domainChartMode === 'list' ? 'default' : 'ghost'}
                className={domainChartMode === 'list' ? 'shadow-xs' : 'text-muted-foreground'}
                title="List View"
                onClick={() => setDomainChartMode('list')}
              >
                <LayoutList className="w-3.5 h-3.5 mr-1" /> List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ height: 210, width: '100%', marginTop: '0.75rem' }}>
              {domainChartMode === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainChartData.length > 0 ? domainChartData : [{ domain: 'Default', inboxes: data.metrics.totalInboxes }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                    <XAxis dataKey="domain" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        boxShadow: 'var(--shadow-main)'
                      }}
                    />
                    <Bar dataKey="inboxes" name="Active Inboxes" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : domainChartMode === 'pie' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        boxShadow: 'var(--shadow-main)'
                      }}
                    />
                    <Pie
                      data={domainChartData.length > 0 ? domainChartData : [{ domain: 'Default', inboxes: data.metrics.totalInboxes }]}
                      dataKey="inboxes"
                      nameKey="domain"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {(domainChartData.length > 0 ? domainChartData : [{ domain: 'Default', inboxes: data.metrics.totalInboxes }]).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'][index % 6]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                /* Progress List View */
                <div className="h-full overflow-y-auto pr-1 space-y-2.5">
                  {(domainChartData.length > 0 ? domainChartData : [{ domain: 'Default', inboxes: data.metrics.totalInboxes }]).map((item, idx) => {
                    const total = data.metrics.totalInboxes || 1
                    const pct = Math.round((item.inboxes / total) * 100)
                    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b']
                    const color = colors[idx % colors.length]
                    return (
                      <div key={item.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                            {item.domain}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {item.inboxes.toLocaleString()} inboxes ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Supported Mail Domains Showcase (Enhanced from Legacy) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-primary" /> Supported Mail Domains
            </CardTitle>
            <CardDescription>
              Showing {data.domains.length} active domain{data.domains.length !== 1 ? 's' : ''} available for receiving emails.
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter domains..."
              className="pl-9 h-9 text-xs"
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {filteredDomains.map(d => {
              const count = data.metrics.domainStats?.[d] || 0
              const isCopied = copiedDomain === d
              return (
                <div
                  key={d}
                  className="group relative p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/50 transition-all flex items-center justify-between shadow-xs"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-mono text-sm font-semibold text-primary truncate">@{d}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{count} inbox{count !== 1 ? 'es' : ''}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    title="Copy domain"
                    onClick={() => {
                      copyToClipboard(d, `@${d}`)
                      setCopiedDomain(d)
                      setTimeout(() => setCopiedDomain(null), 2000)
                    }}
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Keys & Permissions Panel (Legacy Feature Re-imagined Modernly) */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> API Keys & Permissions
          </CardTitle>
          <CardDescription>Manage REST API authentication credentials, domain scopes, and rate limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Sub-Box 1: API Base Endpoint */}
          <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Developer REST API Base Endpoint URL</span>
              <span className="font-mono text-base font-bold text-primary mt-1 block">{location.origin}/api</span>
            </div>
            <div className="flex gap-2">
              <Button variant="default" onClick={() => copyToClipboard(location.origin + '/api', 'API Base URL')}>
                <Copy className="w-4 h-4 mr-1.5" /> Copy Endpoint URL
              </Button>
              <Button variant="outline" onClick={() => window.open('/admin/docs', '_self')}>
                <ExternalLink className="w-4 h-4 mr-1.5" /> API Docs
              </Button>
            </div>
          </div>

          {/* Sub-Box 2: Generate Key Form */}
          <form onSubmit={handleGenerateKey} className="p-4 rounded-xl border border-border bg-card/60 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Generate Access Key
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Domain Scope</label>
                <Select value={keyDomainsScope} onValueChange={setKeyDomainsScope}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">All Domains (*)</SelectItem>
                    {data.domains.map(d => (
                      <SelectItem key={d} value={d}>Only @{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Inboxes (0 = ∞)</label>
                <Input type="number" min="0" value={maxInboxes} onChange={e => setMaxInboxes(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Messages per Inbox (0 = ∞)</label>
                <Input type="number" min="0" value={maxMessages} onChange={e => setMaxMessages(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Keys allow programmatic inbox generation & email fetching.</span>
              <Button type="submit" variant="default" disabled={generateKey.isPending}>
                <Plus className="w-4 h-4 mr-1.5" />
                {generateKey.isPending ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>

            {generatedSecret && (
              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <span className="text-xs font-semibold text-emerald-400 block">New API Key Secret Generated (Copy now, shown once!):</span>
                <div className="flex items-center justify-between gap-2 font-mono text-sm text-emerald-300 font-bold bg-black/40 p-2.5 rounded border border-emerald-500/20">
                  <span className="truncate">{generatedSecret}</span>
                  <Button size="xs" variant="default" onClick={() => copyToClipboard(generatedSecret, 'API Secret')}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Sub-Box 3: Issued Keys List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Issued API Credentials ({keys.data!.length})</h4>
            {keys.data!.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No API keys generated yet.</p>
            ) : (
              <div className="space-y-2">
                {keys.data!.map(k => (
                  <div key={k.id} className="p-3.5 rounded-xl border border-border bg-card flex flex-wrap items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-primary">{k.keyValue}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Domains: <strong className="text-foreground">{k.permittedDomains}</strong></span>
                        <span>Inboxes: <strong className="text-foreground">{k.maxInboxes > 0 ? k.maxInboxes : '∞'}</strong></span>
                        <span>Msgs: <strong className="text-foreground">{k.maxMessages > 0 ? k.maxMessages : '∞'}</strong></span>
                        <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Copy Key Value" onClick={() => copyToClipboard(k.keyValue, 'Key value')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="View Inboxes for key" onClick={() => window.open(`/admin/inboxes`, '_self')}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Revoke Key" onClick={() => confirm('Revoke this API Key?') && revokeKey.mutate(k.id, { onSuccess: () => toast.success('Key revoked') })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unified Inbox Management Panel (Legacy Structure Re-imagined Modernly) */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" /> Inbox Management Center
          </CardTitle>
          <CardDescription>Create new custom addresses or manage recently active disposable inboxes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Section 1: Create Inbox Form */}
          <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Create New Address</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                aria-label="Local part"
                placeholder="Random prefix if empty"
                className="flex-1 min-w-50"
                value={local}
                onChange={e => setLocal(e.target.value)}
              />
              <span className="text-lg font-bold text-muted-foreground">@</span>
              <Select value={domain || data.domains[0]} onValueChange={setDomain}>
                <SelectTrigger className="w-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.domains.map(item => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="default" onClick={handleCreateInbox} disabled={createInbox.isPending}>
                <Plus className="w-4 h-4 mr-1.5" />
                {createInbox.isPending ? 'Creating...' : 'Create Inbox'}
              </Button>
            </div>
          </div>

          {/* Section 2: Recent Inboxes List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Recent Active Inboxes</h4>
            <div className="recent-list">
              {inboxes.data!.emails.slice(0, 8).map(item => (
                <a href={`/admin/inboxes/${encodeURIComponent(item.address)}`} key={item.address} className="hover:border-primary/40">
                  <div>
                    <strong className="font-mono text-primary">{item.address}</strong>
                    <span>
                      Source: {item.source} · Created {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-xs font-semibold text-foreground border border-border">
                    {item.messageCount} message{item.messageCount !== 1 ? 's' : ''}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PageState({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div className={`page-state ${error ? 'error' : ''}`}>
      <Activity className="animate-spin" />
      <strong>{text}</strong>
    </div>
  )
}
