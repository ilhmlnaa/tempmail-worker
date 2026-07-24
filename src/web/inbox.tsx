import { html, raw } from 'hono/html'
import { Layout } from './layout'
import { IconButton, EmptyState } from './components'

interface Message {
  id: string
  from: string
  subject: string
  body: string
  html?: string | null
  createdAt: string
}

export function InboxPage({ address, messages }: { address: string; messages: Message[] }) {
  return Layout({
    title: address,
    session: true,
    children: html`
    <div class="dash-header">
      <div>
        <h2 style="font-family:monospace;display:flex;align-items:center;gap:12px">
          <i data-lucide="mail" class="icon-inline"></i> ${address}
        </h2>
        <p>${messages.length} message${messages.length !== 1 ? 's' : ''}</p>
      </div>
      <div class="actions" style="gap:8px">
        ${IconButton({ icon: 'clipboard', onclick: 'copyAddress()', title: 'Copy address' })}
        ${IconButton({ icon: 'refresh-cw', onclick: 'refresh()', title: 'Refresh' })}
        <a href="/dashboard" class="btn-icon" title="Dashboard"><i data-lucide="arrow-left"></i></a>
      </div>
    </div>

    ${messages.length === 0 ? html`
      <div class="panel">
        ${EmptyState({
          icon: 'inbox',
          message: 'No messages yet.',
          subMessage: `Send an email to <strong>${address}</strong>`
        })}
      </div>
    ` : messages.map((msg, i) => html`
      <div class="panel msg-panel" id="msg-${i}">
        <div class="panel-header msg-header" onclick="toggleMsg('${i}')">
          <div class="msg-meta">
            <div class="msg-subject">
              <i data-lucide="${msg.subject ? 'message-square' : 'mail'}" class="icon-sm"></i>
              ${escape(msg.subject) || '(no subject)'}
            </div>
            <div class="msg-from"><span class="text-dim">From:</span> ${escape(msg.from)}</div>
            <div class="text-dim" style="font-size:0.75rem">${formatDate(msg.createdAt)}</div>
          </div>
          <div class="msg-toggle">
            <span class="badge" id="badge-${i}">New</span>
            <i data-lucide="chevron-down" id="chevron-${i}" class="icon-sm" style="transition:transform 0.2s"></i>
          </div>
        </div>
        <div class="panel-body msg-detail hidden" id="detail-${i}">
          <div class="msg-toolbar">
            <div class="toggle-group">
              <button class="toggle-btn active" id="btn-rendered-${i}" onclick="switchView('${i}','rendered')">Rendered</button>
              <button class="toggle-btn" id="btn-raw-${i}" onclick="switchView('${i}','raw')">Raw</button>
              ${msg.html ? html`<button class="toggle-btn" id="btn-source-${i}" onclick="switchView('${i}','source')">Source</button>` : ''}
            </div>
            <button class="btn-icon" onclick="event.stopPropagation();copyText('msg-source-${i}')" title="Copy content">
              <i data-lucide="copy"></i>
            </button>
          </div>
          <div class="msg-viewport">
            <div class="msg-view active" id="view-rendered-${i}">
              ${msg.html
                ? html`<iframe data-html="${encodeURIComponent(msg.html || '')}" sandbox="allow-same-origin" class="msg-iframe"></iframe>`
                : html`<pre class="msg-pre">${escape(msg.body)}</pre>`
              }
            </div>
            <div class="msg-view" id="view-raw-${i}">
              <pre class="msg-pre">${escape(msg.body)}</pre>
            </div>
            ${msg.html ? html`
              <div class="msg-view" id="view-source-${i}">
                <pre class="msg-pre" id="msg-source-${i}">${escape(msg.html)}</pre>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `)}

    <script>
      document.querySelectorAll('iframe[data-html]').forEach(iframe => {
        iframe.srcdoc = decodeURIComponent(iframe.dataset.html)
      })

      function toggleMsg(id) {
        const detail = document.getElementById('detail-' + id)
        const badge = document.getElementById('badge-' + id)
        const chevron = document.getElementById('chevron-' + id)
        const isHidden = detail.classList.toggle('hidden')
        if (badge) badge.style.display = isHidden ? '' : 'none'
        if (chevron) chevron.style.transform = isHidden ? '' : 'rotate(180deg)'
        lucide.createIcons()
      }

      function switchView(id, mode) {
        ['rendered','raw','source'].forEach(m => {
          const btn = document.getElementById('btn-'+m+'-'+id)
          const view = document.getElementById('view-'+m+'-'+id)
          if (btn) btn.classList.toggle('active', m === mode)
          if (view) view.classList.toggle('active', m === mode)
        })
      }

      function copyAddress() {
        navigator.clipboard.writeText('${address}')
        showToast('Address copied')
      }

      function copyText(elId) {
        const el = document.getElementById(elId)
        if (!el) return
        navigator.clipboard.writeText(el.textContent || '')
        showToast('Content copied')
      }

      function refresh() { window.location.reload() }

      function showToast(msg) {
        const t = document.getElementById('toast')
        t.textContent = msg; t.classList.add('show')
        setTimeout(() => t.classList.remove('show'), 3000)
      }
    </script>
    `
  })
}

function escape(s: string): string {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function formatDate(d: string): string {
  try { return new Date(d + 'Z').toLocaleString() } catch { return d }
}
