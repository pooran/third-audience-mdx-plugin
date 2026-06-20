# Installation Guide

Complete step-by-step guide for adding `third-audience-mdx` to an existing Next.js App Router project.

---

## Prerequisites

- Node.js 18+
- Next.js 13+ (App Router)
- MDX content files (`.mdx` or `.md`) in a content directory

---

## Step 1 — Install the package

```bash
npm install third-audience-mdx
```

Or with pnpm / yarn:
```bash
pnpm add third-audience-mdx
yarn add third-audience-mdx
```

---

## Step 2 — Run the setup wizard (recommended)

```bash
npx third-audience init
```

The wizard will:
1. Detect your Next.js project
2. Ask for your content directory (e.g. `content`)
3. Ask for your data directory (e.g. `data`)
4. Ask for a dashboard secret
5. Write `middleware.ts` if it doesn't exist
6. Append to `.env.local`
7. Create the `data/` directory and update `.gitignore`

After the wizard, skip to [Step 6 — Add API routes](#step-6--add-api-routes).

---

## Step 3 — Wrap your Next.js config

**`next.config.ts`**
```ts
import { withThirdAudience } from 'third-audience-mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // your existing config here
}

export default withThirdAudience(
  {
    contentDir: 'content',   // folder where your .mdx files live
    dataDir: 'data',         // folder for analytics logs
    dashboard: true,
    dashboardSecret: process.env.THIRD_AUDIENCE_SECRET,
  },
  nextConfig
)
```

---

## Step 4 — Add middleware

Create (or update) **`middleware.ts`** in your project root:

```ts
export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

This handles:
- `GET /any-page.md` → serves Markdown of the matching MDX file
- `Accept: text/markdown` header → serves Markdown automatically
- `/llms.txt`, `/sitemap-ai.xml`, `/okf/` → rewrites to the correct API handlers

If you already have a `middleware.ts`, call `thirdAudienceMiddleware` inside your existing function and return its result when it produces a response.

---

## Step 5 — Set environment variables

**`.env.local`**
```
# Required
THIRD_AUDIENCE_SECRET=choose-a-strong-secret-here
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# Optional (defaults shown)
TA_CONTENT_DIR=content
TA_DATA_DIR=data
```

`THIRD_AUDIENCE_SECRET` protects the `/third-audience/` dashboard. Leave it blank only during local development.

---

## Step 6 — Add API routes

Create these files inside your `app/` directory. Each one is a one-liner that re-exports the handler from the package.

**`app/api/third-audience/markdown/[...slug]/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/markdown'
```

**`app/api/third-audience/okf/[...path]/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/okf'
```

**`app/api/third-audience/llms-txt/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/llms-txt'
```

**`app/api/third-audience/sitemap-ai/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/sitemap-ai'
```

**`app/api/third-audience/citation/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/citation'
```

**`app/api/third-audience/analytics/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/analytics'
```

**`app/api/third-audience/bots-config/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/bots-config'
```

---

## Step 7 — Add the dashboard

Create these files to mount the dashboard at `/third-audience/`.

**`app/third-audience/layout.tsx`**
```tsx
import type { ReactNode } from 'react'
import { Sidebar } from 'third-audience-mdx/dashboard/ui/components/Sidebar'
import 'third-audience-mdx/dashboard/ui/globals.css'

export const metadata = { title: 'Third Audience Dashboard' }

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="ta-layout">
          <Sidebar />
          <main className="ta-main">{children}</main>
        </div>
      </body>
    </html>
  )
}
```

**`app/third-audience/page.tsx`** — Bot Analytics
```tsx
import { BotAnalyticsPage } from 'third-audience-mdx/dashboard/ui/pages/BotAnalyticsPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <BotAnalyticsPage /> }
```

**`app/third-audience/citations/page.tsx`** — LLM Traffic
```tsx
import { LlmTrafficPage } from 'third-audience-mdx/dashboard/ui/pages/LlmTrafficPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <LlmTrafficPage /> }
```

**`app/third-audience/bots/page.tsx`** — Bot Management
```tsx
import { BotManagementPage } from 'third-audience-mdx/dashboard/ui/pages/BotManagementPage'
import fs from 'fs'
import path from 'path'
export const dynamic = 'force-dynamic'

