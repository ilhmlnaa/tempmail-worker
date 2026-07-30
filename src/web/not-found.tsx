import { html } from 'hono/html'
import { Layout } from './layout'

export function NotFoundPage({ session = false }: { session?: boolean }) {
  return Layout({
    title: 'Page Not Found',
    session,
    children: html`
      <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
        <i data-lucide="ghost" style="width: 80px; height: 80px; color: var(--border-focus); margin-bottom: 24px;"></i>
        <h1 style="font-size: 3rem; font-weight: 700; margin-bottom: 12px; background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          404
        </h1>
        <h2 style="font-size: 1.25rem; font-weight: 500; color: var(--text-dim); margin-bottom: 32px;">
          The page you are looking for has vanished into the void.
        </h2>
        <a href="${session ? '/admin' : '/#'}" class="btn-primary" style="text-decoration: none; padding: 12px 28px; font-size: 1rem;">
          <i data-lucide="arrow-left" class="icon-inline" style="margin-right: 8px;"></i>
          Return to Safety
        </a>
      </div>
    `
  })
}
