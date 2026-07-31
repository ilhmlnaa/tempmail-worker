import { html, raw } from 'hono/html'
import { MobileHeader, SidebarNav } from './components'

export function Layout({ title, children, session }: { title: string; children: any; session?: boolean }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — VoidMail</title>
  <link rel="icon" type="image/png" href="/legacy/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/legacy/styles.css" />
  <script src="/vendor/lucide-0.468.0.min.js"></script>
  <script src="/vendor/chart-4.4.7.umd.js"></script>
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
  <div id="confirmModal" class="confirm-modal-overlay" onclick="if(event.target===this)closeConfirmModal()">
    <div class="confirm-modal-card">
      <div class="confirm-icon"><i data-lucide="alert-triangle"></i></div>
      <h3 id="confirmTitle">Confirm Action</h3>
      <p id="confirmMsg">Are you sure?</p>
      <div id="confirmInputContainer" style="display:none;margin-top:14px">
        <input type="number" id="promptInput" style="width:100%" placeholder="Enter a value..." />
      </div>
      <div class="confirm-actions" style="margin-top:20px">
        <button type="button" class="btn-cancel" onclick="closeConfirmModal()">Cancel</button>
        <button type="button" class="btn-danger" id="confirmBtn">Confirm</button>
      </div>
    </div>
  </div>
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
    let _toastTimer = null;
    function showToast(msg, isError = false) {
      const t = document.getElementById('toast');
      if (!t) return;
      if (_toastTimer) clearTimeout(_toastTimer);

      t.style.border = isError ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)';
      t.style.boxShadow = isError ? '0 4px 20px rgba(239, 68, 68, 0.25)' : '0 4px 20px rgba(16, 185, 129, 0.25)';
      const icon = isError ? '<i data-lucide="alert-circle" style="color:#ef4444;width:18px;height:18px;margin-right:8px;vertical-align:middle"></i>' : '<i data-lucide="check-circle" style="color:#10b981;width:18px;height:18px;margin-right:8px;vertical-align:middle"></i>';
      t.innerHTML = icon + '<span style="vertical-align:middle">' + msg + '</span>';
      if (window.lucide) lucide.createIcons();

      t.classList.add('show');
      _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
    }

    function closeConfirmModal() {
      const m = document.getElementById('confirmModal');
      if (m) m.classList.remove('show');
      const inputContainer = document.getElementById('confirmInputContainer');
      if (inputContainer) inputContainer.style.display = 'none';
    }

    function confirmAction(title, message, btnText, onConfirm) {
      const m = document.getElementById('confirmModal');
      if (!m) {
        if (confirm(message)) onConfirm();
        return;
      }
      
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMsg');
      const btn = document.getElementById('confirmBtn');
      const inputContainer = document.getElementById('confirmInputContainer');
      if (inputContainer) inputContainer.style.display = 'none';
      
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      if (btn) {
        btn.textContent = btnText;
        btn.onclick = function() {
          closeConfirmModal();
          onConfirm();
        };
      }

      m.classList.add('show');
      if (window.lucide) lucide.createIcons();
    }

    function promptAction(title, message, placeholder, defaultValue, btnText, onSubmit) {
      const m = document.getElementById('confirmModal');
      if (!m) return;

      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMsg');
      const btn = document.getElementById('confirmBtn');
      const inputContainer = document.getElementById('confirmInputContainer');
      const input = document.getElementById('promptInput');

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      if (inputContainer) inputContainer.style.display = 'block';
      if (input) {
        input.placeholder = placeholder || '';
        input.value = defaultValue || '';
        setTimeout(() => input.focus(), 50);
      }

      if (btn) {
        btn.textContent = btnText || 'Submit';
        btn.onclick = function() {
          const val = input ? input.value : '';
          closeConfirmModal();
          onSubmit(val);
        };
      }

      m.classList.add('show');
      if (window.lucide) lucide.createIcons();
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
