import fs from 'fs'
import path from 'path'
import { NextResponse, type NextRequest } from 'next/server'
import { checkApiAuth, unauthorizedResponse } from '../auth.js'

function botsConfigPath(): string {
  return path.join(process.cwd(), process.env.TA_DATA_DIR ?? 'data', 'ta-bots-config.json')
}

/** GET /api/third-audience/bots-config — returns current bots configuration */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!checkApiAuth(req)) return unauthorizedResponse()

  const filePath = botsConfigPath()
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ allowlist: [], blocklist: [], track_unknown: true })
  }

  return NextResponse.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
}

/** POST /api/third-audience/bots-config — saves bots configuration */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!checkApiAuth(req)) return unauthorizedResponse()

  const body = await req.json()
  const filePath = botsConfigPath()
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(body, null, 2))

  return new NextResponse(null, { status: 204 })
}
