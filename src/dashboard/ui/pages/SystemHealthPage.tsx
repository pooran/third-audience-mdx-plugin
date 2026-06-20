import fs from 'fs'
import path from 'path'
import { Card } from '../components/Card.js'

interface HealthCheck {
  label: string
  status: 'ok' | 'warning' | 'error'
  note?: string
}

function runHealthChecks(): { checks: HealthCheck[]; overall: 'ok' | 'warning' | 'error' } {
  const cwd = process.cwd()
  const checks: HealthCheck[] = []

  // Node version
  const [major] = process.versions.node.split('.').map(Number)
  checks.push({
    label: `Node.js ${process.versions.node}`,
    status: major >= 18 ? 'ok' : 'error',
    note: major < 18 ? 'Requires Node 18+' : undefined,
  })

  // Content dir
  const contentDir = process.env.TA_CONTENT_DIR ?? 'content'
  const contentPath = path.join(cwd, contentDir)
  const contentExists = fs.existsSync(contentPath)
  let mdxCount = 0
  if (contentExists) {
    function countMdx(dir: string): number {
      let n = 0
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) n += countMdx(path.join(dir, e.name))
        else if (e.name.endsWith('.mdx') || e.name.endsWith('.md')) n++
      }
      return n
    }
    mdxCount = countMdx(contentPath)
  }
  checks.push({
    label: `Content directory (${contentDir})`,
    status: contentExists ? 'ok' : 'warning',
    note: contentExists ? `${mdxCount} MDX files` : 'Not found — set TA_CONTENT_DIR',
  })

  // Data dir
  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  const dataPath = path.join(cwd, dataDir)
  checks.push({
    label: `Data directory (${dataDir})`,
    status: fs.existsSync(dataPath) ? 'ok' : 'warning',
    note: !fs.existsSync(dataPath) ? 'Run `npx third-audience init`' : undefined,
  })

  // JSONL files
  const visitsPath = path.join(cwd, dataDir, 'ta-visits.jsonl')
  const citPath = path.join(cwd, dataDir, 'ta-citations.jsonl')
  const visitLines = fs.existsSync(visitsPath) ? fs.readFileSync(visitsPath, 'utf-8').split('\n').filter(Boolean).length : 0
  const citLines = fs.existsSync(citPath) ? fs.readFileSync(citPath, 'utf-8').split('\n').filter(Boolean).length : 0
  checks.push({ label: 'ta-visits.jsonl', status: 'ok', note: `${visitLines.toLocaleString()} records` })
  checks.push({ label: 'ta-citations.jsonl', status: 'ok', note: `${citLines.toLocaleString()} records` })

  // Cache dir
  const cachePath = path.join(cwd, dataDir, 'ta-cache')
  const cacheExists = fs.existsSync(cachePath)
  const cacheFiles = cacheExists ? fs.readdirSync(cachePath).filter(f => f.endsWith('.json')).length : 0
  checks.push({ label: 'Cache directory', status: 'ok', note: `${cacheFiles} entries` })

  // Dashboard secret
  checks.push({
    label: 'THIRD_AUDIENCE_SECRET',
    status: process.env.THIRD_AUDIENCE_SECRET ? 'ok' : 'warning',
    note: !process.env.THIRD_AUDIENCE_SECRET ? 'Not set — dashboard is open to anyone' : 'Set',
  })

  // Middleware
  const middlewarePath = path.join(cwd, 'middleware.ts')
  checks.push({
    label: 'middleware.ts',
    status: fs.existsSync(middlewarePath) ? 'ok' : 'warning',
    note: !fs.existsSync(middlewarePath) ? 'Not found — .md URLs and /llms.txt may not route correctly' : undefined,
  })

  const hasErrors = checks.some(c => c.status === 'error')
  const hasWarnings = checks.some(c => c.status === 'warning')
  const overall = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok'

  return { checks, overall }
}

const STATUS_ICON: Record<string, string> = { ok: '✅', warning: '⚠️', error: '❌' }
const STATUS_COLOR: Record<string, string> = {
  ok: 'var(--ta-green)', warning: 'var(--ta-orange)', error: 'var(--ta-red)',
}
const OVERALL_MSG: Record<string, string> = {
  ok: 'All systems operational',
  warning: 'Some optional features may be limited',
  error: 'Action required: system requirements not met',
}

export async function SystemHealthPage() {
  const { checks, overall } = runHealthChecks()

  return (
    <div>
      <h1 className="ta-page-title">System Health</h1>
      <p className="ta-page-subtitle">Diagnostics and configuration status</p>

      {/* Overall status banner */}
      <div className="ta-card ta-section" style={{ borderLeft: `4px solid ${STATUS_COLOR[overall]}` }}>
        <div className="ta-card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>{STATUS_ICON[overall]}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{OVERALL_MSG[overall]}</div>
            <div style={{ color: 'var(--ta-gray-600)', fontSize: 13 }}>
              {checks.filter(c => c.status === 'ok').length}/{checks.length} checks passing
            </div>
          </div>
        </div>
      </div>

      <Card title="System Checks">
        <table className="ta-table">
          <thead><tr><th>Check</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            {checks.map(c => (
              <tr key={c.label}>
                <td style={{ fontWeight: 500 }}>{c.label}</td>
                <td>
                  <span className={`ta-badge ta-badge--${c.status === 'ok' ? 'green' : c.status === 'warning' ? 'orange' : 'red'}`}>
                    {c.status}
                  </span>
                </td>
                <td style={{ color: 'var(--ta-gray-600)', fontSize: 13 }}>{c.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Package Info">
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 0', fontSize: 13 }}>
          <span style={{ color: 'var(--ta-gray-600)' }}>Package</span>
          <span><code>third-audience-mdx</code></span>
          <span style={{ color: 'var(--ta-gray-600)' }}>Node.js</span>
          <span><code>{process.versions.node}</code></span>
          <span style={{ color: 'var(--ta-gray-600)' }}>Content dir</span>
          <span><code>{process.env.TA_CONTENT_DIR ?? 'content'}</code></span>
          <span style={{ color: 'var(--ta-gray-600)' }}>Data dir</span>
          <span><code>{process.env.TA_DATA_DIR ?? 'data'}</code></span>
          <span style={{ color: 'var(--ta-gray-600)' }}>Dashboard</span>
          <span><code>/third-audience/</code></span>
        </div>
      </Card>

      <Card title="Quick Links">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { href: '/llms.txt', label: '/llms.txt' },
            { href: '/sitemap-ai.xml', label: '/sitemap-ai.xml' },
            { href: '/okf/', label: '/okf/' },
            { href: '/okf/index.md', label: '/okf/index.md' },
          ].map(link => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="ta-btn ta-btn--ghost">
              {link.label} ↗
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}
