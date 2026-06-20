'use client'
import { useState } from 'react'
import { Card } from '../components/Card.js'
import { KNOWN_BOTS } from '../../../detection/known-patterns.js'

interface BotConfig {
  allowlist: string[]
  blocklist: string[]
  track_unknown: boolean
}

interface BotManagementPageProps {
  config: BotConfig
}

export function BotManagementPage({ config }: BotManagementPageProps) {
  const [allowlist, setAllowlist] = useState(config.allowlist)
  const [blocklist, setBlocklist] = useState(config.blocklist)
  const [trackUnknown, setTrackUnknown] = useState(config.track_unknown)
  const [newAllow, setNewAllow] = useState('')
  const [newBlock, setNewBlock] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/third-audience/bots-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowlist, blocklist, track_unknown: trackUnknown }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const AI_CRAWLERS = KNOWN_BOTS.filter(b => b.category === 'ai_crawler')
  const SEARCH_ENGINES = KNOWN_BOTS.filter(b => b.category === 'search_engine')

  return (
    <div>
      <h1 className="ta-page-title">Bot Management</h1>
      <p className="ta-page-subtitle">Configure which bots to track or block</p>

      {/* Known bots reference */}
      <Card title="Known AI Crawlers">
        <table className="ta-table">
          <thead><tr><th>Bot</th><th>User-Agent Pattern</th><th>Category</th></tr></thead>
          <tbody>
            {AI_CRAWLERS.map(b => (
              <tr key={b.name}>
                <td><strong>{b.name}</strong></td>
                <td><code>{b.patterns[0].source}</code></td>
                <td><span className="ta-badge ta-badge--blue">AI Crawler</span></td>
              </tr>
            ))}
            {SEARCH_ENGINES.map(b => (
              <tr key={b.name}>
                <td><strong>{b.name}</strong></td>
                <td><code>{b.patterns[0].source}</code></td>
                <td><span className="ta-badge ta-badge--gray">Search Engine</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Allowlist */}
      <Card title="Allowlist" action={
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newAllow}
            onChange={e => setNewAllow(e.target.value)}
            placeholder="Bot name or UA pattern"
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--ta-gray-200)', fontSize: 13, width: 200 }}
          />
          <button className="ta-btn ta-btn--primary" onClick={() => { if (newAllow) { setAllowlist(l => [...l, newAllow]); setNewAllow('') } }}>
            Add
          </button>
        </div>
      }>
        {allowlist.length === 0 ? (
          <p style={{ color: 'var(--ta-gray-500)', fontSize: 13 }}>No overrides. All detected bots are tracked.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allowlist.map(name => (
              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,199,89,0.1)', borderRadius: 6, padding: '4px 10px', fontSize: 13 }}>
                <span className="ta-dot ta-dot--green" />
                {name}
                <button onClick={() => setAllowlist(l => l.filter(x => x !== name))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ta-gray-500)', marginLeft: 4 }}>×</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Blocklist */}
      <Card title="Blocklist" action={
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newBlock}
            onChange={e => setNewBlock(e.target.value)}
            placeholder="Bot name or UA pattern"
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--ta-gray-200)', fontSize: 13, width: 200 }}
          />
          <button className="ta-btn ta-btn--danger" onClick={() => { if (newBlock) { setBlocklist(l => [...l, newBlock]); setNewBlock('') } }}>
            Block
          </button>
        </div>
      }>
        {blocklist.length === 0 ? (
          <p style={{ color: 'var(--ta-gray-500)', fontSize: 13 }}>No blocked bots.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {blocklist.map(name => (
              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,59,48,0.1)', borderRadius: 6, padding: '4px 10px', fontSize: 13 }}>
                <span className="ta-dot ta-dot--red" />
                {name}
                <button onClick={() => setBlocklist(l => l.filter(x => x !== name))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ta-gray-500)', marginLeft: 4 }}>×</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Track unknown */}
      <Card title="Unknown Bots">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={trackUnknown}
            onChange={e => setTrackUnknown(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span>Track unknown bots (bots detected by heuristics, not in the known list)</span>
        </label>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="ta-btn ta-btn--primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>
        {saved && <span style={{ color: 'var(--ta-green)', fontSize: 13 }}>✓ Saved</span>}
      </div>
    </div>
  )
}
