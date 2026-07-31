import { useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { useMessages } from '@/hooks/use-admin'
import { PageState } from './dashboard-page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function InboxDetailPage() {
  const { address = '' } = useParams()
  const email = decodeURIComponent(address)
  const messages = useMessages(email)
  const [open, setOpen] = useState<string | null>(null)
  if (messages.isLoading) return <PageState text="Loading messages" />
  if (messages.isError) return <PageState text="Unable to load messages" error />
  return <div className="page-stack"><div className="page-header"><div><h2>{email}</h2><p>{messages.data!.length} messages received</p></div><div className="button-group"><Button variant="outline" onClick={() => navigator.clipboard.writeText(email).then(() => toast.success('Address copied'))}><Copy />Copy address</Button><Button variant="outline" onClick={() => messages.refetch()}><RefreshCw />Refresh</Button></div></div>
    {messages.data!.length === 0 ? <Card><CardContent className="empty-state">No messages have arrived yet.</CardContent></Card> : messages.data!.map(message => <Card key={message.id} className="message-card"><CardHeader className="message-summary" onClick={() => setOpen(open === message.id ? null : message.id)}><div><CardTitle>{message.subject || '(No subject)'}</CardTitle><p>{message.from} · {new Date(message.createdAt).toLocaleString()}</p></div><span>{open === message.id ? 'Close' : 'Open'}</span></CardHeader>{open === message.id && <CardContent><Tabs defaultValue="rendered"><TabsList><TabsTrigger value="rendered">Rendered</TabsTrigger><TabsTrigger value="text">Text</TabsTrigger><TabsTrigger value="source">HTML source</TabsTrigger></TabsList><TabsContent value="rendered"><iframe className="email-frame" title={message.subject} sandbox="allow-popups" referrerPolicy="no-referrer" srcDoc={message.html || `<pre>${message.body.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]!)}</pre>`} /></TabsContent><TabsContent value="text"><pre className="email-source">{message.body}</pre></TabsContent><TabsContent value="source"><pre className="email-source">{message.html || message.body}</pre></TabsContent></Tabs><Button className="copy-content" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(message.html || message.body).then(() => toast.success('Message copied'))}><Copy />Copy content</Button></CardContent>}</Card>)}
  </div>
}
