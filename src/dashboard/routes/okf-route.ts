import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { MdxReader } from '../../core/mdx-reader.js'
import { generateOkfIndex, generateOkfPage } from '../../okf/okf-bundle.js'

const reader = new MdxReader({ contentDir: path.join(process.cwd(), process.env.TA_CONTENT_DIR ?? 'content') })

/**
 * Handler for /okf/ and /okf/[...slug].md
 * Rewired from middleware to /api/third-audience/okf/[...path]
 */
export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const allFiles = reader.readAll()
  const segments = params.path ?? []

  // /okf/ or /okf/index.md → manifest
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'index.md')) {
    return new NextResponse(generateOkfIndex(allFiles, baseUrl), {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  // /okf/[slug].md → individual page
  const slug = segments.join('/').replace(/\.md$/, '')
  const file = allFiles.find(f => f.slug === slug)
  if (!file) return new NextResponse('Not Found', { status: 404 })

  return new NextResponse(generateOkfPage(file, allFiles, baseUrl), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
