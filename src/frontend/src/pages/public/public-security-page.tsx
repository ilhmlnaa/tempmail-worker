import { PublicHeader } from '@/components/public/layout/public-header'
import { PublicFooter } from '@/components/public/layout/public-footer'
import { Lock, EyeOff, Server, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PublicSecurityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Security & Privacy Policy</h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              How VoidMail keeps your identity safe and maintains zero logs on edge infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <EyeOff className="w-5 h-5 text-primary" /> Zero Logging Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                We do not track IP addresses, user agents, or personal identifiers when generating temporary email addresses. Messages are processed entirely in memory and auto-purged after retention window.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="w-5 h-5 text-primary" /> Cloudflare Edge Isolation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                VoidMail operates on Cloudflare Workers and D1 database. All connections use strict TLS 1.3 encryption with Security Headers (HSTS, CSP, X-Frame-Options).
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="w-5 h-5 text-primary" /> HTML Sanitization
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Incoming email bodies are sanitized on the fly to neutralize malicious scripts, tracking pixels, and unauthorized external image loads.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="w-5 h-5 text-primary" /> Responsible Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                If you discover a security vulnerability, please report it via email to security@hamdiv.me or check our security.txt standard.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
