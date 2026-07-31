import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    SwaggerUIBundle?: any
  }
}

const openApiSpec = {
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
}

export function DocsPage() {
  useEffect(() => {
    // Load Swagger CSS
    if (!document.getElementById('swagger-css')) {
      const link = document.createElement('link')
      link.id = 'swagger-css'
      link.rel = 'stylesheet'
      link.href = '/vendor/swagger-ui-5.17.14.css'
      document.head.appendChild(link)
    }

    // Load Swagger JS Bundle
    if (window.SwaggerUIBundle) {
      initSwagger()
    } else {
      const script = document.createElement('script')
      script.src = '/vendor/swagger-ui-5.17.14-bundle.js'
      script.async = true
      script.onload = () => initSwagger()
      document.body.appendChild(script)
    }

    function initSwagger() {
      if (!window.SwaggerUIBundle) return
      window.SwaggerUIBundle({
        spec: openApiSpec,
        dom_id: '#swagger-ui-mount',
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      })
    }
  }, [])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h2>API Documentation</h2>
          <p>Interactive REST API specification and developer endpoint guide.</p>
        </div>
      </div>

      {/* Guide Box */}
      <Card className="border-primary/20 bg-secondary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-5 h-5 text-primary" /> API Key Authentication Guide
          </CardTitle>
          <CardDescription>
            To authenticate your REST API requests programmatically, pass your generated API Key in the HTTP request header:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-black/40 font-mono text-sm text-primary font-bold">
            <span>Authorization: Bearer YOUR_GENERATED_API_KEY</span>
            <Button
              size="xs"
              variant="default"
              onClick={() => {
                navigator.clipboard.writeText('Authorization: Bearer YOUR_GENERATED_API_KEY')
                toast.success('Authorization Header example copied')
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy Example
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Base Endpoint URL: <code className="text-foreground">{location.origin}/api</code>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Swagger UI Mount Container */}
      <Card className="p-4 bg-card/60">
        <div id="swagger-ui-mount" className="swagger-theme-wrapper min-h-125" />
      </Card>
    </div>
  )
}
