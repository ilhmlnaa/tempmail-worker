import { html, raw } from 'hono/html'
import { MobileHeader, SidebarNav } from './components'

export function Layout({ title, children, session }: { title: string; children: any; session?: boolean }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — VoidMail</title>
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="${session ? 'admin-body' : ''}">
  ${session ? html`
  ${MobileHeader()}
  <div class="app-layout">
    ${SidebarNav()}
    <main class="main">${raw(children)}</main>
  </div>
  ` : html`
  <div class="auth-page">${raw(children)}</div>
  `}
  <div id="toast"></div>
  <dialog id="confirmModal" class="confirm-modal">
    <div class="confirm-icon"><i data-lucide="alert-triangle"></i></div>
    <h3 id="confirmTitle"></h3>
    <p id="confirmMsg"></p>
    <div class="confirm-actions">
      <button class="btn-cancel" onclick="document.getElementById('confirmModal').close()">Cancel</button>
      <button class="btn-danger" id="confirmBtn"></button>
    </div>
  </dialog>
  <script>
    lucide.createIcons();
    function toggleSidebar(show) {
      const sidebar = document.getElementById('appSidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (!sidebar) return;
      if (typeof show === 'boolean') {
        if (show) {
          sidebar.classList.add('open');
          if (backdrop) backdrop.classList.add('show');
          document.body.style.overflow = 'hidden';
        } else {
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('show');
          document.body.style.overflow = '';
        }
      } else {
        const isOpen = sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('show', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    }
    function confirmAction(title, message, btnText, onConfirm) {
      const m = document.getElementById('confirmModal');
      document.getElementById('confirmTitle').textContent = title;
      document.getElementById('confirmMsg').textContent = message;
      const btn = document.getElementById('confirmBtn');
      btn.textContent = btnText;
      btn.onclick = function() { m.close(); onConfirm(); };
      m.showModal();
      lucide.createIcons();
    }
    async function logout() {
      confirmAction('Logout', 'Are you sure you want to log out of your session?', 'Logout', async function() {
        await fetch('/auth/logout', {method:'POST'});
        location.href = '/login';
      });
    }
    const path = window.location.pathname;
    if(path === '/admin' || path === '/admin/dashboard') {
      const el = document.getElementById('nav-dashboard');
      if (el) el.classList.add('active');
    } else if(path.startsWith('/admin/inboxes')) {
      const el = document.getElementById('nav-inboxes');
      if (el) el.classList.add('active');
    } else if(path.startsWith('/admin/settings')) {
      const el = document.getElementById('nav-settings');
      if (el) el.classList.add('active');
    } else if(path.startsWith('/admin/docs')) {
      const el = document.getElementById('nav-docs');
      if (el) el.classList.add('active');
    }
  </script>
</body>
</html>`
}
