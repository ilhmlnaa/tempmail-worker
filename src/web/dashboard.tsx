import { html } from 'hono/html'
import { Layout } from './layout'
import type { Inbox } from '../db/queries'

export function DashboardPage({ inboxes, domains, apiKeys }: { inboxes: Inbox[]; domains: string[]; apiKeys: any[] }) {
  const totalMsgs = inboxes.reduce((s, i) => s + (i.messageCount || 0), 0)

  return Layout({
    title: 'Dashboard',
    session: true,
    children: html`
    <div class="dash-header">
      <div>
        <h2>Dashboard Overview</h2>
        <p>Manage all disposable inboxes and API keys</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Inboxes</h3>
        <div class="val">${inboxes.length}</div>
      </div>
      <div class="stat-card">
        <h3>Total Messages</h3>
        <div class="val">${totalMsgs}</div>
      </div>
      <div class="stat-card">
        <h3>Active Domains</h3>
        <div class="val">${domains.length}</div>
      </div>
    </div>

    <!-- API Keys Panel -->
    <div class="panel">
      <h3><i data-lucide="key" class="icon-inline"></i> API Keys & Permissions</h3>
      
      <form class="create-form" onsubmit="createApiKey(event)" style="margin-bottom:24px;">
        <div class="input-group">
          <span class="at"><i data-lucide="globe" class="icon-sm"></i></span>
          <input type="text" id="apiDomains" placeholder="Domains (e.g. example.com, test.com) or * for all" />
        </div>
        <button type="submit" class="btn-primary" id="btnCreateKey">Generate Key</button>
      </form>

      <div class="inbox-list">
        ${!apiKeys || apiKeys.length === 0 ? html`<p style="color:var(--text-dim);text-align:center;padding:20px">No API keys generated yet.</p>` : ''}
        ${apiKeys && apiKeys.map(k => html`
          <div class="inbox-item" id="keyrow-${k.id}">
            <div class="inbox-info">
              <h4 style="color:var(--primary)">${k.keyValue}</h4>
              <p>Domains: <span style="color:#fff">${k.permittedDomains}</span> &nbsp;&bull;&nbsp; Created: ${new Date(k.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="actions">
              <button onclick="delKey('${k.id}')" class="btn-icon danger" title="Revoke Key"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        `)}
      </div>
    </div>

    <!-- Create Inbox -->
    <div class="panel">
      <h3><i data-lucide="plus-circle" class="icon-inline"></i> Create Custom Inbox</h3>
      <form class="create-form" onsubmit="create(event)">
        <div class="input-group">
          <input type="text" id="local" placeholder="random (optional)" />
          <span class="at">@</span>
          <select id="domain">
            ${domains.map(d => html`<option value="${d}">${d}</option>`)}
          </select>
        </div>
        <button type="submit" class="btn-primary" id="btnCreate">Create Inbox</button>
      </form>
    </div>

    <!-- Inbox List -->
    <div class="panel">
      <h3><i data-lucide="list" class="icon-inline"></i> All Generated Inboxes</h3>
      <div class="inbox-list">
        ${inboxes.length === 0 ? html`<p style="color:var(--text-dim);text-align:center;padding:20px">No inboxes yet.</p>` : ''}
        ${inboxes.map(i => html`
          <div class="inbox-item" id="row-${i.address}">
            <div class="inbox-info">
              <h4><a href="/inbox/${encodeURIComponent(i.address)}">${i.address}</a></h4>
              <p>Created: ${new Date(i.createdAt).toLocaleString()}</p>
            </div>
            <div class="inbox-meta">
              <span class="badge">${i.messageCount || 0} msgs</span>
              <div class="actions">
                <a href="/inbox/${encodeURIComponent(i.address)}" class="btn-icon" title="View Inbox"><i data-lucide="eye"></i></a>
                <button onclick="del('${i.address}')" class="btn-icon danger" title="Delete"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          </div>
        `)}
      </div>
    </div>

    <script>
      function showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg; t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
      }
      
      async function create(e) {
        e.preventDefault();
        const btn = document.getElementById('btnCreate');
        btn.disabled = true; btn.textContent = 'Creating...';
        const local = document.getElementById('local').value;
        const domain = document.getElementById('domain').value;
        try {
          const r = await fetch('/dashboard/inboxes', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ local, domain })
          });
          if (r.ok) location.reload();
          else showToast('Failed to create inbox');
        } finally {
          btn.disabled = false; btn.textContent = 'Create Inbox';
        }
      }

      async function del(addr) {
        if (!confirm('Delete inbox ' + addr + '?')) return;
        const r = await fetch('/dashboard/inboxes/' + encodeURIComponent(addr), { method: 'DELETE' });
        if (r.ok) {
          const row = document.getElementById('row-' + addr);
          if (row) row.remove();
          showToast('Deleted ' + addr);
        } else {
          showToast('Failed to delete');
        }
      }

      async function createApiKey(e) {
        e.preventDefault();
        const btn = document.getElementById('btnCreateKey');
        btn.disabled = true; btn.textContent = 'Generating...';
        const domains = document.getElementById('apiDomains').value;
        try {
          const r = await fetch('/dashboard/apikeys', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ domains })
          });
          if (r.ok) location.reload();
          else showToast('Failed to generate key');
        } finally {
          btn.disabled = false; btn.textContent = 'Generate Key';
        }
      }

      async function delKey(id) {
        if (!confirm('Revoke this API Key?')) return;
        const r = await fetch('/dashboard/apikeys/' + encodeURIComponent(id), { method: 'DELETE' });
        if (r.ok) {
          const row = document.getElementById('keyrow-' + id);
          if (row) row.remove();
          showToast('Key revoked');
        } else {
          showToast('Failed to revoke');
        }
      }

      async function logout() {
        await fetch('/auth/logout', {method:'POST'});
        location.href = '/login';
      }
    </script>
    `
  })
}
