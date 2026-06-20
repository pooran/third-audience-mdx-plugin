import fs from 'fs'
import path from 'path'
import type { NextRequest } from 'next/server'
import { detectBot } from '../detection/bot-detection-pipeline.js'
import { getCountry } from './geolocation.js'

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
  private dataDir: string

  private constructor(dataDir: string) {
    this.dataDir = dataDir
  }

  static getInstance(dataDir = process.env.TA_DATA_DIR ?? 'data'): VisitTracker {
    if (!VisitTracker.instance) {
      VisitTracker.instance = new VisitTracker(dataDir)
    }
    return VisitTracker.instance
  }

  record(req: NextRequest, meta: { responseMs?: number; cacheHit?: boolean; contentLength?: number } = {}): void {
    const ua = req.headers.get('user-agent') ?? ''
    const result = detectBot({ userAgent: ua, headers: Object.fromEntries(req.headers) })

    if (!result.isBot) return // only track bots

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'

    const record: VisitRecord = {
      timestamp: new Date().toISOString(),
      bot_name: result.botName,
      bot_category: result.category,
      detection_method: result.detectionMethod,
      confidence: result.confidence,
      url: req.nextUrl.pathname,
      ip,
      country: getCountry(ip),
      user_agent: ua,
      referer: req.headers.get('referer'),
      response_ms: meta.responseMs ?? null,
      cache_hit: meta.cacheHit ?? false,
      content_length: meta.contentLength ?? null,
    }

    this.append('ta-visits.jsonl', record)
  }

  private append(filename: string, record: VisitRecord): void {
    try {
      const filePath = path.join(this.dataDir, filename)
      fs.mkdirSync(this.dataDir, { recursive: true })
      fs.appendFileSync(filePath, JSON.stringify(record) + '\n', 'utf-8')
    } catch {
      // Tracking must never throw
    }
  }
}
