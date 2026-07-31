import { useState, useEffect } from 'react'
import { useLocation } from 'react-router'
import { Menu, Shield, BookOpen, Globe, Mail, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const location = useLocation()
  const [activeHash, setActiveHash] = useState('')

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 30) {
        setVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setVisible(true)
      }

      // Hash scroll spy on landing page
      if (location.pathname === '/') {
        const sections = ['generator', 'domains', 'features']
        for (const sec of sections) {
          const el = document.getElementById(sec)
          if (el) {
            const rect = el.getBoundingClientRect()
            if (rect.top <= 200 && rect.bottom >= 100) {
              setActiveHash(`#${sec}`)
              break
            }
          }
        }
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const isLinkActive = (path: string, hash?: string) => {
    if (path === '/') {
      if (location.pathname !== '/') return false
      if (!hash) return !activeHash || activeHash === '#generator'
      return activeHash === hash
    }
    return location.pathname === path
  }

  const navLinks = [
    { name: 'Instant Mail', path: '/', hash: '#generator', icon: Mail },
    { name: 'Domains', path: '/', hash: '#domains', icon: Globe },
    { name: 'Features', path: '/', hash: '#features', icon: Zap },
    { name: 'Developer API', path: '/docs', icon: BookOpen },
    { name: 'Security', path: '/security', icon: Shield }
  ]

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-blue-500/30 bg-background/80 backdrop-blur-xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight group">
          <img
            src="/legacy/logo.png"
            alt="VoidMail Logo"
            className="w-8 h-8 rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"
            onError={e => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
          <span className="text-foreground">
            Void<span className="text-primary">Mail</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            v2.0
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-muted-foreground">
          {navLinks.map(link => {
            const active = isLinkActive(link.path, link.hash)
            const href = link.hash ? `${link.path}${link.hash}` : link.path
            return (
              <a
                key={link.name}
                href={href}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  active
                    ? 'text-primary font-bold bg-blue-500/10 border border-blue-500/30 shadow-xs'
                    : 'hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.name}
              </a>
            )
          })}
        </nav>

        {/* Actions (Theme Switcher) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeSwitcher />
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6 flex flex-col justify-between border-r border-blue-500/30">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 font-bold text-lg pb-4 border-b border-blue-500/20">
                  <img src="/legacy/logo.png" alt="VoidMail" className="w-7 h-7 rounded-md" />
                  <span>
                    Void<span className="text-primary">Mail</span>
                  </span>
                </div>
                <nav className="flex flex-col gap-2 font-medium text-sm">
                  {navLinks.map(link => {
                    const Icon = link.icon
                    const active = isLinkActive(link.path, link.hash)
                    const href = link.hash ? `${link.path}${link.hash}` : link.path
                    return (
                      <a
                        key={link.name}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                          active
                            ? 'text-primary font-bold bg-blue-500/15 border border-blue-500/35 shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>{link.name}</span>
                      </a>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
