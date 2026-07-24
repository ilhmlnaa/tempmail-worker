import { html } from 'hono/html'

export const css = `
:root {
  --bg: #0f172a;
  --bg-panel: #1e293b;
  --bg-hover: #334155;
  --text: #f8fafc;
  --text-dim: #94a3b8;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --success: #10b981;
  --border: rgba(255, 255, 255, 0.1);
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  --gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--text); text-decoration: none; }
button { font-family: inherit; cursor: pointer; border: none; }
input, select {
  font-family: inherit;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.2s;
}
input:focus, select:focus { border-color: var(--primary); }

/* Layout */
.app-layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 260px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}
.sidebar-logo {
  padding: 24px;
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  border-bottom: 1px solid var(--border);
}
.sidebar-nav {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sidebar-nav a {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-dim);
  font-weight: 500;
  transition: all 0.2s;
}
.sidebar-nav a:hover {
  background: rgba(255,255,255,0.05);
  color: var(--text);
}
.sidebar-nav a.active {
  background: var(--gradient);
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
}
.sidebar-footer button {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.05);
  color: var(--text-dim);
  font-weight: 500;
  transition: all 0.2s;
}
.sidebar-footer button:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

/* Dashboard UI */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}
.dash-header h2 {
  font-size: 2rem;
  font-weight: 700;
}
.dash-header p {
  color: var(--text-dim);
  margin-top: 8px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}
.stat-card {
  background: var(--bg-panel);
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.stat-card h3 {
  color: var(--text-dim);
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-card .val {
  font-size: 2.5rem;
  font-weight: 700;
  margin-top: 12px;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* API Key Coming Soon */
.api-keys-banner {
  background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%);
  border: 1px dashed rgba(139,92,246,0.4);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.api-keys-banner h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a78bfa;
}

/* Box Panels */
.panel {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 24px;
  box-shadow: var(--shadow);
  margin-bottom: 32px;
}
.panel h3 {
  font-size: 1.25rem;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

/* Form */
.create-form {
  display: flex;
  gap: 12px;
  align-items: center;
}
.create-form .input-group {
  display: flex;
  align-items: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex: 1;
}
.create-form input, .create-form select {
  border: none;
  background: transparent;
  flex: 1;
}
.create-form .at {
  padding: 0 12px;
  color: var(--text-dim);
  background: rgba(255,255,255,0.02);
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
.btn-primary {
  background: var(--gradient);
  color: #fff;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.9; }

/* Table */
.inbox-list {
  display: grid;
  gap: 16px;
}
.inbox-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color 0.2s;
}
.inbox-item:hover { border-color: var(--primary); }
.inbox-info h4 {
  font-size: 1.1rem;
  font-family: monospace;
}
.inbox-info p {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-top: 4px;
}
.inbox-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}
.badge {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.btn-icon {
  background: transparent;
  color: var(--text-dim);
  padding: 8px;
  border-radius: var(--radius-sm);
}
.btn-icon:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text);
}
.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.actions { display: flex; gap: 8px; }

/* Toast */
#toast {
  position: fixed;
  bottom: 24px; right: 24px;
  background: var(--bg-panel);
  color: var(--text);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s;
}
#toast.show {
  transform: translateY(0);
  opacity: 1;
}

/* Auth Page */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, var(--bg-panel) 0%, var(--bg) 100%);
}

/* Lucide Icon Tweaks */
.icon-md { width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; }
.icon-sm { width: 18px; height: 18px; vertical-align: middle; }
.icon-inline { width: 20px; height: 20px; vertical-align: text-bottom; margin-right: 8px; color: var(--primary); }
svg.lucide { stroke-width: 2; }
`
