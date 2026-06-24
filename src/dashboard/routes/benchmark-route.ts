import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStore } from '../../storage/get-store.js'
import type { BenchmarkFilters, BenchmarkRecord } from '../../storage/store.js'

/** GET /api/third-audience/benchmark?competitor_url=&ai_platform=&sinceDate=&limit=&offset= */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const store = getStore()
  const p = req.nextUrl.searchParams
  const filters: BenchmarkFilters = {
    competitor_url: p.get('competitor_url') ?? undefined,
    ai_platform: p.get('ai_platform') ?? undefined,
    sinceDate: p.get('sinceDate') ?? undefined,
  }
  const limit = Math.min(parseInt(p.get('limit') ?? '50'), 200)
  const offset = parseInt(p.get('offset') ?? '0')

  const [competitors, rows, total] = await Promise.all([
    store.getCompetitors(),
    store.getBenchmarks(filters),
    store.countBenchmarks(filters),
  ])

  const paginated = rows.slice(offset, offset + limit)

  // Analytics: citation rate per competitor × platform
  const analytics = buildAnalytics(rows)

  return NextResponse.json({ competitors, rows: paginated, total, analytics })
}

/** POST /api/third-audience/benchmark */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const store = getStore()
  const body = await req.json() as Record<string, unknown>
  const action = body.action as string

  if (action === 'save_competitors') {
    const list = body.competitors as Array<{ url: string; name: string }>
    if (!Array.isArray(list)) return NextResponse.json({ error: 'Invalid competitors list' }, { status: 400 })
    const deduped = Array.from(new Map(list.map(c => [c.url.trim(), { url: c.url.trim(), name: c.name.trim() }])).values())
    await store.saveCompetitors(deduped)
    return NextResponse.json({ ok: true, competitors: deduped })
  }

  if (action === 'record') {
    const r = body.record as Record<string, unknown>
    if (!r?.competitor_url || !r?.test_prompt || !r?.ai_platform || !r?.test_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await store.appendBenchmark({
      competitor_url: String(r.competitor_url),
      competitor_name: String(r.competitor_name ?? ''),
      test_prompt: String(r.test_prompt),
      ai_platform: String(r.ai_platform),
      cited_rank: r.cited_rank != null ? Number(r.cited_rank) : null,
      test_date: String(r.test_date),
      test_notes: String(r.test_notes ?? ''),
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await store.deleteBenchmark(id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'clear_all') {
    await store.clearBenchmarks()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── Analytics aggregation ──────────────────────────────────────────────────

function buildAnalytics(rows: BenchmarkRecord[]) {
  // Per-competitor citation rates
  const byCompetitor: Record<string, { name: string; total: number; cited: number; totalRank: number; rankCount: number }> = {}
  const byPlatform: Record<string, { total: number; cited: number }> = {}

  for (const r of rows) {
    const key = r.competitor_url
    if (!byCompetitor[key]) byCompetitor[key] = { name: r.competitor_name, total: 0, cited: 0, totalRank: 0, rankCount: 0 }
    byCompetitor[key].total++
    if (r.cited_rank !== null) { byCompetitor[key].cited++; byCompetitor[key].totalRank += r.cited_rank; byCompetitor[key].rankCount++ }

    if (!byPlatform[r.ai_platform]) byPlatform[r.ai_platform] = { total: 0, cited: 0 }
    byPlatform[r.ai_platform].total++
    if (r.cited_rank !== null) byPlatform[r.ai_platform].cited++
  }

  const competitors = Object.entries(byCompetitor).map(([url, v]) => ({
    url, name: v.name,
    total: v.total, cited: v.cited,
    citationRate: v.total > 0 ? Math.round((v.cited / v.total) * 100) : 0,
    avgRank: v.rankCount > 0 ? Math.round((v.totalRank / v.rankCount) * 10) / 10 : null,
  })).sort((a, b) => b.citationRate - a.citationRate)

  const platforms = Object.entries(byPlatform).map(([name, v]) => ({
    name, total: v.total, cited: v.cited,
    citationRate: v.total > 0 ? Math.round((v.cited / v.total) * 100) : 0,
  })).sort((a, b) => b.citationRate - a.citationRate)

  return { competitors, platforms }
}
