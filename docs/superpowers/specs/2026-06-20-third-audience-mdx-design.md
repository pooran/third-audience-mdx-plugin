# Design Spec: third-audience-mdx

**Date:** 2026-06-20
**Status:** Approved

---

## Overview

`third-audience-mdx` is an npm package for Next.js (App Router) that ports the Third Audience WordPress plugin to MDX content sites. It serves AI-optimized Markdown to LLM crawlers, tracks bot visits and citations, generates AI discoverability files, and provides a web dashboard — all without external services, using flat JSONL files for storage.

---

## Package Shape

- Published to npm as `third-audience-mdx`
- Framework: Next.js App Router (primary), framework-agnostic where possible
- Storage: flat JSONL files (`data/ta-visits.jsonl`, `data/ta-citations.jsonl`)
- Dashboard: React web UI at `/third-audience/`
- CLI: `npx third-audience <command>`

---

## Integration

Two touch points:

```ts
// next.config.ts
import { withThirdAudience } from 'third-audience-mdx'
export default withThirdAudience({ contentDir: 'content' })

// middleware.ts
export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
export const config = { matcher: ['/((?!_next|api).*)'] }
```

---

## Modules

### 1. Core (`src/core/`)
- `config.ts` — `ThirdAudienceConfig` interface + `resolveConfig()`
- `with-third-audience.ts` — Next.js config wrapper
- `middleware.ts` — Next.js middleware: routes `.md` URLs, `Accept: text/markdown`, `/okf/`, `/llms.txt`, `/sitemap-ai.xml`
- `mdx-reader.ts` — `MdxReader`: scans contentDir, parses frontmatter via `gray-matter`
- `markdown-renderer.ts` — `MarkdownRenderer`: strips JSX imports/components/expressions, serializes frontmatter as YAML header

### 2. Detection (`src/detection/`)
- `bot-detection-result.ts` — `BotDetectionResult` interface
- `known-patterns.ts` — `KNOWN_BOTS`: 20+ AI crawlers and search engines
- `bot-detection-pipeline.ts` — `detectBot()`: 3-layer pipeline (known → heuristics → auto-learner)

### 3. Analytics (`src/analytics/`)
- `visit-tracker.ts` — `VisitTracker` singleton: records bot visits to JSONL
- `geolocation.ts` — `getCountry()`: IP → country via `geoip-lite`
- `performance-stats.ts` — `PerformanceStats`: derives summaries from JSONL (total visits, top bots, top pages, cache hit rate, visits by day)

### 4. Citations (`src/citations/`)
- `citation-tracker.ts` — `CitationTracker`: server-side referrer detection + client POST handler; `detectAiPlatform()`
- `citation-alerts.ts` — `CitationAlerts`: monitors for first citation, new platform, citation spike

### 5. Cache (`src/cache/`)
- `cache-manager.ts` — `CacheManager`: 2-tier (memory LRU + file-system); TTL + tag invalidation

### 6. Discovery (`src/discovery/`)
- `llms-txt.ts` — `generateLlmsTxt()`: builds `/llms.txt` from MDX frontmatter
- `sitemap-ai.ts` — `generateAiSitemap()`: builds `/sitemap-ai.xml`

### 7. OKF Bundle (`src/okf/`)
- `okf-bundle.ts` — `generateOkfIndex()` + `generateOkfPage()`: serves `/okf/` bundle with internal links rewritten to sibling `.md` paths

### 8. Dashboard (`src/dashboard/`)
- `auth.ts` — `checkDashboardAuth()`: Bearer/Basic auth via `THIRD_AUDIENCE_SECRET`
- `routes/markdown-route.ts` — `GET /api/third-audience/markdown/[...slug]`
- `routes/llms-txt-route.ts` — `GET /api/third-audience/llms-txt`
- `routes/okf-route.ts` — `GET /api/third-audience/okf/[...path]`
- `routes/citation-route.ts` — `POST/GET /api/third-audience/citation`
- `routes/analytics-api-route.ts` — `GET /api/third-audience/analytics`
- UI pages (React, to be implemented): Bot Analytics, LLM Traffic, Bot Management, System Health

