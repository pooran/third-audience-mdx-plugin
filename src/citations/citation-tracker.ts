import type { NextRequest } from 'next/server'
import { getStore } from '../storage/get-store.js'

export interface CitationRecord {
  timestamp: string
  platform: string
  query: string | null
  url: string
  ip: string
  user_agent: string
  referer: string
}

// Order matters — more specific patterns must come before broader ones.
// Bing Search (organic) is explicitly excluded; only Copilot counts as AI.
const AI_PLATFORMS: Array<{
  name: string
  test: (referer: string, url: URL, req?: { searchParams: URLSearchParams }) => boolean
  extractQuery?: (url: URL) => string | null
}> = [
  // --- ChatGPT / OpenAI ---
  // Since Jun 2025 ChatGPT uses utm_source=chatgpt.com instead of referrer
  {
    name: 'ChatGPT',
    test: (ref) => /openai\.com|chatgpt\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Perplexity ---
  {
    name: 'Perplexity',
    test: (ref) => /perplexity\.ai/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Claude (Anthropic) ---
  // Claude often doesn't send a referrer — detected via UTM or absence heuristic
  {
    name: 'Claude',
    test: (ref) => /claude\.ai|anthropic\.com/i.test(ref),
    extractQuery: () => null,
  },
  // --- Gemini / Bard ---
  {
    name: 'Gemini',
    test: (ref) => /gemini\.google\.com|bard\.google\.com/i.test(ref),
    extractQuery: () => null,
  },
  // --- Microsoft Copilot (NOT Bing Search) ---
  // copilot.microsoft.com is AI; www.bing.com/search is organic search
  {
    name: 'Copilot',
    test: (ref) => /copilot\.microsoft\.com/i.test(ref) || /bing\.com\/chat/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- You.com ---
  {
    name: 'You.com',
    test: (ref) => /you\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Phind ---
  {
    name: 'Phind',
    test: (ref) => /phind\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Kagi ---
  {
    name: 'Kagi',
    test: (ref) => /kagi\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- SearchGPT / OpenAI Search ---
  {
    name: 'SearchGPT',
    test: (ref) => /search\.openai\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Grok (xAI) ---
  {
    name: 'Grok',
    test: (ref) => /grok\.x\.ai|x\.ai\/grok/i.test(ref),
    extractQuery: () => null,
  },
  // --- Bing AI in new Bing (distinguished from organic by /search path absence) ---
  // bing.com/search = organic, already excluded above; other bing paths may be AI
  {
    name: 'Bing AI',
    test: (ref) => {
      if (!/bing\.com/i.test(ref)) return false
      try {
        const u = new URL(ref)
        // /search is organic — everything else (/, /chat, /ai, etc.) is AI
        return !u.pathname.startsWith('/search')
      } catch { return false }
    },
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Poe (AI aggregator) ---
  {
    name: 'Poe',
    test: (ref) => /poe\.com/i.test(ref),
    extractQuery: () => null,
  },
  // --- Character.AI ---
  {
    name: 'Character.AI',
    test: (ref) => /character\.ai/i.test(ref),
    extractQuery: () => null,
  },
  // --- Mistral Le Chat ---
  {
    name: 'Mistral',
    test: (ref) => /mistral\.ai|chat\.mistral\.ai/i.test(ref),
    extractQuery: () => null,
  },
  // --- Meta AI ---
  {
    name: 'Meta AI',
    test: (ref) => /meta\.ai|ai\.meta\.com/i.test(ref),
    extractQuery: () => null,
  },
  // --- HuggingChat ---
  {
    name: 'HuggingChat',
    test: (ref) => /huggingface\.co\/chat/i.test(ref),
    extractQuery: () => null,
  },
  // --- Brave Leo ---
  {
    name: 'Brave Leo',
    test: (ref) => /search\.brave\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- DuckDuckGo AI ---
  {
    name: 'DuckDuckGo AI',
    test: (ref) => /duckduckgo\.com/i.test(ref) && /duckai|ai_/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
  // --- Liner AI ---
  {
    name: 'Liner',
    test: (ref) => /liner\.app/i.test(ref),
    extractQuery: () => null,
  },
  // --- Andi Search ---
  {
    name: 'Andi',
    test: (ref) => /andisearch\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get('q'),
  },
]

export function detectAiPlatform(
  referer: string,
  utmSource?: string | null,
  landingParams?: URLSearchParams | null,
): { platform: string; query: string | null } | null {
  // ChatGPT UTM detection (used since Jun 2025 when referrer is absent)
  if (!referer && utmSource && /chatgpt/i.test(utmSource)) {
    return { platform: 'ChatGPT', query: null }
  }
  // Claude UTM detection (Claude often strips referrer)
  if (!referer && utmSource && /claude|anthropic/i.test(utmSource)) {
    return { platform: 'Claude', query: null }
  }

  if (!referer) return null

  let url: URL
  try { url = new URL(referer) } catch { return null }

  // Google AI Mode: udm=50 ONLY (on referer query or landing params) with google referrer.
  // srsltid is Merchant Center shopping click-tracking, not an AI signal — dropped.
  if (landingParams) {
    const fromGoogle = /google\./i.test(referer) || !referer
    if (fromGoogle && (landingParams.get('udm') === '50' || url.searchParams.get('udm') === '50')) {
      return { platform: 'Google AI Mode', query: landingParams.get('q') }
    }
  }

  for (const p of AI_PLATFORMS) {
    if (p.test(referer, url)) {
      const query = p.extractQuery ? p.extractQuery(url) : null
      return { platform: p.name, query }
    }
  }
  return null
}

// Hidden-referrer detection: Claude (Anthropic) and some other AI platforms strip the
// Referer header, so their clicks arrive with no Referer and no UTM and would
// otherwise be silently dropped by detectAiPlatform(). A real top-level cross-origin
// navigation still sends Fetch Metadata request headers, so we use those as a
// low-confidence fallback signal — ported from the WordPress reference
// implementation's detect_hidden_referrer() (class-ta-ai-citation-tracker.php).
// Gated by TA_DETECT_HIDDEN_REFERRER (default on; set to '0' or 'false' to disable),
// mirroring the reference's ta_detect_hidden_referrer option (default true).
//
// NOTE: the reference also gates on is_singular() (only count actual content pages,
// not the home page/archives/feeds). This npm package's CitationTracker.record() is
// only ever invoked from route handlers that already represent a specific
// content-page request (see citation-route.ts / track-route.ts) — there is no
// archive/listing concept here — so that guard has no equivalent and is deliberately
// omitted rather than silently dropped.
function isHiddenReferrerDetectionEnabled(): boolean {
  const raw = process.env.TA_DETECT_HIDDEN_REFERRER
  return raw !== '0' && raw !== 'false'
}

function detectHiddenReferrer(req: NextRequest): { platform: string; query: string | null } | null {
  if (!isHiddenReferrerDetectionEnabled()) return null

  const site = req.headers.get('sec-fetch-site') ?? ''
  const mode = req.headers.get('sec-fetch-mode') ?? ''
  const dest = req.headers.get('sec-fetch-dest') ?? ''

  // Must be a real top-level page navigation that originated on another site.
  if (site !== 'cross-site' || mode !== 'navigate') return null
  // When Sec-Fetch-Dest is present it must be a document (not image/script/etc).
  if (dest !== '' && dest !== 'document') return null

  return { platform: 'Hidden Referrer (Claude)', query: null }
}

export class CitationTracker {
  record(req: NextRequest): CitationRecord | null {
    const referer = req.headers.get('referer') ?? ''
    const utmSource = req.nextUrl.searchParams.get('utm_source')
    // detectAiPlatform() already covers UTM-based detection when referer is empty
    // (ChatGPT/Claude UTM sniffing); if it still found nothing and there's no
    // referer, fall back to the Fetch Metadata hidden-referrer heuristic.
    const detection = detectAiPlatform(referer, utmSource, req.nextUrl.searchParams)
      ?? (!referer ? detectHiddenReferrer(req) : null)
    if (!detection) return null

    // Skip browser prefetch — Chrome sends SEC-Fetch-Purpose: prefetch on visible links
    if (req.headers.get('sec-fetch-purpose') === 'prefetch') return null

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'client'

    const record: CitationRecord = {
      timestamp: new Date().toISOString(),
      platform: detection.platform,
      query: detection.query,
      url: req.nextUrl.pathname,
      ip,
      user_agent: req.headers.get('user-agent') ?? '',
      referer,
    }

    getStore().appendCitation(record).catch(() => {})
    return record
  }

  recordFromBody(body: { platform: string; query?: string | null; url: string; ip?: string; user_agent?: string; referer?: string }): void {
    const record: CitationRecord = {
      timestamp: new Date().toISOString(),
      platform: body.platform,
      query: body.query ?? null,
      url: body.url,
      ip: body.ip ?? 'client',
      user_agent: body.user_agent ?? '',
      referer: body.referer ?? '',
    }
    getStore().appendCitation(record).catch(() => {})
  }
}
