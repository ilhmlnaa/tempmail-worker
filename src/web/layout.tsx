import { html, raw } from 'hono/html'

export function Layout({ title, children, session }: { title: string; children: any; session?: boolean }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TempMail</title>
  <link rel="stylesheet" href="/styles.css" />
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
        <a href="/dashboard" id="nav-dashboard">
          <i data-lucide="layout-dashboard"></i> Overview
        </a>
        <a href="/settings" id="nav-settings">
          <i data-lucide="settings"></i> Settings
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
    // Auto-active nav link based on current path
    const path = window.location.pathname;
    if(path.startsWith('/dashboard') || path === '/') {
      const el = document.getElementById('nav-dashboard');
      if (el) el.classList.add('active');
    } else if(path.startsWith('/settings')) {
      const el = document.getElementById('nav-settings');
      if (el) el.classList.add('active');
    }
  </script>
</body>
</html>`
}
