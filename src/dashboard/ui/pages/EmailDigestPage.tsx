'use client'

import { useState, useEffect } from 'react'

interface DigestStatus {
  lastSent: { daily: string | null; weekly: string | null }
}

export function EmailDigestPage() {
  const [status, setStatus] = useState<DigestStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<'daily' | 'weekly' | null>(null)
  const [result, setResult] = useState<{ ok: boolean; sent?: boolean; reason?: string; error?: string } | null>(null)

  async function loadStatus() {
    try {
      const res = await fetch('/api/third-audience/digest')
      const data = await res.json() as DigestStatus
      setStatus(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { loadStatus() }, [])

  async function send(period: 'daily' | 'weekly', force = false) {
    setSending(period)
    setResult(null)
    try {
      const res = await fetch('/api/third-audience/digest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, force }),
      })
      const data = await res.json() as typeof result
      setResult(data)
      loadStatus()
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Failed' })
    } finally {
      setSending(null)
    }
  }

  function fmt(iso: string | null) {
    if (!iso) return 'Never'
    return new Date(iso).toLocaleString()
  }

  return (
    <div className="ta-page">
      <div className="ta-page-header">
        <h1 className="ta-page-title">Email Digest</h1>
        <p style={{ color: 'var(--ta-secondary)', fontSize: 14, margin: 0 }}>
          Trigger digest emails manually or review last-sent timestamps
        </p>
      </div>

      {result && (
        <div style={{
          background: result.ok && result.sent ? '#dcfce7' : result.ok && !result.sent ? '#fef3c7' : '#fee2e2',
          color: result.ok && result.sent ? '#16a34a' : result.ok && !result.sent ? '#d97706' : '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 14,
        }}>
          {result.error ?? (result.sent ? 'Digest sent successfully.' : `Skipped: ${result.reason}`)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 800 }}>
        {/* Daily */}
        <div className="ta-card">
          <div className="ta-card-header">
            <h2 className="ta-card-title">Daily Digest</h2>
          </div>
          <div className="ta-card-body">
            <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 4 }}>Last sent:</p>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>
              {loading ? '…' : fmt(status?.lastSent.daily ?? null)}
            </p>
            <p style={{ fontSize: 13, color: 'var(--ta-secondary)', marginBottom: 16 }}>
              Covers the last 24 hours of bot visits and AI citations.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ta-btn ta-btn-primary" onClick={() => send('daily')}
                disabled={sending !== null} style={{ flex: 1 }}>
                {sending === 'daily' ? 'Sending…' : 'Send now'}
              </button>
              <button className="ta-btn ta-btn-secondary" onClick={() => send('daily', true)}
                disabled={sending !== null} title="Force send even if recently sent">
                Force
              </button>
            </div>
          </div>
        </div>

        {/* Weekly */}
        <div className="ta-card">
          <div className="ta-card-header">
            <h2 className="ta-card-title">Weekly Digest</h2>
          </div>
          <div className="ta-card-body">
            <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 4 }}>Last sent:</p>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>
              {loading ? '…' : fmt(status?.lastSent.weekly ?? null)}
            </p>
            <p style={{ fontSize: 13, color: 'var(--ta-secondary)', marginBottom: 16 }}>
              Covers the last 7 days with trend charts and platform breakdowns.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ta-btn ta-btn-primary" onClick={() => send('weekly')}
                disabled={sending !== null} style={{ flex: 1 }}>
                {sending === 'weekly' ? 'Sending…' : 'Send now'}
              </button>
              <button className="ta-btn ta-btn-secondary" onClick={() => send('weekly', true)}
                disabled={sending !== null} title="Force send even if recently sent">
                Force
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Config reminder */}
      <div className="ta-card" style={{ maxWidth: 800, marginTop: 24 }}>
        <div className="ta-card-header"><h2 className="ta-card-title">Configuration</h2></div>
        <div className="ta-card-body">
          <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 16 }}>
            Emails require either a Brevo API key or SMTP credentials in your environment:
          </p>
          <pre style={{
            background: '#1d1d1f', color: '#f5f5f7', borderRadius: 10,
            padding: '14px 16px', fontSize: 13, overflowX: 'auto',
          }}>{`# Option A — Brevo transactional API
TA_BREVO_API_KEY=your-api-key

# Option B — SMTP (works with Brevo relay or any provider)
TA_SMTP_HOST=smtp-relay.brevo.com
TA_SMTP_PORT=587
TA_SMTP_USER=your-login
TA_SMTP_PASS=your-password

# Required for both
TA_NOTIFY_TO=you@example.com
TA_NOTIFY_FROM=Third Audience <alerts@yourdomain.com>`}</pre>

          <p style={{ fontSize: 13, color: 'var(--ta-secondary)', marginTop: 16 }}>
            To automate digests, add a cron job to <code>vercel.json</code>:
          </p>
          <pre style={{
            background: '#1d1d1f', color: '#f5f5f7', borderRadius: 10,
            padding: '14px 16px', fontSize: 13, overflowX: 'auto', marginTop: 8,
          }}>{`{
  "crons": [
    { "path": "/api/third-audience/digest", "schedule": "0 8 * * *" }
  ]
}`}</pre>
        </div>
      </div>
    </div>
  )
}
