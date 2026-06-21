import { NextResponse, type NextRequest } from 'next/server'
import { checkApiAuth, unauthorizedResponse } from '../auth.js'
import { getStore } from '../../storage/get-store.js'

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!await checkApiAuth(req)) return unauthorizedResponse()
  const config = await getStore().getBotsConfig()
  return NextResponse.json(config)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!await checkApiAuth(req)) return unauthorizedResponse()
  const body = await req.json()
  await getStore().saveBotsConfig(body)
  return new NextResponse(null, { status: 204 })
}
