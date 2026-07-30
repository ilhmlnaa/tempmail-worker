import { html } from 'hono/html'
import type { MaintenanceConfig } from '../../db/queries'

export function MaintenancePage({ config, timezone, timeFormat }: { config: MaintenanceConfig; timezone: string; timeFormat: string }) {
  const estimatedEnd = config.endAt ? formatDate(config.endAt, timezone, timeFormat) : ''
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.pageTitle} — VoidMail</title>
  <meta name="robots" content="noindex,nofollow" />
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="/vendor/lucide-0.468.0.min.js"></script>
</head>
<body class="maintenance-body">
  <main class="maintenance-shell">
    <div class="maintenance-brand">
      <img src="/logo.png" alt="VoidMail Logo" />
      <span>Void<span>Mail</span></span>
    </div>
    <div class="maintenance-card">
      <div class="maintenance-icon"><i data-lucide="wrench"></i></div>
      <div class="maintenance-status"><span></span> Maintenance in progress</div>
      <h1>${config.pageTitle}</h1>
      <p>${config.pageMessage}</p>
      ${estimatedEnd ? html`
        <div class="maintenance-estimate">
          <span>Estimated return</span>
          <strong>${estimatedEnd}</strong>
        </div>
      ` : ''}
      <button type="button" class="btn-primary" onclick="location.reload()">
        <i data-lucide="refresh-cw" class="icon-sm"></i> Try again
      </button>
    </div>
    <p class="maintenance-footnote">Inbound email delivery remains protected while maintenance is in progress.</p>
  </main>
  <script>lucide.createIcons();</script>
</body>
</html>`
}

export function MaintenanceBanner({ config, timezone, timeFormat }: { config: MaintenanceConfig; timezone: string; timeFormat: string }) {
  const window = config.startAt
    ? `${formatDate(config.startAt, timezone, timeFormat)}${config.endAt ? ` – ${formatDate(config.endAt, timezone, timeFormat)}` : ''}`
    : ''
  return html`
    <div class="maintenance-banner" role="status">
      <div class="landing-container maintenance-banner-inner">
        <i data-lucide="triangle-alert"></i>
        <div>
          <strong>${config.bannerTitle}</strong>
          <span>${config.bannerMessage}${window ? ` ${window}.` : ''}</span>
        </div>
      </div>
    </div>
  `
}

function formatDate(value: string, timezone: string, timeFormat: string): string {
  try {
    return new Date(value).toLocaleString('en-GB', {
      timeZone: timezone,
      hour12: timeFormat === '12',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}
