import { html, raw } from 'hono/html'

export function Panel({ title, icon, children }: { title: string; icon: string; children: any }) {
  return html`
    <div class="panel">
      <h3><i data-lucide="${icon}" class="icon-inline"></i> ${title}</h3>
      ${raw(children)}
    </div>
  `
}

export function StatCard({ label, value, subText, icon, color }: { label: string; value: string | number; subText?: string; icon?: string; color?: string }) {
  return html`
    <div class="stat-card">
      <h3>${label}</h3>
      <div class="val">${value}</div>
      ${subText ? html`
        <div class="stat-sub">
          ${icon ? html`<i data-lucide="${icon}" class="icon-sm" style="color:${color || '#60a5fa'}"></i>` : ''}
          ${subText}
        </div>
      ` : ''}
    </div>
  `
}

export function MobileHeader() {
  return html`
    <div class="mobile-header">
      <div class="mobile-logo">
        <img src="/logo.png" alt="VoidMail Logo" class="brand-logo-img" /> 
        <span>Void<span style="color:var(--primary)">Mail</span></span>
      </div>
      <button class="mobile-menu-btn" onclick="toggleSidebar(true)" aria-label="Open Menu">
        <i data-lucide="menu"></i>
      </button>
    </div>
    <div class="sidebar-backdrop" onclick="toggleSidebar(false)"></div>
  `
}

export function SidebarNav() {
  return html`
    <aside class="sidebar" id="appSidebar">
      <div class="sidebar-logo">
        <div style="display:flex;align-items:center;gap:10px">
          <img src="/logo.png" alt="VoidMail Logo" class="brand-logo-img" /> 
          <span>Void<span style="color:var(--primary)">Mail</span></span>
        </div>
        <button class="mobile-close-btn" onclick="toggleSidebar(false)" aria-label="Close Menu">
          <i data-lucide="x"></i>
        </button>
      </div>
      <nav class="sidebar-nav">
        <a href="/admin" id="nav-dashboard" onclick="toggleSidebar(false)">
          <i data-lucide="layout-dashboard"></i> Overview
        </a>
        <a href="/admin/inboxes" id="nav-inboxes" onclick="toggleSidebar(false)">
          <i data-lucide="inbox"></i> Inboxes
        </a>
        <a href="/admin/settings" id="nav-settings" onclick="toggleSidebar(false)">
          <i data-lucide="settings"></i> Settings
        </a>
        <a href="/admin/docs" id="nav-docs" onclick="toggleSidebar(false)">
          <i data-lucide="book-open"></i> API Docs
        </a>
      </nav>
      <div class="sidebar-footer">
        <button onclick="logout()">
          <i data-lucide="log-out"></i> Logout
        </button>
      </div>
    </aside>
  `
}

export function AnalyticsChartsGrid() {
  return html`
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-card-header">
          <h3><i data-lucide="pie-chart" class="icon-inline"></i> Domain Inbox Distribution</h3>
          <span style="font-size:0.75rem;color:var(--text-dim)">Share by Domain</span>
        </div>
        <div class="chart-container">
          <canvas id="domainChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <h3><i data-lucide="bar-chart-2" class="icon-inline"></i> System Activity Overview</h3>
          <span style="font-size:0.75rem;color:var(--text-dim)">Inboxes vs Messages</span>
        </div>
        <div class="chart-container">
          <canvas id="activityChart"></canvas>
        </div>
      </div>
    </div>
  `
}

export function DomainShowcaseWidget({ domains, domainStats = {} }: { domains: string[]; domainStats?: Record<string, number> }) {
  return Panel({
    title: 'Supported Mail Domains',
    icon: 'globe',
    children: html`
      <div class="domain-showcase-box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <p style="color:var(--text-dim);font-size:0.9rem">
            Showing <strong>${domains.length}</strong> active domain${domains.length !== 1 ? 's' : ''} available for inbox creation. Click any domain to copy.
          </p>
          <div class="domain-search-bar" style="width:240px">
            <i data-lucide="search" class="icon-sm" style="color:var(--text-dim)"></i>
            <input type="text" id="domainSearchInput" placeholder="Filter domains..." oninput="filterDomainCards()" />
          </div>
        </div>

        <div class="domain-cards-grid" id="domainCardsContainer">
          ${domains.map(d => html`
            <div class="domain-card-item" data-domain="${d}">
              <div>
                <div class="domain-card-name">@${d}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">
                  ${domainStats[d] || 0} inbox${(domainStats[d] || 0) !== 1 ? 'es' : ''}
                </div>
              </div>
              <button type="button" class="btn-icon" onclick="copyDomain('${d}')" title="Copy domain @${d}">
                <i data-lucide="copy" class="icon-sm"></i>
              </button>
            </div>
          `)}
        </div>
      </div>
    `
  })
}

export function ToggleGroup({ id, buttons }: { id: string; buttons: { id: string; label: string; active?: boolean }[] }) {
  return html`
    <div class="toggle-group" id="${id}">
      ${buttons.map(b => html`
        <button class="toggle-btn ${b.active ? 'active' : ''}" id="${b.id}">${b.label}</button>
      `)}
    </div>
  `
}

export function IconButton({ icon, onclick, title, variant }: { icon: string; onclick?: string; title?: string; variant?: 'danger' }) {
  const cssClass = variant === 'danger' ? 'btn-icon danger' : 'btn-icon'
  const onclickAttr = onclick ? `onclick="${onclick}"` : ''
  const titleAttr = title ? `title="${title}"` : ''
  return html`<button class="${cssClass}" ${raw(onclickAttr)} ${raw(titleAttr)}><i data-lucide="${icon}"></i></button>`
}

export function EmptyState({ icon, message, subMessage }: { icon: string; message: string; subMessage?: string }) {
  return html`
    <div style="text-align:center;padding:60px 24px">
      <i data-lucide="${icon}" style="width:48px;height:48px;color:var(--text-dim);margin-bottom:16px"></i>
      <p style="color:var(--text-dim);font-size:1rem">${message}</p>
      ${subMessage ? html`<p style="color:var(--text-dim);font-size:0.85rem;margin-top:4px">${raw(subMessage)}</p>` : ''}
    </div>
  `
}
