import { html, raw } from 'hono/html'

export function Layout({ title, children, session }: { title: string; children: any; session?: boolean }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TempMail</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  ${session ? html`
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">⚡ TempMail</div>
      <nav class="sidebar-nav">
        <a href="/" class="active">📬 Dashboard</a>
      </nav>
      <div class="sidebar-footer">
        <button onclick="logout()">🚪 Logout</button>
      </div>
    </aside>
    <main class="main">${raw(children)}</main>
  </div>
  ` : html`
  <div class="auth-page">${raw(children)}</div>
  `}
  <div id="toast"></div>
</body>
</html>`
}
