# third-audience Plugin

For two decades, websites were built for two audiences: **humans** and **search engines**. Today there is a third: **AI agents and LLM crawlers**.

Plugin for `third-audience-mdx` — the npm package that automatically serves clean Markdown versions of your MDX content to AI crawlers (ChatGPT, Claude, Perplexity, Gemini), while humans continue to see your normal site. Think of it as **SEO for the AI era** — Generative Engine Optimization (GEO).

## Supported runtimes

| Runtime | Context file | Plugin manifest |
|---|---|---|
| Claude Code | `CLAUDE.md` | `package.json` (pi.skills) |
| OpenAI Codex / Perplexity | `AGENTS.md` | `.codex-plugin/plugin.json` |
| Cursor | `CLAUDE.md` | `.cursor-plugin/plugin.json` |
| Kimi Code | `CLAUDE.md` | `.kimi-plugin/plugin.json` |
| Gemini CLI | `GEMINI.md` | `gemini-extension.json` |

## Skills

### `/setup-third-audience`
Add `third-audience-mdx` to an existing Next.js App Router project. Detects project state, wraps `next.config`, integrates middleware without overwriting existing code, creates all 7 API route handlers, adds the dashboard (4 pages), copies the citation tracker, and verifies everything responds correctly.

### `/add-ai-route`
Add a specific missing route handler to a project that already has the package installed. Scans what exists, creates only what's missing, confirms middleware is wired, and tests each endpoint.

### `/debug-bot-detection`
Diagnose why bot visits aren't being tracked. Walks through the three-layer detection pipeline (known UA patterns → heuristics → auto-learner), checks config, data directory, blocklist, and fires test curls for each major AI crawler.

## Requirements

- Node.js 18+
- Next.js 13+ App Router project
- `third-audience-mdx` npm package
