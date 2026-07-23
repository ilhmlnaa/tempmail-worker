import { Layout } from './layout'

interface Inbox {
  address: string
  domain: string
  createdAt: string
  messageCount: number
  lastMessageAt: string | null
}

export function DashboardPage({ inboxes, domains }: { inboxes: Inbox[]; domains: string[] }) {
  const totalMsgs = inboxes.reduce((s, i) => s + (i.messageCount || 0), 0)

  return Layout({
    title: 'Dashboard',
    session: true,
    children: `
    <div class="dash-header">
      <div>
        <h2>📬 Dashboard</h2>
        <p style="color:var(--text2);font-size:14px;margin-top:4px">Manage your disposable inboxes</p>
      </div>
      <button class="btn btn-primary" onclick="openCreateModal()">+ New Inbox</button>
    </div>

    <div class="dash-stats">
      <div class="stat-card">
        <div class="label">Total Inboxes</div>
        <div class="value">${inboxes.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Messages</div>
        <div class="value">${totalMsgs}</div>
      </div>
      <div class="stat-card">
        <div class="label">Domains</div>
        <div class="value" style="font-size:18px">${domains.join(', ')}</div>
      </div>
    </div>

    <!-- Create Modal -->
    <div id="createModal" class="panel hidden" style="margin-bottom:24px">
      <div class="panel-header">
        <h3>➕ Create New Inbox</h3>
        <button class="btn-icon" onclick="closeCreateModal()">✕</button>
      </div>
      <div class="panel-body">
        <form id="createForm" style="display:flex;gap:8px;flex-wrap:wrap">
          <input type="text" name="local" class="auth-input" placeholder="username (empty = random)" style="flex:1;min-width:200px" />
          <select name="domain" class="auth-input" style="width:auto">${domains.map(d => `<option value="${d}">@${d}</option>`).join('')}</select>
          <button type="submit" class="btn btn-primary">Create</button>
          <button type="button" class="btn btn-secondary" onclick="createRandom()">🎲 Random</button>
        </form>
      </div>
    </div>

    <!-- Inbox List -->
    <div class="panel">
      <div class="panel-header">
        <h3>Your Inboxes</h3>
        <span style="color:var(--text2);font-size:13px">${inboxes.length} inboxes</span>
      </div>
      <div class="panel-body" style="padding:0;overflow-x:auto">
        ${inboxes.length === 0 ? `
          <div class="empty-state">
            <div class="icon">📭</div>
            <p>No inboxes yet. Create one to get started!</p>
          </div>
        ` : `
        <table>
          <thead><tr><th>Email Address</th><th>Domain</th><th>Messages</th><th>Last Activity</th><th></th></tr></thead>
          <tbody>
            ${inboxes.map(i => `
              <tr>
                <td style="font-weight:600;cursor:pointer" onclick="viewInbox('${i.address}')">${i.address}</td>
                <td><span class="badge badge-gray">@${i.domain}</span></td>
                <td><span class="badge ${i.messageCount > 0 ? 'badge-green' : 'badge-gray'}">${i.messageCount || 0}</span></td>
                <td style="color:var(--text2);font-size:13px">${i.lastMessageAt ? new Date(i.lastMessageAt + 'Z').toLocaleString() : '-'}</td>
                <td>
                  <button class="btn btn-sm btn-danger" onclick="deleteInbox('${i.address}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}
      </div>
    </div>

    <script>
      function openCreateModal() { document.getElementById('createModal').classList.remove('hidden') }
      function closeCreateModal() { document.getElementById('createModal').classList.add('hidden') }
      
      document.getElementById('createForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const local = e.target.local.value.trim()
        const domain = e.target.domain.value
        const res = await fetch('/dashboard/inboxes', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ local: local || undefined, domain })
        })
        if(res.ok) { window.location.reload() }
        else { toast('Failed to create inbox') }
      })
      
      async function createRandom() {
        const domain = document.querySelector('[name=domain]').value
        const res = await fetch('/dashboard/inboxes', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ domain })
        })
        if(res.ok) { window.location.reload() }
      }
      
      function viewInbox(addr) { window.location = '/inbox/' + encodeURIComponent(addr) }
      
      async function deleteInbox(addr) {
        if(!confirm('Remove ${addr} from dashboard?')) return
        const res = await fetch('/dashboard/inboxes/' + encodeURIComponent(addr), { method:'DELETE' })
        if(res.ok) window.location.reload()
      }
      
      function logout() {
        fetch('/auth/logout', { method:'POST' }).then(() => window.location = '/login')
      }
      
      function toast(msg) {
        const el = document.createElement('div'); el.className='toast'; el.textContent=msg
        document.getElementById('toast').appendChild(el)
        setTimeout(() => el.remove(), 3000)
      }
    </script>
  `
  })
}
