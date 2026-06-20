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
