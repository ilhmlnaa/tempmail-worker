# TempMail Worker

**MAILLDEZ-compatible Temp Mail API** running on Cloudflare Email Workers.

Powered by [Hono](https://hono.dev) — zero servers, zero maintenance.

---

## 🏗️ Architecture

```
Email → *@yourdomain.com → CF Email Routing → Worker (Hono)
                                                   │
                                              KV Store
                                             (auto-expire 10m)
```

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` / `POST` | `/api/session` | Create session → `{ sessionId, expiresAt }` |
| `POST` | `/api/inboxes` | Create inbox → `{ address }` (body: `{ domain }`) |
| `GET` | `/api/inboxes/{addr}/messages` | List messages → `[{ id, from, subject, body }]` |
| `DELETE` | `/api/inboxes/{addr}` | Delete inbox |

**Headers:** `x-session-id: <sessionId>` (optional, ties inbox to session)

Compatible with `grok-signup.py` from [Auto-sign-up-grok-dezz](https://github.com/dzDev37/Auto-sign-up-grok-dezz).

---

## 🚀 Deploy

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Cloudflare account](https://dash.cloudflare.com) with **Workers Paid** ($5/mo — required for Email Workers)
- Domain on Cloudflare (with Email Routing enabled)

### Step 1: Install & Login

```bash
git clone <this-repo>
cd tempmail-worker
npm install
npx wrangler login
```

### Step 2: Create KV Namespace

```bash
npx wrangler kv namespace create MAIL_LITE
```

Copy the `id` output and paste into `wrangler.toml` replacing `TBD_WILL_BE_GENERATED`.

### Step 3: Enable Email Routing on your domain

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → your domain
2. **Email** → **Email Routing** → Enable
3. Add a **Catch-all** rule → **Send to a Worker** → select `tempmail-worker`

### Step 4: Deploy Worker

```bash
npm run deploy
```

### Step 5: Test

```bash
# Create session
curl https://your-worker.workers.dev/api/session

# Create inbox
curl -X POST https://your-worker.workers.dev/api/inboxes \
  -H "Content-Type: application/json" \
  -d '{"domain":"zenime.online"}'

# Send a test email to that address, then:
curl https://your-worker.workers.dev/api/inboxes/ABcdEF123456/messages
```

### Step 6: Configure Auto-sign-up-grok-dezz

In your `.env`:

```env
MAILLDEZ_URL=https://your-worker.workers.dev
MAILLDEZ_DOMAINS=zenime.online,your-other-domain.com
```

---

## 🛠️ Local Development

```bash
npm run dev
```

Note: Email routing doesn't work locally — deploy to test end-to-end.

---

## 📁 File Structure

```
tempmail-worker/
├── src/
│   └── index.ts          # Worker entry (Hono + email handler)
├── package.json
├── tsconfig.json
├── wrangler.toml
└── README.md
```

---

## ⚠️ Requirements

| Requirement | Why |
|-------------|-----|
| **Workers Paid ($5/mo)** | Email Workers is paid-only |
| **Domain on Cloudflare** | Email Routing requires CF-managed DNS |
| **Email Routing enabled** | Catch-all → Worker delivery |

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SECRET` | `change-me-to-random-string` | Reserved for future auth (not yet enforced) |

---

## 🧪 Tech Stack

- [Hono](https://hono.dev) — Fast, lightweight web framework for the edge
- [postal-mime](https://github.com/postalsys/postal-mime) — MIME email parser
- [Cloudflare Workers](https://workers.cloudflare.com) — Serverless edge runtime
- [Cloudflare KV](https://developers.cloudflare.com/kv) — Key-value store with TTL

## 📜 License

MIT
