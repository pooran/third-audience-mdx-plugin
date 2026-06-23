import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'ta_session'
const RESET_COOKIE = 'ta_session_reset'

// Edge-safe bot UA patterns — no Node.js APIs needed
const BOT_UA_PATTERNS = [
  'claudebot', 'gptbot', 'chatgpt-user', 'perplexitybot', 'google-extended',
  'applebot', 'ccbot', 'coherecrawler', 'ai2bot', 'bytespider', 'diffbot',
  'youbot', 'facebookbot', 'bingbot', 'googlebot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'sogou', 'exabot', 'ia_archiver', 'scrapy',
  'curl/', 'python-requests', 'go-http-client', 'okhttp', 'axios/', 'got/',
  'node-fetch', 'undici', 'wget/', 'libwww', 'lwp-', 'java/', 'ruby',
  'headlesschrome', 'phantomjs', 'selenium', 'playwright', 'puppeteer',
]

function isBotUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase()
  return BOT_UA_PATTERNS.some(p => lower.includes(p))
}

/**
 * Third Audience middleware — Edge-runtime compatible (no Node.js crypto).
 *
 * Auth guard uses cookie presence only; HMAC verification happens in the
 * route handler (Node.js runtime) where crypto is available.
 *
 * Wire up in middleware.ts:
 *   export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
 *   export const config = { matcher: ['/((?!_next|api).*)'] }
 */
export function thirdAudienceMiddleware(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  const accept = req.headers.get('accept') ?? ''

  // Dashboard auth guard — cookie presence check (HMAC verified in route handler)
  if (pathname.startsWith('/third-audience') && !pathname.startsWith('/third-audience/login')) {
    const session = req.cookies.get(COOKIE_NAME)?.value
    if (!session) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/third-audience/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  // Password reset guard — /third-audience/login?reset=1 requires reset or session cookie
  if (pathname === '/third-audience/login' && req.nextUrl.searchParams.get('reset') === '1') {
    const resetCookie = req.cookies.get(RESET_COOKIE)?.value
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value
    if (!resetCookie && !sessionCookie) {
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

  // /okf or /okf/* → rewrite to OKF bundle handler
  // [...path] catch-all requires at least one segment, so /okf → /okf/index
  if (pathname.startsWith('/okf')) {
    const url = req.nextUrl.clone()
    const rest = pathname.slice(4) // '' or '/something'
    url.pathname = `/api/third-audience/okf${rest || '/index'}`
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

  // Track bot visits to regular HTML pages (fire-and-forget, never blocks response)
  const ua = req.headers.get('user-agent') ?? ''
  const isApi = pathname.startsWith('/api/')
  const isDashboard = pathname.startsWith('/third-audience')
  const isAsset = pathname.startsWith('/_next') || pathname.includes('.')
  if (isBotUserAgent(ua) && !isApi && !isDashboard && !isAsset) {
    const trackUrl = req.nextUrl.clone()
    trackUrl.pathname = '/api/third-audience/track'
    // Pass original URL so the track handler records the right path
    trackUrl.searchParams.set('_url', pathname)
    fetch(trackUrl.toString(), {
      method: 'GET',
      headers: {
        'user-agent': ua,
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
        'x-real-ip': req.headers.get('x-real-ip') ?? '',
        'referer': req.headers.get('referer') ?? '',
        'x-ta-original-url': pathname,
      },
    }).catch(() => {})
  }

  // No match — let the caller's middleware chain continue
  return null
}

