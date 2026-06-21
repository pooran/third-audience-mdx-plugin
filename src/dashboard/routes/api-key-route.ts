import { NextResponse, type NextRequest } from 'next/server'
import { checkApiAuth, unauthorizedResponse } from '../auth.js'
import { getApiKey, rotateApiKey } from '../admin-store.js'

/** GET /api/third-audience/api-key — returns masked key for display */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!await checkApiAuth(req)) return unauthorizedResponse()

  const key = await getApiKey()
  if (!key) {
    return NextResponse.json({ key: null, masked: null })
  }

  const masked = key.slice(0, 8) + '••••••••••••••••••••••••••••••••••••••' + key.slice(-4)
  return NextResponse.json({ masked, prefix: key.slice(0, 3) })
}

/** POST /api/third-audience/api-key — rotate (regenerate) the API key */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!await checkApiAuth(req)) return unauthorizedResponse()

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  if (body.action !== 'rotate') {
    return NextResponse.json({ error: 'Send { action: "rotate" }' }, { status: 400 })
  }

  const newKey = await rotateApiKey()
  return NextResponse.json({
    key: newKey,
    message: 'API key rotated. Copy it now — it will not be shown again.',
  })
}