export default function Page() {
  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  const configPath = path.join(process.cwd(), dataDir, 'ta-bots-config.json')
  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : { allowlist: [], blocklist: [], track_unknown: true }
  return <BotManagementPage config={config} />
}
```

**`app/third-audience/health/page.tsx`** — System Health
```tsx
import { SystemHealthPage } from 'third-audience-mdx/dashboard/ui/pages/SystemHealthPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <SystemHealthPage /> }
```

---

## Step 8 — Add client-side citation tracker

Copy the script to your public folder:

```bash
cp node_modules/third-audience-mdx/src/public/citation-tracker.js public/citation-tracker.js
```

Add to your root layout (`app/layout.tsx`):

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script src="/citation-tracker.js" async />
      </body>
    </html>
  )
}
```

This detects when users arrive from ChatGPT, Perplexity, Claude, Gemini, or Copilot and records the citation.

---

## Step 9 — Set up admin login

The dashboard at `/third-audience/` is protected by a login page. On first access, initialise the admin store:

```bash
npx third-audience init-admin
```

Or run the Node snippet manually:

```bash
node -e "
const crypto = require('crypto');
const fs = require('fs');
const secret = process.env.THIRD_AUDIENCE_SECRET || 'ta-salt';
const password = 'Chang3M3Now!';
const hash = crypto.createHash('sha256').update(secret + password).digest('hex');
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/ta-admin.json', JSON.stringify({
  passwordHash: hash,
  isDefaultPassword: true,
  createdAt: new Date().toISOString(),
  lastLoginAt: null
}, null, 2));
console.log('Admin store created. Default password: Chang3M3Now!');
"
```

**Default password: `Chang3M3Now!`**

On first login you will be immediately redirected to a password reset form. The dashboard shows a red warning banner until the default password is changed.

Add the login route:

**`app/api/third-audience/login/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/login'
```

---

## Step 10 — Update `.gitignore`

```
# Third Audience — keep analytics local, not in git
data/ta-visits.jsonl
data/ta-citations.jsonl
data/ta-cache/
data/ta-admin.json
```

The `data/ta-bots-config.json` file (your allowlist/blocklist) can optionally be committed.

---

## Step 10 — Verify everything works

```bash
npx third-audience health
```

Then start your dev server and check:

| URL | Expected |
|---|---|
| `/llms.txt` | Plain text list of all your content |
| `/sitemap-ai.xml` | XML sitemap with AI metadata |
| `/okf/` | Markdown index of all content |
| `/your-first-post.md` | Clean Markdown of that MDX file |
| `/third-audience/` | Bot Analytics dashboard |
| `/third-audience/health` | System Health page |

---

## Troubleshooting

**`.md` URLs return 404**
Make sure `middleware.ts` is at the project root (not inside `app/`) and the matcher covers the URL pattern.

**Dashboard shows no data**
Bot visits only appear after a real AI crawler hits your site. Use `curl -A "ClaudeBot/1.0" http://localhost:3000/` to simulate one.

**`contentDir` not found**
Set `TA_CONTENT_DIR` in `.env.local` to the correct path relative to your project root.

**Citation tracker not recording**
Confirm `citation-tracker.js` is in `public/` and the `<script>` tag is in your root layout. Test by visiting your site with `?utm_source=chatgpt` appended to the URL.

**Dashboard is open (no auth)**
Set `THIRD_AUDIENCE_SECRET` in `.env.local` and restart the dev server.

---

## Directory structure after setup

```
your-nextjs-project/
├── app/
│   ├── api/
│   │   └── third-audience/
│   │       ├── analytics/route.ts
│   │       ├── bots-config/route.ts
│   │       ├── citation/route.ts
│   │       ├── llms-txt/route.ts
│   │       ├── markdown/[...slug]/route.ts
│   │       ├── okf/[...path]/route.ts
│   │       └── sitemap-ai/route.ts
│   ├── third-audience/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── citations/page.tsx
│   │   ├── bots/page.tsx
│   │   └── health/page.tsx
│   └── layout.tsx              ← add citation-tracker.js <script> here
├── public/
│   └── citation-tracker.js    ← copied from node_modules
├── data/                       ← created by init wizard
│   ├── ta-visits.jsonl
│   ├── ta-citations.jsonl
│   └── ta-cache/
├── middleware.ts
├── next.config.ts
└── .env.local
```
