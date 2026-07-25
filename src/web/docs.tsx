import { html, raw } from 'hono/html'
import { Layout } from './layout'

export function DocsPage({ session = false }: { session?: boolean }) {
  const swaggerHtml = `
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
      .swagger-ui { font-family: inherit !important; color: #f8fafc !important; }
      .swagger-ui .wrapper { padding: 0 !important; max-width: none !important; }
      .swagger-ui .scheme-container, .swagger-ui .topbar, .swagger-ui .info { display: none !important; }
      .swagger-ui .opblock-tag { color: #f8fafc !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-size: 1.1rem !important; margin: 0 0 16px 0 !important; padding: 0 0 8px 0 !important; }
      .swagger-ui .opblock-tag small { color: #94a3b8 !important; }
      .swagger-ui .opblock { border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: none !important; background: #0f172a !important; margin-bottom: 16px !important; overflow: hidden !important; }
      .swagger-ui .opblock.opblock-post { background: rgba(16, 185, 129, 0.03) !important; border-color: rgba(16, 185, 129, 0.3) !important; }
      .swagger-ui .opblock.opblock-get { background: rgba(59, 130, 246, 0.03) !important; border-color: rgba(59, 130, 246, 0.3) !important; }
      .swagger-ui .opblock.opblock-delete { background: rgba(239, 68, 68, 0.03) !important; border-color: rgba(239, 68, 68, 0.3) !important; }
      .swagger-ui .opblock .opblock-summary { padding: 12px 16px !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; align-items: center !important; }
      .swagger-ui .opblock .opblock-summary-method { border-radius: 6px !important; font-weight: 700 !important; font-size: 0.85rem !important; padding: 6px 16px !important; text-shadow: none !important; }
      .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated { color: #f8fafc !important; font-weight: 600 !important; font-size: 0.95rem !important; }
      .swagger-ui .opblock .opblock-summary-description { color: #cbd5e1 !important; font-weight: 400 !important; font-size: 0.875rem !important; }
      .swagger-ui .opblock-body { background: #0f172a !important; padding: 16px !important; }
      .swagger-ui .opblock-section-header { background: rgba(255, 255, 255, 0.05) !important; border-radius: 8px !important; padding: 10px 16px !important; margin-bottom: 16px !important; box-shadow: none !important; }
      .swagger-ui .opblock-section-header h4 { color: #f8fafc !important; font-weight: 600 !important; font-size: 0.9rem !important; }
      .swagger-ui .opblock-section-header label { color: #f8fafc !important; }
      .swagger-ui table { padding: 0 !important; }
      .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #94a3b8 !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-size: 0.85rem !important; padding: 8px 12px !important; }
      .swagger-ui table tbody tr td { color: #f8fafc !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; padding: 12px !important; }
      .swagger-ui .parameter__name { color: #f8fafc !important; font-weight: 600 !important; }
      .swagger-ui .parameter__name.required:after { color: #ef4444 !important; }
      .swagger-ui .parameter__type, .swagger-ui .parameter__in { color: #38bdf8 !important; font-size: 0.8rem !important; }
      .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p { color: #cbd5e1 !important; }
      .swagger-ui .response-col_status { color: #10b981 !important; font-weight: 600 !important; }
      .swagger-ui .response-col_description, .swagger-ui .response-col_description__inner div.markdown, .swagger-ui .response-col_description__inner div.renderedMarkdown { color: #e2e8f0 !important; }
      .swagger-ui .btn.try-out__btn { background: rgba(59, 130, 246, 0.15) !important; color: #60a5fa !important; border: 1px solid rgba(59, 130, 246, 0.4) !important; border-radius: 6px !important; font-weight: 500 !important; }
      .swagger-ui .btn.try-out__btn:hover { background: rgba(59, 130, 246, 0.25) !important; }
      .swagger-ui .btn.execute { background: #3b82f6 !important; color: #fff !important; border: none !important; border-radius: 6px !important; }
      .swagger-ui .btn.btn-clear { color: #94a3b8 !important; border-color: rgba(255,255,255,0.2) !important; }
      .swagger-ui select { background: #1e293b !important; color: #f8fafc !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 6px !important; padding: 6px 12px !important; }
      .swagger-ui input[type=text], .swagger-ui textarea { background: #1e293b !important; color: #f8fafc !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 6px !important; padding: 6px 12px !important; }
      .swagger-ui .opblock-body pre.microlight { background: #1e293b !important; color: #38bdf8 !important; border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.1) !important; }
      .swagger-ui .model-box { background: #1e293b !important; border-radius: 8px !important; padding: 12px !important; }
      .swagger-ui .model, .swagger-ui .model-title { color: #f8fafc !important; }
      .swagger-ui .prop-type { color: #38bdf8 !important; }
      .swagger-ui .prop-format { color: #a78bfa !important; }
      .swagger-ui svg { fill: #94a3b8 !important; }
      .swagger-ui section.models { border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; background: #0f172a !important; margin-top: 24px !important; }
      .swagger-ui section.models h4 { border-bottom: 1px solid rgba(255,255,255,0.1) !important; color: #f8fafc !important; }
    </style>

    <div id="swagger-ui"></div>
    
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        const spec = {
          openapi: "3.0.0",
          info: {
            title: "VoidMail Developer API",
            version: "2.0.0",
            description: "REST API endpoints for VoidMail temporary email service. Base URL prefix: /api",
          },
          components: {
            securitySchemes: {
              ApiKeyAuth: {
                type: "apiKey",
                in: "header",
                name: "Authorization",
                description: "Enter your generated API Key in the format: 'Bearer <YOUR_API_KEY>'"
              }
            }
          },
          security: [{ ApiKeyAuth: [] }],
          paths: {
            "/api/inboxes": {
              post: {
                summary: "Create an Inbox",
                tags: ["Inbox"],
                requestBody: {
                  required: true,
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          domain: { type: "string", example: "voidmail.my.id" },
                          address: { type: "string", example: "testuser" }
                        }
                      }
                    }
                  }
                },
                responses: {
                  "200": { description: "Inbox created successfully" },
                  "401": { description: "Unauthorized" },
                  "429": { description: "Quota exceeded" }
                }
              }
            },
            "/api/inboxes/{addr}/messages": {
              get: {
                summary: "List Messages in an Inbox",
                tags: ["Inbox"],
                parameters: [
                  { name: "addr", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                  "200": { description: "List of messages" }
                }
              }
            },
            "/api/session": {
              get: {
                summary: "Create or Verify Public Guest Session",
                tags: ["Session"],
                responses: {
                  "200": { description: "Session created" }
                }
              }
            }
          }
        };

        window.ui = SwaggerUIBundle({
          spec: spec,
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout"
        });
      };
    </script>
  `

  const apiKeyGuideHtml = `
    <div style="background:rgba(15,23,42,0.8);border:1px solid var(--border);border-radius:var(--radius-md);padding:20px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <i data-lucide="key" style="color:var(--primary)"></i>
        <h3 style="font-size:1rem;font-weight:600;margin:0">API Key Authentication Guide</h3>
      </div>
      <p style="font-size:0.875rem;color:var(--text-dim);line-height:1.5;margin-bottom:12px">
        To authenticate your REST API requests programmatically, generate an API key in the Admin Portal and pass it in your HTTP Request Header:
      </p>
      <div style="background:rgba(0,0,0,0.5);border:1px solid var(--border);padding:10px 14px;border-radius:6px;font-family:monospace;font-size:0.875rem;color:#38bdf8;margin-bottom:12px">
        Authorization: Bearer YOUR_GENERATED_API_KEY
      </div>
      <div style="font-size:0.8rem;color:var(--text-dim);display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <span><i data-lucide="globe" class="icon-sm" style="color:var(--primary);margin-right:4px"></i> Base Endpoint URL: <code>/api</code></span>
        <span><i data-lucide="shield-check" class="icon-sm" style="color:#10b981;margin-right:4px"></i> Domain Permissions & Quotas Enforced</span>
      </div>
    </div>
  `

  if (session) {
    return Layout({
      title: 'API Documentation',
      session: true,
      children: html`
        <div class="dash-header">
          <div>
            <h2><i data-lucide="book-open" class="icon-inline"></i> API Documentation</h2>
            <p>REST API endpoints and interactive specification</p>
          </div>
        </div>

        <div class="panel" style="padding:24px">
          ${raw(apiKeyGuideHtml)}
          ${raw(swaggerHtml)}
        </div>
      `
    })
  }

  // Public Developer View (/docs)
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Developer REST API Docs — VoidMail</title>
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="landing-body">
  <header class="landing-header">
    <div class="landing-container nav-container">
      <div class="landing-logo">
        <img src="/logo.png" alt="VoidMail Logo" class="brand-logo-img" /> 
        <span>Void<span style="color:var(--primary)">Mail</span></span>
      </div>
      <nav class="landing-nav">
        <a href="/#generator">Instant Mail</a>
        <a href="/#domains">Domains</a>
        <a href="/#features">Features</a>
        <a href="/docs" class="active">Developer API</a>
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
      <a href="/#generator" onclick="toggleLandingDrawer(false)"><i data-lucide="mail"></i> Instant Mail</a>
      <a href="/#domains" onclick="toggleLandingDrawer(false)"><i data-lucide="globe"></i> Domains</a>
      <a href="/#features" onclick="toggleLandingDrawer(false)"><i data-lucide="zap"></i> Features</a>
      <a href="/docs" onclick="toggleLandingDrawer(false)" class="active"><i data-lucide="book-open"></i> Developer API</a>
    </nav>
  </aside>

  <div class="landing-container" style="padding: 32px 20px 60px">
    <div class="dash-header" style="margin-bottom:16px;flex-wrap:wrap;gap:16px">
      <div>
        <h1 style="font-size:1.75rem;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:10px">
          <i data-lucide="book-open" style="color:var(--primary)"></i> Developer REST API Docs
        </h1>
        <p style="color:var(--text-dim);font-size:0.9rem">REST API endpoints and specification for VoidMail temporary email service.</p>
      </div>
      <a href="/" class="btn-primary" style="background:var(--bg-panel);border:1px solid var(--border);padding:8px 18px;font-size:0.85rem">
        ← Back to Home
      </a>
    </div>

    <div class="panel" style="padding:20px 24px;background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--radius-lg)">
      ${raw(apiKeyGuideHtml)}
      ${raw(swaggerHtml)}
    </div>
  </div>

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

  <script>
    lucide.createIcons();
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
  </script>
</body>
</html>`
}
