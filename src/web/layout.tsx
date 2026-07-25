import { html, raw } from 'hono/html'

export function Layout({ title, children, session }: { title: string; children: any; session?: boolean }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TempMail</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  ${session ? html`
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <i data-lucide="zap" class="icon-md"></i> <span>TempMail</span>
      </div>
      <nav class="sidebar-nav">
        <a href="/dashboard" id="nav-dashboard">
          <i data-lucide="layout-dashboard"></i> Overview
        </a>
        <a href="/settings" id="nav-settings">
          <i data-lucide="settings"></i> Settings
        </a>
        <a href="/docs" id="nav-docs">
          <i data-lucide="book-open"></i> API Docs
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
    const path = window.location.pathname;
    if(path.startsWith('/dashboard') || path === '/') {
      const el = document.getElementById('nav-dashboard');
      if (el) el.classList.add('active');
    } else if(path.startsWith('/settings')) {
      const el = document.getElementById('nav-settings');
      if (el) el.classList.add('active');
    } else if(path.startsWith('/docs')) {
      const el = document.getElementById('nav-docs');
      if (el) el.classList.add('active');
    }
  </script>
</body>
</html>`
}

