import { Wrench, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicConfig } from '@/hooks/use-public'

export function PublicMaintenancePage() {
  const config = usePublicConfig()
  const maintenance = config.data?.maintenance

  const title = maintenance?.pageTitle || 'System Under Maintenance'
  const message =
    maintenance?.pageMessage ||
    'We are currently upgrading VoidMail infrastructure to serve you better. Inbound email delivery remains uninterrupted.'
  const estimatedEnd = maintenance?.endAt ? new Date(maintenance.endAt).toLocaleString() : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-radial-[at_50%_40%] from-primary/15 via-background to-background pointer-events-none" />

      <main className="w-full max-w-lg relative z-10 space-y-6 text-center">
        {/* Brand Lockup */}
        <div className="flex items-center justify-center gap-2.5 font-extrabold text-2xl tracking-tight">
          <img src="/legacy/logo.png" alt="VoidMail" className="w-9 h-9 rounded-lg object-contain shadow-md" />
          <span>
            Void<span className="text-primary">Mail</span>
          </span>
        </div>

        {/* Maintenance Card */}
        <Card className="border-primary/30 bg-card shadow-2xl p-6 space-y-6">
          <CardHeader className="p-0 space-y-4">
            {/* Glowing Icon Container */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-inner relative">
              <Wrench className="w-8 h-8 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" /> Maintenance in progress
            </div>

            <CardTitle className="text-2xl font-black tracking-tight">{title}</CardTitle>
          </CardHeader>

          <CardContent className="p-0 space-y-6 text-sm">
            <p className="text-muted-foreground leading-relaxed">{message}</p>

            {estimatedEnd && (
              <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estimated Return
                </span>
                <strong className="block text-base font-bold text-foreground">{estimatedEnd}</strong>
              </div>
            )}

            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full font-bold shadow-md gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </CardContent>
        </Card>

        {/* Footnote */}
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          Inbound email delivery remains active and protected on Edge.
        </p>
      </main>
    </div>
  )
}
