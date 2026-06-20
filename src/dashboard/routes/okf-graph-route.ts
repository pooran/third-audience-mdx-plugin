import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { MdxReader } from '../../core/mdx-reader.js'
import { buildOkfGraph } from '../../okf/okf-bundle.js'
import { checkApiAuth, unauthorizedResponse } from '../auth.js'

const reader = new MdxReader({ contentDir: path.join(process.cwd(), process.env.TA_CONTENT_DIR ?? 'content') })

/** GET /api/third-audience/okf-graph — returns graph JSON for the OKF dashboard viewer */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!checkApiAuth(req)) return unauthorizedResponse()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const files = reader.readAll()
  const graph = buildOkfGraph(files, baseUrl)

  return NextResponse.json({
    graph,
    stats: {
      pages: files.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    },
    indexUrl: `${baseUrl}/okf`,
  })
}
