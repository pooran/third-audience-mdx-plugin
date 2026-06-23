import type { NextRequest } from 'next/server'
import { detectBot } from '../detection/bot-detection-pipeline.js'
import { getCountry } from './geolocation.js'
import { getStore } from '../storage/get-store.js'

export interface VisitRecord {
  timestamp: string
  bot_name: string | null
  bot_category: string
  detection_method: string
  confidence: string
  url: string
  ip: string
  country: string | null
  user_agent: string
  referer: string | null
  response_ms: number | null
  cache_hit: boolean
  content_length: number | null
}

export class VisitTracker {
  private static instance: VisitTracker | null = null

  static getInstance(): VisitTracker {
    if (!VisitTracker.instance) {
      VisitTracker.instance = new VisitTracker()
    }
    return VisitTracker.instance
  }

  record(req: NextRequest, meta: { responseMs?: number; cacheHit?: boolean; contentLength?: number; url?: string } = {}): void {
    const ua = req.headers.get('user-agent') ?? ''
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => { headers[key] = value })
    const result = detectBot({ userAgent: ua, headers })

    if (!result.isBot) return

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'

    const record: VisitRecord = {
      timestamp: new Date().toISOString(),
      bot_name: result.botName,
      bot_category: result.category,
      detection_method: result.detectionMethod,
      confidence: result.confidence,
      url: meta.url ?? req.nextUrl.pathname,
      ip,
      country: getCountry(ip),
      user_agent: ua,
      referer: req.headers.get('referer'),
      response_ms: meta.responseMs ?? null,
      cache_hit: meta.cacheHit ?? false,
      content_length: meta.contentLength ?? null,
    }

    // Fire-and-forget — tracking must never block the response
    getStore().appendVisit(record).catch(() => {})
  }
}
