import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifySession, verifyApiKey } from './admin-store.js'

const SESSION_COOKIE = 'ta_session'

/**
 * Authenticate an API route request. Accepts (in order):
 * 1. X-TA-Api-Key header — for headless/external callers (mirrors WP's approach)
 * 2. Authorization: Bearer <api-key> — same key, different transport
 * 3. Valid ta_session cookie — browser dashboard session
 */
export function checkApiAuth(req: NextRequest): boolean {
  // 1. X-TA-Api-Key header (WP-style headless key)
  const apiKeyHeader = req.headers.get('x-ta-api-key')
  if (apiKeyHeader) return verifyApiKey(apiKeyHeader)

  // 2. Bearer token (treat as api key)
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    return verifyApiKey(token)
  }

  // 3. Browser session cookie
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (session) return verifySession(session)

  return false
}

/**
 * Returns a 401 JSON response with the correct WWW-Authenticate header.
 * Use as: if (!checkApiAuth(req)) return unauthorizedResponse()
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized. Provide X-TA-Api-Key header or a valid session cookie.' },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="Third Audience API"' },
    }
  )
}
