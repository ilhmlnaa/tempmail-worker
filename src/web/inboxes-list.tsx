import { html } from 'hono/html'
import { Layout } from './layout'
import { Panel, StatCard, IconButton } from './components'
import type { Inbox } from '../db/queries'

export function InboxesListPage({ 
  inboxes, totalInboxes, totalMessages, currentPage 
}: { 
  inboxes: Inbox[]; totalInboxes: number; totalMessages: number; currentPage: number 
}) {
  const totalPages = Math.ceil(totalInboxes / 20) || 1
  const baseUrl = '/inboxes'

  return Layout({
    title: 'Generated Inboxes',
    session: true,
    children: html`
    <div class="dash-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2><i data-lucide="inbox" class="icon-inline"></i> Inboxes</h2>
        <p>All temporary email inboxes currently active in the system.</p>
      </div>
      <div>
        <button class="btn-primary" onclick="refreshInboxes()" id="btnRefresh">
          <i data-lucide="refresh-cw" class="icon-sm"></i> Refresh
        </button>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-bottom: 24px;">
      ${StatCard({ label: 'Total Inboxes', value: totalInboxes })}
      ${StatCard({ label: 'Total Messages Received', value: totalMessages })}
    </div>

    ${Panel({ title: 'Generated Inboxes', icon: 'list', children: html`
      <div id="inboxListContainer">
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
                  ${IconButton({ icon: 'trash-2', onclick: `del('${i.address}')`, title: 'Delete', variant: 'danger' })}
                </div>
              </div>
            </div>
          `)}
        </div>

        ${totalPages > 1 ? html`
        <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:24px; padding-top:16px; border-top:1px solid var(--border)">
          <a href="${baseUrl}?page=${currentPage - 1}" class="btn-primary" style="${currentPage <= 1 ? 'pointer-events:none;opacity:0.5' : ''}">
            <i data-lucide="chevron-left" class="icon-inline"></i> Prev
          </a>
          
          <span style="color:var(--text-dim); font-size:0.9rem;">
            Page <strong>${currentPage}</strong> of ${totalPages}
          </span>
          
          <a href="${baseUrl}?page=${currentPage + 1}" class="btn-primary" style="${currentPage >= totalPages ? 'pointer-events:none;opacity:0.5' : ''}">
            Next <i data-lucide="chevron-right" class="icon-inline" style="margin-left:8px; margin-right:0"></i>
          </a>
        </div>
        ` : ''}
      </div>
    `})}

    <script>
      function showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg; t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
      }

      async function refreshInboxes() {
        const btn = document.getElementById('btnRefresh');
        const icon = btn.querySelector('i');
        btn.disabled = true;
        icon.classList.add('spin-anim'); // assume you have this css, or we fallback to reload
        
        try {
          // Soft-refresh the list container via AJAX
          const res = await fetch(window.location.href);
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const newContainer = doc.getElementById('inboxListContainer');
          if(newContainer) {
            document.getElementById('inboxListContainer').innerHTML = newContainer.innerHTML;
            lucide.createIcons(); // re-init icons
            showToast('List refreshed');
          } else {
            location.reload();
          }
        } catch(e) {
          location.reload();
        } finally {
          btn.disabled = false;
          icon.classList.remove('spin-anim');
        }
      }

      async function del(addr) {
        confirmAction('Delete Inbox', 'Are you sure you want to delete ' + addr + '? All messages will be lost.', 'Delete', async function() {
          const r = await fetch('/dashboard/inboxes/' + encodeURIComponent(addr), { method: 'DELETE' });
          if (r.ok) {
            const row = document.getElementById('row-' + addr);
            if (row) row.remove();
            showToast('Deleted ' + addr);
          } else {
            showToast('Failed to delete');
          }
        });
      }
    </script>
    <style>
      .spin-anim { animation: spin 1s linear infinite; }
      @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
    `
  })
}
