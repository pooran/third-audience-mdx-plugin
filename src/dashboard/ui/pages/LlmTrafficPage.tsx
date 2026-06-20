import fs from 'fs'
import path from 'path'
import { Card } from '../components/Card.js'
import { HeroCard } from '../components/HeroCard.js'
import type { CitationRecord } from '../../../citations/citation-tracker.js'

const PLATFORM_COLORS: Record<string, string> = {
  ChatGPT: 'green', Perplexity: 'blue', Claude: 'orange',
  Gemini: 'teal', Copilot: 'blue', default: 'gray',
}

function loadCitations(days = 30): CitationRecord[] {
  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  const filePath = path.join(process.cwd(), dataDir, 'ta-citations.jsonl')
  if (!fs.existsSync(filePath)) return []

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString()

  return fs.readFileSync(filePath, 'utf-8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) as CitationRecord } catch { return null } })
    .filter((r): r is CitationRecord => r !== null && r.timestamp >= cutoffStr)
}

function groupBy<T>(arr: T[], key: (item: T) => string): Array<{ name: string; count: number }> {
  const map = new Map<string, number>()
  for (const item of arr) {
    const k = key(item)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

export async function LlmTrafficPage() {
  const records = loadCitations(30)

  const today = new Date().toISOString().slice(0, 10)
  const todayCount = records.filter(r => r.timestamp.startsWith(today)).length

  const byPlatform = groupBy(records, r => r.platform)
  const byPage = groupBy(records, r => r.url)
  const byCountry = groupBy(records, r => r.country ?? 'Unknown').slice(0, 10)

  return (
    <div>
      <h1 className="ta-page-title">LLM Traffic</h1>
      <p className="ta-page-subtitle">Citation clicks from AI platforms (last 30 days)</p>

      <div className="ta-hero-grid">
        <HeroCard
          label="Total Citations"
          value={records.length.toLocaleString()}
          meta={`${todayCount} today`}
          color="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
        />
        <HeroCard
          label="AI Platforms"
          value={byPlatform.length}
          meta="distinct sources"
          color="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
        />
        <HeroCard
          label="Pages Cited"
          value={byPage.length}
          meta="unique URLs cited"
          color="orange"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <HeroCard
          label="Top Platform"
          value={byPlatform[0]?.name ?? '—'}
          meta={byPlatform[0] ? `${byPlatform[0].count} citations` : 'no data yet'}
          color="teal"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        />
      </div>

      <div className="ta-grid-2">
        <Card title="By Platform">
          {byPlatform.length === 0 ? (
            <div className="ta-empty"><p>No citation data yet. Make sure citation-tracker.js is included in your layout.</p></div>
          ) : (
            <table className="ta-table">
              <thead><tr><th>Platform</th><th>Citations</th><th>Share</th></tr></thead>
              <tbody>
                {byPlatform.map(p => {
                  const pct = records.length > 0 ? ((p.count / records.length) * 100).toFixed(1) : '0'
                  const color = PLATFORM_COLORS[p.name] ?? PLATFORM_COLORS.default
                  return (
                    <tr key={p.name}>
                      <td><span className={`ta-badge ta-badge--${color}`}>{p.name}</span></td>
                      <td><strong>{p.count}</strong></td>
                      <td style={{ fontSize: 12, color: 'var(--ta-gray-600)' }}>{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="By Country">
          {byCountry.length === 0 ? (
            <div className="ta-empty"><p>No country data yet.</p></div>
          ) : (
            <table className="ta-table">
              <thead><tr><th>Country</th><th>Citations</th></tr></thead>
              <tbody>
                {byCountry.map(c => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td><strong>{c.count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="Top Cited Pages">
        {byPage.length === 0 ? (
          <div className="ta-empty"><p>No pages cited yet.</p></div>
        ) : (
          <table className="ta-table">
            <thead><tr><th>Page</th><th>Citations</th></tr></thead>
            <tbody>
              {byPage.slice(0, 20).map(p => (
                <tr key={p.name}>
                  <td>
                    <a href={p.name} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--ta-font-mono)', fontSize: 12 }}>
                      {p.name}
                    </a>
                  </td>
                  <td><strong>{p.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
