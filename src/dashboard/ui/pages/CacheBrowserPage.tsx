'use client'

import { useState, useEffect, useCallback } from 'react'

interface CacheEntry {
  key: string
  etag: string
  cachedAt: number
  ttl: number
  size: number
  expired: boolean
  expiresAt: number
}

const PAGE_SIZE = 50

export function CacheBrowserPage() {
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/third-audience/cache-browser?${params}`)
      const data = await res.json() as { entries: CacheEntry[]; total: number }
      setEntries(data.entries ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [offset, search])

  useEffect(() => { load() }, [load])

  async function doAction(action: string, extra: Record<string, unknown> = {}) {
    setActionMsg(null)
    const res = await fetch('/api/third-audience/cache-browser', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    const data = await res.json() as { ok: boolean; deleted?: number }
    if (data.ok) {
      if (action === 'clear_expired') setActionMsg(`Cleared ${data.deleted ?? 0} expired entries`)
      else if (action === 'clear_all') setActionMsg('All cache entries cleared')
      else if (action === 'delete_key') setActionMsg('Entry deleted')
      load()
    }
  }

  function fmt(ms: number) {
    return new Date(ms).toLocaleString()
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const expiredCount = entries.filter(e => e.expired).length

  return (
    <div className="ta-page">
      <div className="ta-page-header">
        <h1 className="ta-page-title">Cache Browser</h1>
      </div>

      {/* Stats + bulk actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--ta-secondary)' }}>{total} cached entries</span>
        {expiredCount > 0 && (
          <span style={{ fontSize: 13, color: '#d97706', background: '#fef3c7', padding: '3px 10px', borderRadius: 9999 }}>
            {expiredCount} expired on this page
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="ta-btn ta-btn-secondary" onClick={() => doAction('clear_expired')} style={{ fontSize: 13 }}>
            Clear expired
          </button>
          <button className="ta-btn ta-btn-danger" onClick={() => {
            if (confirm('Clear ALL cached content? Pages will be re-fetched on next request.')) doAction('clear_all')
          }} style={{ fontSize: 13 }}>
            Clear all
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {actionMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setOffset(0) } }}
          placeholder="Search by URL key…"
          style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--ta-border)', borderRadius: 8, fontSize: 14, background: 'var(--ta-bg)' }}
        />
        <button className="ta-btn ta-btn-secondary" onClick={() => { setSearch(searchInput); setOffset(0) }}>Search</button>
        {search && (
          <button className="ta-btn ta-btn-secondary" onClick={() => { setSearch(''); setSearchInput(''); setOffset(0) }}>Clear</button>
        )}
      </div>

      <div className="ta-card">
        <div className="ta-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ta-secondary)', fontSize: 14 }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ta-secondary)', fontSize: 14 }}>
              {search ? 'No entries match your search.' : 'Cache is empty.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--ta-surface)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>URL / Key</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ta-secondary)', fontWeight: 600 }}>Size</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Cached</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--ta-secondary)', fontWeight: 600 }}>Expires</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--ta-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.key} style={{ borderTop: '1px solid var(--ta-border)', background: e.expired ? '#fffbeb' : undefined }}>
                    <td style={{ padding: '10px 16px', maxWidth: 320 }}>
                      <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{e.key}</code>
                      {e.etag && <div style={{ fontSize: 11, color: 'var(--ta-secondary)', marginTop: 2 }}>ETag: {e.etag}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--ta-secondary)' }}>
                      {fmtSize(e.size)}
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: 'var(--ta-secondary)', fontSize: 12 }}>
                      {fmt(e.cachedAt)}
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: 'var(--ta-secondary)', fontSize: 12 }}>
                      {fmt(e.expiresAt)}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      {e.expired
                        ? <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>Expired</span>
                        : <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>Fresh</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button onClick={() => doAction('delete_key', { key: e.key })}
                        className="ta-btn ta-btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
          <button className="ta-btn ta-btn-secondary" onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))} disabled={offset === 0} style={{ fontSize: 13 }}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--ta-secondary)' }}>Page {currentPage} of {totalPages}</span>
          <button className="ta-btn ta-btn-secondary" onClick={() => setOffset(o => o + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total} style={{ fontSize: 13 }}>Next →</button>
        </div>
      )}
    </div>
  )
}
