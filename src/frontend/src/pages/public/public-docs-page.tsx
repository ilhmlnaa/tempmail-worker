import { useEffect } from 'react'
import { PublicHeader } from '@/components/public/layout/public-header'
import { PublicFooter } from '@/components/public/layout/public-footer'
import { KeyRound, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "VoidMail Public Developer API",
    version: "2.0.0",
    description: "REST API endpoints for VoidMail temporary email service. Base URL prefix: /api",
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Enter your API Key in format: 'Bearer <YOUR_API_KEY>'"
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/api/inboxes": {
      post: {
        summary: "Create a Temporary Inbox",
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
        summary: "List Received Email Messages",
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
        summary: "Create or Verify Guest Session",
        tags: ["Session"],
        responses: {
          "200": { description: "Session valid" }
        }
      }
    }
  }
}

export function PublicDocsPage() {
  useEffect(() => {
    if (!document.getElementById('swagger-css')) {
      const link = document.createElement('link')
      link.id = 'swagger-css'
      link.rel = 'stylesheet'
      link.href = '/vendor/swagger-ui-5.17.14.css'
      document.head.appendChild(link)
    }

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
        dom_id: '#public-swagger-ui-mount',
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      })
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Developer API Documentation</h1>
            <p className="text-sm text-muted-foreground">
              Integrate temporary inbox creation and message listing directly into your automated workflows.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-primary/20 bg-card space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-primary">
              <KeyRound className="w-4 h-4" /> Authentication Header Example
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background font-mono text-xs text-foreground">
              <span>Authorization: Bearer YOUR_GENERATED_API_KEY</span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText('Authorization: Bearer YOUR_GENERATED_API_KEY')
                  toast.success('Header copied')
                }}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl swagger-theme-wrapper overflow-hidden">
            <div id="public-swagger-ui-mount" className="min-h-125" />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
