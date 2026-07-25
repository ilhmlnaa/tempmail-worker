import { html, raw } from 'hono/html'
import { Layout } from './layout'

export function DocsPage() {
  const swaggerHtml = `
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
      .swagger-ui { font-family: inherit !important; color: #f8fafc !important; }
      .swagger-ui .wrapper { padding: 0 !important; max-width: none !important; }
      .swagger-ui .scheme-container, .swagger-ui .topbar { display: none !important; }
      .swagger-ui .info { display: block !important; margin: 0 0 20px 0 !important; padding: 0 0 16px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
      .swagger-ui .info .title { color: #f8fafc !important; font-size: 1.25rem !important; font-weight: 700 !important; margin: 0 0 6px 0 !important; }
      .swagger-ui .info p { color: #94a3b8 !important; font-size: 0.875rem !important; margin: 0 !important; }
      .swagger-ui .opblock-tag { color: #f8fafc !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; font-size: 1.1rem !important; margin: 20px 0 16px 0 !important; padding: 0 0 8px 0 !important; }
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
      .swagger-ui .tab li { color: #f8fafc !important; }
      .swagger-ui label { color: #f8fafc !important; }
      .swagger-ui .dialog-ux .modal-ux { background: #1e293b !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; }
      .swagger-ui .dialog-ux .modal-ux-header { border-bottom-color: rgba(255,255,255,0.1) !important; }
      .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f8fafc !important; }
      .swagger-ui .auth-container { border-bottom-color: rgba(255,255,255,0.1) !important; }
      .swagger-ui .auth-container h4, .swagger-ui .auth-container label { color: #f8fafc !important; }
    </style>
    <div id="swagger-ui"></div>
    
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        const spec = {
          openapi: "3.0.0",
          info: {
            title: "TempMail Worker API",
            version: "2.0.0",
            description: "API for managing temporary email inboxes, reading messages, and managing API keys.",
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
                          domain: { type: "string", example: "zenime.online" },
                          local: { type: "string", description: "Optional specific username", example: "random123" }
                        },
                        required: ["domain"]
                      }
                    }
                  }
                },
                responses: {
                  "200": { description: "Inbox created successfully", content: { "application/json": { schema: { type: "object", properties: { address: { type: "string" } } } } } },
                  "401": { description: "Unauthorized" }
                }
              }
            },
            "/api/inboxes/{address}/messages": {
              get: {
                summary: "Get Messages",
                tags: ["Messages"],
                parameters: [
                  { name: "address", in: "path", required: true, schema: { type: "string" }, example: "random123@zenime.online" }
                ],
                responses: {
                  "200": { description: "List of messages" },
                  "401": { description: "Unauthorized" }
                }
              }
            },
            "/api/inboxes/{address}/messages/{messageId}": {
              get: {
                summary: "Get Message by ID (Raw EML)",
                tags: ["Messages"],
                parameters: [
                  { name: "address", in: "path", required: true, schema: { type: "string" } },
                  { name: "messageId", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                  "200": { description: "Raw EML text of the message" },
                  "401": { description: "Unauthorized" }
                }
              }
            },
            "/api/inboxes/{address}": {
              delete: {
                summary: "Delete an Inbox",
                tags: ["Inbox"],
                parameters: [
                  { name: "address", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                  "200": { description: "Inbox deleted" },
                  "401": { description: "Unauthorized" }
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
        ${raw(swaggerHtml)}
      </div>
    `
  })
}




