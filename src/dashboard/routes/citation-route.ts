import { NextResponse, type NextRequest } from 'next/server'
import { CitationTracker } from '../../citations/citation-tracker.js'
import { CitationAlerts } from '../../citations/citation-alerts.js'

const tracker = new CitationTracker()
const alerts = new CitationAlerts()

/**
 * POST /api/third-audience/citation
 * Accepts client-side citation reports from citation-tracker.js
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    tracker.recordFromBody(body)
    // Check for notable citation events (first citation, new platform, spike)
    const record = {
      timestamp: new Date().toISOString(),
      platform: body.platform ?? 'unknown',
      query: body.query ?? null,
      url: body.url ?? '',
      ip: body.ip ?? 'client',
      user_agent: body.user_agent ?? '',
      referer: body.referer ?? '',
    }
    alerts.check(record).catch(() => {})
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 400 })
  }
}

/**
 * GET /api/third-audience/citation
 * Server-side detection — call from page route handlers if needed.
 */
export async function GET(req: NextRequest) {
  const record = tracker.record(req)
  if (record) {
    alerts.check(record)
  }
  return new NextResponse(null, { status: 204 })
}
