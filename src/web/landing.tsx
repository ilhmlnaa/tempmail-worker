import { html, raw } from 'hono/html'

export function LandingPage({ domains }: { domains: string[] }) {
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
  <script src="https://unpkg.com/lucide@latest"></script>
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
    <div class="landing-container hero-content">
      <span class="hero-badge"><span class="pulse-dot"></span> Next-Gen Disposable Email Service</span>
      <h1 class="hero-title">Disposable Email into the <span class="gradient-text">Void</span></h1>
      <p class="hero-subtitle">
        Generate instant, anonymous temporary email addresses in seconds. Keep your personal inbox safe from spam, trackers, and data leaks.
      </p>

      <!-- Instant Temp Mail Generator Widget -->
      <div class="hero-widget-card" id="generator">
        <div class="widget-header">
          <div style="display:flex;align-items:center;gap:10px">
            <i data-lucide="mail" style="color:var(--primary)"></i>
            <span style="font-weight:600;font-size:0.95rem">Your Temporary Email Address</span>
          </div>
          <span class="badge" id="tempMailStatus">Ready</span>
        </div>

        <div class="widget-body">
          <div class="widget-email-row">
            <div class="widget-email-display" id="widgetEmail">Generating email...</div>
            <button type="button" class="btn-primary" onclick="copyWidgetEmail()" id="btnCopyEmail">
              <i data-lucide="copy" class="icon-sm"></i> Copy Address
            </button>
            <button type="button" class="btn-icon" onclick="generateNewPublicMail()" title="Generate New Mail">
              <i data-lucide="refresh-cw" class="icon-sm"></i>
            </button>
          </div>

          <div class="widget-form-row">
            <input type="text" id="customPrefix" placeholder="Custom username (optional)..." />
            <select id="widgetDomain">
              ${domains.map(d => html`<option value="${d}">@${d}</option>`)}
            </select>
            <button type="button" class="btn-primary" onclick="createCustomMail()" style="background:var(--bg-panel-solid);border:1px solid var(--border)">
              Create Custom
            </button>
          </div>
        </div>

        <!-- Live Messages Inbox Reader Widget -->
        <div class="widget-inbox-section">
          <div class="widget-inbox-header">
            <span><i data-lucide="inbox" class="icon-inline"></i> Incoming Messages</span>
            <span style="font-size:0.75rem;color:var(--text-dim)" id="autoRefreshStatus">Auto-refreshing every 5s...</span>
          </div>

          <div class="widget-messages-container" id="widgetMessagesContainer">
            <div style="text-align:center;padding:30px 16px;color:var(--text-dim)">
              <i data-lucide="loader" class="spin-anim" style="width:28px;height:28px;margin-bottom:8px"></i>
              <p style="font-size:0.875rem">Waiting for incoming messages to <strong id="waitingAddress">...</strong></p>
            </div>
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

  <div id="toast"></div>

  <script>
    lucide.createIcons();

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
    let publicSessionId = localStorage.getItem('voidmail_public_sid');
    let pollInterval = null;

    if (!publicSessionId) {
      publicSessionId = 'pub_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('voidmail_public_sid', publicSessionId);
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

    function selectDomainFromLanding(d) {
      document.getElementById('widgetDomain').value = d;
      createCustomMail();
      document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
    }

    async function initPublicMail() {
      // Auto-provision public guest session
      try {
        await fetch('/api/session', { headers: { 'x-session-id': publicSessionId } });
      } catch (e) {
        console.error('Session init error:', e);
      }

      const savedEmail = localStorage.getItem('voidmail_current_email');
      if (savedEmail) {
        currentPublicEmail = savedEmail;
        updateEmailDisplay(currentPublicEmail);
        startPollingMessages(currentPublicEmail);
      } else {
        await generateNewPublicMail();
      }
    }

    async function generateNewPublicMail() {
      const domain = document.getElementById('widgetDomain').value || '${primaryDomain}';
      const randomPrefix = 'temp_' + Math.random().toString(36).substring(2, 10);
      await createPublicInbox(randomPrefix, domain);
    }

    async function createCustomMail() {
      const prefix = document.getElementById('customPrefix').value.trim();
      const domain = document.getElementById('widgetDomain').value || '${primaryDomain}';
      await createPublicInbox(prefix, domain);
    }

    async function createPublicInbox(prefix, domain) {
      try {
        const res = await fetch('/api/inboxes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': publicSessionId
          },
          body: JSON.stringify({ address: prefix, domain: domain })
        });
        const data = await res.json();
        if (data.address) {
          currentPublicEmail = data.address;
          localStorage.setItem('voidmail_current_email', currentPublicEmail);
          updateEmailDisplay(currentPublicEmail);
          startPollingMessages(currentPublicEmail);
          showToast('New email generated!');
        } else if (data.error) {
          showToast(data.error);
        }
      } catch (err) {
        console.error('Error creating public inbox:', err);
      }
    }

    function updateEmailDisplay(email) {
      document.getElementById('widgetEmail').textContent = email;
      document.getElementById('waitingAddress').textContent = email;
    }

    function startPollingMessages(email) {
      if (pollInterval) clearInterval(pollInterval);
      fetchMessages(email);
      pollInterval = setInterval(() => fetchMessages(email), 5000);
    }

    async function fetchMessages(email) {
      if (!email) return;
      try {
        const res = await fetch('/api/inboxes/' + encodeURIComponent(email) + '/messages', {
          headers: { 'x-session-id': publicSessionId }
        });
        if (res.ok) {
          const msgs = await res.json();
          renderWidgetMessages(msgs);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    }

    function renderWidgetMessages(msgs) {
      const container = document.getElementById('widgetMessagesContainer');
      if (!msgs || msgs.length === 0) {
        container.innerHTML = \`
          <div style="text-align:center;padding:30px 16px;color:var(--text-dim)">
            <i data-lucide="mail-open" style="width:28px;height:28px;margin-bottom:8px;opacity:0.5"></i>
            <p style="font-size:0.875rem">No messages yet. Send an email to <strong>\${currentPublicEmail}</strong></p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = msgs.map((m, i) => \`
        <div style="padding:14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:rgba(11,15,25,0.6);margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <strong style="font-size:0.9rem;color:var(--text)">\${m.subject || '(no subject)'}</strong>
            <span style="font-size:0.75rem;color:var(--text-dim)">\${new Date(m.createdAt).toLocaleTimeString()}</span>
          </div>
          <div style="font-size:0.8rem;color:#60a5fa;margin-bottom:8px">From: \${m.from}</div>
          <div style="font-size:0.85rem;color:var(--text-dim);max-height:80px;overflow-y:auto;white-space:pre-wrap;background:rgba(0,0,0,0.2);padding:8px;border-radius:4px">\${m.body || ''}</div>
        </div>
      \`).join('');
      lucide.createIcons();
    }

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

    window.addEventListener('DOMContentLoaded', () => {
      initPublicMail();
    });
  </script>
</body>
</html>`
}
