import { html } from 'hono/html'
import { Layout } from '../layout'
import { Panel, StatCard, IconButton } from '../components'
import type { Inbox } from '../../db/queries'

function formatDate(value: string, timezone: string, timeFormat: string): string {
  return new Date(value.endsWith('Z') ? value : `${value}Z`).toLocaleString('en-GB', {
    timeZone: timezone,
    hour12: timeFormat === '12',
  })
}

function escape(s: string): string {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export function InboxesListPage({ 
  inboxes, totalInboxes, totalMessages, filteredTotal, currentPage, search, messageFilter, timezone = 'Asia/Jakarta', timeFormat = '24'
}: { 
  inboxes: Inbox[]; totalInboxes: number; totalMessages: number; filteredTotal: number; currentPage: number; search: string; messageFilter: 'all' | 'empty' | 'has-messages'; timezone?: string; timeFormat?: string
}) {
  const totalPages = Math.ceil(filteredTotal / 20) || 1
  const baseUrl = '/admin/inboxes'
  const filterParams = new URLSearchParams()
  if (search) filterParams.set('q', search)
  if (messageFilter !== 'all') filterParams.set('messages', messageFilter)
  const qs = filterParams.toString() ? `&${filterParams.toString()}` : ''

  return Layout({
    title: 'Manage Inboxes',
    session: true,
    children: html`
    <div class="dash-header" style="margin-bottom: 24px;">
      <div>
        <h2><i data-lucide="inbox" class="icon-inline"></i> Manage Inboxes</h2>
        <p>Search, filter, and purge temporary addresses.</p>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <div class="dropdown">
          <button class="btn-secondary" onclick="toggleDropdown('bulkActions')">
            <i data-lucide="trash-2" class="icon-sm text-danger"></i> Bulk Cleanup <i data-lucide="chevron-down" class="icon-sm"></i>
          </button>
          <div class="dropdown-menu" id="bulkActions" style="right:0;">
            <button onclick="bulkDelete('empty')"><i data-lucide="mail-x"></i> Delete all empty inboxes</button>
            <button onclick="promptBulkDeleteOlderThan()"><i data-lucide="calendar-off"></i> Delete older than N days...</button>
          </div>
        </div>
        <button class="btn-primary" onclick="location.reload()">
          <i data-lucide="refresh-cw" class="icon-sm"></i> Refresh
        </button>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom: 24px;">
      ${StatCard({ label: 'Total Inboxes', value: totalInboxes })}
      ${StatCard({ label: 'Total Messages', value: totalMessages })}
      ${StatCard({ label: 'Matches Filter', value: filteredTotal, icon: 'filter', color: '#a78bfa' })}
    </div>

    <div class="panel" style="margin-bottom: 24px; padding: 16px;">
      <form action="/admin/inboxes" method="GET" style="display: flex; gap: 12px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <input type="text" name="q" value="${escape(search)}" placeholder="Search by address or domain..." style="width: 100%;" />
        </div>
        <select name="messages" style="min-width: 160px;">
          <option value="all" ${messageFilter === 'all' ? 'selected' : ''}>All Inboxes</option>
          <option value="empty" ${messageFilter === 'empty' ? 'selected' : ''}>Empty Only (0 msgs)</option>
          <option value="has-messages" ${messageFilter === 'has-messages' ? 'selected' : ''}>Has Messages (>0 msgs)</option>
        </select>
        <button type="submit" class="btn-primary">Filter</button>
        ${search || messageFilter !== 'all' ? html`<a href="/admin/inboxes" class="btn-secondary">Clear</a>` : ''}
      </form>
    </div>

    ${Panel({ title: 'Inbox Results', icon: 'list', children: html`
      <div id="inboxListContainer">
        <div class="inbox-list">
          ${inboxes.length === 0 ? html`<div class="widget-empty"><i data-lucide="search-x"></i><p>No inboxes found matching the criteria.</p></div>` : ''}
          ${inboxes.map(i => html`
            <div class="inbox-item" id="row-${i.address}">
              <div class="inbox-info">
                <h4><a href="/admin/inbox/${encodeURIComponent(i.address)}">${i.address}</a></h4>
                <p>Created: ${formatDate(i.createdAt, timezone, timeFormat)}</p>
              </div>
              <div class="inbox-meta">
                <span class="badge">${i.messageCount || 0} msgs</span>
                <div class="actions">
                  <a href="/admin/inbox/${encodeURIComponent(i.address)}" class="btn-icon" title="View Inbox"><i data-lucide="eye"></i></a>
                  ${IconButton({ icon: 'trash-2', onclick: `del('${i.address}')`, title: 'Delete', variant: 'danger' })}
                </div>
              </div>
            </div>
          `)}
        </div>

        ${totalPages > 1 ? html`
        <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:24px; padding-top:16px; border-top:1px solid var(--border)">
          <a href="${baseUrl}?page=${currentPage - 1}${qs}" class="btn-primary" style="${currentPage <= 1 ? 'pointer-events:none;opacity:0.5' : ''}">
            <i data-lucide="chevron-left" class="icon-inline"></i> Prev
          </a>
          
          <span style="color:var(--text-dim); font-size:0.9rem;">
            Page <strong>${currentPage}</strong> of ${totalPages}
          </span>
          
          <a href="${baseUrl}?page=${currentPage + 1}${qs}" class="btn-primary" style="${currentPage >= totalPages ? 'pointer-events:none;opacity:0.5' : ''}">
            Next <i data-lucide="chevron-right" class="icon-inline" style="margin-left:8px; margin-right:0"></i>
          </a>
        </div>
        ` : ''}
      </div>
    `})}

    <script>
      function escapeHtml(s) {
        return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function toggleDropdown(id) {
        const menu = document.getElementById(id);
        if (!menu) return;
        const isShow = menu.classList.toggle('show');
        if (isShow) {
          setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
              if (!menu.contains(e.target) && !e.target.closest('.dropdown')) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
              }
            });
          }, 10);
        }
      }

      async function bulkDelete(mode, days) {
        const label = mode === 'empty' ? 'all empty inboxes' : 'inboxes older than ' + days + ' days';
        confirmAction('Bulk Delete Inboxes', 'Are you sure you want to delete ' + label + '? This action cannot be undone.', 'Delete All', async function() {
          try {
            const res = await fetch('/dashboard/inboxes/bulk-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode, days })
            });
            const data = await res.json();
            if (data.ok) {
              showToast('Deleted ' + data.deleted + ' inbox(es)');
              setTimeout(() => location.reload(), 800);
            } else {
              showToast(data.error || 'Failed to delete');
            }
          } catch (e) {
            showToast('Bulk delete failed');
          }
        });
      }

      function promptBulkDeleteOlderThan() {
        promptAction(
          'Delete Old Inboxes',
          'Enter the age threshold. Every inbox created before this many days will be permanently deleted.',
          'Days between 1 and 365',
          '7',
          'Continue',
          function(input) {
            const days = parseInt(input, 10);
            if (isNaN(days) || days < 1 || days > 365) {
              showToast('Enter a whole number between 1 and 365.', true);
              return;
            }
            bulkDelete('older-than', days);
          }
        );
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
