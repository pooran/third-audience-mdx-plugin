'use client'

import { useState, useEffect, useCallback } from 'react'

const ALL_PLATFORMS = [
  'ChatGPT', 'Perplexity', 'Claude', 'Gemini', 'Copilot',
  'You.com', 'Phind', 'Kagi', 'SearchGPT', 'Grok', 'Bing AI',
  'Poe', 'Character.AI', 'Mistral', 'Meta AI', 'HuggingChat',
  'Brave Leo', 'DuckDuckGo AI', 'Liner', 'Andi', 'Google AI Overview',
]

interface Competitor { url: string; name: string }
interface BenchmarkRow {
  id: number; competitor_url: string; competitor_name: string
  test_prompt: string; ai_platform: string; cited_rank: number | null
  test_date: string; test_notes: string
}
interface Analytics {
  competitors: Array<{ url: string; name: string; total: number; cited: number; citationRate: number; avgRank: number | null }>
  platforms: Array<{ name: string; total: number; cited: number; citationRate: number }>
}

type Tab = 'analytics' | 'tests' | 'add_test' | 'manage'

export function CompetitorBenchmarkingPage() {
  const [tab, setTab] = useState<Tab>('analytics')
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [rows, setRows] = useState<BenchmarkRow[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterCompetitor, setFilterCompetitor] = useState('')

  // Manage competitors state
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  // Add test state
  const [form, setForm] = useState({
    competitor_url: '', test_prompt: '', ai_platform: 'ChatGPT',
    cited_rank: '', test_date: new Date().toISOString().slice(0, 10), test_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (filterPlatform) params.set('ai_platform', filterPlatform)
      if (filterCompetitor) params.set('competitor_url', filterCompetitor)
      const res = await fetch(`/api/third-audience/benchmark?${params}`)
      const data = await res.json() as { competitors: Competitor[]; rows: BenchmarkRow[]; total: number; analytics: Analytics }
      setCompetitors(data.competitors ?? [])
      setRows(data.rows ?? [])
      setTotal(data.total ?? 0)
      setAnalytics(data.analytics ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [filterPlatform, filterCompetitor])

  useEffect(() => { load() }, [load])

  async function addCompetitor() {
    if (!newUrl.trim() || !newName.trim()) return
    setSaving(true)
    const updated = [...competitors, { url: newUrl.trim(), name: newName.trim() }]
    await fetch('/api/third-audience/benchmark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_competitors', competitors: updated }),
    })
    setNewUrl(''); setNewName('')
    setSaving(false)
    load()
  }

  async function removeCompetitor(url: string) {
    const updated = competitors.filter(c => c.url !== url)
    await fetch('/api/third-audience/benchmark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_competitors', competitors: updated }),
    })
    load()
  }

  async function submitTest() {
    if (!form.competitor_url || !form.test_prompt || !form.ai_platform) return
    setSubmitting(true)
    const comp = competitors.find(c => c.url === form.competitor_url)
    await fetch('/api/third-audience/benchmark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'record',
        record: {
          ...form,
          competitor_name: comp?.name ?? '',
          cited_rank: form.cited_rank ? Number(form.cited_rank) : null,
        },
      }),
    })
    setSubmitting(false)
    setSubmitOk(true)
    setForm(f => ({ ...f, test_prompt: '', cited_rank: '', test_notes: '' }))
    setTimeout(() => setSubmitOk(false), 3000)
    load()
  }

  async function deleteRow(id: number) {
    await fetch('/api/third-audience/benchmark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    load()
  }

  const citationBadge = (rate: number) => {
    const color = rate >= 60 ? '#16a34a' : rate >= 30 ? '#d97706' : '#dc2626'
    const bg = rate >= 60 ? '#dcfce7' : rate >= 30 ? '#fef3c7' : '#fee2e2'
    return <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>{rate}%</span>
  }

  return (
    <div className="ta-page">
      <div className="ta-page-header">
        <h1 className="ta-page-title">Competitor Benchmarking</h1>
        <p style={{ color: 'var(--ta-secondary)', fontSize: 14, margin: 0 }}>
          Track how often competitors are cited by AI platforms compared to your site
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--ta-border)', paddingBottom: 0 }}>
        {(['analytics', 'tests', 'add_test', 'manage'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--ta-accent)' : 'var(--ta-secondary)',
            borderBottom: tab === t ? '2px solid var(--ta-accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t === 'analytics' ? 'Analytics' : t === 'tests' ? 'Test Results' : t === 'add_test' ? 'Add Test' : 'Manage Competitors'}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      {loading && <div style={{ color: 'var(--ta-secondary)', fontSize: 14 }}>Loading…</div>}

      {/* ── Analytics tab ── */}
      {!loading && tab === 'analytics' && (
        <div>
          {competitors.length === 0 ? (
            <div className="ta-card">
              <div className="ta-card-body" style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ color: 'var(--ta-secondary)', marginBottom: 16 }}>No competitors added yet.</p>
                <button className="ta-btn ta-btn-primary" onClick={() => setTab('manage')}>Add competitors</button>
              </div>
            </div>
          ) : analytics && analytics.competitors.length > 0 ? (
            <>
              <div className="ta-card" style={{ marginBottom: 20 }}>
                <div className="ta-card-header"><h2 className="ta-card-title">Citation Rate by Competitor</h2></div>
                <div className="ta-card-body" style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--ta-surface)' }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Competitor</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Tests</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Cited</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Rate</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Avg Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.competitors.map(c => (
                        <tr key={c.url} style={{ borderTop: '1px solid var(--ta-border)' }}>
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ fontWeight: 500 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--ta-secondary)' }}>{c.url}</div>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>{c.total}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>{c.cited}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>{citationBadge(c.citationRate)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)' }}>
                            {c.avgRank !== null ? `#${c.avgRank}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ta-card">
                <div className="ta-card-header"><h2 className="ta-card-title">Citation Rate by Platform</h2></div>
                <div className="ta-card-body" style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--ta-surface)' }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Platform</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Tests</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Cited</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.platforms.map(p => (
                        <tr key={p.name} style={{ borderTop: '1px solid var(--ta-border)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 500 }}>{p.name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.total}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.cited}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>{citationBadge(p.citationRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="ta-card">
              <div className="ta-card-body" style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ color: 'var(--ta-secondary)', marginBottom: 16 }}>No test results yet. Add your first test result to see analytics.</p>
                <button className="ta-btn ta-btn-primary" onClick={() => setTab('add_test')}>Add test result</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Test results tab ── */}
      {!loading && tab === 'tests' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filterCompetitor} onChange={e => setFilterCompetitor(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)' }}>
              <option value="">All competitors</option>
              {competitors.map(c => <option key={c.url} value={c.url}>{c.name}</option>)}
            </select>
            <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)' }}>
              <option value="">All platforms</option>
              {ALL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ fontSize: 13, color: 'var(--ta-secondary)', alignSelf: 'center' }}>{total} results</span>
          </div>

          <div className="ta-card">
            <div className="ta-card-body" style={{ padding: 0 }}>
              {rows.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ta-secondary)', fontSize: 14 }}>No test results found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--ta-surface)' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Competitor</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Platform</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Prompt</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--ta-secondary)', fontWeight: 600 }}>Cited</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--ta-secondary)', fontWeight: 600 }}>Rank</th>
                      <th style={{ padding: '10px 16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--ta-border)' }}>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: 'var(--ta-secondary)' }}>{r.test_date}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 500 }}>{r.competitor_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ta-secondary)' }}>{r.competitor_url}</div>
                        </td>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>{r.ai_platform}</td>
                        <td style={{ padding: '10px 16px', maxWidth: 260 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.test_prompt}>{r.test_prompt}</div>
                          {r.test_notes && <div style={{ fontSize: 11, color: 'var(--ta-secondary)', marginTop: 2 }}>{r.test_notes}</div>}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {r.cited_rank !== null
                            ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>Yes</span>
                            : <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>No</span>}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--ta-secondary)' }}>
                          {r.cited_rank !== null ? `#${r.cited_rank}` : '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <button onClick={() => deleteRow(r.id)} className="ta-btn ta-btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add test tab ── */}
      {!loading && tab === 'add_test' && (
        <div className="ta-card" style={{ maxWidth: 640 }}>
          <div className="ta-card-header"><h2 className="ta-card-title">Record Test Result</h2></div>
          <div className="ta-card-body">
            <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 20 }}>
              Run the prompt manually in the AI platform, then record the result here.
            </p>

            {submitOk && (
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                Result recorded successfully.
              </div>
            )}

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Competitor *</label>
            <select value={form.competitor_url} onChange={e => setForm(f => ({ ...f, competitor_url: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', marginBottom: 16 }}>
              <option value="">Select competitor…</option>
              {competitors.map(c => <option key={c.url} value={c.url}>{c.name} ({c.url})</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>AI Platform *</label>
            <select value={form.ai_platform} onChange={e => setForm(f => ({ ...f, ai_platform: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', marginBottom: 16 }}>
              {ALL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Test Prompt *</label>
            <textarea value={form.test_prompt} onChange={e => setForm(f => ({ ...f, test_prompt: e.target.value }))}
              placeholder="e.g. What is the best tool for tracking AI citations?"
              rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Was competitor cited?</label>
                <select value={form.cited_rank} onChange={e => setForm(f => ({ ...f, cited_rank: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)' }}>
                  <option value="">Not cited</option>
                  <option value="1">Cited — rank #1</option>
                  <option value="2">Cited — rank #2</option>
                  <option value="3">Cited — rank #3</option>
                  <option value="4">Cited — rank #4</option>
                  <option value="5">Cited — rank #5</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Test Date *</label>
                <input type="date" value={form.test_date} onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', boxSizing: 'border-box' }} />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes</label>
            <input value={form.test_notes} onChange={e => setForm(f => ({ ...f, test_notes: e.target.value }))}
              placeholder="Optional notes about this test"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', boxSizing: 'border-box', marginBottom: 20 }} />

            <button className="ta-btn ta-btn-primary" onClick={submitTest}
              disabled={submitting || !form.competitor_url || !form.test_prompt}>
              {submitting ? 'Saving…' : 'Save result'}
            </button>
          </div>
        </div>
      )}

      {/* ── Manage competitors tab ── */}
      {!loading && tab === 'manage' && (
        <div style={{ maxWidth: 640 }}>
          <div className="ta-card" style={{ marginBottom: 20 }}>
            <div className="ta-card-header"><h2 className="ta-card-title">Add Competitor</h2></div>
            <div className="ta-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>URL *</label>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://competitor.com"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Competitor Name"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button className="ta-btn ta-btn-primary" onClick={addCompetitor} disabled={saving || !newUrl.trim() || !newName.trim()}>
                {saving ? 'Saving…' : 'Add competitor'}
              </button>
            </div>
          </div>

          <div className="ta-card">
            <div className="ta-card-header"><h2 className="ta-card-title">Competitors ({competitors.length})</h2></div>
            <div className="ta-card-body" style={{ padding: 0 }}>
              {competitors.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--ta-secondary)', fontSize: 14 }}>No competitors added yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <tbody>
                    {competitors.map(c => (
                      <tr key={c.url} style={{ borderTop: '1px solid var(--ta-border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--ta-secondary)' }}>{c.url}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => removeCompetitor(c.url)} className="ta-btn ta-btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
