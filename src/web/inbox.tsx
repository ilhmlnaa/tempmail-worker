import { Layout } from './layout'

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
    children: `
    <div class="dash-header">
      <div>
        <h2>📨 ${address}</h2>
        <p style="color:var(--text2);font-size:14px;margin-top:4px">${messages.length} messages</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="copyAddress()">📋 Copy</button>
        <button class="btn btn-primary" onclick="refresh()">🔄 Refresh</button>
        <a href="/" class="btn btn-secondary">⬅ Dashboard</a>
      </div>
    </div>

    ${messages.length === 0 ? `
      <div class="panel">
        <div class="panel-body">
          <div class="empty-state">
            <div class="icon">📭</div>
            <p>No messages yet. Send an email to <strong>${address}</strong>!</p>
          </div>
        </div>
      </div>
    ` : messages.map((msg, i) => `
      <div class="panel" style="cursor:pointer" onclick="toggleMsg(this)" id="msg-${i}">
        <div class="panel-header" style="display:flex;align-items:flex-start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px;margin-bottom:2px">${escape(msg.subject)}</div>
            <div style="font-size:12px;color:var(--text2)">From: ${escape(msg.from)}</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">${formatDate(msg.createdAt)}</div>
          </div>
          <span class="badge badge-green">New</span>
        </div>
        <div class="panel-body msg-detail hidden">
          <div class="msg-body">${escape(msg.body)}</div>
        </div>
      </div>
    `).join('')}

    <script>
      function toggleMsg(el) {
        const detail = el.querySelector('.msg-detail')
        const badge = el.querySelector('.badge')
        detail.classList.toggle('hidden')
        if(badge) badge.classList.add('hidden')
      }
      
      function copyAddress() {
        navigator.clipboard.writeText('${address}')
        toast('Copied!')
      }
      
      function refresh() { window.location.reload() }
      
      function toast(msg) {
        const el = document.createElement('div'); el.className='toast'; el.textContent=msg
        document.getElementById('toast').appendChild(el)
        setTimeout(() => el.remove(), 3000)
      }
      
      function formatDate(d) { return d }
    </script>
    <script>
      // Server-side formatDate replacement
      function formatDate(d) { return new Date(d + 'Z').toLocaleString() }
    </script>
  `
  })
}

function escape(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function formatDate(d: string): string {
  try { return new Date(d + 'Z').toLocaleString() } catch { return d }
}
