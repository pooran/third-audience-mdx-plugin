import { NextResponse, type NextRequest } from 'next/server'
import { VisitTracker } from '../../analytics/visit-tracker.js'

/**
 * Internal route — called by thirdAudienceMiddleware for every bot HTML request.
 * Runs in Node.js runtime so geoip and DB writes are available.
 *
 * Install at:
 *   app/api/third-audience/track/route.ts
 *   export { GET } from 'third-audience-mdx/routes/track'
 */
export async function GET(req: NextRequest) {
  const originalUrl = req.headers.get('x-ta-original-url') ?? undefined
  VisitTracker.getInstance().record(req, { url: originalUrl })
  return new NextResponse(null, { status: 204 })
}
