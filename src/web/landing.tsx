import { html, raw } from 'hono/html'

export function LandingPage({ domains, turnstileSiteKey }: { domains: string[]; turnstileSiteKey: string }) {
  const primaryDomain = domains[0] || 'voidmail.my.id'

  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VoidMail — Instant Disposable Temporary Email Service</title>
  <meta name="description" content="Generate instant, anonymous temporary email addresses with VoidMail. Protect your primary inbox from spam, ads, and data leaks." />
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="/vendor/lucide-0.468.0.min.js"></script>
  ${turnstileSiteKey ? html`<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>` : ''}
</head>
<body class="landing-body">
  <!-- Public Navbar -->
  <header class="landing-header">
    <div class="landing-container nav-container">
      <div class="landing-logo">
        <img src="/logo.png" alt="VoidMail Logo" class="brand-logo-img" /> 
        <span>Void<span style="color:var(--primary)">Mail</span></span>
      </div>
      <nav class="landing-nav">
        <a href="#generator" id="nav-gen" class="active">Instant Mail</a>
        <a href="#domains" id="nav-domains">Domains</a>
        <a href="#features" id="nav-features">Features</a>
        <a href="/docs" id="nav-api">Developer API</a>
      </nav>
      <button class="landing-mobile-menu-btn" onclick="toggleLandingDrawer(true)" aria-label="Open Menu">
        <i data-lucide="menu"></i>
      </button>
    </div>
  </header>

  <div class="landing-drawer-backdrop" onclick="toggleLandingDrawer(false)"></div>
  <aside class="landing-drawer" id="landingDrawer">
    <div class="landing-drawer-header">
      <div class="landing-logo">
        <img src="/logo.png" alt="VoidMail Logo" class="brand-logo-img" /> 
        <span>Void<span style="color:var(--primary)">Mail</span></span>
      </div>
      <button class="mobile-close-btn" onclick="toggleLandingDrawer(false)" aria-label="Close Menu">
        <i data-lucide="x"></i>
      </button>
    </div>
    <nav class="landing-drawer-nav">
      <a href="#generator" onclick="toggleLandingDrawer(false)"><i data-lucide="mail"></i> Instant Mail</a>
      <a href="#domains" onclick="toggleLandingDrawer(false)"><i data-lucide="globe"></i> Domains</a>
      <a href="#features" onclick="toggleLandingDrawer(false)"><i data-lucide="zap"></i> Features</a>
      <a href="/docs" onclick="toggleLandingDrawer(false)"><i data-lucide="book-open"></i> Developer API</a>
    </nav>
  </aside>

  <!-- Hero Section -->
  <section class="landing-hero">
    <div class="hero-grid-bg"></div>
    <div class="landing-container hero-content">
      <span class="hero-badge"><span class="pulse-dot"></span> Next-Gen Disposable Email Service</span>
      <h1 class="hero-title">
        <span id="typedHeroText">Disposable Email into the </span><span class="gradient-text" id="typedHeroVoid">Void</span><span class="typewriter-cursor">|</span>
      </h1>
      <p class="hero-subtitle">
        Generate instant, anonymous temporary email addresses in seconds. Keep your personal inbox safe from spam, trackers, and data leaks.
      </p>

      <!-- Instant Temp Mail Generator Widget -->
      <div class="hero-widget-card" id="generator">
        <div class="widget-header">
          <div class="widget-header-title">
            <i data-lucide="mail"></i>
            <span>Your Temporary Email Address</span>
          </div>
          <span class="badge" id="tempMailStatus">Ready</span>
        </div>

        <div class="widget-body">
          <div class="widget-email-row">
            <div class="widget-email-display" id="widgetEmail">Generating email...</div>
            <button type="button" class="btn-primary widget-copy-btn" onclick="copyWidgetEmail()" id="btnCopyEmail">
              <i data-lucide="copy" class="icon-sm"></i> Copy Address
            </button>
            <button type="button" class="btn-icon widget-refresh-btn" onclick="generateNewPublicMail()" title="Generate New Mail" id="btnRefreshMail">
              <i data-lucide="refresh-cw" class="icon-sm"></i>
            </button>
          </div>

          <div class="widget-form-row">
            <input type="text" id="customPrefix" placeholder="Custom username (optional)..." />
            <div class="domain-select" id="domainSelect">
              <input type="hidden" id="widgetDomain" value="${primaryDomain}" />
              <button type="button" class="domain-select-trigger" id="domainSelectTrigger" aria-haspopup="listbox" aria-expanded="false" onclick="toggleDomainSelect()">
                <span id="selectedDomainLabel">@${primaryDomain}</span>
                <i data-lucide="chevron-down" class="domain-select-chevron"></i>
              </button>
              <div class="domain-select-menu" id="domainSelectMenu" role="listbox" hidden>
                ${domains.map((d, index) => html`
                  <button type="button" class="domain-select-option ${index === 0 ? 'active' : ''}" role="option" aria-selected="${index === 0 ? 'true' : 'false'}" data-domain="${d}" onclick="selectDomainOption(this)">
                    <span class="domain-select-icon"><i data-lucide="at-sign"></i></span>
                    <span>${d}</span>
                    <i data-lucide="check" class="domain-select-check"></i>
                  </button>
                `)}
              </div>
            </div>
            <button type="button" class="btn-secondary" onclick="createCustomMail()" id="btnCreateCustom">
              Create Custom
            </button>
          </div>

          ${turnstileSiteKey ? html`
            <div class="turnstile-panel" id="turnstilePanel" hidden>
              <div class="turnstile-panel-copy">
                <i data-lucide="shield-check"></i>
                <div>
                  <strong>Quick security check</strong>
                  <span>Complete this once to continue creating inboxes.</span>
                </div>
              </div>
              <div id="turnstileWidget"></div>
            </div>
          ` : ''}
        </div>

        <!-- Live Messages Inbox Reader Widget (Master-Detail Split) -->
        <div class="widget-inbox-section">
          <div class="widget-inbox-header">
            <div class="widget-inbox-heading">
              <i data-lucide="inbox" class="widget-inbox-heading-icon"></i>
              <div>
                <strong>Session inboxes</strong>
                <span>Switch inboxes and read incoming messages</span>
              </div>
            </div>
            <span class="widget-inbox-status" id="autoRefreshStatus"><span class="pulse-dot"></span> Refreshes every 5s</span>
          </div>

          <div class="widget-inbox-master-detail">
            <!-- Sidebar list of user's active session inboxes -->
            <div class="widget-inbox-sidebar">
              <div class="widget-sidebar-title">Your Inboxes</div>
              <div id="inboxesListSidebar" class="widget-sidebar-list"></div>
            </div>

            <!-- Messages list for active selected inbox -->
            <div class="widget-messages-container" id="widgetMessagesContainer"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Supported Mail Domains Showcase -->
  <section class="landing-section" id="domains" style="background:rgba(15, 23, 42, 0.4)">
    <div class="landing-container">
      <div class="section-title-box">
        <h2>Supported Mail Suffixes</h2>
        <p>Choose from our active pool of verified temporary email domains.</p>
      </div>

      <div class="landing-domain-grid">
        ${domains.map(d => html`
          <div class="landing-domain-card" onclick="selectDomainFromLanding('${d}')">
            <i data-lucide="globe" style="color:var(--primary)"></i>
            <span class="domain-name">@${d}</span>
            <span class="badge" style="font-size:0.7rem">Active</span>
          </div>
        `)}
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="landing-section" id="features">
    <div class="landing-container">
      <div class="section-title-box">
        <h2>Why Choose VoidMail?</h2>
        <p>Built for privacy enthusiasts, developers, and everyday web users.</p>
      </div>

      <div class="landing-features-grid">
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="shield"></i></div>
          <h3>100% Anonymous</h3>
          <p>No credit card, password, or registration required. Use instantly and disappear without leaving a trace.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="zap"></i></div>
          <h3>Cloudflare Edge Speed</h3>
          <p>Powered by Cloudflare Workers and D1 database for sub-millisecond email reception worldwide.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="trash-2"></i></div>
          <h3>Auto-Expiring Inbox</h3>
          <p>Disposable email addresses keep spam, phishing attempts, and unwanted newsletters away from your personal accounts.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i data-lucide="code"></i></div>
          <h3>Developer REST API</h3>
          <p>Programmatically generate inboxes, list received messages, and read HTML/plaintext email bodies via API.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Developer API cURL Section -->
  <section class="landing-section" id="api" style="background:rgba(15, 23, 42, 0.6)">
    <div class="landing-container">
      <div class="section-title-box">
        <h2>Developer Friendly API</h2>
        <p>Integrate automated email testing and inbox creation in your apps with simple cURL commands.</p>
      </div>

      <div class="api-code-box">
        <div class="api-code-header">
          <span><i data-lucide="terminal" class="icon-sm"></i> Create Inbox cURL Example</span>
          <button type="button" class="btn-icon" onclick="copyApiCurl()" title="Copy Code">
            <i data-lucide="copy" class="icon-sm"></i>
          </button>
        </div>
        <pre class="api-code-body" id="curlSnippet">curl -X POST https://voidmail.my.id/api/inboxes \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "${primaryDomain}", "address": "testuser"}'</pre>
      </div>

      <div style="text-align:center;margin-top:28px">
        <a href="/docs" class="btn-primary" style="padding:12px 28px;font-size:0.95rem;text-decoration:none">
          <i data-lucide="book-open" class="icon-inline" style="color:white;margin-right:8px"></i> Explore API Docs
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="landing-footer">
    <div class="landing-container footer-content">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="/logo.png" alt="VoidMail Logo" class="brand-logo-img-sm" />
        <span style="font-weight:700;font-size:1.1rem">VoidMail</span>
      </div>
      <p style="color:var(--text-dim);font-size:0.85rem">
        © 2026 VoidMail Temporary Email Service. All rights reserved.
      </p>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:0.75rem;color:var(--text-dim);display:flex;align-items:center;gap:6px">
          <span class="pulse-dot"></span> System 100% Operational
        </span>
      </div>
    </div>
  </footer>

  <!-- Message Detail Viewer -->
  <div class="msg-modal-backdrop" id="msgModalBackdrop" onclick="if(event.target===this)hideMessageModal()">
    <div class="msg-modal" role="dialog" aria-modal="true" aria-labelledby="modalSubject">
      <div class="msg-modal-header">
        <div class="msg-modal-avatar" id="modalAvatar"></div>
        <div class="msg-modal-meta">
          <div class="msg-modal-subject" id="modalSubject"></div>
          <div class="msg-modal-from" id="modalFrom"></div>
        </div>
        <button type="button" class="btn-icon" onclick="hideMessageModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="msg-modal-toolbar">
        <div class="toggle-group">
          <button type="button" class="toggle-btn active" id="mv-btn-rendered" onclick="switchModalView('rendered')">Rendered</button>
          <button type="button" class="toggle-btn" id="mv-btn-raw" onclick="switchModalView('raw')">Raw</button>
          <button type="button" class="toggle-btn" id="mv-btn-source" onclick="switchModalView('source')">Source</button>
        </div>
        <span class="msg-modal-date" id="modalDate"></span>
      </div>
      <div class="msg-modal-body">
        <div class="msg-view active" id="mv-rendered"></div>
        <div class="msg-view" id="mv-raw"><pre class="msg-pre" id="modalRaw"></pre></div>
        <div class="msg-view" id="mv-source"><pre class="msg-pre" id="modalSource"></pre></div>
      </div>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.lucide) lucide.createIcons();
    });

    // Active ScrollSpy for Header Navigation
    const navGen = document.getElementById('nav-gen');
    const navDomains = document.getElementById('nav-domains');
    const navFeatures = document.getElementById('nav-features');
    const navApi = document.getElementById('nav-api');

    function updateActiveNav() {
      const scrollPos = window.scrollY + 140;
      const domainsEl = document.getElementById('domains');
      const featuresEl = document.getElementById('features');
      const apiEl = document.getElementById('api');

      const domainsTop = domainsEl ? domainsEl.offsetTop : 0;
      const featuresTop = featuresEl ? featuresEl.offsetTop : 0;
      const apiTop = apiEl ? apiEl.offsetTop : 0;

      [navGen, navDomains, navFeatures, navApi].forEach(el => el && el.classList.remove('active'));

      if (apiEl && scrollPos >= apiTop - 100) {
        if (navApi) navApi.classList.add('active');
      } else if (featuresEl && scrollPos >= featuresTop - 100) {
        if (navFeatures) navFeatures.classList.add('active');
      } else if (domainsEl && scrollPos >= domainsTop - 100) {
        if (navDomains) navDomains.classList.add('active');
      } else {
        if (navGen) navGen.classList.add('active');
      }
    }

    window.addEventListener('scroll', updateActiveNav);

    let currentPublicEmail = '';
    let publicSessionId = null;
    let pollInterval = null;
    let widgetMessages = [];
    let inboxesList = [];
    let turnstileToken = null;
    let turnstileWidgetId = null;

    function escapeHtml(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function decodeQP(str) {
      if (!str) return str || '';
      return str
        .replace(/=\\r?\\n/g, '')
        .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    function formatShortDate(d) {
      try { return new Date(d + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
      catch (e) { return ''; }
    }

    function formatFullDate(d) {
      try { return new Date(d + 'Z').toLocaleString(); } catch (e) { return d || ''; }
    }

    function setStatus(text) {
      const el = document.getElementById('tempMailStatus');
      if (el) el.textContent = text;
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg; t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function copyWidgetEmail() {
      if (!currentPublicEmail) return;
      navigator.clipboard.writeText(currentPublicEmail);
      showToast('Copied ' + currentPublicEmail);
    }

    function copyApiCurl() {
      const snippet = document.getElementById('curlSnippet').textContent;
      navigator.clipboard.writeText(snippet);
      showToast('cURL snippet copied');
    }

    function toggleDomainSelect(force) {
      const root = document.getElementById('domainSelect');
      const trigger = document.getElementById('domainSelectTrigger');
      const menu = document.getElementById('domainSelectMenu');
      if (!root || !trigger || !menu) return;
      const shouldOpen = typeof force === 'boolean' ? force : menu.hidden;
      menu.hidden = !shouldOpen;
      root.classList.toggle('open', shouldOpen);
      trigger.setAttribute('aria-expanded', String(shouldOpen));
      if (shouldOpen) menu.querySelector('.domain-select-option.active')?.focus();
    }

    function selectDomainOption(option) {
      const domain = option.dataset.domain;
      if (!domain) return;
      document.getElementById('widgetDomain').value = domain;
      document.getElementById('selectedDomainLabel').textContent = '@' + domain;
      document.querySelectorAll('.domain-select-option').forEach(item => {
        const active = item === option;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      toggleDomainSelect(false);
      document.getElementById('domainSelectTrigger')?.focus();
    }

    function setSelectedDomain(domain) {
      const option = Array.from(document.querySelectorAll('.domain-select-option')).find(item => item.dataset.domain === domain);
      if (option) selectDomainOption(option);
    }

    document.addEventListener('click', event => {
      const root = document.getElementById('domainSelect');
      if (root && !root.contains(event.target)) toggleDomainSelect(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') toggleDomainSelect(false);
    });

    function selectDomainFromLanding(d) {
      setSelectedDomain(d);
      createCustomMail();
      document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
    }

    async function initPublicMail() {
      try {
        await fetch('/api/session');
        const res = await fetch('/api/session/inboxes');
        if (res.ok) {
          inboxesList = await res.json();
          renderInboxesSidebar();
        }
      } catch (e) {}

      const savedEmail = localStorage.getItem('voidmail_current_email');
      if (inboxesList.length > 0) {
        // Find if saved exists in our active session list
        const exists = inboxesList.find(i => i.address === savedEmail);
        currentPublicEmail = exists ? savedEmail : inboxesList[0].address;
        localStorage.setItem('voidmail_current_email', currentPublicEmail);
        updateEmailDisplay(currentPublicEmail);
        showMessagesLoading();
        await loadMessages(currentPublicEmail);
        startPollingMessages(currentPublicEmail);
      } else {
        await generateNewPublicMail();
      }
    }

    function renderInboxesSidebar() {
      const container = document.getElementById('inboxesListSidebar');
      if (!container) return;
      if (inboxesList.length === 0) {
        container.innerHTML = '<div style="padding:16px;color:var(--text-dim);font-size:0.85rem">No active inboxes</div>';
        return;
      }
      container.innerHTML = inboxesList.map(inbox => {
        const isActive = inbox.address === currentPublicEmail;
        return \`
          <button class="inbox-sidebar-item \${isActive ? 'active' : ''}" onclick="switchInbox('\${inbox.address}')">
            <i data-lucide="\${isActive ? 'mail-open' : 'mail'}"></i>
            <span class="inbox-addr">\${escapeHtml(inbox.address)}</span>
            \${inbox.messageCount > 0 ? \`<span class="badge" style="font-size:0.7rem">\${inbox.messageCount}</span>\` : ''}
          </button>
        \`;
      }).join('');
      lucide.createIcons();
    }

    async function switchInbox(address) {
      if (address === currentPublicEmail) return;
      currentPublicEmail = address;
      localStorage.setItem('voidmail_current_email', currentPublicEmail);
      updateEmailDisplay(address);
      renderInboxesSidebar(); // Update active state
      showMessagesLoading();
      await loadMessages(currentPublicEmail);
      startPollingMessages(currentPublicEmail);
    }

    async function generateNewPublicMail() {
      const domain = document.getElementById('widgetDomain').value || '${primaryDomain}';
      await createPublicInbox('', domain);
    }

    async function createCustomMail() {
      const prefix = document.getElementById('customPrefix').value.trim();
      const domain = document.getElementById('widgetDomain').value || '${primaryDomain}';
      await createPublicInbox(prefix, domain);
    }

    function setCreatingState(active) {
      const ids = ['btnCreateCustom', 'btnRefreshMail', 'btnCopyEmail'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = active;
      });
      setStatus(active ? 'Loading' : 'Ready');
    }

    async function createPublicInbox(prefix, domain) {
      setCreatingState(true);
      showMessagesLoading();
      try {
        const payload = { address: prefix, domain: domain };
        if (turnstileToken) payload.turnstileToken = turnstileToken;

        const res = await fetch('/api/inboxes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.status === 403 && data.requireCaptcha) {
          renderWidgetMessages([]);
          showTurnstileChallenge();
          return;
        }

        if (data.address) {
          // Reset token state after success
          turnstileToken = null;
          hideTurnstileChallenge();
          
          if (!inboxesList.find(i => i.address === data.address)) {
            inboxesList.unshift({ address: data.address, messageCount: 0 });
          }
          currentPublicEmail = data.address;
          localStorage.setItem('voidmail_current_email', currentPublicEmail);
          updateEmailDisplay(currentPublicEmail);
          document.getElementById('customPrefix').value = '';
          renderInboxesSidebar();
          await loadMessages(currentPublicEmail);
          startPollingMessages(currentPublicEmail);
          showToast('Email ready: ' + currentPublicEmail);
        } else {
          renderWidgetMessages([]);
          showToast(data.error || 'Failed to create email');
        }
      } catch (err) {
        renderWidgetMessages([]);
        showToast('Failed to create email');
      } finally {
        setCreatingState(false);
      }
    }

    function showTurnstileChallenge() {
      const panel = document.getElementById('turnstilePanel');
      if (!panel || !window.turnstile) return;
      panel.hidden = false;
      if (turnstileWidgetId === null) {
        turnstileWidgetId = window.turnstile.render('#turnstileWidget', {
          sitekey: '${turnstileSiteKey}',
          theme: 'dark',
          callback: function(token) {
            turnstileToken = token;
            const prefix = document.getElementById('customPrefix').value.trim();
            const domain = document.getElementById('widgetDomain').value || '${domains[0] || 'voidmail.my.id'}';
            createPublicInbox(prefix, domain);
          }
        });
      } else {
        window.turnstile.reset(turnstileWidgetId);
      }
    }

    function hideTurnstileChallenge() {
      const panel = document.getElementById('turnstilePanel');
      if (panel) panel.hidden = true;
    }

    function updateEmailDisplay(email) {
      document.getElementById('widgetEmail').textContent = email;
    }

    async function loadMessages(email, attempts = 4) {
      for (let a = 0; a < attempts; a++) {
        try {
          const res = await fetch('/api/inboxes/' + encodeURIComponent(email) + '/messages');
          if (res.ok) {
            renderWidgetMessages(await res.json());
            return;
          }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 400));
      }
      renderWidgetMessages([]);
    }

    function startPollingMessages(email) {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => fetchMessages(email), 5000);
    }

    async function fetchMessages(email) {
      if (!email) return;
      try {
        const res = await fetch('/api/inboxes/' + encodeURIComponent(email) + '/messages');
        if (res.ok) {
          const msgs = await res.json();
          const targetInbox = inboxesList.find(i => i.address === email);
          if (targetInbox && targetInbox.messageCount !== msgs.length) {
            targetInbox.messageCount = msgs.length;
            renderInboxesSidebar();
          }
          renderWidgetMessages(msgs);
        }
      } catch (err) {}
    }

    function showMessagesLoading() {
      const container = document.getElementById('widgetMessagesContainer');
      container.innerHTML = [0, 1, 2].map(() => \`
        <div class="widget-msg-skeleton">
          <div class="sk-avatar"></div>
          <div class="sk-lines"><div class="sk-line"></div><div class="sk-line short"></div></div>
        </div>
      \`).join('');
    }

    function renderWidgetMessages(msgs) {
      widgetMessages = msgs || [];
      const container = document.getElementById('widgetMessagesContainer');
      if (!widgetMessages.length) {
        container.innerHTML = \`
          <div class="widget-empty">
            <i data-lucide="mail-open"></i>
            <p>No messages yet. Send an email to <strong>\${escapeHtml(currentPublicEmail)}</strong></p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = widgetMessages.map((m, i) => {
        const senderName = (m.from || '').replace(/<.*>/, '').trim().replace(/"/g, '') || m.from || 'Unknown';
        const initial = (senderName.charAt(0) || '?').toUpperCase();
        return \`
          <button type="button" class="widget-msg-item" onclick="openMessage(\${i})">
            <div class="widget-msg-avatar">\${escapeHtml(initial)}</div>
            <div class="widget-msg-info">
              <div class="widget-msg-subject">\${escapeHtml(m.subject || '(no subject)')}</div>
              <div class="widget-msg-from">\${escapeHtml(senderName)}</div>
            </div>
            <div class="widget-msg-side">
              <span class="widget-msg-time">\${escapeHtml(formatShortDate(m.createdAt))}</span>
              <i data-lucide="chevron-right" class="icon-sm"></i>
            </div>
          </button>
        \`;
      }).join('');
      lucide.createIcons();
    }



    async function loadMessageImagesWithProxy(i) {
      if (!currentPublicEmail) return;
      try {
        const res = await fetch('/api/inboxes/' + encodeURIComponent(currentPublicEmail) + '/messages?images=proxy');
        if (res.ok) {
          widgetMessages = await res.json();
          openMessage(i);
        }
      } catch (err) {}
    }

    function openMessage(i) {
      const m = widgetMessages[i];
      if (!m) return;

      const senderName = (m.from || '').replace(/<.*>/, '').trim().replace(/"/g, '') || m.from || 'Unknown';
      const senderEmail = ((m.from || '').match(/<(.+)>/) || [null, m.from || ''])[1];

      document.getElementById('modalAvatar').textContent = (senderName.charAt(0) || '?').toUpperCase();
      document.getElementById('modalSubject').textContent = m.subject || '(no subject)';
      document.getElementById('modalFrom').textContent = senderName + (senderEmail ? ' <' + senderEmail + '>' : '');
      document.getElementById('modalDate').textContent = formatFullDate(m.createdAt);

      const bodyDecoded = decodeQP(m.body || '');
      const htmlDecoded = m.html ? decodeQP(m.html) : '';

      const rendered = document.getElementById('mv-rendered');
      if (htmlDecoded) {
        const hasBlockedImages = htmlDecoded.toLowerCase().includes('src="data:image/gif;base64');
        const proxyBanner = hasBlockedImages
          ? '<div class="proxy-img-banner"><i data-lucide="shield-alert"></i> <span>External images blocked to protect your privacy.</span> <button type="button" class="btn-secondary btn-sm" onclick="loadMessageImagesWithProxy(' + i + ')">Load images via ImgCDN</button></div>'
          : '';
        rendered.innerHTML = proxyBanner + '<div class="iframe-wrapper"><iframe sandbox="allow-popups" referrerpolicy="no-referrer" class="msg-iframe" id="modalIframe"></iframe></div>';
        const iframe = document.getElementById('modalIframe');
        iframe.srcdoc = htmlDecoded;
      } else {
        rendered.innerHTML = '<div class="msg-plain">' + escapeHtml(bodyDecoded || '(empty message)') + '</div>';
      }

      document.getElementById('modalRaw').textContent = bodyDecoded || '(empty)';

      const sourceBtn = document.getElementById('mv-btn-source');
      if (htmlDecoded) {
        sourceBtn.style.display = '';
        document.getElementById('modalSource').textContent = htmlDecoded;
      } else {
        sourceBtn.style.display = 'none';
        document.getElementById('modalSource').textContent = '';
      }

      switchModalView('rendered');
      const backdrop = document.getElementById('msgModalBackdrop');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      lucide.createIcons();
    }

    function switchModalView(mode) {
      ['rendered', 'raw', 'source'].forEach(m => {
        const btn = document.getElementById('mv-btn-' + m);
        const view = document.getElementById('mv-' + m);
        if (btn) btn.classList.toggle('active', m === mode);
        if (view) view.classList.toggle('active', m === mode);
      });
    }

    function hideMessageModal() {
      const backdrop = document.getElementById('msgModalBackdrop');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideMessageModal();
    });

    function toggleLandingDrawer(show) {
      const drawer = document.getElementById('landingDrawer');
      const backdrop = document.querySelector('.landing-drawer-backdrop');
      if (!drawer) return;
      if (typeof show === 'boolean') {
        if (show) {
          drawer.classList.add('open');
          if (backdrop) backdrop.classList.add('show');
          document.body.style.overflow = 'hidden';
        } else {
          drawer.classList.remove('open');
          if (backdrop) backdrop.classList.remove('show');
          document.body.style.overflow = '';
        }
      } else {
        const isOpen = drawer.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('show', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    }

    // Typewriter effect with infinite rotating words for Hero Title
    function initHeroTypewriter() {
      const textEl = document.getElementById('typedHeroText');
      const voidEl = document.getElementById('typedHeroVoid');
      if (!textEl || !voidEl) return;

      const prefixText = 'Disposable Email into the ';
      const words = ['Void', 'Shadow', 'Ether', 'Abyss', 'Cipher', 'Future'];
      let wordIndex = 0;

      textEl.textContent = '';
      voidEl.textContent = '';
      voidEl.style.display = 'none';

      let i = 0;
      function typePrefix() {
        if (i < prefixText.length) {
          textEl.textContent += prefixText.charAt(i);
          i++;
          setTimeout(typePrefix, 40);
        } else {
          voidEl.style.display = 'inline';
          typeWord();
        }
      }

      function typeWord() {
        const currentWord = words[wordIndex];
        let j = 0;
        function typing() {
          if (j < currentWord.length) {
            voidEl.textContent += currentWord.charAt(j);
            j++;
            setTimeout(typing, 80);
          } else {
            // Wait 2 seconds before erasing
            setTimeout(eraseWord, 2000);
          }
        }
        typing();
      }

      function eraseWord() {
        const currentWord = voidEl.textContent;
        if (currentWord.length > 0) {
          voidEl.textContent = currentWord.substring(0, currentWord.length - 1);
          setTimeout(eraseWord, 40);
        } else {
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(typeWord, 300);
        }
      }

      typePrefix();
    }

    window.addEventListener('DOMContentLoaded', () => {
      initPublicMail();
      initHeroTypewriter();
    });
  </script>
</body>
</html>`
}
