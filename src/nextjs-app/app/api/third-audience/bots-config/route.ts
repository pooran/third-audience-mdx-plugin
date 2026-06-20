import { NextResponse, type NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { checkDashboardAuth } from 'third-audience-mdx/dashboard/auth'

export async function GET(req: NextRequest) {
  if (!checkDashboardAuth(req)) return new NextResponse('Unauthorized', { status: 401 })
  const filePath = path.join(process.cwd(), process.env.TA_DATA_DIR ?? 'data', 'ta-bots-config.json')
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ allowlist: [], blocklist: [], track_unknown: true })
  }
  return NextResponse.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
}

export async function POST(req: NextRequest) {
  if (!checkDashboardAuth(req)) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const filePath = path.join(process.cwd(), process.env.TA_DATA_DIR ?? 'data', 'ta-bots-config.json')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(body, null, 2))
  return new NextResponse(null, { status: 204 })
}
