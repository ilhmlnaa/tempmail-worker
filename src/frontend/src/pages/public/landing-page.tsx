import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Copy,
  RefreshCw,
  Plus,
  Mail,
  Globe,
  Clock,
  Shield,
  Zap,
  Trash2,
  Code,
  Check,
  Inbox,
  Terminal,
  ArrowRight,
  AtSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  usePublicConfig,
  useSessionInboxes,
  useCreatePublicInbox,
  useInboxMessages,
  useDeletePublicInbox
} from '@/hooks/use-public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { Message } from '@/types/admin'
import { PublicHeader } from '@/components/public/layout/public-header'
import { PublicFooter } from '@/components/public/layout/public-footer'
import { PublicMaintenancePage } from './public-maintenance-page'

function HeroTypewriter() {
  const prefixText = 'Disposable Email into the '
  const words = ['Void', 'Shadow', 'Ether', 'Abyss', 'Cipher', 'Future']

  const [displayText, setDisplayText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPrefixDone, setIsPrefixDone] = useState(false)
  const [currentWordText, setCurrentWordText] = useState('')

  // 1. Type prefix text once
  useEffect(() => {
    if (displayText.length < prefixText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prefixText.slice(0, displayText.length + 1))
      }, 35)
      return () => clearTimeout(timer)
    } else {
      setIsPrefixDone(true)
    }
  }, [displayText])

  // 2. Continuous rotating word typewriter effect
  useEffect(() => {
    if (!isPrefixDone) return

    const targetWord = words[wordIndex]
    if (!isDeleting) {
      if (currentWordText.length < targetWord.length) {
        const timer = setTimeout(() => {
          setCurrentWordText(targetWord.slice(0, currentWordText.length + 1))
        }, 70)
        return () => clearTimeout(timer)
      } else {
        const timer = setTimeout(() => {
          setIsDeleting(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    } else {
      if (currentWordText.length > 0) {
        const timer = setTimeout(() => {
          setCurrentWordText(targetWord.slice(0, currentWordText.length - 1))
        }, 40)
        return () => clearTimeout(timer)
      } else {
        setIsDeleting(false)
        setWordIndex(prev => (prev + 1) % words.length)
      }
    }
  }, [isPrefixDone, currentWordText, isDeleting, wordIndex])

  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
      <span>{displayText}</span>
      <span className="bg-linear-to-r from-blue-400 via-primary to-cyan-400 bg-clip-text text-transparent font-extrabold transition-all">
        {currentWordText}
      </span>
      <span className="animate-pulse text-primary font-light ml-0.5">|</span>
    </h1>
  )
}

export function LandingPage() {
  const config = usePublicConfig()
  const sessionInboxes = useSessionInboxes()
  const createInbox = useCreatePublicInbox()
  const deleteInbox = useDeletePublicInbox()

  const [activeAddress, setActiveAddress] = useState<string>('')
  const [customLocal, setCustomLocal] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [msgTab, setMsgTab] = useState<'html' | 'text' | 'raw'>('html')

  const messagesQuery = useInboxMessages(activeAddress)

  // Initialize selected domain & auto-create default inbox on first visit if none exists
  useEffect(() => {
    if (config.data?.domains?.length) {
      if (!selectedDomain) setSelectedDomain(config.data.domains[0])
    }
  }, [config.data, selectedDomain])

  useEffect(() => {
    if (sessionInboxes.data && sessionInboxes.data.length > 0) {
      if (!activeAddress || !sessionInboxes.data.some(i => i.address === activeAddress)) {
        setActiveAddress(sessionInboxes.data[0].address)
      }
    } else if (sessionInboxes.data && sessionInboxes.data.length === 0 && !createInbox.isPending) {
      // Auto-generate initial instant inbox
      createInbox.mutate({}, {
        onSuccess: res => setActiveAddress(res.address)
      })
    }
  }, [sessionInboxes.data])

  const handleGenerateNew = () => {
    createInbox.mutate(
      { domain: selectedDomain || undefined },
      {
        onSuccess: res => {
          setActiveAddress(res.address)
          toast.success('New temporary email created', { description: res.address })
        },
        onError: err => toast.error(err.message)
      }
    )
  }

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customLocal) return
    createInbox.mutate(
      { address: customLocal, domain: selectedDomain || undefined },
      {
        onSuccess: res => {
          setActiveAddress(res.address)
          setCustomLocal('')
          toast.success('Custom email created', { description: res.address })
        },
        onError: err => toast.error(err.message)
      }
    )
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const domainsList = config.data?.domains || ['voidmail.my.id']
  const maintenance = config.data?.maintenance

  // If system is under active maintenance, render public maintenance page
  if (maintenance?.status === 'active' && !maintenance.allowInboxReads) {
    return <PublicMaintenancePage />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Show advance banner ONLY when maintenance is scheduled in the future */}
      {maintenance?.status === 'scheduled' && maintenance.showBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 flex items-center justify-center gap-2 font-medium z-50 relative">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong className="font-bold text-amber-200">{maintenance.bannerTitle}:</strong>{' '}
            {maintenance.bannerMessage}
          </span>
        </div>
      )}
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION WITH BACKGROUND GRID */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/40 bg-radial-[at_50%_0%] from-primary/10 via-background to-background">
          {/* Subtle Grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
            {/* Hero Copy */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold gap-2 border-primary/30 bg-primary/5 text-primary rounded-full inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Next-Gen Disposable Email Service
              </Badge>

              <HeroTypewriter />

              <p className="text-lg text-muted-foreground leading-relaxed">
                Generate instant, anonymous temporary email addresses in seconds. Keep your personal inbox safe from spam, trackers, and data leaks.
              </p>
            </div>

            {/* Quick Stats Kotak-Kotak Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto"
            >
              <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card flex items-center gap-3 shadow-xs transition-shadow hover:shadow-md">
                <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium block truncate">Active Domains</span>
                  <strong className="block text-base sm:text-lg font-black leading-none mt-0.5 sm:mt-1">
                    {config.isLoading ? '…' : (config.data?.domains?.length || 1)}
                  </strong>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card flex items-center gap-3 shadow-xs transition-shadow hover:shadow-md">
                <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium block truncate">Messages</span>
                  <strong className="block text-base sm:text-lg font-black leading-none mt-0.5 sm:mt-1">
                    {config.isLoading ? '…' : (config.data?.lifetimeMessages !== undefined ? config.data.lifetimeMessages.toLocaleString() : '0')}
                  </strong>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card flex items-center gap-3 col-span-2 sm:col-span-1 shadow-xs transition-shadow hover:shadow-md">
                <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium block truncate">Retention</span>
                  <strong className="block text-base sm:text-lg font-black leading-none mt-0.5 sm:mt-1">
                    {config.isLoading ? '…' : `${config.data?.retentionHours || 24}h`}
                  </strong>
                </div>
              </motion.div>
            </motion.div>

            {/* INSTANT GENERATOR & LIVE INBOX WIDGET CARD */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-5xl mx-auto shadow-xl rounded-2xl border border-primary/30 bg-card overflow-hidden"
              id="generator"
            >
              <div className="p-5 border-b border-border/60 bg-muted/40 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Your Temporary Email Address</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" /> Live Ready
                </Badge>
              </div>

              <div className="p-6 space-y-6">
                {/* Email Display & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl border border-border bg-background font-mono font-bold text-base text-primary flex items-center overflow-x-auto select-all">
                    {activeAddress || 'Generating temporary email address…'}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleCopy(activeAddress)}
                      disabled={!activeAddress}
                      className="flex-1 sm:flex-none font-semibold"
                    >
                      {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      {copied ? 'Copied!' : 'Copy Address'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateNew}
                      disabled={createInbox.isPending}
                      title="Generate new random inbox"
                      className="h-11 w-11 shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${createInbox.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Custom Prefix & Domain Selection Form */}
                <form onSubmit={handleCreateCustom} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
                    <Input
                      placeholder="Custom username (optional)..."
                      value={customLocal}
                      onChange={e => setCustomLocal(e.target.value)}
                      className="h-10 text-sm font-mono flex-1 min-w-0"
                    />
                    <Select value={selectedDomain || domainsList[0]} onValueChange={v => setSelectedDomain(v)}>
                      <SelectTrigger className="h-10 w-full sm:w-52.5 shrink-0 font-mono text-xs font-bold bg-background border-border shadow-xs hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-border bg-card shadow-xl min-w-52.5">
                        {domainsList.map(d => (
                          <SelectItem key={d} value={d} className="font-mono text-xs font-semibold cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span className="p-1 rounded bg-primary/10 text-primary">
                                <AtSign className="w-3 h-3" />
                              </span>
                              <span>@{d}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" variant="secondary" className="w-full sm:w-auto h-10 font-semibold shrink-0" disabled={createInbox.isPending}>
                    <Plus className="w-4 h-4 mr-1.5" /> Create Custom
                  </Button>
                </form>

                {/* LIVE MESSAGES & SESSION INBOXES SECTION (SPLIT ON DESKTOP) */}
                <div className="pt-5 border-t border-border/60">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* LEFT COLUMN: SESSION INBOXES LIST */}
                    <div className="md:col-span-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Inbox className="w-4 h-4 text-primary" />
                          <strong className="text-sm font-bold">Session Inboxes ({sessionInboxes.data?.length || 0})</strong>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {sessionInboxes.data && sessionInboxes.data.length > 0 ? (
                          sessionInboxes.data.map(item => {
                            const isActive = item.address === activeAddress
                            return (
                              <div
                                key={item.address}
                                onClick={() => setActiveAddress(item.address)}
                                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                  isActive
                                    ? 'border-primary bg-primary/10 text-foreground font-bold shadow-xs'
                                    : 'border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="truncate block font-mono text-xs text-foreground">{item.address}</span>
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    {item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'}
                                  </span>
                                </div>

                                {sessionInboxes.data.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation()
                                      deleteInbox.mutate(item.address, {
                                        onSuccess: () => toast.success('Inbox removed from session')
                                      })
                                    }}
                                    className="text-muted-foreground hover:text-red-400 p-1 rounded-md transition-colors"
                                    title="Remove inbox"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                            No active inboxes
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: MESSAGES FEED BOX */}
                    <div className="md:col-span-8 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-mono text-muted-foreground truncate">
                            Messages for <strong className="text-foreground font-bold">{activeAddress}</strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live 5s
                        </span>
                      </div>

                      <div className="rounded-xl border border-border bg-background min-h-64 max-h-96 overflow-y-auto">
                        {messagesQuery.isLoading ? (
                          <div className="p-8 text-center text-sm text-muted-foreground">Loading inbox messages…</div>
                        ) : !messagesQuery.data || messagesQuery.data.length === 0 ? (
                          <div className="p-10 text-center space-y-2">
                            <Mail className="w-8 h-8 mx-auto text-muted-foreground/40 animate-bounce" />
                            <p className="font-semibold text-sm">Your inbox is empty</p>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                              Waiting for incoming emails to <span className="font-mono text-primary font-bold">{activeAddress}</span>. Sender emails will appear here automatically.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/60">
                            {messagesQuery.data.map(msg => {
                              const isExpanded = expandedMessageId === msg.id
                              return (
                                <div key={msg.id} className="border-b border-border/60 transition-colors">
                                  <div
                                    onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                                    className="p-3.5 cursor-pointer flex items-start justify-between gap-3 group hover:bg-muted/40"
                                  >
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-foreground truncate">{msg.fromAddress || msg.from}</span>
                                        <span className="text-[11px] text-muted-foreground shrink-0">
                                          {new Date(msg.receivedAt || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <h4 className="font-semibold text-xs text-primary group-hover:underline truncate">
                                        {msg.subject || '(No Subject)'}
                                      </h4>
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {msg.text || msg.body || (msg.html ? 'Contains HTML formatting' : '(Empty message body)')}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedMessage(msg)
                                        }}
                                        title="Open full view modal"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5 mr-1" /> Full View
                                      </Button>
                                      <Button size="xs" variant="ghost" className="h-7 w-7 p-0">
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Accordion Inline Preview */}
                                  {isExpanded && (
                                    <div className="p-4 bg-muted/20 border-t border-border/40 space-y-3">
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>From: <strong className="text-foreground">{msg.fromAddress || msg.from}</strong></span>
                                        <span>{new Date(msg.receivedAt || msg.createdAt).toLocaleString()}</span>
                                      </div>
                                      <div className="rounded-lg border border-border bg-background p-3.5 text-xs text-foreground leading-relaxed overflow-x-auto max-h-80">
                                        {msg.html ? (
                                          <iframe
                                            srcDoc={msg.html}
                                            title={msg.subject || 'Email'}
                                            className="w-full h-64 border-0 rounded bg-white"
                                            sandbox="allow-same-origin"
                                          />
                                        ) : (
                                          <pre className="font-mono whitespace-pre-wrap text-xs text-muted-foreground">
                                            {msg.text || msg.body || '(Empty message body)'}
                                          </pre>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SUPPORTED MAIL DOMAINS SHOWCASE GRID (KOTAK-KOTAK) */}
        <section className="py-16 border-b border-border/40 bg-muted/20" id="domains">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto space-y-2"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Supported Mail Suffixes</h2>
              <p className="text-sm text-muted-foreground">
                Choose from our verified pool of receiving domains for instant temporary inbox creation.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {domainsList.map((d, index) => (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => {
                    setSelectedDomain(d)
                    createInbox.mutate(
                      { domain: d },
                      {
                        onSuccess: res => {
                          setActiveAddress(res.address)
                          toast.success(`Created inbox @${d}`, { description: res.address })
                        }
                      }
                    )
                  }}
                  className="group relative p-4 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-sm font-mono font-bold text-foreground">@{d}</strong>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    </div>
                  </div>
                  <Button size="xs" variant="ghost" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Use
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE VOIDMAIL? FEATURES GRID (KOTAK-KOTAK) */}
        <section className="py-16 md:py-24 border-b border-border/40" id="features">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto space-y-2"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Why Choose VoidMail?</h2>
              <p className="text-sm text-muted-foreground">
                Engineered with modern web standards for privacy advocates, developers, and everyday users.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl border border-border bg-card/60 hover:border-primary/40 transition-all shadow-xs hover:shadow-lg space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">100% Anonymous</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No credit card, passwords, or account registration required. Use instantly and disappear without leaving logs.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl border border-border bg-card/60 hover:border-primary/40 transition-all shadow-xs hover:shadow-lg space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Edge Velocity</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Powered by Cloudflare Workers and D1 database for sub-millisecond email reception and worldwide availability.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl border border-border bg-card/60 hover:border-primary/40 transition-all shadow-xs hover:shadow-lg space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Auto-Expiring</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Disposable email addresses automatically purge after retention period, keeping spam and trackers out of your personal inbox.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl border border-border bg-card/60 hover:border-primary/40 transition-all shadow-xs hover:shadow-lg space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Code className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Developer API</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Full OpenAPI REST endpoints to programmatically generate inboxes, inspect messages, and automate testing.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* DEVELOPER FRIENDLY API CURL SECTION */}
        <section className="py-16 bg-muted/20" id="api">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Developer Friendly REST API</h2>
              <p className="text-sm text-muted-foreground">
                Integrate automated temporary email testing in your apps with simple cURL commands.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
              <div className="p-3.5 border-b border-border bg-muted/60 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-muted-foreground">
                  <Terminal className="w-4 h-4 text-primary" /> Create Inbox cURL Example
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      `curl -X POST https://${window.location.host}/api/inboxes \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"domain": "${domainsList[0]}", "address": "testuser"}'`
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                </Button>
              </div>
              <pre className="p-5 font-mono text-xs text-primary bg-background overflow-x-auto leading-relaxed">
                {`curl -X POST https://${window.location.host}/api/inboxes \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "${domainsList[0]}", "address": "testuser"}'`}
              </pre>
            </div>

            <div className="text-center pt-2">
              <Button asChild size="lg" className="font-bold">
                <a href="/docs">
                  Explore Interactive API Documentation <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* MESSAGE READER MODAL */}
      <Dialog open={Boolean(selectedMessage)} onOpenChange={open => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col border-primary/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold truncate pr-6">{selectedMessage?.subject || '(No Subject)'}</DialogTitle>
            <DialogDescription className="text-xs flex items-center justify-between pt-1">
              <span>From: <strong className="text-foreground">{selectedMessage?.fromAddress || selectedMessage?.from}</strong></span>
              <span>{(selectedMessage?.receivedAt || selectedMessage?.createdAt) ? new Date(selectedMessage?.receivedAt || selectedMessage?.createdAt || '').toLocaleString() : ''}</span>
            </DialogDescription>
          </DialogHeader>

          {/* View Tab Switcher */}
          <div className="flex items-center gap-2 pt-2 border-b border-border">
            <Button size="xs" variant={msgTab === 'html' ? 'default' : 'ghost'} onClick={() => setMsgTab('html')}>
              HTML View
            </Button>
            <Button size="xs" variant={msgTab === 'text' ? 'default' : 'ghost'} onClick={() => setMsgTab('text')}>
              Plain Text
            </Button>
            <Button size="xs" variant={msgTab === 'raw' ? 'default' : 'ghost'} onClick={() => setMsgTab('raw')}>
              Raw Source
            </Button>
          </div>

          {/* Message Content Viewport */}
          <div className="flex-1 overflow-y-auto min-h-75 p-2">
            {msgTab === 'html' && selectedMessage?.html ? (
              <iframe
                srcDoc={selectedMessage.html}
                title="Email Body"
                className="w-full h-100 border-0 rounded-lg bg-white"
                sandbox="allow-same-origin"
              />
            ) : msgTab === 'text' || !selectedMessage?.html ? (
              <pre className="p-4 rounded-lg bg-muted text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {selectedMessage?.text || selectedMessage?.body || '(No plaintext body available)'}
              </pre>
            ) : (
              <pre className="p-4 rounded-lg bg-muted text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedMessage, null, 2)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