### 9. CLI (`src/cli/`)
- `init.ts` — interactive setup wizard
- `health.ts` — system health check
- `export.ts` — JSONL → CSV export

### 10. Client JS (`src/public/`)
- `citation-tracker.js` — framework-agnostic, detects UTM + referrer from AI platforms, POSTs to `/api/third-audience/citation`

---

## Data Schema

**ta-visits.jsonl** (one line per bot visit):
```json
{ "timestamp": "ISO", "bot_name": "ClaudeBot", "bot_category": "ai_crawler", "detection_method": "known_pattern", "confidence": "high", "url": "/blog/post", "ip": "1.2.3.4", "country": "US", "user_agent": "...", "referer": null, "response_ms": 42, "cache_hit": true, "content_length": 1024 }
```

**ta-citations.jsonl** (one line per citation click):
```json
{ "timestamp": "ISO", "platform": "ChatGPT", "query": "what is X", "url": "/blog/post", "ip": "1.2.3.4", "user_agent": "...", "referer": "https://chat.openai.com/..." }
```

---

## Config Options

```ts
withThirdAudience({
  contentDir: 'content',
  dataDir: 'data',
  dashboard: true,
  dashboardSecret: process.env.THIRD_AUDIENCE_SECRET,
  notifications: {
    email: { smtp: '...', to: '...' },
    slack: { webhookUrl: '...' }
  },
  bots: { allowlist: [], blocklist: [] },
  cache: { ttl: 3600, maxMemoryEntries: 500 }
})
```

---

## Feature Map: WordPress → MDX

| WordPress | MDX Equivalent | Status |
|---|---|---|
| URL Router (`.md` URLs) | Next.js middleware rewrite | ✅ implemented |
| Content Negotiation (`Accept: text/markdown`) | Middleware header check | ✅ implemented |
| Markdown Renderer (HTML→MD) | MDX reader + JSX stripper | ✅ implemented |
| OKF Bundle (`/okf/`) | `okf-bundle.ts` | ✅ implemented |
| llms.txt Generator | `llms-txt.ts` | ✅ implemented |
| AI Sitemap | `sitemap-ai.ts` | ✅ implemented |
| Bot Detector (UA patterns) | `known-patterns.ts` + pipeline | ✅ implemented |
| Bot Detection Pipeline | `bot-detection-pipeline.ts` | ✅ implemented |
| Visit Tracker (WP DB) | `visit-tracker.ts` → JSONL | ✅ implemented |
| Geolocation | `geolocation.ts` (geoip-lite) | ✅ implemented |
| Performance Stats | `performance-stats.ts` | ✅ implemented |
| Citation Tracker (server) | `citation-tracker.ts` | ✅ implemented |
| Citation Tracker (client JS) | `citation-tracker.js` (adapted) | ✅ implemented |
| Citation Alerts | `citation-alerts.ts` | ✅ implemented |
| Cache Manager (3-tier) | `cache-manager.ts` (2-tier) | ✅ implemented |
| Admin Dashboard (WP admin) | React UI at `/third-audience/` | 🔜 UI pending |
| Headless Wizard | CLI `init` command | ✅ implemented |
| Health Check | CLI `health` command | ✅ implemented |
| Data Export | CLI `export` command | ✅ implemented |
| Bot Auto-Learner | Pipeline layer 3 | ✅ implemented |

---

## What's Not Needed (WordPress-only)

- PHP, Composer, `vendor/`
- `wpdb`, WordPress hooks, options API
- HTML→Markdown conversion (source is already MDX)
- WP admin page system (`add_menu_page`)
- WP nonce/sanitization (replaced by standard HTTP auth)
- `register_activation_hook` / `register_deactivation_hook`
