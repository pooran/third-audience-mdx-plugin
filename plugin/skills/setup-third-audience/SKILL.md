---
name: setup-third-audience
description: Use when adding third-audience-mdx to a Next.js App Router project — detects project state and walks through installation, API routes, dashboard, and verification
---

# Setup third-audience-mdx

Add `third-audience-mdx` to an existing Next.js App Router project. Makes the site discoverable by AI systems (ChatGPT, Claude, Perplexity, Gemini) and tracks bot visits and citations.

## Checklist

Work through these steps in order. Check off each one before moving to the next.

1. **Detect project state** — find `package.json`, `next.config.ts/js`, `middleware.ts`, `app/` directory, `content/` directory
2. **Check if already installed** — look for `third-audience-mdx` in dependencies; if present, run health check instead
3. **Install package** — `npm install third-audience-mdx`
4. **Wrap next.config** — add `withThirdAudience()` wrapping the existing config
5. **Add or update middleware.ts** — export `thirdAudienceMiddleware`; if middleware exists, integrate rather than replace
6. **Add API routes** — create all 7 route files under `app/api/third-audience/`
7. **Add dashboard pages** — create 4 pages + layout under `app/third-audience/`
8. **Add citation tracker script** — copy to `public/` and add `<script>` to root layout
9. **Add env vars** — append to `.env.local`
10. **Update .gitignore** — add data files
11. **Verify** — run `npx third-audience health`, check all endpoints

## Step 1 — Detect project state

Read the following files if they exist:
- `package.json` — check Next.js version, existing dependencies
- `next.config.ts` or `next.config.js` — existing config shape
- `middleware.ts` — existing middleware (CRITICAL: don't overwrite it)
- `app/layout.tsx` — root layout for adding the citation tracker script

Report what you found before proceeding.

## Step 2 — Check if already installed

```bash
grep -r "third-audience-mdx" package.json
```

If found, run `npx third-audience health` and report status. Skip to Step 11.

## Step 3 — Install

```bash
npm install third-audience-mdx
```

## Step 4 — Wrap next.config

**If `next.config.ts` exists (TypeScript):**
```ts
import { withThirdAudience } from 'third-audience-mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // existing config preserved here
}

export default withThirdAudience(
  {
    contentDir: 'content',
    dataDir: 'data',
    dashboard: true,
    dashboardSecret: process.env.THIRD_AUDIENCE_SECRET,
  },
  nextConfig
)
```

**If `next.config.js` exists (CommonJS):**
```js
const { withThirdAudience } = require('third-audience-mdx')

const nextConfig = {
  // existing config preserved here
}

module.exports = withThirdAudience(
  { contentDir: 'content', dataDir: 'data', dashboard: true },
  nextConfig
)
```

Always preserve the existing config — never replace it.

## Step 5 — Middleware

**If no `middleware.ts` exists**, create it:
```ts
export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**If `middleware.ts` already exists**, integrate without replacing:
```ts
import { thirdAudienceMiddleware } from 'third-audience-mdx'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Run third-audience first — it handles AI crawler rewrites
  const taResponse = thirdAudienceMiddleware(request)
  if (taResponse) return taResponse

  // Existing middleware logic below
  // ... (preserve existing code here)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Step 6 — API routes

Create each of these files. Each is a one-liner:

`app/api/third-audience/markdown/[...slug]/route.ts`
```ts
export { GET } from 'third-audience-mdx/routes/markdown'
```

`app/api/third-audience/okf/[...path]/route.ts`
```ts
export { GET } from 'third-audience-mdx/routes/okf'
```

`app/api/third-audience/llms-txt/route.ts`
```ts
export { GET } from 'third-audience-mdx/routes/llms-txt'
```

`app/api/third-audience/sitemap-ai/route.ts`
```ts
export { GET } from 'third-audience-mdx/routes/sitemap-ai'
```

`app/api/third-audience/citation/route.ts`
```ts
export { GET, POST } from 'third-audience-mdx/routes/citation'
```

`app/api/third-audience/analytics/route.ts`
```ts
export { GET } from 'third-audience-mdx/routes/analytics'
```

`app/api/third-audience/bots-config/route.ts`
```ts
export { GET, POST } from 'third-audience-mdx/routes/bots-config'
```

## Step 7 — Dashboard pages

`app/third-audience/layout.tsx`
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

`app/third-audience/page.tsx`
```tsx
import { BotAnalyticsPage } from 'third-audience-mdx/dashboard/ui/pages/BotAnalyticsPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <BotAnalyticsPage /> }
```

`app/third-audience/citations/page.tsx`
```tsx
import { LlmTrafficPage } from 'third-audience-mdx/dashboard/ui/pages/LlmTrafficPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <LlmTrafficPage /> }
```

`app/third-audience/bots/page.tsx`
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

`app/third-audience/health/page.tsx`
```tsx
import { SystemHealthPage } from 'third-audience-mdx/dashboard/ui/pages/SystemHealthPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <SystemHealthPage /> }
```

## Step 8 — Citation tracker script

```bash
cp node_modules/third-audience-mdx/src/public/citation-tracker.js public/citation-tracker.js
```

Add to `app/layout.tsx` before `</body>`:
```tsx
<script src="/citation-tracker.js" async />
```

## Step 9 — Environment variables

Append to `.env.local`:
```
THIRD_AUDIENCE_SECRET=<generate a random secret>
NEXT_PUBLIC_SITE_URL=https://yoursite.com
TA_CONTENT_DIR=content
TA_DATA_DIR=data
```

Generate a secret: `openssl rand -hex 32`

## Step 10 — .gitignore

Add to `.gitignore`:
```
data/ta-visits.jsonl
data/ta-citations.jsonl
data/ta-cache/
```

## Step 11 — Verify

```bash
npx third-audience health
```

Then confirm each endpoint responds correctly:

| Check | Command |
|---|---|
| llms.txt | `curl http://localhost:3000/llms.txt` |
| sitemap-ai | `curl http://localhost:3000/sitemap-ai.xml` |
| .md URL | `curl http://localhost:3000/your-first-post.md` |
| Simulate bot | `curl -A "ClaudeBot/1.0" http://localhost:3000/your-first-post` |
| Dashboard | Open `http://localhost:3000/third-audience/` |

Report results to the user. Flag anything that returned unexpected output.

## Key Principles

- **Never overwrite existing middleware** — always integrate with it
- **Never overwrite existing next.config** — always wrap the existing export
- **Preserve all existing config values** — only add, never remove
- **Content dir must exist** — if `content/` doesn't exist, ask the user where their MDX files are before proceeding
- **Don't invent secrets** — generate them with `openssl rand -hex 32` or ask the user
