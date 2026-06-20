'use client'

import { useState } from 'react'

interface SettingsPageProps {
  maskedKey: string | null
}

export function SettingsPage({ maskedKey: initialMasked }: SettingsPageProps) {
  const [masked, setMasked] = useState(initialMasked)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRotate() {
    if (!confirm('Rotate the API key? All existing integrations using the current key will stop working immediately.')) return
    setRotating(true)
    setError(null)
    setRevealed(null)
    try {
      const res = await fetch('/api/third-audience/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate' }),
      })
      const data = await res.json() as { key?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRevealed(data.key ?? null)
      setMasked(null) // hide masked while showing full key
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setRotating(false)
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed — please copy manually.')
    }
  }

  return (
    <div className="ta-page">
      <div className="ta-page-header">
        <h1 className="ta-page-title">Settings</h1>
      </div>

      {/* API Key section — mirrors WP plugin's settings page */}
      <div className="ta-card" style={{ maxWidth: 640 }}>
        <div className="ta-card-header">
          <h2 className="ta-card-title">API Key</h2>
        </div>
        <div className="ta-card-body">
          <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 20 }}>
            Use this key to authenticate headless or external API calls via the{' '}
            <code>X-TA-Api-Key</code> request header. Keep it secret.
          </p>

          {/* Revealed key (shown once after rotate) */}
          {revealed && (
            <div style={{
              background: '#f0fff4',
              border: '1.5px solid #34c759',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a7f37', marginBottom: 8 }}>
                New API key — copy it now, it will not be shown again
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <code style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  wordBreak: 'break-all',
                  background: '#fff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d2d2d7',
                }}>{revealed}</code>
                <button
                  className="ta-btn ta-btn-secondary"
                  onClick={() => handleCopy(revealed)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Masked key display */}
          {!revealed && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <input
                readOnly
                value={masked ?? '(no key generated)'}
                style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  padding: '9px 12px',
                  border: '1.5px solid #d2d2d7',
                  borderRadius: 10,
                  background: '#f5f5f7',
                  color: '#1d1d1f',
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: '#fff2f2',
              border: '1px solid #ffbaba',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#c0392b',
              marginBottom: 16,
            }}>{error}</div>
          )}

          <button
            className="ta-btn ta-btn-danger"
            onClick={handleRotate}
            disabled={rotating}
          >
            {rotating ? 'Rotating…' : 'Rotate API key'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--ta-secondary)', marginTop: 10 }}>
            Rotating generates a new key immediately. The old key stops working at once.
          </p>
        </div>
      </div>

      {/* Usage example */}
      <div className="ta-card" style={{ maxWidth: 640, marginTop: 20 }}>
        <div className="ta-card-header">
          <h2 className="ta-card-title">Usage</h2>
        </div>
        <div className="ta-card-body">
          <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 12 }}>
            Include the key in the <code>X-TA-Api-Key</code> header on any API request:
          </p>
          <pre style={{
            background: '#1d1d1f',
            color: '#f5f5f7',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 13,
            overflowX: 'auto',
          }}>{`curl https://yoursite.com/api/third-audience/analytics \\
  -H "X-TA-Api-Key: ta_your_key_here"`}</pre>
          <p style={{ fontSize: 13, color: 'var(--ta-secondary)', marginTop: 12 }}>
            Or use <code>Authorization: Bearer ta_your_key_here</code> if your HTTP client
            does not support custom headers.
          </p>
        </div>
      </div>

      {/* Change password */}
      <div className="ta-card" style={{ maxWidth: 640, marginTop: 20 }}>
        <div className="ta-card-header">
          <h2 className="ta-card-title">Dashboard password</h2>
        </div>
        <div className="ta-card-body">
          <p style={{ fontSize: 14, color: 'var(--ta-secondary)', marginBottom: 16 }}>
            Change the password used to log in to this dashboard.
          </p>
          <a href="/third-audience/login?reset=1" className="ta-btn ta-btn-secondary">
            Change password
          </a>
        </div>
      </div>
    </div>
  )
}
