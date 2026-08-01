import { useState } from 'react'
import { Eye, Filter, Search, Trash2, RotateCcw, LayoutGrid, LayoutList, Mail, Calendar } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useAdminMutation, useDeleteInbox, useInboxes } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function InboxesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const filter = params.get('filter') || 'all'
  const inboxes = useInboxes()
  const deleteOne = useDeleteInbox()
  const bulk = useAdminMutation<{ deleted: number }, { mode: 'empty' | 'older-than'; days?: number }>('/dashboard/inboxes/bulk-delete')
  const [bulkMode, setBulkMode] = useState<'empty' | 'older-than'>('empty')
  const [days, setDays] = useState('7')
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  if (inboxes.isLoading) return <PageState text="Loading inbox index" />
  if (inboxes.isError) return <PageState text="Unable to load inboxes" error />

  const filtered = inboxes.data!.emails.filter(item => {
    const matchQ = !q || item.address.toLowerCase().includes(q.toLowerCase())
    const matchF = filter === 'all' ? true : filter === 'empty' ? item.messageCount === 0 : item.messageCount > 0
    return matchQ && matchF
  })

  const runBulk = () =>
    bulk.mutate(
      { mode: bulkMode, days: bulkMode === 'older-than' ? Number(days) : undefined },
      {
        onSuccess: result => {
          setOpen(false)
          toast.success(`Purged ${result.deleted} inboxes`)
        },
        onError: err => toast.error(err.message)
      }
    )

  const clearFilters = () => {
    setParams({})
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Active Inboxes</h2>
          <p>Filter, inspect messages, or purge inboxes across all mail domains.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Bulk Cleanup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Cleanup</DialogTitle>
              <DialogDescription>Purge empty or stale inboxes to optimize database capacity.</DialogDescription>
            </DialogHeader>
            <div className="form-stack">
              <label>
                <span>Cleanup Mode</span>
                <Select value={bulkMode} onValueChange={v => setBulkMode(v as 'empty' | 'older-than')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Purge all empty inboxes (0 messages)</SelectItem>
                    <SelectItem value="older-than">Purge inboxes older than N days</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              {bulkMode === 'older-than' && (
                <label>
                  <span>Days Threshold (1-365)</span>
                  <Input type="number" min="1" max="365" value={days} onChange={e => setDays(e.target.value)} />
                </label>
              )}
            </div>
            <DialogFooter>
              <Button onClick={runBulk} disabled={bulk.isPending}>
                {bulk.isPending ? 'Purging…' : 'Purge Inboxes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar Filter & Search Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[min(15rem,100%)]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by address or domain..."
                className="pl-9 h-10"
                value={q}
                onChange={e =>
                  setParams(prev => {
                    if (e.target.value) prev.set('q', e.target.value)
                    else prev.delete('q')
                    return prev
                  })
                }
              />
            </div>

            {/* Filter Dropdown & View Mode Switcher */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[min(11.25rem,100%)]">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select
                  value={filter}
                  onValueChange={value =>
                    setParams(prev => {
                      prev.set('filter', value)
                      return prev
                    })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inboxes</SelectItem>
                    <SelectItem value="has-messages">With Messages</SelectItem>
                    <SelectItem value="empty">Empty Inboxes (0 msgs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-lg border border-border bg-secondary/30">
                <Button
                  size="xs"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  className={viewMode === 'cards' ? 'shadow-xs' : 'text-muted-foreground'}
                  title="Card list view"
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Cards
                </Button>
                <Button
                  size="xs"
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  className={viewMode === 'table' ? 'shadow-xs' : 'text-muted-foreground'}
                  title="Table view"
                  onClick={() => setViewMode('table')}
                >
                  <LayoutList className="w-3.5 h-3.5 mr-1" /> Table
                </Button>
              </div>

              {(q || filter !== 'all') && (
                <Button variant="ghost" size="icon" title="Reset filters" onClick={clearFilters}>
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inboxes Directory */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inboxes Directory ({filtered.length})</CardTitle>
            <CardDescription>
              Showing {filtered.length} of {inboxes.data!.emails.length} total registered addresses
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Mail className="w-8 h-8 mx-auto opacity-40" />
              <p className="font-semibold text-sm">No inboxes found matching the search criteria.</p>
              {(q || filter !== 'all') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Search & Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            /* LEGACY-INSPIRED STACKED INBOX CARDS LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtered.map(item => (
                <div
                  key={item.address}
                  className="group relative p-4 rounded-xl border border-border bg-card/70 hover:bg-card hover:border-primary/50 transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 pr-2">
                      <a
                        href={`/admin/inboxes/${encodeURIComponent(item.address)}`}
                        className="font-mono font-bold text-sm text-primary hover:underline truncate block"
                      >
                        {item.address}
                      </a>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="capitalize text-[10px] py-0 px-2 font-medium">
                          {item.source}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary text-foreground border border-border shrink-0">
                      {item.messageCount} msg{item.messageCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground">
                      Last msg: {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-7 text-xs font-semibold hover:text-primary hover:bg-primary/10"
                        onClick={() => navigate(`/admin/inboxes/${encodeURIComponent(item.address)}`)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-7 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() =>
                          confirm(`Delete ${item.address}?`) &&
                          deleteOne.mutate(item.address, {
                            onSuccess: () => toast.success('Inbox deleted'),
                            onError: err => toast.error(err.message)
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="overflow-x-auto rounded-xl border border-border bg-card/40">
              <Table>
                <TableHeader className="bg-secondary/40 border-b border-border">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="w-75 text-foreground font-semibold">Address</TableHead>
                    <TableHead className="w-30 text-foreground font-semibold">Source</TableHead>
                    <TableHead className="w-50 text-foreground font-semibold">Created Date</TableHead>
                    <TableHead className="w-30 text-foreground font-semibold">Messages</TableHead>
                    <TableHead className="text-right w-25 text-foreground font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.address} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold text-primary">{item.address}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs font-medium">
                          {item.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border">
                          {item.messageCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                            title="Inspect Inbox"
                            onClick={() => navigate(`/admin/inboxes/${encodeURIComponent(item.address)}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete Inbox"
                            onClick={() =>
                              confirm(`Delete ${item.address}?`) &&
                              deleteOne.mutate(item.address, {
                                onSuccess: () => toast.success('Inbox deleted'),
                                onError: err => toast.error(err.message)
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
