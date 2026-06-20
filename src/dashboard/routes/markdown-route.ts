import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { MdxReader } from '../../core/mdx-reader.js'
import { MarkdownRenderer } from '../../core/markdown-renderer.js'
import { CacheManager } from '../../cache/cache-manager.js'

const reader = new MdxReader({ contentDir: path.join(process.cwd(), process.env.TA_CONTENT_DIR ?? 'content') })
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
export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  const cacheKey = `markdown:${slug}`

  const cached = cache.get(cacheKey)
  if (cached) {
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

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Cache': 'MISS',
    },
  })
}
