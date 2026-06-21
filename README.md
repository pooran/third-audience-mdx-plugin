# third-audience-mdx

For two decades, websites were built for two audiences: **humans** and **search engines**. Today there is a third audience rapidly growing: **AI agents and LLM crawlers**.

AI systems like ChatGPT, Perplexity, Claude, and Gemini actively crawl the web to answer questions, generate summaries, and provide recommendations. Most sites serve these bots the same HTML built for humans — full of navigation menus, scripts, ads, and layout markup that adds noise and reduces accuracy.

**third-audience-mdx** automatically serves clean, structured Markdown versions of your MDX content to AI crawlers, while humans continue to see your normal site. Think of it as **SEO for the AI era** — Generative Engine Optimization (GEO).

Drop-in npm package for Next.js App Router. Tracks bot visits and AI citations. Stores data in SQLite (local) or Postgres (Vercel/serverless). Zero external services required.

> Inspired by [third-audience-wordpress-plugin](https://github.com/spcaeo/third-audience-wordpress-plugin) by [@spcaeo](https://github.com/spcaeo).

---

## Features

- **`.md` URL for every page** — `GET /your-post.md` returns clean Markdown of the matching MDX file
- **Content negotiation** — `Accept: text/markdown` header serves Markdown to any AI crawler automatically
- **`/llms.txt`** — auto-generated AI content index from your MDX frontmatter
- **`/sitemap-ai.xml`** — AI-specific sitemap with title and description metadata
- **`/okf/` bundle** — Open Knowledge Format: all content as self-navigable `.md` files
- **Bot detection** — 20+ known AI crawlers (ClaudeBot, GPTBot, PerplexityBot, Gemini, etc.) plus heuristic detection
- **Bot analytics** — every crawler visit logged to the database
- **Citation tracking** — server-side referrer detection + client-side JS for ChatGPT, Perplexity, Claude, Gemini, Copilot
- **Citation alerts** — notifies on first citation, new platform, citation spikes
- **Dashboard** — React web UI at `/third-audience/` with 4 pages
- **CLI** — `npx third-audience init/health/export`
- **JSX stripping** — serves clean Markdown to AI; removes imports, component tags, expressions
- **Memory cache** — LRU in-memory cache + database-backed disk tier

---

## Install

```bash
npm install third-audience-mdx
```

---

## Quick Setup

```bash
npx third-audience init
```

The wizard detects your Next.js project, asks for your content directory, and writes the required files.

---

## Manual Setup

### 1. Wrap your Next.js config

**`next.config.ts`**
```ts
import { withThirdAudience } from 'third-audience-mdx'

export default withThirdAudience({
  contentDir: 'content',       // where your .mdx files live
  dashboard: true,
  dashboardSecret: process.env.THIRD_AUDIENCE_SECRET,
})
```

### 2. Add middleware

**`middleware.ts`** (project root)
```ts
export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. Add API routes

Create these files in your `app/` directory:

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

### 4. Add the dashboard

**`app/third-audience/layout.tsx`**
```tsx
import type { ReactNode } from 'react'
import { Sidebar } from 'third-audience-mdx/dashboard/ui/components/Sidebar'
import 'third-audience-mdx/dashboard/ui/globals.css'

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
export const dynamic = 'force-dynamic'
export default function Page() { return <BotManagementPage config={{ allowlist: [], blocklist: [], track_unknown: true }} /> }
```

**`app/third-audience/health/page.tsx`** — System Health
```tsx
import { SystemHealthPage } from 'third-audience-mdx/dashboard/ui/pages/SystemHealthPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <SystemHealthPage /> }
```

### 5. Add client-side citation tracker

Copy `node_modules/third-audience-mdx/src/public/citation-tracker.js` to `public/` and add to your root layout:

```tsx
// app/layout.tsx
<script src="/citation-tracker.js" async />
```

### 6. Environment variables

**`.env.local`**
```
THIRD_AUDIENCE_SECRET=your-secret-here
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

---

## Storage

third-audience-mdx needs somewhere to store visits, citations, admin state, and cache. Two backends are supported — the right choice depends on where you deploy.

### SQLite (default — local servers, Docker, VPS)

Zero config. A single `ta-data.db` file is created automatically in your data directory. Tables are created on first run.

```ts
// next.config.ts — SQLite is the default, no config needed
withThirdAudience({
  contentDir: 'content',
})

// or explicitly:
withThirdAudience({
  storage: { type: 'sqlite' },
})
```

### Postgres (Vercel, serverless, any hosted Postgres)

Use this on Vercel or any platform with a read-only filesystem. Works with any Postgres-compatible provider — Supabase, Neon, Railway, PlanetScale (via Postgres mode), etc. All tables are created automatically on first connection (prefixed `ta_`).

```ts
// next.config.ts
withThirdAudience({
  storage: {
    type: 'postgres',
    url: process.env.DATABASE_URL!,
  },
})
```

**`.env.local`**
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

**Tables created automatically:**
- `ta_admin` — dashboard credentials and API key
- `ta_bots_config` — allowlist/blocklist settings
- `ta_visits` — bot visit log
- `ta_citations` — AI citation log
- `ta_cache` — rendered Markdown cache

---

## Dashboard

Visit `/third-audience/` on your site. Protected by `THIRD_AUDIENCE_SECRET` (HTTP Basic or Bearer token).

| Page | URL | Description |
|---|---|---|
| Bot Analytics | `/third-audience/` | Hero metrics, daily visits chart, top bots, top pages |
| LLM Traffic | `/third-audience/citations` | Citations per platform, country, page |
| Bot Management | `/third-audience/bots` | Known bots list, allowlist/blocklist editor |
| System Health | `/third-audience/health` | Node version, storage status, cache stats, quick links |

---

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /your-page.md` | Clean Markdown of any MDX file |
| `Accept: text/markdown` | Auto-serves Markdown to AI crawlers |
| `GET /llms.txt` | AI content index from frontmatter |
| `GET /sitemap-ai.xml` | AI sitemap with metadata |
| `GET /okf/` | OKF bundle index |
| `GET /okf/[slug].md` | Individual page as Markdown |
| `POST /api/third-audience/citation` | Client-side citation report receiver |

---

## CLI

```bash
npx third-audience init              # interactive setup wizard
npx third-audience health            # system health check
npx third-audience export            # export visits as CSV
npx third-audience export citations  # export citations as CSV
```

---

## Configuration

```ts
withThirdAudience({
  contentDir: 'content',          // .mdx source directory (default: 'content')
  dataDir: 'data',                // data directory for SQLite file (default: 'data')
  dashboard: true,                // mount /third-audience/ (default: true)
  dashboardSecret: '...',         // protect dashboard with a secret
  storage: { type: 'sqlite' },   // or { type: 'postgres', url: '...' }
  stripSegments: ['en', 'fr'],   // strip locale prefixes from URL slugs
  notifications: {
    email: { smtp: '...', to: '...' },
    slack: { webhookUrl: '...' },
  },
  bots: {
    allowlist: [],                // always track these UAs
    blocklist: [],                // never track these UAs
  },
  cache: {
    ttl: 3600,                    // cache TTL in seconds (default: 3600)
    maxMemoryEntries: 500,        // max in-memory entries (default: 500)
  },
})
```

---

## Project Structure

```
src/
  core/         MDX reader, Markdown renderer (JSX stripper), middleware, Next.js config wrapper
  detection/    Bot detection pipeline — known patterns → heuristics → auto-learner
  analytics/    Visit tracker, geolocation (geoip-lite), performance stats
  citations/    Citation tracker, citation alerts
  cache/        Two-tier cache (memory LRU + database-backed disk tier)
  storage/      Store interface, SqliteStore, PostgresStore, factory
  discovery/    llms.txt generator, sitemap-ai generator
  okf/          OKF bundle — index + per-page + internal link rewriting
  dashboard/    Auth, API route handlers, React UI pages and components
  cli/          init, health, export commands
  public/       citation-tracker.js (client-side, framework-agnostic)
  nextjs-app/   Ready-to-copy Next.js App Router files
```

## Detected AI Crawlers

ClaudeBot, GPTBot, ChatGPT-User, PerplexityBot, Googlebot-AI (Google-Extended), Applebot-Extended, CCBot, CohereCrawler, AI2Bot, Bytespider, Diffbot, YouBot, FacebookBot — plus heuristic detection for unknown bots.
