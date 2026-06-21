import { getStore } from '../storage/get-store.js'
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
  async compute(days = 30): Promise<PerformanceSummary> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const records = await getStore().getVisits(cutoff.toISOString())
    return summarise(records)
  }
}

function summarise(records: VisitRecord[]): PerformanceSummary {
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
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([url, visits]) => ({ url, visits }))

  const topBots = [...botCounts.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, visits]) => ({ name, visits }))

  const visitsByDay = [...dayCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, visits]) => ({ date, visits }))

  return { totalVisits, uniqueBots, avgResponseMs, cacheHitRate, topPages, topBots, visitsByDay }
}
