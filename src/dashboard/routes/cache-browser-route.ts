import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStore } from '../../storage/get-store.js'

/** GET /api/third-audience/cache-browser?search=&limit=50&offset=0 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const store = getStore()
  const p = req.nextUrl.searchParams
  const search = p.get('search') ?? undefined
  const limit = Math.min(parseInt(p.get('limit') ?? '50'), 200)
  const offset = parseInt(p.get('offset') ?? '0')

  const [entries, total] = await Promise.all([
    store.listCacheKeys({ search, limit, offset }),
    store.countCacheKeys(search),
  ])

  const now = Date.now()
  const annotated = entries.map(e => ({
    key: e.key,
    etag: e.etag,
    cachedAt: e.cachedAt,
    ttl: e.ttl,
    size: e.content.length,
    expired: now > e.cachedAt + e.ttl * 1000,
    expiresAt: e.cachedAt + e.ttl * 1000,
  }))

  return NextResponse.json({ entries: annotated, total, offset, limit })
}

/** POST /api/third-audience/cache-browser */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const store = getStore()
  const body = await req.json() as Record<string, unknown>
  const action = body.action as string

  if (action === 'delete_key') {
    const key = body.key as string
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    await store.deleteCacheKey(key)
    return NextResponse.json({ ok: true })
  }

  if (action === 'clear_expired') {
    const deleted = await store.clearExpiredCache()
    return NextResponse.json({ ok: true, deleted })
  }

  if (action === 'clear_all') {
    await store.deleteCache('')
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
