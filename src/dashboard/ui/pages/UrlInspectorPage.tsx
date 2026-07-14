'use client'

import { useState, useCallback } from 'react'
import { HeroCard } from '../components/HeroCard.js'
import { Card } from '../components/Card.js'
import { VisitsChart } from '../components/VisitsChart.js'

interface PlatformBreakdown { platform: string; count: number; pct: number }
interface HistRow { label: string; count: number; vsPrev: number | null; topPlatform: string }

interface InspectorResult {
  total: number
  llmCount?: number
  topPlatform?: string | null
  topCount?: number
  topPct?: number
  peakLabel?: string
  peak?: string
  peakV?: number
  trendLabels?: string[]
  trendValues?: number[]
  platforms?: PlatformBreakdown[]
  hist?: HistRow[]
  mode?: 'today' | 'week' | 'month' | 'alltime'
  empty: boolean
}

type Preset = '7d' | '30d' | '90d' | 'alltime' | 'custom'

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function presetRange(preset: Preset): { date_from: string; date_to: string } | null {
  if (preset === 'alltime' || preset === 'custom') return null
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { date_from: isoDate(from), date_to: isoDate(to) }
}

export function UrlInspectorPage() {
  const [url, setUrl] = useState('')
  const [preset, setPreset] = useState<Preset>('30d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InspectorResult | null>(null)
  const [searched, setSearched] = useState(false)

  const inspect = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const params = new URLSearchParams({ url: url.trim() })
      const range = preset === 'custom' ? { date_from: dateFrom, date_to: dateTo } : presetRange(preset)
      if (range?.date_from) params.set('date_from', range.date_from)
      if (range?.date_to) params.set('date_to', range.date_to)
      const res = await fetch(`/api/third-audience/url-inspector?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? `Request failed (${res.status})`)
      }
      const data = await res.json() as InspectorResult
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [url, preset, dateFrom, dateTo])

  const chartData = (result?.trendLabels ?? []).map((label, i) => ({
    date: label,
    visits: result?.trendValues?.[i] ?? 0,
  }))

  return (
    <div className="ta-page">
      <div className="ta-page-header">
        <h1 className="ta-page-title">URL Inspector</h1>
        <p style={{ color: 'var(--ta-secondary)', fontSize: 14, margin: 0 }}>
          See how often a specific page has been cited by AI platforms
        </p>
      </div>

      {/* Search controls */}
      <div className="ta-card" style={{ marginBottom: 20 }}>
        <div className="ta-card-body">
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Page URL or path *</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') inspect() }}
              placeholder="https://example.com/industries/ or /industries/"
              style={{ flex: '1 1 320px', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', boxSizing: 'border-box' }}
            />
            <button className="ta-btn ta-btn-primary" onClick={inspect} disabled={loading || !url.trim()}>
              {loading ? 'Inspecting…' : 'Inspect'}
            </button>
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date range</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['7d', '30d', '90d', 'alltime', 'custom'] as Preset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={preset === p ? 'ta-btn ta-btn-primary' : 'ta-btn ta-btn-secondary'}
                style={{ fontSize: 13, padding: '6px 12px' }}
              >
                {p === '7d' ? '7 days' : p === '30d' ? '30 days' : p === '90d' ? '90 days' : p === 'alltime' ? 'All time' : 'Custom'}
              </button>
            ))}
            {preset === 'custom' && (
              <>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: '7px 10px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 13, background: 'var(--ta-bg)' }} />
                <span style={{ color: 'var(--ta-secondary)', fontSize: 13 }}>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: '7px 10px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 13, background: 'var(--ta-bg)' }} />
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {!searched && !loading && (
        <div className="ta-card">
          <div className="ta-empty"><p>Enter a URL above and click Inspect to see its citation history.</p></div>
        </div>
      )}

      {loading && (
        <div className="ta-card">
          <div className="ta-empty"><p>Loading…</p></div>
        </div>
      )}

      {!loading && searched && result?.empty && (
        <div className="ta-card">
          <div className="ta-empty"><p>No citations recorded for this URL yet.</p></div>
        </div>
      )}

      {!loading && result && !result.empty && (
        <>
          {/* Hero stats */}
          <div className="ta-hero-grid">
            <HeroCard
              label="Total Citations"
              value={result.total.toLocaleString()}
              meta={result.mode ? `mode: ${result.mode}` : undefined}
              color="blue"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
            />
            <HeroCard
              label="Top Platform"
              value={result.topPlatform ?? '—'}
              meta={result.topCount !== undefined ? `${result.topCount} citations (${result.topPct}%)` : undefined}
              color="green"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
            />
            <HeroCard
              label="Unique Platforms"
              value={result.llmCount ?? 0}
              meta="distinct AI platforms"
              color="teal"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
            />
            <HeroCard
              label={result.peakLabel ?? 'Peak'}
              value={result.peak ?? '—'}
              meta={result.peakV !== undefined ? `${result.peakV} citations` : undefined}
              color="orange"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            />
          </div>

          {/* Trend chart */}
          <Card title="Citation Trend">
            <VisitsChart data={chartData} />
          </Card>

          <div className="ta-grid-2">
            {/* Platform breakdown */}
            <Card title="Platform Breakdown">
              {!result.platforms || result.platforms.length === 0 ? (
                <div className="ta-empty"><p>No platform data.</p></div>
              ) : (
                <div>
                  {result.platforms.map(p => (
                    <div key={p.platform} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{p.platform}</span>
                        <span style={{ color: 'var(--ta-secondary)' }}>{p.count} ({p.pct}%)</span>
                      </div>
                      <div style={{ background: 'var(--ta-surface)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${p.pct}%`, background: 'var(--ta-blue)', height: '100%', borderRadius: 6 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Historical table */}
            <Card title="History">
              {!result.hist || result.hist.length === 0 ? (
                <div className="ta-empty"><p>No historical data.</p></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Period</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Count</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>vs Prev</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Top Platform</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.hist.slice().reverse().map((h, i) => (
                        <tr key={`${h.label}-${i}`} style={{ borderTop: '1px solid var(--ta-border)' }}>
                          <td style={{ padding: '8px 10px' }}>{h.label}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{h.count}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: h.vsPrev === null ? 'var(--ta-secondary)' : h.vsPrev > 0 ? '#16a34a' : h.vsPrev < 0 ? '#dc2626' : 'var(--ta-secondary)' }}>
                            {h.vsPrev === null ? '—' : h.vsPrev > 0 ? `+${h.vsPrev}` : h.vsPrev}
                          </td>
                          <td style={{ padding: '8px 10px' }}>{h.topPlatform}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
