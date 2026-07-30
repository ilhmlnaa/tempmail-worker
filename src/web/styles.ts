import { html } from 'hono/html'

export const css = `
:root {
  --bg: #0b0f19;
  --bg-panel: rgba(21, 29, 42, 0.96);
  --bg-panel-solid: #151d2a;
  --bg-hover: rgba(255, 255, 255, 0.06);
  --text: #f8fafc;
  --text-dim: #94a3b8;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-glow: rgba(59, 130, 246, 0.25);
  --accent: #06b6d4;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --success: #10b981;
  --border: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(59, 130, 246, 0.5);
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.15);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Lexend', system-ui, -apple-system, sans-serif;
  background: radial-gradient(circle at 50% 0%, #172033 0%, var(--bg) 70%);
  background-attachment: fixed;
  color: var(--text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

body.admin-body {
  height: 100vh;
  overflow: hidden;
}

body.landing-body {
  min-height: 100vh;
  overflow-y: auto;
}

a { color: var(--text); text-decoration: none; }
button { font-family: inherit; cursor: pointer; border: none; }
input, select {
  font-family: inherit;
  background: rgba(11, 15, 25, 0.7);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.2s ease;
}
input:focus, select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

select option {
  background: var(--bg-panel-solid);
  color: var(--text);
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Mobile Navigation Header */
.mobile-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #0f172a;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 99;
}
.mobile-logo {
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
}
.brand-logo-img {
  height: 32px;
  width: 32px;
  object-fit: contain;
  border-radius: 6px;
  flex-shrink: 0;
}
.brand-logo-img-sm {
  height: 24px;
  width: 24px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
}
.brand-logo-img-lg {
  height: 48px;
  width: 48px;
  object-fit: contain;
  border-radius: 10px;
  flex-shrink: 0;
}
.mobile-menu-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.mobile-menu-btn:hover {
  background: var(--primary-glow);
  border-color: var(--primary);
}
.mobile-close-btn {
  display: none;
  background: transparent;
  color: var(--text-dim);
  padding: 6px;
  border-radius: 6px;
  transition: color 0.2s;
}
.mobile-close-btn:hover { color: var(--text); }

.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.sidebar-backdrop.show {
  display: block;
  opacity: 1;
  pointer-events: auto;
}

/* Sidebar Styling */
.sidebar {
  width: 260px;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  background: #131b2a;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-logo {
  padding: 24px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-nav {
  padding: 20px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sidebar-nav a {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-dim);
  font-weight: 500;
  transition: all 0.2s ease;
}
.sidebar-nav a:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  transform: translateX(3px);
}
.sidebar-nav a.active {
  background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}
.sidebar-footer {
  padding: 20px 16px;
  border-top: 1px solid var(--border);
}
.sidebar-footer button {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
}
.sidebar-footer button:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--danger);
}

.main {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  padding: 40px;
  min-width: 0;
}

/* Header & Panels */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 36px;
  gap: 20px;
}
.dash-header h2 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.dash-header p {
  color: var(--text-dim);
  margin-top: 6px;
  font-size: 0.95rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 36px;
}
.stat-card {
  background: var(--bg-panel);
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  transition: all 0.25s ease;
}
.stat-card:hover {
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
  box-shadow: var(--shadow), var(--shadow-glow);
}
.stat-card h3 {
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.stat-card .val {
  font-size: 2.25rem;
  font-weight: 700;
  margin-top: 10px;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.stat-sub {
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-green 2s infinite;
}
@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 36px;
}
.chart-card {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 24px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}
.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.chart-card-header h3 {
  font-size: 1.05rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart-container {
  position: relative;
  height: 220px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Domain Showcase Widget */
.domain-showcase-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.domain-search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(11, 15, 25, 0.7);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 14px;
}
.domain-search-bar input {
  background: transparent;
  border: none;
  padding: 0;
  flex: 1;
  font-size: 0.9rem;
}
.domain-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.domain-card-item {
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}
.domain-card-item:hover {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(15, 23, 42, 0.8);
  transform: translateY(-1px);
}
.domain-card-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  word-break: break-all;
}
.domain-card-count {
  font-size: 0.75rem;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 2px 8px;
  border-radius: 12px;
}

.panel {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 28px;
  box-shadow: var(--shadow);
  margin-bottom: 32px;
}
.panel h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
}

.api-key-box {
  background: linear-gradient(145deg, rgba(21, 29, 42, 0.9) 0%, rgba(11, 15, 25, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.api-key-form-controls {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.api-key-form-inputs {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.api-key-input-field {
  width: 130px;
}
.api-key-input-field label {
  font-size: 0.75rem;
  color: var(--text-dim);
  display: block;
  margin-bottom: 4px;
  white-space: nowrap;
}
.api-key-input-field input {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.85rem;
}
.btn-generate-key {
  padding: 7px 18px;
  font-size: 0.85rem;
  height: 34px;
}
.segmented-control {
  display: inline-flex;
  background: rgba(11, 15, 25, 0.8);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 3px;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
}
.segmented-btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.segmented-btn:hover { color: var(--text); }
.segmented-btn.active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}
.domain-badge-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.domain-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  transition: all 0.2s ease;
}
.domain-tag:hover {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.1);
}
.domain-tag.checked {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
.key-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-dim);
}
.domain-manage-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.domain-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  min-height: 56px;
  align-items: center;
}
.domain-tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  color: #60a5fa;
}
.domain-tag-item button {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.domain-tag-item button:hover { color: #ef4444; }
.domain-add-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-form {
  display: flex;
  gap: 12px;
  align-items: center;
}
.create-form .input-group {
  display: flex;
  align-items: center;
  background: rgba(11, 15, 25, 0.7);
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
  background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.45);
  transform: translateY(-1px);
}

.inbox-list {
  display: grid;
  gap: 16px;
}
.inbox-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
.inbox-item:hover {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.inbox-info h4 {
  font-size: 1.05rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  background: rgba(16, 185, 129, 0.12);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.btn-icon {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 8px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.btn-icon:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.2);
}
.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.3);
}
.actions { display: flex; gap: 8px; align-items: center; }

.dropdown { position: relative; }
.dropdown-menu {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  z-index: 20;
  min-width: 240px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-panel-solid);
  box-shadow: var(--shadow);
}
.dropdown-menu.show { display: block; }
.dropdown-menu button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.85rem;
  text-align: left;
}
.dropdown-menu button:hover,
.dropdown-menu button:focus-visible {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
  outline: none;
}
.dropdown-menu button svg { width: 16px; height: 16px; }
.text-danger { color: var(--danger); }

/* Messages Panel */
.msg-panel {
  padding: 0;
  margin-bottom: 16px;
  transition: border-color 0.2s ease;
  overflow: hidden;
}
.msg-panel:hover { border-color: rgba(59, 130, 246, 0.4); }
.msg-header {
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.msg-avatar {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.05rem;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.msg-meta { flex: 1; min-width: 0; }
.msg-subject {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-sender-name { color: var(--text); }
.msg-from { font-size: 0.85rem; word-break: break-all; }
.text-dim { color: var(--text-dim); }
.msg-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.msg-detail {
  border-top: 1px solid var(--border);
  padding: 0;
  background: rgba(11, 15, 25, 0.95);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
.msg-detail.hidden { display: none; }
.msg-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.toggle-group {
  display: flex;
  background: rgba(11, 15, 25, 0.8);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.toggle-btn {
  background: transparent;
  color: var(--text-dim);
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.toggle-btn:hover { background: rgba(255,255,255,0.05); }
.toggle-btn.active {
  background: var(--primary);
  color: #fff;
}
.msg-viewport { position: relative; overflow-x: auto; }
.msg-view { display: none; }
.msg-view.active { display: block; }
.iframe-wrapper {
  background: #fff;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  overflow: hidden;
  width: 100%;
}
.msg-iframe {
  width: 100%;
  min-height: 400px;
  height: 60vh;
  border: none;
  display: block;
  background: #fff;
}
.msg-plain {
  padding: 24px;
  color: #1e293b;
  background: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.925rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}
.msg-pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-dim);
  padding: 20px;
  margin: 0;
  overflow-x: auto;
}

#toast {
  position: fixed;
  bottom: 24px; right: 24px;
  background: var(--bg-panel-solid);
  color: var(--text);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10000;
}
#toast.show {
  transform: translateY(0);
  opacity: 1;
}

.auth-page {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #172033 0%, var(--bg) 100%);
}

.auth-card {
  background: var(--bg-panel);
  padding: 40px 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  text-align: center;
  width: 100%;
  max-width: 400px;
}
.auth-card h1 {
  font-size: 2rem;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.auth-card p {
  color: var(--text-dim);
  margin-bottom: 32px;
}
.auth-input {
  width: 100%;
  margin-bottom: 16px;
}
.auth-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
  color: #fff;
  padding: 12px;
  border-radius: var(--radius-sm);
  font-weight: bold;
  transition: all 0.2s ease;
}
.auth-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}
.auth-error {
  color: var(--danger);
  margin-top: 16px;
  font-size: 0.9rem;
}

.icon-md { width: 24px; height: 24px; vertical-align: middle; }
.icon-sm { width: 18px; height: 18px; vertical-align: middle; }
.icon-inline { width: 20px; height: 20px; vertical-align: middle; margin-right: 8px; color: var(--primary); }
svg.lucide { stroke-width: 2; }

.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  padding: 16px;
}
.confirm-modal-overlay.show {
  opacity: 1;
  visibility: visible;
}
.confirm-modal-card {
  background: var(--bg-panel-solid);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  transform: scale(0.92);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-modal-overlay.show .confirm-modal-card {
  transform: scale(1);
}
.confirm-icon {
  width: 48px; height: 48px;
  margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(239, 68, 68, 0.12);
  border-radius: 50%;
}
.confirm-icon svg { width: 24px; height: 24px; color: var(--danger); }
.confirm-modal h3 { font-size: 1.1rem; margin-bottom: 8px; }
.confirm-modal p { color: var(--text-dim); font-size: 0.9rem; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; justify-content: center; }
.btn-cancel {
  padding: 10px 20px; border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05); color: var(--text); border: 1px solid var(--border);
  font-weight: 500; transition: background 0.2s;
}
.btn-cancel:hover { background: var(--bg-hover); }
.btn-danger {
  padding: 10px 20px; border-radius: var(--radius-sm);
  background: var(--danger); color: white; border: none;
  font-weight: 600; transition: background 0.2s;
}
.btn-danger:hover { background: var(--danger-hover); }

/* Animation Utility */
.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* ==========================================================================
   Responsive Breakpoints & Media Queries
   ========================================================================== */

@media (max-width: 992px) {
  .main {
    padding: 30px 24px;
  }
}

@media (max-width: 768px) {
  html, body {
    height: auto !important;
    min-height: 100vh !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }

  body.admin-body {
    height: auto !important;
    min-height: 100vh !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }

  .app-layout {
    flex-direction: column !important;
    height: auto !important;
    min-height: 100vh !important;
    overflow: visible !important;
  }

  .mobile-header {
    display: flex;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: -280px;
    width: 280px;
    height: 100vh;
    z-index: 1000;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
  }

  .sidebar.open {
    transform: translateX(280px);
  }

  .mobile-close-btn {
    display: flex !important;
  }

  .main {
    height: auto !important;
    min-height: calc(100vh - 65px) !important;
    overflow-y: visible !important;
    padding: 20px 16px 100px 16px !important;
    width: 100% !important;
  }

  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 24px;
  }

  .dash-header h2 {
    font-size: 1.5rem;
    word-break: break-word;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    padding: 16px;
    border-radius: var(--radius-md);
  }

  .stat-card h3 {
    font-size: 0.725rem;
  }

  .stat-card .val {
    font-size: 1.75rem;
    margin-top: 6px;
  }

  .panel {
    padding: 20px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
  }

  .panel h3 {
    font-size: 1.1rem;
    margin-bottom: 18px;
    padding-bottom: 12px;
  }

  .api-key-box {
    padding: 16px;
  }

  .api-key-form-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .api-key-form-controls .segmented-control {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: transparent;
    border: none;
    padding: 0;
  }

  .api-key-form-controls .segmented-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 16px;
    font-size: 0.875rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: rgba(11, 15, 25, 0.8);
  }

  .api-key-form-controls .segmented-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }

  .api-key-form-inputs {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: end;
  }

  .api-key-input-field {
    width: 100%;
  }

  .api-key-input-field label {
    font-size: 0.725rem;
    white-space: normal;
  }

  .btn-generate-key {
    grid-column: span 2;
    width: 100%;
    height: 42px;
    margin-top: 4px;
    font-size: 0.9rem;
  }

  .inbox-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
  }

  .inbox-info h4 {
    word-break: break-all;
  }

  .inbox-meta {
    width: 100%;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  .msg-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
  }

  .msg-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .msg-toolbar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }

  .domain-add-row {
    flex-direction: column;
    align-items: stretch;
  }

  .domain-add-row input, .domain-add-row button {
    width: 100%;
  }

  #toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .segmented-control {
    width: 100%;
  }

  .segmented-btn {
    flex: 1;
    justify-content: center;
    padding: 8px 10px;
    font-size: 0.8rem;
  }

  .auth-card {
    padding: 28px 20px;
  }

  .confirm-modal {
    padding: 24px 16px;
  }
}

/* ==========================================================================
   Public SaaS Landing Page (VoidMail)
   ========================================================================== */
.landing-body {
  height: auto !important;
  overflow-y: auto !important;
  background: radial-gradient(circle at 50% 0%, #172033 0%, var(--bg) 60%) !important;
}

.landing-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
}

.landing-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 15, 25, 0.95);
  border-bottom: 1px solid var(--border);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.landing-logo {
  font-size: 1.35rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.landing-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}
.landing-nav a {
  position: relative;
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-dim);
  font-weight: 500;
  font-size: 0.925rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.landing-nav a:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.landing-nav a.active {
  color: #fff;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.15);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.4);
}
.landing-nav a.active::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 16px; right: 16px;
  height: 3px;
  background: var(--primary);
  border-radius: 3px;
  box-shadow: 0 0 10px var(--primary);
}

.gradient-text {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.landing-hero {
  padding: 80px 0 60px;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero-title {
  font-size: 3.25rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 18px;
}

.hero-subtitle {
  max-width: 680px;
  margin: 0 auto 40px;
  color: var(--text-dim);
  font-size: 1.1rem;
  line-height: 1.6;
}

.hero-widget-card {
  max-width: 880px;
  margin: 0 auto;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), var(--shadow-glow);
  text-align: left;
  overflow: hidden;
}

.widget-header {
  padding: 16px 22px;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.widget-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.95rem;
}
.widget-header-title i { color: var(--primary); }

.widget-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.widget-email-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: stretch;
}

.widget-email-display {
  display: flex;
  align-items: center;
  background: rgba(11, 15, 25, 0.9);
  border: 1px solid var(--border);
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: #60a5fa;
  word-break: break-all;
}

.widget-form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, auto) auto;
  gap: 10px;
}

.proxy-img-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  color: var(--text-dim);
}
.proxy-img-banner svg { color: var(--primary); width: 16px; height: 16px; flex-shrink: 0; }
.proxy-img-banner span { flex: 1; }
.btn-sm { padding: 6px 12px; font-size: 0.78rem; }

.turnstile-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid var(--border-focus);
  border-radius: var(--radius-sm);
  margin-top: 4px;
}
.turnstile-panel[hidden] {
  display: none !important;
}

.turnstile-panel-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
}
.turnstile-panel-copy svg { color: var(--primary); width: 18px; height: 18px; flex-shrink: 0; }
.turnstile-panel-copy strong { display: block; color: var(--text); font-weight: 600; }
.turnstile-panel-copy span { display: block; color: var(--text-dim); font-size: 0.78rem; }

.widget-inbox-section {
  border-top: 1px solid var(--border);
  padding: 20px 24px;
  background: rgba(11, 15, 25, 0.5);
}

.widget-inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  gap: 10px;
}
.widget-inbox-status {
  font-size: 0.75rem;
  color: var(--text-dim);
  white-space: nowrap;
}

.btn-secondary {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}
.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-focus);
}
.btn-primary:disabled, .btn-secondary:disabled, .btn-icon:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.widget-inbox-master-detail {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(11, 15, 25, 0.42);
  overflow: hidden;
}

.widget-inbox-sidebar {
  border-bottom: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.72);
}

.widget-sidebar-title {
  padding: 10px 14px;
  background: var(--bg-panel-solid);
  color: var(--text-dim);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}

.widget-sidebar-list {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 10px 14px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  overscroll-behavior-inline: contain;
}
.widget-sidebar-list::-webkit-scrollbar {
  display: none;
}

.inbox-sidebar-item {
  flex-shrink: 0;
  display: inline-flex;
  scroll-snap-align: start;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-panel-solid);
  color: var(--text-dim);
  font-size: 0.85rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.inbox-sidebar-item:hover {
  color: var(--text);
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.08);
}

.inbox-sidebar-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.inbox-sidebar-item.active {
  color: var(--text);
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--primary);
}

.inbox-sidebar-item svg {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.inbox-sidebar-item.active svg { color: var(--primary); }
.inbox-addr { font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

.widget-messages-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 280px;
  max-height: 480px;
  overflow-y: auto;
  padding: 16px;
}

.widget-msg-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}
.widget-msg-item:hover {
  border-color: var(--border-focus);
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}
.widget-msg-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.widget-msg-info { flex: 1; min-width: 0; }
.widget-msg-subject {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.widget-msg-from {
  font-size: 0.8rem;
  color: #60a5fa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.widget-msg-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  color: var(--text-dim);
}
.widget-msg-time { font-size: 0.72rem; white-space: nowrap; }

.widget-empty {
  text-align: center;
  padding: 36px 16px;
  color: var(--text-dim);
}
.widget-empty i {
  width: 30px; height: 30px;
  margin-bottom: 10px;
  opacity: 0.5;
}
.widget-empty p { font-size: 0.875rem; }

.widget-msg-skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: rgba(11, 15, 25, 0.6);
}
.widget-msg-skeleton .sk-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
}
.widget-msg-skeleton .sk-lines { flex: 1; }
.widget-msg-skeleton .sk-line { height: 10px; border-radius: 6px; }
.widget-msg-skeleton .sk-line.short { width: 45%; margin-top: 9px; }
.sk-avatar, .sk-line {
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.msg-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(3, 7, 18, 0.72);
  backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}
.msg-modal-backdrop.open { opacity: 1; visibility: visible; }
.msg-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 720px;
  max-height: 88vh;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
  transform: translateY(12px) scale(0.98);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.msg-modal-backdrop.open .msg-modal { transform: translateY(0) scale(1); }
.msg-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}
.msg-modal-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  flex-shrink: 0;
}
.msg-modal-meta { flex: 1; min-width: 0; }
.msg-modal-subject {
  font-weight: 600;
  font-size: 1.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-modal-from {
  font-size: 0.85rem;
  color: #60a5fa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.msg-modal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(11, 15, 25, 0.5);
  flex-wrap: wrap;
}
.msg-modal-date {
  font-size: 0.78rem;
  color: var(--text-dim);
  white-space: nowrap;
}
.msg-modal-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  background: var(--bg-panel-solid);
}
.msg-modal-body .msg-plain,
.msg-modal-body .iframe-wrapper { border-radius: 0; }

.landing-section {
  padding: 70px 0;
  border-top: 1px solid var(--border);
}

.section-title-box {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
}
.section-title-box h2 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 10px;
}
.section-title-box p {
  color: var(--text-dim);
  font-size: 1rem;
}

.landing-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}
.feature-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 28px;
  transition: all 0.2s ease;
}
.feature-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}
.feature-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.12);
  color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px;
}
.feature-card h3 {
  font-size: 1.15rem;
  margin-bottom: 8px;
}
.feature-card p {
  color: var(--text-dim);
  font-size: 0.9rem;
  line-height: 1.6;
}

.landing-domain-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}
.landing-domain-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 30px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.landing-domain-card:hover {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}
.landing-domain-card .domain-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  font-size: 0.95rem;
}

.api-code-box {
  max-width: 720px;
  margin: 0 auto;
  background: #0f172a;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.api-code-header {
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-dim);
}
.api-code-body {
  padding: 20px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  color: #38bdf8;
  overflow-x: auto;
  margin: 0;
}

.landing-footer {
  border-top: 1px solid var(--border);
  padding: 36px 0;
  background: #0b0f19;
}
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

/* Landing Mobile Header & Right Drawer */
.landing-mobile-menu-btn {
  display: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.landing-mobile-menu-btn:hover {
  background: var(--primary-glow);
  border-color: var(--primary);
}

.landing-drawer-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.landing-drawer-backdrop.show {
  display: block;
  opacity: 1;
  pointer-events: auto;
}

.landing-drawer {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background: #131b2a;
  border-right: 1px solid var(--border);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 5px 0 30px rgba(0, 0, 0, 0.6);
}
.landing-drawer.open {
  transform: translateX(280px);
}
.landing-drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.landing-drawer-nav {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}
.landing-drawer-nav a {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-dim);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}
.landing-drawer-nav a:hover, .landing-drawer-nav a.active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
}
.landing-drawer-nav a.drawer-btn-admin {
  margin-top: auto;
  background: var(--primary);
  color: #fff;
  justify-content: center;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}
.landing-drawer-nav a.drawer-btn-admin:hover {
  background: var(--primary-hover);
}

@media (max-width: 768px) {
  .hero-title { font-size: 2.25rem; }
  .hero-subtitle { font-size: 0.95rem; }
  .landing-nav { display: none !important; }
  .landing-mobile-menu-btn { display: flex !important; }
  .widget-body { padding: 18px; }
  .widget-email-row { grid-template-columns: 1fr; }
  .widget-form-row { grid-template-columns: 1fr; }
  .widget-inbox-section { padding: 18px; }
  .footer-content { flex-direction: column; text-align: center; }
}

@media (max-width: 640px) {
  .msg-modal-backdrop { padding: 0; align-items: flex-end; }
  .msg-modal {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}
`
