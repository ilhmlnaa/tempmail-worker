import { html } from 'hono/html'
import { Layout } from './layout'
import { Panel } from './components'

export function SettingsPage({ domains, hasAuthSecret }: { domains: string; hasAuthSecret: boolean }) {
  const initialDomains = domains.split(',').map(d => d.trim()).filter(Boolean)

  return Layout({
    title: 'Settings',
    session: true,
    children: html`
    <div class="dash-header">
      <div>
        <h2><i data-lucide="settings" class="icon-inline"></i> Configuration</h2>
        <p>Manage allowed email domains and admin authentication</p>
      </div>
    </div>

    ${Panel({ title: 'Mail Domains', icon: 'globe', children: html`
      <div class="domain-manage-box">
        <p style="color:var(--text-dim);font-size:0.9rem">
          Manage allowed domains for creating temporary inboxes and API key permissions.
        </p>

        <div id="domainTagsList" class="domain-tags-list">
          ${initialDomains.map(d => html`
            <div class="domain-tag-item" data-domain="${d}">
              <span>${d}</span>
              <button type="button" onclick="removeDomain('${d}')" title="Remove domain">&times;</button>
            </div>
          `)}
        </div>

        <div class="domain-add-row">
          <input type="text" id="newDomainInput" placeholder="Enter new domain (e.g. domain.com)" style="flex:1" onkeydown="if(event.key==='Enter'){event.preventDefault();addDomain();}" />
          <button type="button" class="btn-primary" onclick="addDomain()" style="padding:9px 20px;height:40px">
            <i data-lucide="plus" class="icon-sm"></i> Add Domain
          </button>
        </div>
      </div>
    `})}

    ${Panel({ title: 'Admin Password', icon: 'lock', children: html`
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px">
        Update your admin dashboard login password. Leave blank if you don't wish to change it.
      </p>

      <form id="settingsForm" onsubmit="updateSettings(event)">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px">
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">New Password</label>
            <input type="password" id="cfg_password" placeholder="Enter new password" style="width:100%" />
          </div>
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Repeat New Password</label>
            <input type="password" id="cfg_repeat_password" placeholder="Repeat new password" style="width:100%" />
          </div>
        </div>

        <div>
          <button type="submit" class="btn-primary" id="btnSaveCfg">Save Configuration</button>
        </div>
      </form>
    `})}

    <script>
      let activeDomains = ${JSON.stringify(initialDomains)};

      function renderDomainTags() {
        const container = document.getElementById('domainTagsList');
        if (activeDomains.length === 0) {
          container.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem">No domains added yet. Add a domain below.</p>';
          return;
        }
        container.innerHTML = activeDomains.map(d => \`
          <div class="domain-tag-item" data-domain="\${d}">
            <span>\${d}</span>
            <button type="button" onclick="removeDomain('\${d}')" title="Remove domain">&times;</button>
          </div>
        \`).join('');
      }

      function addDomain() {
        const input = document.getElementById('newDomainInput');
        const val = input.value.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');
        if (!val) {
          showToast('Please enter a valid domain name');
          return;
        }
        if (!val.includes('.')) {
          showToast('Domain must include extension (e.g. domain.com)');
          return;
        }
        if (activeDomains.includes(val)) {
          showToast('Domain is already added');
          return;
        }
        activeDomains.push(val);
        input.value = '';
        renderDomainTags();
        showToast('Domain added to list');
      }

      function removeDomain(d) {
        activeDomains = activeDomains.filter(item => item !== d);
        renderDomainTags();
        showToast('Domain removed');
      }

      async function updateSettings(e) {
        e.preventDefault();
        const btn = document.getElementById('btnSaveCfg');
        
        const pass = document.getElementById('cfg_password').value;
        const repeatPass = document.getElementById('cfg_repeat_password').value;

        if (pass || repeatPass) {
          if (pass !== repeatPass) {
            showToast('New password and repeat password do not match');
            return;
          }
          if (pass.length < 6) {
            showToast('Password must be at least 6 characters');
            return;
          }
        }

        btn.disabled = true; btn.textContent = 'Saving...';

        const payload = {
          mail_domains: activeDomains.join(',')
        };
        if (pass) payload.auth_password = pass;

        try {
          const r = await fetch('/dashboard/settings', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
          });
          if (r.ok) {
            showToast('Settings saved successfully');
            setTimeout(() => location.reload(), 1200);
          } else showToast('Failed to save settings');
        } finally {
          btn.disabled = false; btn.textContent = 'Save Configuration';
        }
      }

      function showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg; t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
      }
    </script>
    `
  })
}

