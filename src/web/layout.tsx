import { html, raw } from 'hono/html'

export function Layout({ title, children, session }: { title: string; children: any; session?: boolean }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TempMail</title>
  <link rel="stylesheet" href="/styles.css" />
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  ${session ? html`
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <i data-lucide="zap" class="icon-md"></i> TempMail
      </div>
      <nav class="sidebar-nav">
        <a href="/" class="active">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </a>
      </nav>
      <div class="sidebar-footer">
        <button onclick="logout()">
          <i data-lucide="log-out"></i> Logout
        </button>
      </div>
    </aside>
    <main class="main">${raw(children)}</main>
  </div>
  ` : html`
  <div class="auth-page">${raw(children)}</div>
  `}
  <div id="toast"></div>
  <script>
    lucide.createIcons();
  </script>
</body>
</html>`
}
