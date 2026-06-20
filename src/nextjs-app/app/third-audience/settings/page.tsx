import { SettingsPage } from 'third-audience-mdx/dashboard/ui/pages/SettingsPage'
import { getApiKey } from 'third-audience-mdx/dashboard/admin-store'

export const dynamic = 'force-dynamic'

export default function Page() {
  const key = getApiKey()
  const masked = key
    ? key.slice(0, 8) + '••••••••••••••••••••••••••••••••••••••' + key.slice(-4)
    : null
  return <SettingsPage maskedKey={masked} />
}
