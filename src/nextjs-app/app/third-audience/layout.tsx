import type { ReactNode } from 'react'
import { Sidebar } from 'third-audience-mdx/dashboard/ui/components/Sidebar'
import { loadAdmin } from 'third-audience-mdx/dashboard/admin-store'
import 'third-audience-mdx/dashboard/ui/globals.css'

export const metadata = { title: 'Third Audience Dashboard' }

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = loadAdmin()
  const showPasswordWarning = admin?.isDefaultPassword === true

  return (
    <html lang="en">
      <body>
        {showPasswordWarning && (
          <div style={{
            background: '#ff3b30',
            color: '#fff',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}>
            ⚠ You are using the default password. {' '}
            <a href="/third-audience/login?reset=1" style={{ color: '#fff', textDecoration: 'underline' }}>
              Change it now
            </a>
            {' '} before exposing this dashboard publicly.
          </div>
        )}
        <div className="ta-layout">
          <Sidebar />
          <main className="ta-main">{children}</main>
        </div>
      </body>
    </html>
  )
}
