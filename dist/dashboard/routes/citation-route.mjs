// src/dashboard/routes/citation-route.ts
import { NextResponse } from "next/server";

// src/storage/postgres-store.ts
import { Client } from "pg";
var _client = null;
async function getClient() {
  if (_client) return _client;
  const url = process.env.TA_STORAGE_URL;
  if (!url) throw new Error("TA_STORAGE_URL is required for postgres/supabase storage");
  const sslUrl = url.replace(/[?&]sslmode=[^&]*/g, "");
  _client = new Client({ connectionString: sslUrl, ssl: { rejectUnauthorized: false } });
  await _client.connect();
  await migrate(_client);
  return _client;
}
async function migrate(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ta_admin (
      id                  INTEGER PRIMARY KEY,
      password_hash       TEXT    NOT NULL,
      is_default_password BOOLEAN NOT NULL DEFAULT TRUE,
      created_at          TEXT    NOT NULL,
      last_login_at       TEXT,
      api_key             TEXT
    );
    CREATE TABLE IF NOT EXISTS ta_bots_config (
      id            INTEGER PRIMARY KEY,
      allowlist     TEXT    NOT NULL DEFAULT '[]',
      blocklist     TEXT    NOT NULL DEFAULT '[]',
      track_unknown BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS ta_visits (
      id               SERIAL PRIMARY KEY,
      timestamp        TEXT    NOT NULL,
      bot_name         TEXT,
      bot_category     TEXT    NOT NULL,
      detection_method TEXT    NOT NULL,
      confidence       TEXT    NOT NULL,
      url              TEXT    NOT NULL,
      ip               TEXT    NOT NULL,
      country          TEXT,
      user_agent       TEXT    NOT NULL,
      referer          TEXT,
      response_ms      INTEGER,
      cache_hit        BOOLEAN NOT NULL DEFAULT FALSE,
      content_length   INTEGER
    );
    CREATE INDEX IF NOT EXISTS ta_visits_timestamp_idx ON ta_visits (timestamp);
    CREATE TABLE IF NOT EXISTS ta_citations (
      id          SERIAL PRIMARY KEY,
      timestamp   TEXT    NOT NULL,
      platform    TEXT    NOT NULL,
      query       TEXT,
      url         TEXT    NOT NULL,
      ip          TEXT    NOT NULL,
      user_agent  TEXT    NOT NULL,
      referer     TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ta_citations_timestamp_idx ON ta_citations (timestamp);
    CREATE INDEX IF NOT EXISTS ta_citations_platform_idx  ON ta_citations (platform);
    CREATE TABLE IF NOT EXISTS ta_cache (
      key       TEXT    PRIMARY KEY,
      content   TEXT    NOT NULL,
      etag      TEXT    NOT NULL DEFAULT '',
      cached_at BIGINT  NOT NULL,
      ttl       INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ta_kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
var PostgresStore = class {
  constructor() {
    this.clientPromise = getClient();
  }
  async q(sql, params = []) {
    const client = await this.clientPromise;
    return client.query(sql, params);
  }
  async getAdmin() {
    const { rows } = await this.q("SELECT * FROM ta_admin WHERE id = 1");
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      passwordHash: r.password_hash,
      isDefaultPassword: r.is_default_password,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at ?? null,
      apiKey: r.api_key ?? void 0
    };
  }
  async saveAdmin(record) {
    await this.q(`
      INSERT INTO ta_admin (id, password_hash, is_default_password, created_at, last_login_at, api_key)
      VALUES (1, $1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        password_hash       = EXCLUDED.password_hash,
        is_default_password = EXCLUDED.is_default_password,
        created_at          = EXCLUDED.created_at,
        last_login_at       = EXCLUDED.last_login_at,
        api_key             = EXCLUDED.api_key
    `, [record.passwordHash, record.isDefaultPassword, record.createdAt, record.lastLoginAt, record.apiKey ?? null]);
  }
  async getBotsConfig() {
    const { rows } = await this.q("SELECT * FROM ta_bots_config WHERE id = 1");
    if (!rows[0]) return { allowlist: [], blocklist: [], track_unknown: true };
    const r = rows[0];
    return {
      allowlist: JSON.parse(r.allowlist),
      blocklist: JSON.parse(r.blocklist),
      track_unknown: r.track_unknown
    };
  }
  async saveBotsConfig(config) {
    await this.q(`
      INSERT INTO ta_bots_config (id, allowlist, blocklist, track_unknown)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        allowlist     = EXCLUDED.allowlist,
        blocklist     = EXCLUDED.blocklist,
        track_unknown = EXCLUDED.track_unknown
    `, [JSON.stringify(config.allowlist), JSON.stringify(config.blocklist), config.track_unknown]);
  }
  async appendVisit(r) {
    await this.q(`
      INSERT INTO ta_visits (timestamp, bot_name, bot_category, detection_method, confidence, url, ip, country, user_agent, referer, response_ms, cache_hit, content_length)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [r.timestamp, r.bot_name, r.bot_category, r.detection_method, r.confidence, r.url, r.ip, r.country, r.user_agent, r.referer, r.response_ms, r.cache_hit, r.content_length]);
  }
  async getVisits(sinceIso) {
    const { rows } = await this.q("SELECT * FROM ta_visits WHERE timestamp >= $1 ORDER BY timestamp", [sinceIso]);
    return rows.map((r) => ({
      timestamp: r.timestamp,
      bot_name: r.bot_name,
      bot_category: r.bot_category,
      detection_method: r.detection_method,
      confidence: r.confidence,
      url: r.url,
      ip: r.ip,
      country: r.country,
      user_agent: r.user_agent,
      referer: r.referer,
      response_ms: r.response_ms,
      cache_hit: r.cache_hit,
      content_length: r.content_length
    }));
  }
  async appendCitation(r) {
    await this.q(`
      INSERT INTO ta_citations (timestamp, platform, query, url, ip, user_agent, referer)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [r.timestamp, r.platform, r.query, r.url, r.ip, r.user_agent, r.referer]);
  }
  async getCitations(sinceIso) {
    const { rows } = await this.q("SELECT * FROM ta_citations WHERE timestamp >= $1 ORDER BY timestamp", [sinceIso]);
    return rows;
  }
  async getAllCitations() {
    const { rows } = await this.q("SELECT * FROM ta_citations ORDER BY timestamp");
    return rows;
  }
  async getCache(key) {
    const { rows } = await this.q("SELECT * FROM ta_cache WHERE key = $1", [key]);
    if (!rows[0]) return null;
    return { content: rows[0].content, etag: rows[0].etag, cachedAt: Number(rows[0].cached_at), ttl: rows[0].ttl };
  }
  async setCache(key, entry) {
    await this.q(`
      INSERT INTO ta_cache (key, content, etag, cached_at, ttl)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content, etag = EXCLUDED.etag, cached_at = EXCLUDED.cached_at, ttl = EXCLUDED.ttl
    `, [key, entry.content, entry.etag, entry.cachedAt, entry.ttl]);
  }
  async deleteCache(keyPrefix) {
    await this.q("DELETE FROM ta_cache WHERE key LIKE $1", [keyPrefix + "%"]);
  }
  async getKv(key) {
    const { rows } = await this.q("SELECT value FROM ta_kv WHERE key = $1", [key]);
    return rows[0]?.value ?? null;
  }
  async setKv(key, value) {
    await this.q("INSERT INTO ta_kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [key, value]);
  }
};

// src/storage/get-store.ts
var _store = null;
function getStore() {
  if (_store) return _store;
  _store = new PostgresStore();
  return _store;
}

// src/citations/citation-tracker.ts
var AI_PLATFORMS = [
  // --- ChatGPT / OpenAI ---
  // Since Jun 2025 ChatGPT uses utm_source=chatgpt.com instead of referrer
  {
    name: "ChatGPT",
    test: (ref) => /openai\.com|chatgpt\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Perplexity ---
  {
    name: "Perplexity",
    test: (ref) => /perplexity\.ai/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Claude (Anthropic) ---
  // Claude often doesn't send a referrer — detected via UTM or absence heuristic
  {
    name: "Claude",
    test: (ref) => /claude\.ai|anthropic\.com/i.test(ref),
    extractQuery: () => null
  },
  // --- Gemini / Bard ---
  {
    name: "Gemini",
    test: (ref) => /gemini\.google\.com|bard\.google\.com/i.test(ref),
    extractQuery: () => null
  },
  // --- Microsoft Copilot (NOT Bing Search) ---
  // copilot.microsoft.com is AI; www.bing.com/search is organic search
  {
    name: "Copilot",
    test: (ref) => /copilot\.microsoft\.com/i.test(ref) || /bing\.com\/chat/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- You.com ---
  {
    name: "You.com",
    test: (ref) => /you\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Phind ---
  {
    name: "Phind",
    test: (ref) => /phind\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Kagi ---
  {
    name: "Kagi",
    test: (ref) => /kagi\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- SearchGPT / OpenAI Search ---
  {
    name: "SearchGPT",
    test: (ref) => /search\.openai\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Grok (xAI) ---
  {
    name: "Grok",
    test: (ref) => /grok\.x\.ai|x\.ai\/grok/i.test(ref),
    extractQuery: () => null
  },
  // --- Bing AI in new Bing (distinguished from organic by /search path absence) ---
  // bing.com/search = organic, already excluded above; other bing paths may be AI
  {
    name: "Bing AI",
    test: (ref) => {
      if (!/bing\.com/i.test(ref)) return false;
      try {
        const u = new URL(ref);
        return !u.pathname.startsWith("/search");
      } catch {
        return false;
      }
    },
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Poe (AI aggregator) ---
  {
    name: "Poe",
    test: (ref) => /poe\.com/i.test(ref),
    extractQuery: () => null
  },
  // --- Character.AI ---
  {
    name: "Character.AI",
    test: (ref) => /character\.ai/i.test(ref),
    extractQuery: () => null
  },
  // --- Mistral Le Chat ---
  {
    name: "Mistral",
    test: (ref) => /mistral\.ai|chat\.mistral\.ai/i.test(ref),
    extractQuery: () => null
  },
  // --- Meta AI ---
  {
    name: "Meta AI",
    test: (ref) => /meta\.ai|ai\.meta\.com/i.test(ref),
    extractQuery: () => null
  },
  // --- HuggingChat ---
  {
    name: "HuggingChat",
    test: (ref) => /huggingface\.co\/chat/i.test(ref),
    extractQuery: () => null
  },
  // --- Brave Leo ---
  {
    name: "Brave Leo",
    test: (ref) => /search\.brave\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- DuckDuckGo AI ---
  {
    name: "DuckDuckGo AI",
    test: (ref) => /duckduckgo\.com/i.test(ref) && /duckai|ai_/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  },
  // --- Liner AI ---
  {
    name: "Liner",
    test: (ref) => /liner\.app/i.test(ref),
    extractQuery: () => null
  },
  // --- Andi Search ---
  {
    name: "Andi",
    test: (ref) => /andisearch\.com/i.test(ref),
    extractQuery: (url) => url.searchParams.get("q")
  }
];
function detectAiPlatform(referer, utmSource) {
  if (!referer && utmSource && /chatgpt/i.test(utmSource)) {
    return { platform: "ChatGPT", query: null };
  }
  if (!referer && utmSource && /claude|anthropic/i.test(utmSource)) {
    return { platform: "Claude", query: null };
  }
  if (!referer) return null;
  let url;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }
  for (const p of AI_PLATFORMS) {
    if (p.test(referer, url)) {
      const query = p.extractQuery ? p.extractQuery(url) : null;
      return { platform: p.name, query };
    }
  }
  return null;
}
var CitationTracker = class {
  record(req) {
    const referer = req.headers.get("referer") ?? "";
    const utmSource = req.nextUrl.searchParams.get("utm_source");
    const detection = detectAiPlatform(referer, utmSource);
    if (!detection) return null;
    if (req.headers.get("sec-fetch-purpose") === "prefetch") return null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "client";
    const record = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      platform: detection.platform,
      query: detection.query,
      url: req.nextUrl.pathname,
      ip,
      user_agent: req.headers.get("user-agent") ?? "",
      referer
    };
    getStore().appendCitation(record).catch(() => {
    });
    return record;
  }
  recordFromBody(body) {
    const record = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      platform: body.platform,
      query: body.query ?? null,
      url: body.url,
      ip: body.ip ?? "client",
      user_agent: body.user_agent ?? "",
      referer: body.referer ?? ""
    };
    getStore().appendCitation(record).catch(() => {
    });
  }
};

// src/notifications/mailer.ts
import nodemailer from "nodemailer";
function getConfig() {
  return {
    smtp: process.env.TA_SMTP_HOST ? {
      host: process.env.TA_SMTP_HOST,
      port: parseInt(process.env.TA_SMTP_PORT ?? "587"),
      secure: process.env.TA_SMTP_SECURE === "true",
      user: process.env.TA_SMTP_USER ?? "",
      pass: process.env.TA_SMTP_PASS ?? ""
    } : void 0,
    brevoApiKey: process.env.TA_BREVO_API_KEY,
    to: process.env.TA_NOTIFY_TO ?? "",
    from: process.env.TA_NOTIFY_FROM ?? "Third Audience <noreply@third-audience.app>"
  };
}
function isMailConfigured() {
  const cfg = getConfig();
  const hasTo = Boolean(cfg.to && (Array.isArray(cfg.to) ? cfg.to.length > 0 : cfg.to.trim()));
  return hasTo && (Boolean(cfg.brevoApiKey) || Boolean(cfg.smtp?.host));
}
async function sendViaBrevo(apiKey, opts, fromAddr) {
  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];
  const body = {
    sender: { name: "Third Audience", email: fromAddr.replace(/.*<(.+)>/, "$1").trim() || fromAddr },
    to: toList.map((email) => ({ email })),
    subject: opts.subject,
    htmlContent: opts.html
  };
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${text}`);
  }
}
async function sendViaSmtp(smtp, opts, fromAddr) {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port ?? 587,
    secure: smtp.secure ?? false,
    auth: { user: smtp.user, pass: smtp.pass }
  });
  await transporter.sendMail({
    from: opts.from ?? fromAddr,
    to: Array.isArray(opts.to) ? opts.to.join(",") : opts.to,
    subject: opts.subject,
    html: opts.html
  });
}
async function sendMail(opts) {
  const cfg = getConfig();
  const to = opts.to || cfg.to;
  const from = opts.from ?? cfg.from ?? "Third Audience <noreply@third-audience.app>";
  if (!to || (Array.isArray(to) ? to.length === 0 : !to.trim())) {
    return;
  }
  const mailOpts = { ...opts, to, from };
  if (cfg.brevoApiKey) {
    await sendViaBrevo(cfg.brevoApiKey, mailOpts, from);
    return;
  }
  if (cfg.smtp?.host) {
    await sendViaSmtp(cfg.smtp, mailOpts, from);
    return;
  }
}

// src/notifications/email-templates.ts
var BASE_STYLES = `
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
`;
function shell(title, subtitle, body, siteUrl = "") {
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
    <p>Sent by <a href="https://github.com/pooran/third-audience-mdx">third-audience-mdx</a>${siteUrl ? ` \xB7 <a href="${siteUrl}">${siteUrl}</a>` : ""}</p>
  </div>
</div>
</body>
</html>`;
}
function firstCitationEmail(opts) {
  return {
    subject: `\u{1F389} First citation from ${opts.platform}!`,
    html: shell(
      "First AI Citation",
      "",
      `<div class="alert-box success">
        <p>Your content was cited by <strong>${opts.platform}</strong> for the first time!</p>
      </div>
      <table class="data">
        <tr><th>Platform</th><td>${opts.platform}</td></tr>
        <tr><th>Page Cited</th><td><code>${opts.url}</code></td></tr>
        ${opts.query ? `<tr><th>Search Query</th><td>"${opts.query}"</td></tr>` : ""}
      </table>`,
      opts.siteUrl
    )
  };
}
function newPlatformEmail(opts) {
  return {
    subject: `\u{1F195} New AI platform citing you \u2014 ${opts.platform}`,
    html: shell(
      "New Platform Detected",
      "",
      `<div class="alert-box info">
        <p><strong>${opts.platform}</strong> is now citing your content.</p>
      </div>
      <table class="data">
        <tr><th>Platform</th><td>${opts.platform}</td></tr>
        <tr><th>First Page</th><td><code>${opts.url}</code></td></tr>
      </table>`,
      opts.siteUrl
    )
  };
}
function citationSpikeEmail(opts) {
  return {
    subject: `\u{1F4C8} Citation spike from ${opts.platform} \u2014 ${opts.count}x in last hour`,
    html: shell(
      "Citation Spike Detected",
      "",
      `<div class="alert-box warning">
        <p>Unusual citation activity detected from <strong>${opts.platform}</strong>.</p>
      </div>
      <table class="data">
        <tr><th>Platform</th><td>${opts.platform}</td></tr>
        <tr><th>Last Hour</th><td><strong>${opts.count}</strong> citations</td></tr>
        <tr><th>Baseline</th><td>${Math.round(opts.baseline)}/hr</td></tr>
        ${opts.url ? `<tr><th>Top Page</th><td><code>${opts.url}</code></td></tr>` : ""}
      </table>`,
      opts.siteUrl
    )
  };
}

// src/notifications/alert-sender.ts
async function notifyCitationAlerts(record) {
  if (!isMailConfigured()) return;
  const store = getStore();
  const allCitations = await store.getAllCitations();
  const forPlatform = allCitations.filter((c) => c.platform === record.platform);
  if (forPlatform.length === 1) {
    const kvKey = `first_citation_${record.platform.toLowerCase().replace(/\s+/g, "_")}`;
    const alreadySent = await store.getKv(kvKey);
    if (!alreadySent) {
      const { subject, html } = firstCitationEmail({
        platform: record.platform,
        url: record.url,
        query: record.query
      });
      await sendMail({ to: "", subject, html });
      await store.setKv(kvKey, (/* @__PURE__ */ new Date()).toISOString());
    }
    return;
  }
  const since30d = new Date(Date.now() - 30 * 864e5).toISOString();
  const recent30d = allCitations.filter((c) => c.platform === record.platform && c.timestamp >= since30d);
  if (recent30d.length === 1) {
    const kvKey = `new_platform_alert_${record.platform.toLowerCase().replace(/\s+/g, "_")}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 7)}`;
    const alreadySent = await store.getKv(kvKey);
    if (!alreadySent) {
      const { subject, html } = newPlatformEmail({ platform: record.platform, url: record.url });
      await sendMail({ to: "", subject, html });
      await store.setKv(kvKey, (/* @__PURE__ */ new Date()).toISOString());
    }
    return;
  }
  const since24h = new Date(Date.now() - 24 * 36e5).toISOString();
  const last24h = allCitations.filter((c) => c.platform === record.platform && c.timestamp >= since24h);
  const baselinePerHr = last24h.length / 24;
  const lastHour = last24h.filter((c) => new Date(c.timestamp).getTime() > Date.now() - 36e5);
  if (baselinePerHr >= 3 && lastHour.length > baselinePerHr * 3) {
    const kvKey = `spike_alert_${record.platform.toLowerCase().replace(/\s+/g, "_")}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 13)}`;
    const alreadySent = await store.getKv(kvKey);
    if (!alreadySent) {
      const { subject, html } = citationSpikeEmail({
        platform: record.platform,
        count: lastHour.length,
        baseline: baselinePerHr,
        url: record.url
      });
      await sendMail({ to: "", subject, html });
      await store.setKv(kvKey, (/* @__PURE__ */ new Date()).toISOString());
    }
  }
}

// src/citations/citation-alerts.ts
var CitationAlerts = class {
  async check(newRecord) {
    const alerts2 = [];
    const store = getStore();
    const allRecords = await store.getAllCitations();
    const platformHistory = allRecords.filter((r) => r.platform === newRecord.platform);
    if (platformHistory.length === 1) {
      alerts2.push({
        type: "first_citation",
        platform: newRecord.platform,
        url: newRecord.url,
        message: `First citation from ${newRecord.platform}!`,
        timestamp: newRecord.timestamp
      });
    }
    const since30d = new Date(Date.now() - 30 * 24 * 36e5).toISOString();
    const recent30d = await store.getCitations(since30d);
    const recentPlatforms = new Set(recent30d.map((r) => r.platform));
    if (!recentPlatforms.has(newRecord.platform) && platformHistory.length > 1) {
      alerts2.push({
        type: "new_platform",
        platform: newRecord.platform,
        message: `${newRecord.platform} is citing your content again after a long absence.`,
        timestamp: newRecord.timestamp
      });
    }
    const since24h = new Date(Date.now() - 24 * 36e5).toISOString();
    const history24h = await store.getCitations(since24h);
    const hourly = history24h.filter((r) => r.platform === newRecord.platform);
    const baseline = hourly.length > 0 ? hourly.length / 24 : 0;
    const lastHourCount = hourly.filter(
      (r) => new Date(r.timestamp).getTime() > Date.now() - 36e5
    ).length;
    if (baseline > 2 && lastHourCount > baseline * 3) {
      alerts2.push({
        type: "citation_spike",
        platform: newRecord.platform,
        url: newRecord.url,
        message: `Citation spike from ${newRecord.platform}: ${lastHourCount} in last hour (baseline: ${Math.round(baseline)}/hr)`,
        timestamp: newRecord.timestamp
      });
    }
    notifyCitationAlerts(newRecord).catch(() => {
    });
    return alerts2;
  }
};

// src/dashboard/routes/citation-route.ts
var tracker = new CitationTracker();
var alerts = new CitationAlerts();
async function POST(req) {
  try {
    const body = await req.json();
    tracker.recordFromBody(body);
    const record = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      platform: body.platform ?? "unknown",
      query: body.query ?? null,
      url: body.url ?? "",
      ip: body.ip ?? "client",
      user_agent: body.user_agent ?? "",
      referer: body.referer ?? ""
    };
    alerts.check(record).catch(() => {
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
async function GET(req) {
  const record = tracker.record(req);
  if (record) {
    alerts.check(record);
  }
  return new NextResponse(null, { status: 204 });
}
export {
  GET,
  POST
};
//# sourceMappingURL=citation-route.mjs.map