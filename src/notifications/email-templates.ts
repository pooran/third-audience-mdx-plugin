// All emails use inline styles for maximum email client compatibility.

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
  .header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
  .body { padding: 32px; }
  .metric-grid { display: flex; gap: 16px; margin: 24px 0; }
  .metric { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .metric .value { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; }
  .metric .label { font-size: 12px; color: #64748b; margin: 4px 0 0; }
  .section-title { font-size: 14px; font-weight: 600; color: #374151; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  table.data { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.data th { text-align: left; padding: 8px 12px; background: #f8fafc; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
  table.data td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
  table.data tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-orange { background: #ffedd5; color: #9a3412; }
  .badge-purple { background: #ede9fe; color: #5b21b6; }
  .alert-box { padding: 16px; border-radius: 8px; margin: 16px 0; }
  .alert-box.info { background: #eff6ff; border-left: 4px solid #3b82f6; }
  .alert-box.success { background: #f0fdf4; border-left: 4px solid #22c55e; }
  .alert-box.warning { background: #fffbeb; border-left: 4px solid #f59e0b; }
  .alert-box p { margin: 0; font-size: 14px; color: #374151; }
  .bar-container { background: #f1f5f9; border-radius: 4px; height: 6px; width: 100%; }
  .bar { height: 6px; border-radius: 4px; background: #3b82f6; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
  .footer a { color: #64748b; }
`

function shell(title: string, subtitle: string, body: string, siteUrl = ''): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${BASE_STYLES}</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Third Audience</h1>
    <p>${title}</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>Sent by <a href="https://github.com/pooran/third-audience-mdx">third-audience-mdx</a>${siteUrl ? ` · <a href="${siteUrl}">${siteUrl}</a>` : ''}</p>
  </div>
</div>
</body>
</html>`
}

// ── Alert emails ────────────────────────────────────────────────────────────

export function firstBotVisitEmail(opts: {
  botName: string
  url: string
  country: string | null
  siteUrl?: string
}): { subject: string; html: string } {
  return {
    subject: `🤖 First bot visit — ${opts.botName}`,
    html: shell(
      'First Bot Visit Detected',
      '',
      `<div class="alert-box success">
        <p><strong>${opts.botName}</strong> just visited your site for the first time.</p>
      </div>
      <table class="data">
        <tr><th>Bot</th><td>${opts.botName}</td></tr>
        <tr><th>Page</th><td><code>${opts.url}</code></td></tr>
        ${opts.country ? `<tr><th>Country</th><td>${opts.country}</td></tr>` : ''}
      </table>`,
      opts.siteUrl,
    ),
  }
}

export function firstCitationEmail(opts: {
  platform: string
  url: string
  query: string | null
  siteUrl?: string
}): { subject: string; html: string } {
  return {
    subject: `🎉 First citation from ${opts.platform}!`,
    html: shell(
      'First AI Citation',
      '',
      `<div class="alert-box success">
        <p>Your content was cited by <strong>${opts.platform}</strong> for the first time!</p>
      </div>
      <table class="data">
        <tr><th>Platform</th><td>${opts.platform}</td></tr>
        <tr><th>Page Cited</th><td><code>${opts.url}</code></td></tr>
        ${opts.query ? `<tr><th>Search Query</th><td>"${opts.query}"</td></tr>` : ''}
      </table>`,
      opts.siteUrl,
    ),
  }
}

export function newPlatformEmail(opts: {
  platform: string
  url: string
  siteUrl?: string
}): { subject: string; html: string } {
  return {
    subject: `🆕 New AI platform citing you — ${opts.platform}`,
    html: shell(
      'New Platform Detected',
      '',
      `<div class="alert-box info">
        <p><strong>${opts.platform}</strong> is now citing your content.</p>
      </div>
      <table class="data">
        <tr><th>Platform</th><td>${opts.platform}</td></tr>
        <tr><th>First Page</th><td><code>${opts.url}</code></td></tr>
      </table>`,
      opts.siteUrl,
    ),
  }
}

export function citationSpikeEmail(opts: {
  platform: string
  count: number
  baseline: number
  url?: string
  siteUrl?: string
}): { subject: string; html: string } {
  return {
    subject: `📈 Citation spike from ${opts.platform} — ${opts.count}x in last hour`,
    html: shell(
      'Citation Spike Detected',
      '',
      `<div class="alert-box warning">
        <p>Unusual citation activity detected from <strong>${opts.platform}</strong>.</p>
      </div>
      <table class="data">
        <tr><th>Platform</th><td>${opts.platform}</td></tr>
        <tr><th>Last Hour</th><td><strong>${opts.count}</strong> citations</td></tr>
        <tr><th>Baseline</th><td>${Math.round(opts.baseline)}/hr</td></tr>
        ${opts.url ? `<tr><th>Top Page</th><td><code>${opts.url}</code></td></tr>` : ''}
      </table>`,
      opts.siteUrl,
    ),
  }
}

// ── Digest email ────────────────────────────────────────────────────────────

export interface DigestData {
  period: 'daily' | 'weekly'
  dateRange: string
  visits: {
    total: number
    uniqueBots: number
    avgResponseMs: number | null
    cacheHitRate: number | null
    topBots: Array<{ name: string; visits: number }>
    topPages: Array<{ url: string; visits: number }>
    visitsByDay: Array<{ date: string; visits: number }>
  }
  citations: {
    total: number
    platforms: Array<{ name: string; count: number }>
    topPages: Array<{ url: string; count: number }>
  }
  siteUrl?: string
}

function sparkline(data: Array<{ date: string; visits: number }>): string {
  if (data.length === 0) return ''
  const max = Math.max(...data.map(d => d.visits), 1)
  const bars = data.slice(-14).map(d => {
    const pct = Math.round((d.visits / max) * 100)
    const color = pct > 66 ? '#3b82f6' : pct > 33 ? '#93c5fd' : '#dbeafe'
    return `<td style="vertical-align:bottom;padding:0 1px;width:${Math.floor(280 / Math.min(data.length, 14))}px">
      <div title="${d.date}: ${d.visits}" style="height:${Math.max(4, Math.round(pct * 0.4))}px;background:${color};border-radius:2px 2px 0 0"></div>
      </td>`
  }).join('')
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr>${bars}</tr></table>`
}

export function digestEmail(data: DigestData): { subject: string; html: string } {
  const label = data.period === 'daily' ? 'Daily Digest' : 'Weekly Digest'
  const icon = data.period === 'daily' ? '📊' : '📈'

  const platformBadgeColor = (name: string): string => {
    const colors: Record<string, string> = {
      ChatGPT: 'badge-green', Perplexity: 'badge-blue', Claude: 'badge-orange',
      Gemini: 'badge-blue', Copilot: 'badge-blue', 'You.com': 'badge-purple',
    }
    return colors[name] ?? 'badge-blue'
  }

  const topBotsRows = data.visits.topBots.slice(0, 5).map(b => {
    const pct = data.visits.total > 0 ? Math.round((b.visits / data.visits.total) * 100) : 0
    return `<tr>
      <td>${b.name}</td>
      <td>${b.visits.toLocaleString()}</td>
      <td style="width:120px">
        <div class="bar-container"><div class="bar" style="width:${pct}%"></div></div>
      </td>
      <td style="color:#64748b;font-size:12px">${pct}%</td>
    </tr>`
  }).join('')

  const topPagesRows = data.visits.topPages.slice(0, 5).map(p =>
    `<tr><td><code style="font-size:12px">${p.url}</code></td><td>${p.visits.toLocaleString()}</td></tr>`,
  ).join('')

  const platformRows = data.citations.platforms.slice(0, 5).map(p => {
    const pct = data.citations.total > 0 ? Math.round((p.count / data.citations.total) * 100) : 0
    return `<tr>
      <td><span class="badge ${platformBadgeColor(p.name)}">${p.name}</span></td>
      <td>${p.count.toLocaleString()}</td>
      <td style="width:120px">
        <div class="bar-container"><div class="bar" style="width:${pct}%;background:#8b5cf6"></div></div>
      </td>
      <td style="color:#64748b;font-size:12px">${pct}%</td>
    </tr>`
  }).join('')

  const cacheRate = data.visits.cacheHitRate !== null
    ? `${Math.round(data.visits.cacheHitRate * 100)}%` : '—'
  const avgMs = data.visits.avgResponseMs !== null
    ? `${Math.round(data.visits.avgResponseMs)}ms` : '—'

  const body = `
    <p style="color:#64748b;font-size:14px;margin:0 0 24px">${data.dateRange}</p>

    <!-- Hero metrics -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:0 8px 0 0;width:25%">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#0f172a">${data.visits.total.toLocaleString()}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Bot Visits</div>
          </div>
        </td>
        <td style="padding:0 8px;width:25%">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#0f172a">${data.citations.total.toLocaleString()}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">AI Citations</div>
          </div>
        </td>
        <td style="padding:0 8px;width:25%">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#0f172a">${data.visits.uniqueBots}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Unique Bots</div>
          </div>
        </td>
        <td style="padding:0 0 0 8px;width:25%">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#0f172a">${cacheRate}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Cache Rate</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Visits sparkline -->
    <div class="section-title">Visits (last ${Math.min(data.visits.visitsByDay.length, 14)} days)</div>
    ${sparkline(data.visits.visitsByDay)}

    <!-- Top bots -->
    ${data.visits.topBots.length > 0 ? `
    <div class="section-title">Top Crawlers</div>
    <table class="data">
      <thead><tr><th>Bot</th><th>Visits</th><th colspan="2">Share</th></tr></thead>
      <tbody>${topBotsRows}</tbody>
    </table>` : ''}

    <!-- Top pages by visits -->
    ${data.visits.topPages.length > 0 ? `
    <div class="section-title">Most Crawled Pages</div>
    <table class="data">
      <thead><tr><th>Page</th><th>Visits</th></tr></thead>
      <tbody>${topPagesRows}</tbody>
    </table>` : ''}

    <!-- Citation platforms -->
    ${data.citations.total > 0 ? `
    <div class="section-title">AI Citations by Platform</div>
    <table class="data">
      <thead><tr><th>Platform</th><th>Citations</th><th colspan="2">Share</th></tr></thead>
      <tbody>${platformRows}</tbody>
    </table>` : `
    <div class="alert-box info" style="margin-top:24px">
      <p>No AI citations recorded in this period. Make sure <code>citation-tracker.js</code> is loaded on your pages.</p>
    </div>`}

    ${data.visits.avgResponseMs !== null ? `
    <p style="font-size:13px;color:#64748b;margin-top:24px">Avg response time: <strong>${avgMs}</strong></p>` : ''}
  `

  return {
    subject: `${icon} ${label} — ${data.visits.total} bot visits, ${data.citations.total} citations`,
    html: shell(label, data.dateRange, body, data.siteUrl),
  }
}
