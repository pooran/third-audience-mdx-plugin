import { BotManagementPage } from 'third-audience-mdx/dashboard/ui/pages/BotManagementPage'
import { checkDashboardAuth } from 'third-audience-mdx/dashboard/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Bot Management — Third Audience' }

export default async function Page() {
  // Server-side auth check
  const headersList = await headers()
  const authHeader = headersList.get('authorization') ?? ''
  // Build a minimal request-like object for auth check
  const secret = process.env.THIRD_AUDIENCE_SECRET
  if (secret && !authHeader.includes(secret)) {
    redirect('/third-audience?auth=required')
  }

  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  const configPath = path.join(process.cwd(), dataDir, 'ta-bots-config.json')
  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : { allowlist: [], blocklist: [], track_unknown: true }

  return <BotManagementPage config={config} />
}
