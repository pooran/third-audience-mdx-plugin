import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { MdxReader } from '../../core/mdx-reader.js'
import { generateLlmsTxt } from '../../discovery/llms-txt.js'

const reader = new MdxReader({ contentDir: path.join(process.cwd(), process.env.TA_CONTENT_DIR ?? 'content') })

/** Handler for GET /llms.txt → rewired to /api/third-audience/llms-txt */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const files = reader.readAll()
  const content = generateLlmsTxt(files, baseUrl)

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
