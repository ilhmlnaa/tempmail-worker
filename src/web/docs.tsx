import { html, raw } from 'hono/html'
import { Layout } from './layout'

export function DocsPage() {
  const swaggerHtml = `
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
      .swagger-ui .scheme-container, 
      .swagger-ui .topbar { display: none; }
      .swagger-ui { font-family: inherit; color: var(--text); }
      .swagger-ui .info, .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3, .swagger-ui .info h4, .swagger-ui .info h5, .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info a { color: var(--text); }
      .swagger-ui .info .title { color: var(--text); }
      .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated { color: var(--text); }
      .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p { color: var(--text-dim); }
      .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: var(--text); border-bottom-color: var(--border); }
      .swagger-ui table tbody tr td { color: var(--text); }
      .swagger-ui .parameter__name, .swagger-ui .parameter__type, .swagger-ui .parameter__deprecated, .swagger-ui .parameter__in { color: var(--text); }
      .swagger-ui .response-col_status, .swagger-ui .response-col_description__inner div.markdown, .swagger-ui .response-col_description__inner div.renderedMarkdown { color: var(--text); }
      .swagger-ui .opblock-body pre.microlight { background: rgba(0,0,0,0.5) !important; color: #fff !important; }
      .swagger-ui .btn { color: var(--text); border-color: var(--border); }
      .swagger-ui .btn:hover { background: rgba(255,255,255,0.1); }
      .swagger-ui .opblock { border-radius: 8px; border: 1px solid var(--border); box-shadow: none; background: rgba(255,255,255,0.01); }
      .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; }
      .swagger-ui section.models { border-color: var(--border); border-radius: 8px; }
      .swagger-ui section.models h4 span { color: var(--text); }
      .swagger-ui .model, .swagger-ui .model-title { color: var(--text); }
      .swagger-ui .prop-type, .swagger-ui .prop-format { color: #a1a1aa; }
      .swagger-ui svg { fill: var(--text); }
      .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: var(--text); }
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
      <div style="background:var(--bg); border-radius:12px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.1)">
        ${raw(swaggerHtml)}
      </div>
    `
  })
}
