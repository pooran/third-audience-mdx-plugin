---
name: debug-bot-detection
description: Use when bot visits aren't being tracked, a known AI crawler isn't being detected, or the dashboard shows no data — walks through the full detection pipeline systematically
---

# Debug Bot Detection

Diagnose why bot visits are not being tracked in `third-audience-mdx`. Works through the three-layer detection pipeline from outside in.

## Detection pipeline (how it works)

```
Request → Layer 1: Known UA patterns (ClaudeBot, GPTBot, etc.)
                 → Layer 2: Heuristics (headless signals, missing headers)
                 → Layer 3: Auto-learner (generic bot UA regex)
                 → VisitTracker.record() → ta-visits.jsonl
```

A visit is only logged if `isBot: true`. Human visits are intentionally skipped.

## Checklist

1. **Confirm middleware is active** — check `middleware.ts` exists and exports correctly
2. **Simulate a known bot** — curl with ClaudeBot UA, check for 200 response
3. **Check data directory** — confirm `data/` exists and is writable, check `ta-visits.jsonl`
4. **Check config** — confirm `contentDir` and `dataDir` match actual paths
5. **Check blocklist** — confirm the bot isn't on the blocklist in `ta-bots-config.json`
6. **Check geolocation** — confirm `geoip-lite` is installed (optional dep)
7. **Run health check** — `npx third-audience health`

## Step 1 — Confirm middleware

Read `middleware.ts`. It must contain:
```ts
export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
// OR call thirdAudienceMiddleware(request) and return its response
```

If the file is missing or doesn't reference `thirdAudienceMiddleware`, the visit tracker is never called. Fix it first.

## Step 2 — Simulate a known bot

```bash
curl -v -A "ClaudeBot/1.0" http://localhost:3000/
```

Look for:
- HTTP 200 — page loads correctly
- No redirect to a bot block page

Then immediately check:
```bash
tail -5 data/ta-visits.jsonl 2>/dev/null || echo "File missing or empty"
```

If the file is empty after the curl, the visit tracker isn't firing.

## Step 3 — Check data directory

```bash
ls -la data/ 2>/dev/null || echo "data/ directory missing"
```

The `data/` directory must:
- Exist
- Be writable by the Node.js process
- Be at the path set by `TA_DATA_DIR` env var (default: `data` relative to `process.cwd()`)

If missing:
```bash
mkdir -p data
```

## Step 4 — Check config

Read `next.config.ts` or `next.config.js`. Confirm:
- `contentDir` matches the actual directory where `.mdx` files live
- `dataDir` matches `data/` (or whatever `TA_DATA_DIR` is set to)

Check `.env.local`:
```bash
cat .env.local | grep TA_
```

## Step 5 — Check blocklist

```bash
cat data/ta-bots-config.json 2>/dev/null || echo "No config file (using defaults)"
```

If the UA string you're testing with appears in `blocklist`, it won't be tracked. Remove it or test with a different UA.

## Step 6 — Check geoip-lite

```bash
node -e "try { require('geoip-lite'); console.log('ok') } catch(e) { console.log('missing:', e.message) }"
```

`geoip-lite` is optional — its absence won't prevent visit tracking, but country will be `null`. If it's missing and you want country data:
```bash
npm install geoip-lite
```

## Step 7 — Health check

```bash
npx third-audience health
```

Review every line. The health command checks:
- Node version
- Content directory (MDX file count)
- Data directory (writable, JSONL record counts)
- Cache entries
- `THIRD_AUDIENCE_SECRET` presence
- `middleware.ts` presence

## Common causes and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `ta-visits.jsonl` never created | `data/` directory missing | `mkdir -p data` |
| File exists but no new lines | Bot UA not matching detection | Check blocklist; try ClaudeBot UA |
| Dashboard shows 0 visits but file has data | Dashboard reading wrong data dir | Check `TA_DATA_DIR` env var |
| `.md` URLs return 404 | Middleware not rewriting | Check `middleware.ts` exports |
| `/llms.txt` returns 404 | Middleware not rewriting | Check matcher config covers `/llms.txt` |
| Detection works locally, not in prod | Env vars missing in prod | Add `TA_DATA_DIR`, `TA_CONTENT_DIR` to deployment env |

## Testing specific bot UAs

To verify a specific crawler is detected:

```bash
# Claude
curl -A "ClaudeBot/1.0" http://localhost:3000/

# ChatGPT
curl -A "GPTBot/1.1" http://localhost:3000/

# Perplexity
curl -A "PerplexityBot/1.0" http://localhost:3000/

# Google AI
curl -A "Google-Extended" http://localhost:3000/

# Generic headless (heuristic detection)
curl -A "HeadlessChrome/120.0" http://localhost:3000/

# Should NOT be tracked (human browser)
curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" http://localhost:3000/
```

After each, check `tail -1 data/ta-visits.jsonl` to confirm a record was written.
