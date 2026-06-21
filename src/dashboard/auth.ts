import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifySession, verifyApiKey } from './admin-store.js'

const SESSION_COOKIE = 'ta_session'

export async function checkApiAuth(req: NextRequest): Promise<boolean> {
  const apiKeyHeader = req.headers.get('x-ta-api-key')
  if (apiKeyHeader) return verifyApiKey(apiKeyHeader)

  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) {
    return verifyApiKey(auth.slice(7))
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (session) return verifySession(session)

  return false
}

export function checkDashboardAuth(req: NextRequest): boolean {
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (!session) return false
  return verifySession(session)
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized. Provide X-TA-Api-Key header or a valid session cookie.' },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="Third Audience API"' },
    }
  )
}
