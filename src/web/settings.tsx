import { html, raw } from 'hono/html'
import { Layout } from './layout'
import { Panel } from './components'

export function SettingsPage({ 
  domains, 
  hasAuthSecret,
  publicEnabled = 'enabled',
  publicMaxInboxes = 5,
  publicAllowedDomains = '*'
}: { 
  domains: string; 
  hasAuthSecret: boolean;
  publicEnabled?: string;
  publicMaxInboxes?: number;
  publicAllowedDomains?: string;
}) {
  const initialDomains = domains.split(',').map(d => d.trim()).filter(Boolean)

  return Layout({
    title: 'Settings',
    session: true,
    children: html`
    <div class="dash-header">
      <div>
        <h2><i data-lucide="settings" class="icon-inline"></i> Configuration</h2>
        <p>Manage allowed email domains, public landing page limits, and admin password.</p>
      </div>
    </div>

    ${Panel({ title: 'Public TempMail Generator Settings', icon: 'shield', children: html`
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px">
        Configure rate limits, access controls, and allowed public domains for the temp mail generator on the home page (<code>/</code>).
      </p>

      <form id="publicSettingsForm" onsubmit="updatePublicSettings(event)">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Public Generator Access</label>
            <select id="cfg_public_enabled" style="width:100%">
              <option value="enabled" ${publicEnabled === 'enabled' ? 'selected' : ''}>Enabled (Public visitors can create inboxes)</option>
              <option value="disabled" ${publicEnabled === 'disabled' ? 'selected' : ''}>Disabled (Admin portal only)</option>
            </select>
          </div>
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Max Inboxes Per Public Session (0=∞)</label>
            <input type="number" id="cfg_public_max" min="0" value="${publicMaxInboxes}" style="width:100%" placeholder="5" />
          </div>
        </div>

        <!-- Modern SaaS Multi-Domain Selector Widget for 10+ Domains -->
        <div style="background:rgba(11,15,25,0.7);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:var(--text);display:block">Public Permitted Email Suffixes</label>
              <span style="font-size:0.75rem;color:var(--text-dim)">Select which active domains public users can choose from.</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="badge" id="publicDomainCountBadge" style="font-size:0.75rem;background:rgba(59,130,246,0.15);color:#60a5fa">
                ${publicAllowedDomains === '*' ? `All (${initialDomains.length}) Allowed` : `${publicAllowedDomains.split(',').filter(Boolean).length} / ${initialDomains.length} Selected`}
              </span>
              <button type="button" class="btn-icon" onclick="selectAllPublicDomains(true)" title="Select All Domains" style="padding:4px 10px;font-size:0.75rem">Select All</button>
              <button type="button" class="btn-icon" onclick="selectAllPublicDomains(false)" title="Clear Selected" style="padding:4px 10px;font-size:0.75rem">Clear</button>
            </div>
          </div>

          <!-- Scope segmented toggle -->
          <div class="segmented-control" style="margin-bottom:14px;max-width:380px">
            <label class="segmented-btn ${publicAllowedDomains === '*' ? 'active' : ''}" id="pub-scope-all">
              <input type="radio" name="publicDomainScope" value="*" ${publicAllowedDomains === '*' ? 'checked' : ''} onchange="handlePublicScope('*')" style="display:none" />
              <i data-lucide="globe" class="icon-sm"></i> All Domains (*)
            </label>
            <label class="segmented-btn ${publicAllowedDomains !== '*' ? 'active' : ''}" id="pub-scope-custom">
              <input type="radio" name="publicDomainScope" value="custom" ${publicAllowedDomains !== '*' ? 'checked' : ''} onchange="handlePublicScope('custom')" style="display:none" />
              <i data-lucide="filter" class="icon-sm"></i> Specific Domains
            </label>
          </div>

          <!-- Domain search filter input & scrollable grid -->
          <div id="publicDomainsContainer" style="${publicAllowedDomains === '*' ? 'display:none' : ''}">
            <div style="position:relative;margin-bottom:12px">
              <input type="text" id="searchPublicDomainInput" placeholder="Search domain list (e.g. domain.com)..." onkeyup="filterPublicDomainList()" style="padding-left:36px;width:100%;height:38px;font-size:0.85rem" />
              <i data-lucide="search" style="position:absolute;left:12px;top:11px;width:16px;height:16px;color:var(--text-dim)"></i>
            </div>

            <!-- Scrollable Badge Grid -->
            <div id="publicDomainGrid" style="max-height:170px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:8px;padding:4px">
              ${initialDomains.map(d => {
                const isChecked = publicAllowedDomains === '*' || publicAllowedDomains.split(',').map(x => x.trim()).includes(d)
                return html`
                  <label class="domain-tag public-domain-tag-item ${isChecked ? 'selected' : ''}" data-domain-name="${d}">
                    <input type="checkbox" name="publicSelectedDomains" value="${d}" ${isChecked ? 'checked' : ''} onchange="onPublicTagChange(this)" style="display:none" />
                    <i data-lucide="check" class="icon-sm tag-check" style="${isChecked ? '' : 'display:none'}"></i>
                    <span>@${d}</span>
                  </label>
                `
              })}
            </div>
          </div>
        </div>

        <div>
          <button type="submit" class="btn-primary" id="btnSavePublicCfg">
            <i data-lucide="shield-check" class="icon-sm"></i> Save Public Settings
          </button>
        </div>
      </form>
    `})}

    ${Panel({ title: 'Mail Domains', icon: 'globe', children: html`
      <div class="domain-manage-box">
        <p style="color:var(--text-dim);font-size:0.9rem">
          Manage allowed domains for creating temporary inboxes and API key permissions.
        </p>

        <div id="domainTagsList" class="domain-tags-list">
          ${initialDomains.map(d => html`
            <div class="domain-tag-item" data-domain="${d}">
              <span>${d}</span>
              <button type="button" class="domain-remove-btn" title="Remove domain" aria-label="Remove ${d}">&times;</button>
            </div>
          `)}
        </div>

        <div class="domain-add-row">
          <input type="text" id="newDomainInput" placeholder="Enter new domain (e.g. domain.com)" style="flex:1" onkeydown="if(event.key==='Enter'){event.preventDefault();addDomain();}" />
          <button type="button" class="btn-primary" id="btnAddDomain" onclick="addDomain()" style="padding:9px 20px;height:40px">
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
          <button type="submit" class="btn-primary" id="btnSaveCfg">
            <i data-lucide="lock" class="icon-sm"></i> Save Password
          </button>
        </div>
      </form>
    `})}

    <script>
      let activeDomains = ${raw(JSON.stringify(initialDomains))};

      function handlePublicScope(scope) {
        const btnAll = document.getElementById('pub-scope-all');
        const btnCustom = document.getElementById('pub-scope-custom');
        const container = document.getElementById('publicDomainsContainer');
        
        if (scope === '*') {
          btnAll.classList.add('active');
          btnCustom.classList.remove('active');
          container.style.display = 'none';
          document.querySelectorAll('input[name="publicSelectedDomains"]').forEach(input => {
            input.checked = true;
            input.parentNode.classList.add('selected');
            const check = input.parentNode.querySelector('.tag-check');
            if (check) check.style.display = '';
          });
        } else {
          btnCustom.classList.add('active');
          btnAll.classList.remove('active');
          container.style.display = 'block';
        }
        updatePublicCountBadge();
        if (window.lucide) lucide.createIcons();
      }

      function filterPublicDomainList() {
        const query = document.getElementById('searchPublicDomainInput').value.toLowerCase().trim();
        const items = document.querySelectorAll('.public-domain-tag-item');
        items.forEach(el => {
          const name = el.getAttribute('data-domain-name') || '';
          if (!query || name.toLowerCase().includes(query)) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });
      }

      function selectAllPublicDomains(select) {
        document.querySelectorAll('input[name="publicSelectedDomains"]').forEach(input => {
          input.checked = select;
          const check = input.parentNode.querySelector('.tag-check');
          if (select) {
            input.parentNode.classList.add('selected');
            if (check) check.style.display = '';
          } else {
            input.parentNode.classList.remove('selected');
            if (check) check.style.display = 'none';
          }
        });
        updatePublicCountBadge();
      }

      function onPublicTagChange(el) {
        const check = el.parentNode.querySelector('.tag-check');
        if (el.checked) {
          el.parentNode.classList.add('selected');
          if (check) check.style.display = '';
        } else {
          el.parentNode.classList.remove('selected');
          if (check) check.style.display = 'none';
        }
        updatePublicCountBadge();
      }

      function updatePublicCountBadge() {
        const checked = document.querySelectorAll('input[name="publicSelectedDomains"]:checked').length;
        const badge = document.getElementById('publicDomainCountBadge');
        const isAllScope = document.getElementById('pub-scope-all').classList.contains('active');
        
        if (badge) {
          if (isAllScope) {
            badge.textContent = 'All (' + activeDomains.length + ') Allowed';
          } else {
            badge.textContent = checked + ' / ' + activeDomains.length + ' Selected';
          }
        }
      }

      function renderDomainTags() {
        const container = document.getElementById('domainTagsList');
        if (container) {
          container.replaceChildren();

          if (activeDomains.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.style.cssText = 'color:var(--text-dim);font-size:0.85rem';
            emptyState.textContent = 'No domains added yet. Add a domain below.';
            container.appendChild(emptyState);
          } else {
            activeDomains.forEach(domain => {
              const item = document.createElement('div');
              item.className = 'domain-tag-item';
              item.dataset.domain = domain;

              const label = document.createElement('span');
              label.textContent = domain;

              const removeButton = document.createElement('button');
              removeButton.type = 'button';
              removeButton.className = 'domain-remove-btn';
              removeButton.title = 'Remove domain';
              removeButton.setAttribute('aria-label', 'Remove ' + domain);
              removeButton.textContent = '×';

              item.append(label, removeButton);
              container.appendChild(item);
            });
          }
        }

        const grid = document.getElementById('publicDomainGrid');
        if (grid) {
          const selectedDomains = new Set(
            Array.from(grid.querySelectorAll('input[name="publicSelectedDomains"]:checked')).map(input => input.value)
          );
          const renderedDomains = new Set(
            Array.from(grid.querySelectorAll('[data-domain-name]')).map(item => item.getAttribute('data-domain-name'))
          );
          const isAllScope = document.getElementById('pub-scope-all').classList.contains('active');

          grid.replaceChildren();
          activeDomains.forEach(domain => {
            const isChecked = isAllScope || selectedDomains.has(domain) || !renderedDomains.has(domain);
            const tag = document.createElement('label');
            tag.className = 'domain-tag public-domain-tag-item' + (isChecked ? ' selected' : '');
            tag.dataset.domainName = domain;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'publicSelectedDomains';
            checkbox.value = domain;
            checkbox.checked = isChecked;
            checkbox.style.display = 'none';
            checkbox.addEventListener('change', function() { onPublicTagChange(this); });

            const check = document.createElement('i');
            check.setAttribute('data-lucide', 'check');
            check.className = 'icon-sm tag-check';
            if (!isChecked) check.style.display = 'none';

            const label = document.createElement('span');
            label.textContent = '@' + domain;

            tag.append(checkbox, check, label);
            grid.appendChild(tag);
          });
          if (window.lucide) lucide.createIcons();
        }
        updatePublicCountBadge();
      }

      document.getElementById('domainTagsList').addEventListener('click', function(event) {
        const removeButton = event.target.closest('.domain-remove-btn');
        if (!removeButton || !this.contains(removeButton)) return;

        event.preventDefault();
        event.stopPropagation();
        const domain = removeButton.closest('[data-domain]').getAttribute('data-domain');
        if (domain) removeDomain(domain);
      });

      async function addDomain() {
        const input = document.getElementById('newDomainInput');
        const btn = document.getElementById('btnAddDomain');
        const val = input.value.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');
        if (!val) {
          showToast('Please enter a valid domain name', true);
          return;
        }
        if (!val.includes('.')) {
          showToast('Domain must include extension (e.g. domain.com)', true);
          return;
        }
        if (activeDomains.includes(val)) {
          showToast('Domain is already added', true);
          return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin-anim"></i> Adding...';
        if (window.lucide) lucide.createIcons();

        const oldDomains = [...activeDomains];
        activeDomains.push(val);
        renderDomainTags();

        try {
          const res = await saveDomainsToServer(activeDomains.join(','));
          if (!res.ok) {
            activeDomains = oldDomains;
            renderDomainTags();
            showToast('Failed to add domain', true);
          } else {
            input.value = '';
            showToast('Domain @' + val + ' added successfully!');
          }
        } catch (err) {
          activeDomains = oldDomains;
          renderDomainTags();
          showToast('Error connecting to server', true);
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="plus" class="icon-sm"></i> Add Domain';
          if (window.lucide) lucide.createIcons();
        }
      }

      function removeDomain(domain) {
        confirmAction('Remove Domain', 'Are you sure you want to remove @' + domain + '?', 'Remove', async function() {
          const oldDomains = [...activeDomains];
          activeDomains = activeDomains.filter(d => d !== domain);
          renderDomainTags();

          try {
            const res = await saveDomainsToServer(activeDomains.join(','));
            if (!res.ok) {
              activeDomains = oldDomains;
              renderDomainTags();
              showToast('Failed to remove domain', true);
            } else {
              showToast('Domain @' + domain + ' removed successfully!');
            }
          } catch (err) {
            activeDomains = oldDomains;
            renderDomainTags();
            showToast('Error connecting to server', true);
          }
        });
      }

      async function saveDomainsToServer(domainStr) {
        return fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mail_domains: domainStr })
        });
      }

      async function updatePublicSettings(e) {
        e.preventDefault();
        const enabled = document.getElementById('cfg_public_enabled').value;
        const max = document.getElementById('cfg_public_max').value;
        const isAllScope = document.getElementById('pub-scope-all').classList.contains('active');
        
        let allowedStr = '*';
        if (!isAllScope) {
          const checked = Array.from(document.querySelectorAll('input[name="publicSelectedDomains"]:checked')).map(el => el.value);
          allowedStr = checked.length > 0 ? checked.join(',') : '*';
        }

        const btn = document.getElementById('btnSavePublicCfg');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin-anim"></i> Saving Public Settings...';
        if (window.lucide) lucide.createIcons();

        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              public_tempmail_enabled: enabled,
              public_max_inboxes_per_session: max,
              public_allowed_domains: allowedStr
            })
          });
          if (res.ok) {
            showToast('Public settings updated successfully!');
          } else {
            showToast('Failed to update public settings', true);
          }
        } catch (err) {
          showToast('Failed to update public settings', true);
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="shield-check" class="icon-sm"></i> Save Public Settings';
          if (window.lucide) lucide.createIcons();
        }
      }

      async function updateSettings(e) {
        e.preventDefault();
        const p1 = document.getElementById('cfg_password').value;
        const p2 = document.getElementById('cfg_repeat_password').value;
        
        if (p1 && p1 !== p2) {
          showToast('Passwords do not match', true);
          return;
        }
        if (p1 && p1.length < 8) {
          showToast('Password must be at least 8 characters', true);
          return;
        }

        const btn = document.getElementById('btnSaveCfg');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin-anim"></i> Saving Password...';
        if (window.lucide) lucide.createIcons();

        try {
          if (p1) {
            const res = await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ auth_password: p1 })
            });
            if (res.ok) {
              showToast('Admin password updated successfully!');
              document.getElementById('cfg_password').value = '';
              document.getElementById('cfg_repeat_password').value = '';
            } else {
              showToast('Failed to save admin password', true);
            }
          } else {
            showToast('Please enter a new password to change it', true);
          }
        } catch (err) {
          showToast('Failed to save settings', true);
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="lock" class="icon-sm"></i> Save Password';
          if (window.lucide) lucide.createIcons();
        }
      }
    </script>
  `
  })
}
