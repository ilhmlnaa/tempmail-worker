import { html } from 'hono/html'
import { Layout } from './layout'

export function SettingsPage({ domains, hasAuthSecret }: { domains: string; hasAuthSecret: boolean }) {
  return Layout({
    title: 'Settings',
    session: true,
    children: html`
    <div class="dash-header">
      <div>
        <h2>⚙️ Configuration</h2>
        <p>Manage allowed domains and admin authentication</p>
      </div>
    </div>

    <div class="panel">
      <h3><i data-lucide="globe" class="icon-inline"></i> Mail Domains</h3>
      <p style="color:var(--text-dim); margin-bottom:16px;">
        Enter domains you want to use, separated by commas. These will appear in the creation dropdown and API generation.
      </p>
      <form class="create-form" style="display:block" onsubmit="updateSettings(event)">
        <div class="input-group" style="margin-bottom:16px;">
          <input type="text" id="cfg_domains" value="${domains}" style="width:100%" placeholder="e.g. example.com, mydomain.com" />
        </div>
        
        <h3 style="margin-top:40px;"><i data-lucide="lock" class="icon-inline"></i> Admin Password</h3>
        <p style="color:var(--text-dim); margin-bottom:16px;">
          Change your dashboard login password. Leave blank to keep the current password.
        </p>
        <div class="input-group" style="margin-bottom:24px;">
          <input type="password" id="cfg_password" style="width:100%" placeholder="New password" />
        </div>
        
        <button type="submit" class="btn-primary" id="btnSaveCfg">Save Configuration</button>
      </form>
    </div>

    <script>
      async function updateSettings(e) {
        e.preventDefault();
        const btn = document.getElementById('btnSaveCfg');
        btn.disabled = true; btn.textContent = 'Saving...';
        
        const mail_domains = document.getElementById('cfg_domains').value;
        const auth_password = document.getElementById('cfg_password').value;
        
        const payload = {};
        if (mail_domains) payload.mail_domains = mail_domains;
        if (auth_password) payload.auth_password = auth_password;

        try {
          const r = await fetch('/dashboard/settings', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
          });
          if (r.ok) {
            showToast('Settings saved successfully');
            setTimeout(() => location.reload(), 1500);
          } else showToast('Failed to save settings');
        } finally {
          btn.disabled = false; btn.textContent = 'Save Configuration';
        }
      }
    </script>
    `
  })
}
