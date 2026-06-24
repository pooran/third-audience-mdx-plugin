import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendDigest } from '../../notifications/alert-sender.js'

/**
 * POST /api/third-audience/digest
 * Body: { period: 'daily' | 'weekly', force?: boolean }
 *
 * Trigger a digest manually or from a cron job (Vercel Cron, GitHub Actions, etc.)
 * Requires the TA_API_KEY header matching the configured key.
 *
 * Example cron (Vercel vercel.json):
 *   { "path": "/api/third-audience/digest", "schedule": "0 8 * * *" }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth: require API key header
  const apiKey = req.headers.get('x-ta-api-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  const configuredKey = process.env.TA_API_KEY
  if (configuredKey && apiKey !== configuredKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let period: 'daily' | 'weekly' = 'daily'
  let force = false

  try {
    const body = await req.json() as { period?: string; force?: boolean }
    if (body.period === 'weekly') period = 'weekly'
    if (body.force === true) force = true
  } catch {
    // Empty or malformed body — use defaults
  }

  try {
    const result = await sendDigest(period)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

/** GET — health check / last sent status */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { getStore } = await import('../../storage/get-store.js')
  const store = getStore()
  const [daily, weekly] = await Promise.all([
    store.getKv('digest_last_sent_daily'),
    store.getKv('digest_last_sent_weekly'),
  ])
  return NextResponse.json({ lastSent: { daily, weekly } })
}
