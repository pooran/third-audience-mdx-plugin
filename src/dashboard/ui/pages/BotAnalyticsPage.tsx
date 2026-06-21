import { PerformanceStats } from '../../../analytics/performance-stats.js'
import { HeroCard } from '../components/HeroCard.js'
import { Card } from '../components/Card.js'
import { VisitsChart } from '../components/VisitsChart.js'

const BOT_COLORS: Record<string, string> = {
  ClaudeBot: 'orange', GPTBot: 'green', PerplexityBot: 'blue',
  'Googlebot-AI': 'teal', default: 'gray',
}

export async function BotAnalyticsPage() {
  const stats = new PerformanceStats()
  const summary = await stats.compute(30)

  const cacheRate = summary.cacheHitRate !== null
    ? `${(summary.cacheHitRate * 100).toFixed(0)}%` : '—'
  const avgMs = summary.avgResponseMs !== null
    ? `${Math.round(summary.avgResponseMs)}ms` : '—'

  return (
    <div>
      <h1 className="ta-page-title">Bot Analytics</h1>
      <p className="ta-page-subtitle">AI crawler visits over the last 30 days</p>

      {/* Hero metrics */}
      <div className="ta-hero-grid">
        <HeroCard
          label="Total Bot Visits"
          value={summary.totalVisits.toLocaleString()}
          meta={`${summary.uniqueBots.length} unique bots`}
          color="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
        />
        <HeroCard
          label="Unique Pages Crawled"
          value={summary.topPages.length.toLocaleString()}
          meta="distinct URLs visited"
          color="teal"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <HeroCard
          label="Cache Hit Rate"
          value={cacheRate}
          meta="higher = faster bot response"
          color="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <HeroCard
          label="Avg Response"
          value={avgMs}
          meta="for markdown requests"
          color="orange"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
      </div>

      {/* Visits chart */}
      <Card title="Daily Visits (30 days)">
        <VisitsChart data={summary.visitsByDay} />
      </Card>

      <div className="ta-grid-2">
        {/* Top bots */}
        <Card title="Top Bots">
          {summary.topBots.length === 0 ? (
            <div className="ta-empty"><p>No bot visits recorded yet.</p></div>
          ) : (
            <table className="ta-table">
              <thead>
                <tr><th>Bot</th><th>Visits</th><th>Share</th></tr>
              </thead>
              <tbody>
                {summary.topBots.map(b => {
                  const pct = summary.totalVisits > 0
                    ? ((b.visits / summary.totalVisits) * 100).toFixed(1)
                    : '0'
                  const color = BOT_COLORS[b.name] ?? BOT_COLORS.default
                  return (
                    <tr key={b.name}>
                      <td>
                        <span className={`ta-badge ta-badge--${color}`}>{b.name}</span>
                      </td>
                      <td><strong>{b.visits.toLocaleString()}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--ta-gray-100)', borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--ta-blue)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--ta-gray-600)', width: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Top pages */}
        <Card title="Top Pages Crawled">
          {summary.topPages.length === 0 ? (
            <div className="ta-empty"><p>No pages crawled yet.</p></div>
          ) : (
            <table className="ta-table">
              <thead>
                <tr><th>Page</th><th>Visits</th></tr>
              </thead>
              <tbody>
                {summary.topPages.map(p => (
                  <tr key={p.url}>
                    <td>
                      <a href={p.url} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--ta-font-mono)', fontSize: 12 }}>
                        {p.url}
                      </a>
                    </td>
                    <td><strong>{p.visits.toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
