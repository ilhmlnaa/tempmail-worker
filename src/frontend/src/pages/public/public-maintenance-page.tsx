import { Wrench, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicConfig } from '@/hooks/use-public'

export function PublicMaintenancePage() {
  const config = usePublicConfig()
  const maintenance = config.data?.maintenance

  const title = maintenance?.pageTitle || 'We will be back shortly'
  const message =
    maintenance?.pageMessage ||
    'VoidMail is undergoing planned maintenance. Please check back shortly.'
  const estimatedEnd = maintenance?.endAt ? new Date(maintenance.endAt).toLocaleString() : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-radial-[at_50%_40%] from-primary/10 via-background to-background pointer-events-none" />

      <main className="w-full max-w-md relative z-10 space-y-6 text-center">
        {/* Brand Lockup */}
        <div className="flex items-center justify-center gap-2.5 font-extrabold text-2xl tracking-tight">
          <img src="/legacy/logo.png" alt="VoidMail" className="w-8 h-8 rounded-lg object-contain" />
          <span>
            Void<span className="text-primary">Mail</span>
          </span>
        </div>

        {/* Maintenance Card */}
        <Card className="border-border/60 bg-card/80 backdrop-blur shadow-xl p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 space-y-4 flex flex-col items-center">
            {/* Glowing Icon Container */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center relative">
              <Wrench className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>

            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 max-w-fit mx-auto">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Maintenance in progress</span>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-foreground pt-1">{title}</CardTitle>
          </CardHeader>

          <CardContent className="p-0 space-y-6 text-sm">
            <p className="text-muted-foreground leading-relaxed px-2">{message}</p>

            {estimatedEnd && (
              <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Estimated Return
                </span>
                <strong className="block text-sm sm:text-base font-semibold text-foreground">{estimatedEnd}</strong>
              </div>
            )}

            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full font-semibold gap-2 cursor-pointer"
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
