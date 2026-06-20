import { NextResponse, type NextRequest } from 'next/server'
import { PerformanceStats } from '../../analytics/performance-stats.js'
import { checkDashboardAuth } from '../auth.js'

const stats = new PerformanceStats()

/** GET /api/third-audience/analytics?days=30 */
export async function GET(req: NextRequest) {
  if (!checkDashboardAuth(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10)
  const summary = stats.compute(days)

  return NextResponse.json(summary)
}
