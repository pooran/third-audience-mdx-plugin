import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { MdxReader } from '../../core/mdx-reader.js'
import { generateAiSitemap } from '../../discovery/sitemap-ai.js'

const reader = new MdxReader({ contentDir: path.join(process.cwd(), process.env.TA_CONTENT_DIR ?? 'content') })

/** Handler for GET /sitemap-ai.xml → rewired to /api/third-audience/sitemap-ai */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const files = reader.readAll()
  const content = generateAiSitemap(files, baseUrl)

  return new NextResponse(content, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
