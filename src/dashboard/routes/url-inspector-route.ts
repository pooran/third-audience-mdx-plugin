import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStore } from '../../storage/get-store.js'
import type { CitationRecord } from '../../citations/citation-tracker.js'

// Platforms that represent organic/search traffic rather than an actual AI-platform
// citation — excluded the same way the reference WordPress implementation excludes them.
// 'Google AI Mode' may not exist yet in citation-tracker.ts's detection list at the time
// this route ships; it is still excluded here defensively in case that detection lands.
const EXCLUDED_PLATFORMS = new Set(['Google Search', 'Google AI Mode', 'Bing'])

type Mode = 'today' | 'week' | 'month' | 'alltime'

interface PlatformBreakdown {
  platform: string
  count: number
  pct: number
}

interface HistRow {
  label: string
  count: number
  vsPrev: number | null
  topPlatform: string
}

interface UrlInspectorResponse {
  total: number
  llmCount: number
  topPlatform: string | null
  topCount: number
  topPct: number
  peakLabel: string
  peak: string
  peakV: number
  trendLabels: string[]
  trendValues: number[]
  platforms: PlatformBreakdown[]
  hist: HistRow[]
  mode: Mode
  empty: boolean
}

/**
 * Normalize a raw URL/path into the 4 exact-match variants the citation log's
 * `url` field might have stored: full URL with/without trailing slash, and
 * bare path with/without trailing slash. There is no configured site-origin
 * value in ThirdAudienceConfig, so — unlike the WP reference, which anchors
 * variants to `home_url()` — we derive the "full URL" variants defensively
 * from whatever origin (if any) is present in the raw input itself.
 */
function buildUrlVariants(raw: string): string[] {
  let pathname = raw
  let origin = ''

  try {
    const u = new URL(raw)
    origin = u.origin
    pathname = u.pathname
  } catch {
    // Not a full URL — treat the whole input as a path.
    pathname = raw
  }

  // Collapse duplicate slashes and ensure a single leading slash.
  pathname = '/' + pathname.replace(/\/+/g, '/').replace(/^\/+/, '')

  const pathWithSlash = pathname.endsWith('/') ? pathname : pathname + '/'
  const pathNoSlash = pathWithSlash.length > 1 ? pathWithSlash.slice(0, -1) : pathWithSlash

  const variants = new Set<string>([pathWithSlash, pathNoSlash])
  if (origin) {
    variants.add(origin + pathWithSlash)
    variants.add(origin + pathNoSlash)
  }
  return Array.from(variants)
}

function determineMode(dateSingle: string, dateFrom: string, dateTo: string): Mode {
  if (dateSingle) return 'today'
  if (dateFrom && dateTo) {
    const diffDays = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86_400_000
    if (diffDays <= 1) return 'today'
    if (diffDays <= 8) return 'week'
    return 'month'
  }
  return 'alltime'
}

function dayKey(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD (UTC-ish, matches ISO timestamp storage)
}

function hourLabel(iso: string): string {
  const d = new Date(iso)
  const h = d.getUTCHours()
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12} ${period}`
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** GET /api/third-audience/url-inspector?url=&date_from=&date_to=&date= */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const p = req.nextUrl.searchParams
  const rawUrl = p.get('url') ?? ''
  if (!rawUrl.trim()) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 })
  }

  const dateFrom = p.get('date_from') ?? ''
  const dateTo = p.get('date_to') ?? ''
  const dateSingle = p.get('date') ?? ''
  const mode = determineMode(dateSingle, dateFrom, dateTo)

  const store = getStore()
  const all = await store.getAllCitations()

  const variants = new Set(buildUrlVariants(rawUrl))

  let rows: CitationRecord[] = all.filter(r => variants.has(r.url) && !EXCLUDED_PLATFORMS.has(r.platform))

  if (dateSingle) {
    rows = rows.filter(r => dayKey(r.timestamp) === dateSingle)
  } else if (dateFrom && dateTo) {
    rows = rows.filter(r => {
      const d = dayKey(r.timestamp)
      return d >= dateFrom && d <= dateTo
    })
  }

  rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  if (rows.length === 0) {
    return NextResponse.json({ total: 0, empty: true })
  }

  const total = rows.length

  // Platform counts (insertion order preserved by Map, then sorted desc for output).
  const platformCounts = new Map<string, number>()
  for (const r of rows) {
    platformCounts.set(r.platform, (platformCounts.get(r.platform) ?? 0) + 1)
  }
  const sortedPlatforms = Array.from(platformCounts.entries()).sort((a, b) => b[1] - a[1])
  const [topPlatform, topCount] = sortedPlatforms[0]
  const topPct = Math.round((topCount / total) * 100)
  const llmCount = sortedPlatforms.length

  const platforms: PlatformBreakdown[] = sortedPlatforms.map(([platform, count]) => ({
    platform,
    count,
    pct: Math.round((count / total) * 100),
  }))

  // Trend buckets — hourly for 'today' mode, daily otherwise. Keep chronological order.
  const trendBuckets = new Map<string, number>()
  for (const r of rows) {
    const bucket = mode === 'today' ? hourLabel(r.timestamp) : dayLabel(r.timestamp)
    trendBuckets.set(bucket, (trendBuckets.get(bucket) ?? 0) + 1)
  }
  const trendLabels = Array.from(trendBuckets.keys())
  const trendValues = Array.from(trendBuckets.values())

  let peakV = trendValues[0] ?? 0
  let peakIdx = 0
  for (let i = 1; i < trendValues.length; i++) {
    if (trendValues[i] > peakV) { peakV = trendValues[i]; peakIdx = i }
  }
  const peak = trendLabels[peakIdx] ?? '—'
  const peakLabel = mode === 'today' ? 'Peak Hour' : 'Peak Day'

  // Historical table: day-by-day (or hour-by-hour for 'today') with vs-previous delta.
  const hist: HistRow[] = []
  if (mode !== 'today') {
    const dayBuckets = new Map<string, number>()
    const dayPlatformCounts = new Map<string, Map<string, number>>()
    for (const r of rows) {
      const day = dayKey(r.timestamp)
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1)
      if (!dayPlatformCounts.has(day)) dayPlatformCounts.set(day, new Map())
      const perPlat = dayPlatformCounts.get(day)!
      perPlat.set(r.platform, (perPlat.get(r.platform) ?? 0) + 1)
    }
    const sortedDays = Array.from(dayBuckets.keys()).sort() // ascending chronological
    let prev: number | null = null
    for (const day of sortedDays) {
      const count = dayBuckets.get(day)!
      const perPlat = dayPlatformCounts.get(day)!
      const topDay = Array.from(perPlat.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      hist.push({
        label: dayLabel(`${day}T00:00:00.000Z`),
        count,
        vsPrev: prev !== null ? count - prev : null,
        topPlatform: topDay,
      })
      prev = count
    }
  } else {
    let prev: number | null = null
    for (let i = 0; i < trendLabels.length; i++) {
      const count = trendValues[i]
      hist.push({
        label: trendLabels[i],
        count,
        vsPrev: prev !== null ? count - prev : null,
        topPlatform,
      })
      prev = count
    }
  }

  const response: UrlInspectorResponse = {
    total,
    llmCount,
    topPlatform,
    topCount,
    topPct,
    peakLabel,
    peak,
    peakV,
    trendLabels,
    trendValues,
    platforms,
    hist,
    mode,
    empty: false,
  }

  return NextResponse.json(response)
}
