import { html, raw } from 'hono/html'

export function Panel({ title, icon, children }: { title: string; icon: string; children: any }) {
  return html`
    <div class="panel">
      <h3><i data-lucide="${icon}" class="icon-inline"></i> ${title}</h3>
      ${raw(children)}
    </div>
  `
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return html`
    <div class="stat-card">
      <h3>${label}</h3>
      <div class="val">${value}</div>
    </div>
  `
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
