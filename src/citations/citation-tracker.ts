import fs from 'fs'
import path from 'path'
import type { NextRequest } from 'next/server'

export interface CitationRecord {
  timestamp: string
  platform: string
  query: string | null
  url: string
  ip: string
  user_agent: string
  referer: string
}

/** Platform detection from Referer URL */
const AI_PLATFORMS: Array<{ name: string; patterns: RegExp[]; queryParam?: string }> = [
  { name: 'ChatGPT',    patterns: [/chat\.openai\.com/i, /chatgpt\.com/i], queryParam: 'q' },
  { name: 'Perplexity', patterns: [/perplexity\.ai/i],                    queryParam: 'q' },
  { name: 'Claude',     patterns: [/claude\.ai/i] },
  { name: 'Gemini',     patterns: [/gemini\.google\.com/i, /bard\.google\.com/i] },
  { name: 'Copilot',    patterns: [/copilot\.microsoft\.com/i, /bing\.com\/chat/i], queryParam: 'q' },
  { name: 'YouChat',    patterns: [/you\.com/i],                           queryParam: 'q' },
]

export function detectAiPlatform(referer: string): { platform: string; query: string | null } | null {
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
  private dataDir: string

  constructor(dataDir = process.env.TA_DATA_DIR ?? 'data') {
    this.dataDir = dataDir
  }

  /** Call from an API route or middleware to record a citation visit. */
  record(req: NextRequest): CitationRecord | null {
    const referer = req.headers.get('referer') ?? ''
    const detection = detectAiPlatform(referer)
    if (!detection) return null

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'

    const record: CitationRecord = {
      timestamp: new Date().toISOString(),
      platform: detection.platform,
      query: detection.query,
      url: req.nextUrl.pathname,
      ip,
      user_agent: req.headers.get('user-agent') ?? '',
      referer,
    }

    this.append(record)
    return record
  }

  /** Also handles client-side POSTs from citation-tracker.js */
  recordFromBody(body: Partial<CitationRecord>): void {
    if (!body.platform || !body.url) return
    const record: CitationRecord = {
      timestamp: new Date().toISOString(),
      platform: body.platform,
      query: body.query ?? null,
      url: body.url,
      ip: body.ip ?? 'client',
      user_agent: body.user_agent ?? '',
      referer: body.referer ?? '',
    }
    this.append(record)
  }

  private append(record: CitationRecord): void {
    try {
      const filePath = path.join(this.dataDir, 'ta-citations.jsonl')
      fs.mkdirSync(this.dataDir, { recursive: true })
      fs.appendFileSync(filePath, JSON.stringify(record) + '\n', 'utf-8')
    } catch {
      // Never throw from tracking
    }
  }
}
