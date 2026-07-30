import { html, raw } from 'hono/html'
import { Layout } from '../layout'
import { Panel } from '../components'

export interface MaintenanceSettings {
  enabled: string
  startAt: string
  endAt: string
  bannerTitle: string
  bannerMessage: string
  pageTitle: string
  pageMessage: string
  showBanner: string
  allowApi: string
  allowInboxReads: string
  status: 'inactive' | 'scheduled' | 'active' | 'expired'
}

export function MaintenanceSettingsPage({
  settings,
  timezone = 'Asia/Jakarta',
  timeFormat = '24',
}: {
  settings: MaintenanceSettings
  timezone?: string
  timeFormat?: string
}) {
  const statusColors = {
    inactive: 'var(--text-dim)',
    scheduled: '#f59e0b',
    active: '#ef4444',
    expired: 'var(--text-dim)',
  }

  const statusLabels = {
    inactive: 'Inactive',
    scheduled: 'Scheduled',
    active: 'Maintenance in progress',
    expired: 'Expired',
  }

  return Layout({
    title: 'Maintenance Mode Settings',
    session: true,
    children: html`
    <div class="dash-header">
      <div>
        <h2><i data-lucide="wrench" class="icon-inline"></i> Maintenance Mode</h2>
        <p>Schedule system maintenance, configure top notification banners, or show a full maintenance landing page.</p>
      </div>
    </div>

    ${Panel({ title: 'Maintenance Status & Quick Controls', icon: 'shield-alert', children: html`
      <div style="background:rgba(11,15,25,0.7);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
        <div>
          <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em">Current Mode</div>
          <div style="font-size:1.15rem;font-weight:700;color:${statusColors[settings.status]};display:flex;align-items:center;gap:8px;margin-top:4px">
            <span class="pulse-dot" style="background:${statusColors[settings.status]}"></span>
            ${statusLabels[settings.status]}
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn-primary" onclick="triggerQuickAction('start')" id="btnStartNow" style="background:#f59e0b;border-color:#d97706">
            <i data-lucide="play" class="icon-sm"></i> Start Maintenance Now
          </button>
          <button type="button" class="btn-secondary" onclick="triggerQuickAction('end')" id="btnEndNow">
            <i data-lucide="square" class="icon-sm"></i> End Maintenance Now
          </button>
          <a href="/?preview_maintenance=true" target="_blank" class="btn-secondary" style="text-decoration:none">
            <i data-lucide="eye" class="icon-sm"></i> Preview Public Page
          </a>
        </div>
      </div>

      <form id="maintenanceForm" onsubmit="saveMaintenance(event)">
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Schedule Maintenance</label>
            <select id="cfg_maint_enabled" style="width:100%">
              <option value="enabled" ${settings.enabled === 'enabled' ? 'selected' : ''}>Enabled (Follow start & end dates)</option>
              <option value="disabled" ${settings.enabled === 'disabled' ? 'selected' : ''}>Disabled</option>
            </select>
          </div>
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Show Yellow Top Banner</label>
            <select id="cfg_maint_show_banner" style="width:100%">
              <option value="enabled" ${settings.showBanner === 'enabled' ? 'selected' : ''}>Show banner on scheduled state</option>
              <option value="disabled" ${settings.showBanner === 'disabled' ? 'selected' : ''}>Hide top banner</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Start Time (${timezone})</label>
            <input type="datetime-local" id="cfg_maint_start" value="${formatForInput(settings.startAt, timezone)}" style="width:100%" />
          </div>
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Estimated End Time (${timezone})</label>
            <input type="datetime-local" id="cfg_maint_end" value="${formatForInput(settings.endAt, timezone)}" style="width:100%" />
          </div>
        </div>

        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Public API Mode During Active Maintenance</label>
            <select id="cfg_maint_allow_api" style="width:100%">
              <option value="disabled" ${settings.allowApi === 'disabled' ? 'selected' : ''}>Block API (Return HTTP 503 JSON)</option>
              <option value="enabled" ${settings.allowApi === 'enabled' ? 'selected' : ''}>Allow API (Keep background services running)</option>
            </select>
          </div>
          <div style="flex:1;min-width:220px">
            <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:6px">Public Inbox Read Mode</label>
            <select id="cfg_maint_allow_reads" style="width:100%">
              <option value="disabled" ${settings.allowInboxReads === 'disabled' ? 'selected' : ''}>Block Inbox Reading (Full maintenance page)</option>
              <option value="enabled" ${settings.allowInboxReads === 'enabled' ? 'selected' : ''}>Allow Reading Active Inboxes</option>
            </select>
          </div>
        </div>

        <div style="background:rgba(15,23,42,0.6);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;margin-bottom:20px">
          <h4 style="margin-bottom:14px;font-size:0.95rem">Custom Copy & Messaging</h4>

          <div style="display:flex;flex-direction:column;gap:14px">
            <div>
              <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:4px">Top Notice Banner Title</label>
              <input type="text" id="cfg_maint_banner_title" value="${escape(settings.bannerTitle)}" placeholder="Scheduled Maintenance Notice" style="width:100%" />
            </div>
            <div>
              <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:4px">Top Notice Banner Body</label>
              <textarea id="cfg_maint_banner_msg" rows="2" style="width:100%" placeholder="VoidMail will be temporarily under maintenance for upgrades.">${escape(settings.bannerMessage)}</textarea>
            </div>
            <div>
              <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:4px">Full Maintenance Page Title</label>
              <input type="text" id="cfg_maint_page_title" value="${escape(settings.pageTitle)}" placeholder="VoidMail is Temporarily Down for Maintenance" style="width:100%" />
            </div>
            <div>
              <label style="font-size:0.85rem;color:var(--text-dim);display:block;margin-bottom:4px">Full Maintenance Page Description</label>
              <textarea id="cfg_maint_page_msg" rows="3" style="width:100%" placeholder="We are performing planned system upgrades. Inbox access will return shortly.">${escape(settings.pageMessage)}</textarea>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:12px">
          <button type="submit" class="btn-primary" id="btnSaveMaint">
            <i data-lucide="check" class="icon-sm"></i> Save Maintenance Schedule
          </button>
        </div>
      </form>
    `})}

    <script>
      async function saveMaintenance(e) {
        if (e) e.preventDefault();
        const btn = document.getElementById('btnSaveMaint');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin-anim"></i> Saving...';

        const payload = {
          maintenance_enabled: document.getElementById('cfg_maint_enabled').value,
          maintenance_show_banner: document.getElementById('cfg_maint_show_banner').value,
          maintenance_start_at: document.getElementById('cfg_maint_start').value,
          maintenance_end_at: document.getElementById('cfg_maint_end').value,
          maintenance_allow_api: document.getElementById('cfg_maint_allow_api').value,
          maintenance_allow_inbox_reads: document.getElementById('cfg_maint_allow_reads').value,
          maintenance_banner_title: document.getElementById('cfg_maint_banner_title').value,
          maintenance_banner_message: document.getElementById('cfg_maint_banner_msg').value,
          maintenance_page_title: document.getElementById('cfg_maint_page_title').value,
          maintenance_page_message: document.getElementById('cfg_maint_page_msg').value,
        };

        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            showToast('Maintenance settings saved!');
            setTimeout(() => location.reload(), 600);
          } else {
            const d = await res.json().catch(() => ({}));
            showToast(d.error || 'Failed to save maintenance settings', true);
          }
        } catch {
          showToast('Network error while saving settings', true);
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="check" class="icon-sm"></i> Save Maintenance Schedule';
          if (window.lucide) lucide.createIcons();
        }
      }

      async function triggerQuickAction(action) {
        if (action === 'start') {
          document.getElementById('cfg_maint_enabled').value = 'enabled';
          document.getElementById('cfg_maint_start').value = new Date().toISOString().slice(0, 16);
          await saveMaintenance(null);
        } else if (action === 'end') {
          document.getElementById('cfg_maint_enabled').value = 'disabled';
          document.getElementById('cfg_maint_start').value = '';
          document.getElementById('cfg_maint_end').value = '';
          await saveMaintenance(null);
        }
      }
    </script>
    `
  })
}

function escape(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatForInput(isoString: string, timezone: string): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString.endsWith('Z') ? isoString : `${isoString}Z`)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d)
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00'
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`
  } catch {
    return ''
  }
}
