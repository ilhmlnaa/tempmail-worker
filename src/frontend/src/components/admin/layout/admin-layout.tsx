import { useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { AdminSidebar } from './admin-sidebar'

const titles: Record<string, string> = { '/admin': 'Overview', '/admin/inboxes': 'Inboxes', '/admin/api-keys': 'API Keys', '/admin/settings': 'Settings', '/admin/maintenance': 'Maintenance', '/admin/docs': 'API Documentation' }
export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const route = useLocation()
  const title = titles[route.pathname] || (route.pathname.startsWith('/admin/inboxes/') ? 'Inbox details' : 'Admin')
  const logout = async () => { await fetch('/auth/logout', { method: 'POST' }); window.location.href = '/admin/login' }
  return <div className="admin-shell">
    <div className="desktop-sidebar"><AdminSidebar /></div>
    <div className="admin-workspace">
      <header className="admin-header">
        <div className="header-title"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button className="mobile-menu" size="icon" variant="outline"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-72 p-0"><AdminSidebar onNavigate={() => setOpen(false)} /></SheetContent></Sheet><div><span>Administration</span><h1>{title}</h1></div></div>
        <div className="header-actions"><ThemeSwitcher /><Button size="icon" variant="ghost" onClick={logout} aria-label="Sign out"><LogOut /></Button></div>
      </header>
      <main className="admin-content"><Outlet /></main>
    </div>
  </div>
}
