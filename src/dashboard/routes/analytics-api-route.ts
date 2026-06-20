import { NextResponse, type NextRequest } from 'next/server'
import { PerformanceStats } from '../../analytics/performance-stats.js'
import { checkApiAuth, unauthorizedResponse } from '../auth.js'

const stats = new PerformanceStats()

/** GET /api/third-audience/analytics?days=30 */
export async function GET(req: NextRequest) {
  if (!checkApiAuth(req)) {
    return unauthorizedResponse()
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10)
  const summary = stats.compute(days)

  return NextResponse.json(summary)
}
