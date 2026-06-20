import { NextResponse, type NextRequest } from 'next/server'
import { verifySession } from '../dashboard/admin-store.js'

const COOKIE_NAME = 'ta_session'
const RESET_COOKIE = 'ta_session_reset'

/**
 * Third Audience middleware.
 *
 * Handles:
 * - Dashboard auth: /third-audience/* requires valid session cookie
 * - .md URL requests → serve Markdown of matching MDX file
 * - Accept: text/markdown header → serve Markdown of current page
 * - Bot visit tracking (non-blocking, fire-and-forget)
 * - Citation detection via Referer header
 *
 * Wire up in middleware.ts:
 *   export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
 *   export const config = { matcher: ['/((?!_next|api).*)'] }
 */
export async function thirdAudienceMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const accept = req.headers.get('accept') ?? ''

  // Dashboard auth guard — all /third-audience/* except /login
  if (pathname.startsWith('/third-audience') && !pathname.startsWith('/third-audience/login')) {
    const session = req.cookies.get(COOKIE_NAME)?.value
    if (!session || !verifySession(session)) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/third-audience/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  // Password reset guard — /third-audience/login?reset=1 requires reset cookie
  if (pathname === '/third-audience/login' && req.nextUrl.searchParams.get('reset') === '1') {
    const resetCookie = req.cookies.get(RESET_COOKIE)?.value
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value
    // Allow if they have either a valid session or a valid reset token
    if ((!resetCookie || !verifySession(resetCookie)) && (!sessionCookie || !verifySession(sessionCookie))) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/third-audience/login'
      loginUrl.search = ''
      return NextResponse.redirect(loginUrl)
    }
  }

  // /third-audience/login → rewrite to login route handler (GET/POST)
  if (pathname === '/third-audience/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/api/third-audience/login'
    return NextResponse.rewrite(url)
  }

  // .md URL → rewrite to our internal markdown route handler
  if (pathname.endsWith('.md')) {
    const slug = pathname.slice(0, -3) // strip .md
    const url = req.nextUrl.clone()
    url.pathname = `/api/third-audience/markdown${slug}`
    return NextResponse.rewrite(url)
  }

  // Accept: text/markdown header → rewrite to markdown route
  if (accept.includes('text/markdown')) {
    const url = req.nextUrl.clone()
    url.pathname = `/api/third-audience/markdown${pathname}`
    return NextResponse.rewrite(url)
  }

  // /okf/ → rewrite to OKF bundle handler
  if (pathname.startsWith('/okf')) {
    const url = req.nextUrl.clone()
    url.pathname = `/api/third-audience/okf${pathname.slice(4)}`
    return NextResponse.rewrite(url)
  }

  // /llms.txt → rewrite to discovery handler
  if (pathname === '/llms.txt') {
    const url = req.nextUrl.clone()
    url.pathname = '/api/third-audience/llms-txt'
    return NextResponse.rewrite(url)
  }

  // /sitemap-ai.xml → rewrite to AI sitemap handler
  if (pathname === '/sitemap-ai.xml') {
    const url = req.nextUrl.clone()
    url.pathname = '/api/third-audience/sitemap-ai'
    return NextResponse.rewrite(url)
  }

  const response = NextResponse.next()

  // Fire-and-forget: track bot visits and citations (non-blocking)
  trackVisitAsync(req)

  return response
}

function trackVisitAsync(req: NextRequest): void {
  // Dynamically import to avoid loading analytics on every request sync path.
  // Uses void to intentionally not await — tracking must never block response.
  void import('../analytics/visit-tracker.js').then(({ VisitTracker }) => {
    VisitTracker.getInstance().record(req)
  }).catch(() => { /* never throw from tracking */ })
}
