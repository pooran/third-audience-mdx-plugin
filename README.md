# third-audience-mdx

For two decades, websites were built for two audiences: **humans** and **search engines**. Today there is a third audience rapidly growing: **AI agents and LLM crawlers**.

AI systems like ChatGPT, Perplexity, Claude, and Gemini actively crawl the web to answer questions, generate summaries, and provide recommendations. Most sites serve these bots the same HTML built for humans — full of navigation menus, scripts, ads, and layout markup that adds noise and reduces accuracy.

**third-audience-mdx** automatically serves clean, structured Markdown versions of your MDX content to AI crawlers, while humans continue to see your normal site. Think of it as **SEO for the AI era** — Generative Engine Optimization (GEO).

Drop-in npm package for Next.js App Router. Tracks bot visits and AI citations. Stores data in Postgres (Vercel/Supabase/Neon/Railway). Zero external services required.

> Inspired by [third-audience-wordpress-plugin](https://github.com/spcaeo/third-audience-wordpress-plugin) by [@spcaeo](https://github.com/spcaeo).

---

## What's New

### v1.3.0
- **Competitor Benchmarking** — add competitors, record manual AI citation test results across all 22 platforms, view citation rates and average rank by competitor and platform
- **Cache Browser** — paginated view of all cached pages, search/filter, delete individual entries, clear expired, clear all
- **Email Digest UI** — trigger daily/weekly digest emails from the dashboard, view last-sent timestamps, inline cron config reference
- **Google AI Overview detection** — server-side via `srsltid`/`udm=14` landing params; client beacon updated to match
- Postgres-only storage (SQLite removed)

### v1.2.0 — v1.2.1
- **Email notifications** — SMTP + Brevo API support; 5 alert types: first bot visit, first citation, new platform, citation spike, daily/weekly digest
- **22 AI citation platforms** — expanded from 8: added SearchGPT, Grok, Bing AI (correctly excludes Bing Search), Poe, Character.AI, Mistral, Meta AI, HuggingChat, Brave Leo, DuckDuckGo AI, Liner, Andi, Google AI Overview
- UTM-source fallback for ChatGPT and Claude (both suppress referrer headers)
- Rich HTML digest emails with inline bar-chart sparklines
- `/api/third-audience/digest` route for cron-based digest delivery

### v1.1.0
- Postgres storage backend (Supabase, Neon, Railway, any hosted Postgres)
- KV store for notification state
- Background bot tracking for HTML pages via middleware → track route

---

## Features

- **`.md` URL for every page** — `GET /your-post.md` returns clean Markdown of the matching MDX file
- **Content negotiation** — `Accept: text/markdown` header serves Markdown to any AI crawler automatically
- **`/llms.txt`** — auto-generated AI content index from your MDX frontmatter
- **`/sitemap-ai.xml`** — AI-specific sitemap with title and description metadata
- **`/okf/` bundle** — Open Knowledge Format: all content as self-navigable `.md` files
- **Bot detection** — 20+ known AI crawlers (ClaudeBot, GPTBot, PerplexityBot, Gemini, etc.) plus heuristic detection
- **Bot analytics** — every crawler visit logged to the database
- **Citation tracking** — 22 AI platforms: server-side referrer + UTM detection + client-side JS beacon
- **Google AI Overview** — detected via `srsltid` / `udm=14` landing params
- **Email notifications** — SMTP or Brevo; 5 alert types + daily/weekly digest with HTML charts
- **Competitor benchmarking** — track AI citation rates for competitors across all 22 platforms
- **Cache browser** — inspect, search, and manage all cached pages
- **Dashboard** — React web UI at `/third-audience/` with 9 pages
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
  contentDir: 'content',
  dashboard: true,
  dashboardSecret: process.env.THIRD_AUDIENCE_SECRET,
  storage: { type: 'postgres', url: process.env.DATABASE_URL! },
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

**`app/api/third-audience/track/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/track'
```

**`app/api/third-audience/analytics/route.ts`**
```ts
export { GET } from 'third-audience-mdx/routes/analytics'
```

**`app/api/third-audience/bots-config/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/bots-config'
```

**`app/api/third-audience/digest/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/digest'
```

**`app/api/third-audience/benchmark/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/benchmark'
```

**`app/api/third-audience/cache-browser/route.ts`**
```ts
export { GET, POST } from 'third-audience-mdx/routes/cache-browser'
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

**`app/third-audience/okf/page.tsx`** — OKF Graph
```tsx
import { OkfPage } from 'third-audience-mdx/dashboard/ui/pages/OkfPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <OkfPage /> }
```

**`app/third-audience/competitors/page.tsx`** — Competitor Benchmarking
```tsx
import { CompetitorBenchmarkingPage } from 'third-audience-mdx/dashboard/ui/pages/CompetitorBenchmarkingPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <CompetitorBenchmarkingPage /> }
```

**`app/third-audience/cache/page.tsx`** — Cache Browser
```tsx
import { CacheBrowserPage } from 'third-audience-mdx/dashboard/ui/pages/CacheBrowserPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <CacheBrowserPage /> }
```

**`app/third-audience/digest/page.tsx`** — Email Digest
```tsx
import { EmailDigestPage } from 'third-audience-mdx/dashboard/ui/pages/EmailDigestPage'
export const dynamic = 'force-dynamic'
export default function Page() { return <EmailDigestPage /> }
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
# Required
THIRD_AUDIENCE_SECRET=your-secret-here
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Email notifications (choose one)
TA_BREVO_API_KEY=your-brevo-api-key
# or SMTP:
TA_SMTP_HOST=smtp-relay.brevo.com
TA_SMTP_PORT=587
TA_SMTP_USER=your-login
TA_SMTP_PASS=your-password

# Notification recipient
TA_NOTIFY_TO=you@example.com
TA_NOTIFY_FROM=Third Audience <alerts@yourdomain.com>

# Optional
NEXT_PUBLIC_SITE_URL=https://yoursite.com
TA_API_KEY=your-api-key-for-digest-cron
```

---

## Storage

Postgres is required — works with any hosted provider: Supabase, Neon, Railway, PlanetScale (Postgres mode). All tables are created automatically on first connection (prefixed `ta_`).

```ts
withThirdAudience({
  storage: {
    type: 'postgres',
    url: process.env.DATABASE_URL!,
  },
})
```

**Tables created automatically:**
- `ta_admin` — dashboard credentials and API key
- `ta_bots_config` — allowlist/blocklist settings
- `ta_visits` — bot visit log
- `ta_citations` — AI citation log
- `ta_cache` — rendered Markdown cache
- `ta_kv` — notification state (last digest sent, alert dedup)
- `ta_competitors` — competitor list for benchmarking
- `ta_benchmarks` — manual AI citation test results

---

## Dashboard

Visit `/third-audience/` on your site. Protected by `THIRD_AUDIENCE_SECRET`.

| Page | URL | Description |
|---|---|---|
| Bot Analytics | `/third-audience/` | Hero metrics, daily visits chart, top bots, top pages |
| LLM Traffic | `/third-audience/citations` | Citations per platform, country, page |
| Bot Management | `/third-audience/bots` | Known bots list, allowlist/blocklist editor |
| System Health | `/third-audience/health` | Storage status, cache stats, quick links |
| OKF Graph | `/third-audience/okf` | Knowledge graph visualizer |
| Competitor Benchmarking | `/third-audience/competitors` | Citation rates across 22 AI platforms |
| Cache Browser | `/third-audience/cache` | Browse, search, delete cache entries |
| Email Digest | `/third-audience/digest` | Trigger daily/weekly digests, view last sent |
| Settings | `/third-audience/settings` | API key management, password change |

---

## Email Notifications

Configure once, get alerts automatically:

```
TA_BREVO_API_KEY=...     # Brevo transactional API (recommended)
TA_NOTIFY_TO=you@...     # recipient
TA_NOTIFY_FROM=...       # sender name + address
```

**Alert types (all automatic):**
- First bot visit from a new crawler
- First AI citation ever
- New AI platform citing you (after 30-day absence)
- Citation spike (3× hourly baseline)
- Daily digest (last 24h summary)
- Weekly digest (7-day summary with trend chart)

**Automated digest via Vercel Cron (`vercel.json`):**
```json
{
  "crons": [
    { "path": "/api/third-audience/digest", "schedule": "0 8 * * *" }
  ]
}
```

---

## Citation Tracking — 22 Platforms

Server-side referrer detection + client JS beacon covers:

ChatGPT · Perplexity · Claude · Gemini · Copilot · You.com · Phind · Kagi · SearchGPT · Grok · Bing AI · Poe · Character.AI · Mistral · Meta AI · HuggingChat · Brave Leo · DuckDuckGo AI · Liner · Andi · **Google AI Overview** (via `srsltid` / `udm=14`)

ChatGPT and Claude are also detected via `utm_source` when they suppress the referrer header.

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
| `POST /api/third-audience/citation` | Client-side citation beacon receiver |
| `GET/POST /api/third-audience/digest` | Trigger digest / check last-sent status |
| `GET/POST /api/third-audience/benchmark` | Competitor benchmarking CRUD |
| `GET/POST /api/third-audience/cache-browser` | Cache inspection and management |

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
  contentDir: 'content',           // .mdx source directory (default: 'content')
  dashboard: true,                 // mount /third-audience/ (default: true)
  dashboardSecret: '...',          // protect dashboard with a secret
  storage: {
    type: 'postgres',
    url: process.env.DATABASE_URL!,
  },
  stripSegments: ['en', 'fr'],     // strip locale prefixes from URL slugs
  notifications: {
    brevoApiKey: '...',            // Brevo transactional API key
    smtp: {                        // or raw SMTP
      host: 'smtp-relay.brevo.com',
      port: 587,
      user: '...',
      pass: '...',
    },
    to: 'you@example.com',
    from: 'Third Audience <alerts@yourdomain.com>',
    alerts: {
      firstBotVisit: true,
      firstCitation: true,
      newPlatform: true,
      citationSpike: true,
      dailyDigest: true,
      weeklyDigest: true,
    },
  },
  bots: {
    allowlist: [],                 // always track these UAs
    blocklist: [],                 // never track these UAs
  },
  cache: {
    ttl: 3600,                     // cache TTL in seconds (default: 3600)
    maxMemoryEntries: 500,         // max in-memory entries (default: 500)
  },
})
```

---

## Project Structure

```
src/
  core/           MDX reader, Markdown renderer (JSX stripper), middleware, Next.js config wrapper
  detection/      Bot detection pipeline — known patterns → heuristics → auto-learner
  analytics/      Visit tracker, geolocation (geoip-lite), performance stats
  citations/      Citation tracker (22 platforms), citation alerts
  notifications/  Mailer (SMTP + Brevo), email templates, digest builder, alert sender
  cache/          Two-tier cache (memory LRU + database-backed disk tier)
  storage/        Store interface, PostgresStore, factory
  discovery/      llms.txt generator, sitemap-ai generator
  okf/            OKF bundle — index + per-page + internal link rewriting
  dashboard/      Auth, API route handlers, React UI pages and components
  cli/            init, health, export commands
  public/         citation-tracker.js (client-side, framework-agnostic)
  nextjs-app/     Ready-to-copy Next.js App Router files
```

## Detected AI Crawlers

ClaudeBot, GPTBot, ChatGPT-User, PerplexityBot, Googlebot-AI (Google-Extended), Applebot-Extended, CCBot, CohereCrawler, AI2Bot, Bytespider, Diffbot, YouBot, FacebookBot — plus heuristic detection for unknown bots.
