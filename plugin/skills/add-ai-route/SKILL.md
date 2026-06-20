---
name: add-ai-route
description: Use when a specific third-audience-mdx API route is missing — detects which routes exist, creates missing ones, and verifies they respond correctly
---

# Add a third-audience-mdx API Route

Add one or more missing route handlers to a project that already has `third-audience-mdx` installed.

## All available routes

| Route export | File to create | Handles |
|---|---|---|
| `routes/markdown` | `app/api/third-audience/markdown/[...slug]/route.ts` | `.md` URL serving |
| `routes/okf` | `app/api/third-audience/okf/[...path]/route.ts` | `/okf/` bundle |
| `routes/llms-txt` | `app/api/third-audience/llms-txt/route.ts` | `/llms.txt` |
| `routes/sitemap-ai` | `app/api/third-audience/sitemap-ai/route.ts` | `/sitemap-ai.xml` |
| `routes/citation` | `app/api/third-audience/citation/route.ts` | Citation tracking |
| `routes/analytics` | `app/api/third-audience/analytics/route.ts` | Dashboard data API |
| `routes/bots-config` | `app/api/third-audience/bots-config/route.ts` | Allowlist/blocklist config |

## Checklist

1. **Find what exists** — scan `app/api/third-audience/` for existing route files
2. **Identify what's missing** — compare against the table above
3. **Create missing routes** — one file per missing route
4. **Check middleware** — confirm `thirdAudienceMiddleware` is wired up in `middleware.ts`
5. **Verify** — curl each new endpoint

## Step 1 — Find existing routes

```bash
find app/api/third-audience -name "route.ts" 2>/dev/null
```

Report which routes exist and which are missing.

## Step 2 — Create each missing route

Each route file is a one-liner. Create only the ones that are missing:

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

## Step 3 — Check middleware

Read `middleware.ts`. Confirm it contains `thirdAudienceMiddleware`. If missing, the `.md` URL rewrites and `/llms.txt` → `/sitemap-ai.xml` rewrites won't work even with the routes in place.

If middleware is missing the integration, add it following the same pattern as the `setup-third-audience` skill Step 5.

## Step 4 — Verify

Start the dev server if not running, then test each newly created route:

```bash
# Replace localhost:3000 with actual dev URL
curl -s http://localhost:3000/llms.txt | head -5
curl -s http://localhost:3000/sitemap-ai.xml | head -5
curl -s http://localhost:3000/your-first-mdx-page.md | head -10
```

Report the response for each. A 404 usually means middleware isn't rewriting, not that the route handler is wrong.
