import { Activity, BookOpen, Inbox, KeyRound, Settings, Wrench } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin', label: 'Overview', icon: Activity, end: true },
  { to: '/admin/inboxes', label: 'Inboxes', icon: Inbox },
  { to: '/admin/api-keys', label: 'API Keys', icon: KeyRound },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/admin/docs', label: 'API Docs', icon: BookOpen },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <aside className="admin-sidebar">
    <div className="admin-brand"><img src="/legacy/logo.png" alt="VoidMail" className="brand-logo" /><div><strong>Void<span>Mail</span></strong><small>Control center</small></div></div>
    <nav aria-label="Admin navigation">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => cn('admin-nav-link', isActive && 'active')}><Icon /><span>{label}</span></NavLink>)}</nav>
    <a className="legacy-link" href="/legacy/admin">Open legacy admin</a>
  </aside>
}
