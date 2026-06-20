# About third-audience-mdx

## Serving the Third Audience

For two decades, we built websites for two audiences: **humans** and **search engines**. Today, there's a third audience that's rapidly growing: **AI agents and crawlers**.

AI systems like Claude (Anthropic), ChatGPT (OpenAI), Perplexity, and Google Gemini actively consume web content to answer questions, generate summaries, and provide recommendations. Most websites aren't optimized for these AI agents — they receive the same HTML designed for human browsers, not the clean, structured data AI systems prefer.

## What is third-audience-mdx?

**third-audience-mdx** is an npm package for Next.js App Router that automatically serves AI-optimized Markdown to LLM crawlers, tracks bot visits and citations, and provides a built-in analytics dashboard — all from your existing MDX content.

Think of it as **SEO for the AI era** — just as you optimize for Google, you can now optimize for Claude, ChatGPT, Perplexity, and other AI agents that are becoming the primary way people discover and consume content.

## How It Works

1. **AI crawlers request `.md` URLs** (e.g. `yoursite.com/page-name.md`)
2. **Middleware detects the bot** and rewrites to the markdown route handler
3. **MDX content is served as clean Markdown** — no HTML, no noise
4. **Visits are tracked** in a local JSONL store — no external database
5. **Dashboard** lets you see which bots are visiting and what they're reading

## Key Features

### Lightning Fast, Zero External Dependencies
- All processing happens locally — no external APIs, no Cloudflare Workers
- Reads your existing MDX content directly from the filesystem
- Sub-millisecond response times from local JSONL store

### LLM Traffic Dashboard
- Built-in Next.js App Router dashboard at `/third-audience`
- Bot Analytics, LLM Traffic (citations), Bot Management, System Health, Settings
- OKF knowledge graph viewer — interactive force-directed visualization of your content graph
- Session-protected with AES-256-GCM encrypted API key

### AI Crawler Endpoints
- `/page-slug.md` — clean Markdown for any page
- `/llms.txt` — site-wide content index for LLM discovery
- `/sitemap-ai.xml` — AI-optimized sitemap
- `/okf` — Open Knowledge Format bundle (full content graph in Markdown)

### Edge Runtime Compatible Middleware
- `thirdAudienceMiddleware` runs in Edge or Node.js runtime
- Returns `null` when not handling — composes cleanly with next-intl and other middleware
- Cookie presence check in middleware; full HMAC session verification in route handlers

### Flexible Content Directory
- Point at any directory via `TA_CONTENT_DIR` env var
- Reads `.md` and `.mdx` files with gray-matter frontmatter support
- Internal links rewritten automatically for AI consumption

## Installation

```bash
npm install third-audience-mdx
```

Full setup guide: [INSTALLATION.md](./INSTALLATION.md)

## Quick Start

```ts
// middleware.ts
export const runtime = 'nodejs'
import { thirdAudienceMiddleware } from 'third-audience-mdx'

export default function middleware(req) {
  const ta = thirdAudienceMiddleware(req)
  if (ta) return ta
  // your other middleware (next-intl, auth, etc.)
}
```

## Requirements

- **Next.js** 13+ (App Router)
- **React** 18+
- **Node.js** 18+

## npm

[https://www.npmjs.com/package/third-audience-mdx](https://www.npmjs.com/package/third-audience-mdx)

## Technical Architecture

- **Runtime store:** JSONL files in `data/` — zero database setup
- **Auth:** AES-256-GCM encrypted API key + HMAC-SHA256 session tokens
- **Dashboard UI:** Server + client components, no UI library dependency
- **OKF graph:** Vanilla JS force-directed SVG (Coulomb/spring physics, 500 ticks)
- **Build:** tsup, dual CJS/ESM output with `.d.ts` declarations

## Roadmap

- Structured data output (JSON-LD)
- Webhook support for citation events
- Per-bot rate limiting
- Vercel KV / SQLite adapter for production deployments
- Automatic `llms.txt` standard compliance checks

## Credits

**Inspired by:** Dries Buytaert's article ["The Third Audience"](https://dri.es/the-third-audience)

---

## License

GPL-2.0-or-later
