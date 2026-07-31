export function PublicFooter() {
  return (
    <footer className="border-t border-blue-500/30 bg-card/40 mt-16 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Tech Stack Col */}
          <div className="space-y-4 md:col-span-2">
            <a href="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
              <img src="/legacy/logo.png" alt="VoidMail" className="w-7 h-7 rounded-md object-contain" />
              <span>
                Void<span className="text-primary">Mail</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Instant disposable inboxes for sign-ups, testing, and keeping unwanted mail away from your primary address.
            </p>

            {/* Tech Stack Logos */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.simpleicons.org/hono/E36002"
                  alt="Hono"
                  title="Hono"
                  className="h-5 w-5 object-contain hover:scale-110 transition-transform"
                  loading="lazy"
                />
                <img
                  src="https://cdn.simpleicons.org/cloudflareworkers/F38020"
                  alt="Cloudflare Workers"
                  title="Cloudflare Workers"
                  className="h-5 w-5 object-contain hover:scale-110 transition-transform"
                  loading="lazy"
                />
                <img
                  src="https://cdn.simpleicons.org/cloudflare/F38020"
                  alt="Cloudflare D1"
                  title="Cloudflare D1"
                  className="h-5 w-5 object-contain hover:scale-110 transition-transform"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Product & Resources Nav Grid for Mobile (2 cols on mobile, separate on desktop) */}
          <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2 md:grid-cols-2">
            {/* Product Navigation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">Product</h4>
                <div className="h-0.5 flex-1 bg-linear-to-r from-primary/50 via-primary/20 to-transparent rounded-full" />
              </div>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <a href="/#generator" className="text-muted-foreground hover:text-foreground transition-colors">
                    Instant Mail
                  </a>
                </li>
                <li>
                  <a href="/#domains" className="text-muted-foreground hover:text-foreground transition-colors">
                    Domains
                  </a>
                </li>
                <li>
                  <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Navigation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">Resources</h4>
                <div className="h-0.5 flex-1 bg-linear-to-r from-primary/50 via-primary/20 to-transparent rounded-full" />
              </div>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <a href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                    Developer API
                  </a>
                </li>
                <li>
                  <a href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="mailto:security@hamdiv.me" className="text-muted-foreground hover:text-foreground transition-colors">
                    Report an issue
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-6 border-t border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center md:text-left">
          <p>© 2026 VoidMail. All rights reserved.</p>
          <p className="font-medium flex items-center gap-1 text-muted-foreground justify-center md:justify-start">
            Made With love ❤️ by{' '}
            <a
              href="https://github.com/ilhmlnaa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              Me
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
