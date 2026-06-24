import { getStore } from '../storage/get-store.js'
import type { DigestData } from './email-templates.js'

function isoDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

export async function buildDigest(period: 'daily' | 'weekly'): Promise<DigestData> {
  const store = getStore()
  const days = period === 'daily' ? 1 : 7
  const sinceIso = daysAgoIso(days)

  const [visits, citations] = await Promise.all([
    store.getVisits(sinceIso),
    store.getCitations(sinceIso),
  ])

  // --- visits aggregation ---
  const uniqueBots = new Set(visits.map(v => v.bot_name ?? v.bot_category)).size
  const totalRespMs = visits.filter(v => v.response_ms !== null).map(v => v.response_ms as number)
  const avgResponseMs = totalRespMs.length > 0
    ? totalRespMs.reduce((a, b) => a + b, 0) / totalRespMs.length
    : null
  const cacheHits = visits.filter(v => v.cache_hit).length
  const cacheHitRate = visits.length > 0 ? cacheHits / visits.length : null

  const botCounts: Record<string, number> = {}
  for (const v of visits) {
    const name = v.bot_name ?? v.bot_category
    botCounts[name] = (botCounts[name] ?? 0) + 1
  }
  const topBots = Object.entries(botCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, visits: count }))

  const pageVisitCounts: Record<string, number> = {}
  for (const v of visits) {
    pageVisitCounts[v.url] = (pageVisitCounts[v.url] ?? 0) + 1
  }
  const topPages = Object.entries(pageVisitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, count]) => ({ url, visits: count }))

  // Group visits by day
  const visitsByDayMap: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    visitsByDayMap[isoDateStr(d)] = 0
  }
  for (const v of visits) {
    const day = v.timestamp.slice(0, 10)
    if (day in visitsByDayMap) visitsByDayMap[day]++
  }
  const visitsByDay = Object.entries(visitsByDayMap).map(([date, count]) => ({ date, visits: count }))

  // --- citations aggregation ---
  const platformCounts: Record<string, number> = {}
  for (const c of citations) {
    platformCounts[c.platform] = (platformCounts[c.platform] ?? 0) + 1
  }
  const platforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  const citationPageCounts: Record<string, number> = {}
  for (const c of citations) {
    citationPageCounts[c.url] = (citationPageCounts[c.url] ?? 0) + 1
  }
  const citationTopPages = Object.entries(citationPageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, count]) => ({ url, count }))

  // --- date range label ---
  const endDate = new Date()
  const startDate = new Date(Date.now() - days * 86_400_000)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const dateRange = days === 1
    ? fmt(startDate)
    : `${fmt(startDate)} – ${fmt(endDate)}`

  return {
    period,
    dateRange,
    visits: { total: visits.length, uniqueBots, avgResponseMs, cacheHitRate, topBots, topPages, visitsByDay },
    citations: { total: citations.length, platforms, topPages: citationTopPages },
  }
}

export async function wasDigestSentRecently(period: 'daily' | 'weekly'): Promise<boolean> {
  const store = getStore()
  const val = await store.getKv(`digest_last_sent_${period}`)
  if (!val) return false
  const lastSent = new Date(val).getTime()
  const thresholdMs = period === 'daily' ? 20 * 3_600_000 : 6 * 24 * 3_600_000
  return Date.now() - lastSent < thresholdMs
}

export async function markDigestSent(period: 'daily' | 'weekly'): Promise<void> {
  await getStore().setKv(`digest_last_sent_${period}`, new Date().toISOString())
}
