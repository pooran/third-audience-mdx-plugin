import type { NextRequest } from 'next/server'
import { getStore } from '../storage/get-store.js'

export interface CitationRecord {
  timestamp: string
  platform: string
  query: string | null
  url: string
  ip: string
  user_agent: string
  referer: string
}

const AI_PLATFORMS: Array<{ name: string; patterns: RegExp[]; queryParam?: string }> = [
  { name: 'ChatGPT',    patterns: [/openai\.com/i, /chatgpt\.com/i],      queryParam: 'q' },
  { name: 'Perplexity', patterns: [/perplexity\.ai/i],                    queryParam: 'q' },
  { name: 'Claude',     patterns: [/claude\.ai/i, /anthropic\.com/i] },
  { name: 'Gemini',     patterns: [/gemini\.google\.com/i, /bard\.google\.com/i] },
  { name: 'Copilot',    patterns: [/copilot\.microsoft\.com/i, /bing\.com\/chat/i] },
  { name: 'You.com',    patterns: [/you\.com/i],                           queryParam: 'q' },
  { name: 'Phind',      patterns: [/phind\.com/i] },
  { name: 'Kagi',       patterns: [/kagi\.com/i],                          queryParam: 'q' },
]

function detectAiPlatform(referer: string): { platform: string; query: string | null } | null {
  if (!referer) return null
  let url: URL
  try { url = new URL(referer) } catch { return null }

  for (const p of AI_PLATFORMS) {
    if (p.patterns.some(rx => rx.test(referer))) {
      const query = p.queryParam ? url.searchParams.get(p.queryParam) : null
      return { platform: p.name, query }
    }
  }
  return null
}

export class CitationTracker {
  record(req: NextRequest): CitationRecord | null {
    const referer = req.headers.get('referer') ?? ''
    const detection = detectAiPlatform(referer)
    if (!detection) return null

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'client'

    const record: CitationRecord = {
      timestamp: new Date().toISOString(),
      platform: detection.platform,
      query: detection.query,
      url: req.nextUrl.pathname,
      ip,
      user_agent: req.headers.get('user-agent') ?? '',
      referer,
    }

    // Fire-and-forget
    getStore().appendCitation(record).catch(() => {})
    return record
  }

  recordFromBody(body: { platform: string; query?: string | null; url: string; ip?: string; user_agent?: string; referer?: string }): void {
    const record: CitationRecord = {
      timestamp: new Date().toISOString(),
      platform: body.platform,
      query: body.query ?? null,
      url: body.url,
      ip: body.ip ?? 'client',
      user_agent: body.user_agent ?? '',
      referer: body.referer ?? '',
    }
    getStore().appendCitation(record).catch(() => {})
  }
}
