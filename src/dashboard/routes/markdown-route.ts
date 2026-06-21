import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { MdxReader } from '../../core/mdx-reader.js'
import { MarkdownRenderer } from '../../core/markdown-renderer.js'
import { CacheManager } from '../../cache/cache-manager.js'
import { VisitTracker } from '../../analytics/visit-tracker.js'

const reader = new MdxReader({
  contentDir: path.join(process.cwd(), process.env.TA_CONTENT_DIR ?? 'content'),
  stripSegments: (process.env.TA_STRIP_SEGMENTS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
})
const renderer = new MarkdownRenderer()
const cache = new CacheManager({
  cacheDir: path.join(process.cwd(), process.env.TA_DATA_DIR ?? 'data', 'ta-cache'),
})

/**
 * Handler for GET /api/third-audience/markdown/[...slug]
 *
 * Install in your Next.js app at:
 *   app/api/third-audience/markdown/[...slug]/route.ts
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const startedAt = Date.now()
  const { slug: slugParts } = await params
  const slug = slugParts.join('/')
  const cacheKey = `markdown:${slug}`

  const cached = cache.get(cacheKey)
  if (cached) {
    // Record the bot visit (VisitTracker no-ops for non-bot user agents).
    VisitTracker.getInstance().record(req, {
      responseMs: Date.now() - startedAt,
      cacheHit: true,
      contentLength: cached.length,
    })
    return new NextResponse(cached, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Cache': 'HIT',
      },
    })
  }

  const file = reader.read(slug)
  if (!file) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const markdown = renderer.render(file)
  cache.set(cacheKey, markdown)

  // Record the bot visit (VisitTracker no-ops for non-bot user agents).
  VisitTracker.getInstance().record(req, {
    responseMs: Date.now() - startedAt,
    cacheHit: false,
    contentLength: markdown.length,
  })

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Cache': 'MISS',
    },
  })
}
