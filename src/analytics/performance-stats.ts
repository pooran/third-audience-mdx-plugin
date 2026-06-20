import fs from 'fs'
import path from 'path'
import type { VisitRecord } from './visit-tracker.js'

export interface PerformanceSummary {
  totalVisits: number
  uniqueBots: string[]
  avgResponseMs: number | null
  cacheHitRate: number | null
  topPages: Array<{ url: string; visits: number }>
  topBots: Array<{ name: string; visits: number }>
  visitsByDay: Array<{ date: string; visits: number }>
}

export class PerformanceStats {
  private dataDir: string

  constructor(dataDir = process.env.TA_DATA_DIR ?? 'data') {
    this.dataDir = dataDir
  }

  compute(days = 30): PerformanceSummary {
    const records = this.loadRecords(days)

    const totalVisits = records.length
    const uniqueBots = [...new Set(records.map(r => r.bot_name).filter(Boolean))] as string[]

    const withResponseMs = records.filter(r => r.response_ms !== null)
    const avgResponseMs = withResponseMs.length > 0
      ? withResponseMs.reduce((s, r) => s + r.response_ms!, 0) / withResponseMs.length
      : null

    const cacheHitRate = records.length > 0
      ? records.filter(r => r.cache_hit).length / records.length
      : null

    const pageCounts = new Map<string, number>()
    const botCounts = new Map<string, number>()
    const dayCounts = new Map<string, number>()

    for (const r of records) {
      pageCounts.set(r.url, (pageCounts.get(r.url) ?? 0) + 1)
      const name = r.bot_name ?? 'unknown'
      botCounts.set(name, (botCounts.get(name) ?? 0) + 1)
      const day = r.timestamp.slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }

    const topPages = [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, visits]) => ({ url, visits }))

    const topBots = [...botCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, visits]) => ({ name, visits }))

    const visitsByDay = [...dayCounts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, visits]) => ({ date, visits }))

    return { totalVisits, uniqueBots, avgResponseMs, cacheHitRate, topPages, topBots, visitsByDay }
  }

  private loadRecords(days: number): VisitRecord[] {
    const filePath = path.join(this.dataDir, 'ta-visits.jsonl')
    if (!fs.existsSync(filePath)) return []

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString()

    return fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line) as VisitRecord } catch { return null } })
      .filter((r): r is VisitRecord => r !== null && r.timestamp >= cutoffStr)
  }
}
