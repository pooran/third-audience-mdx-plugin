"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/storage/postgres-store.ts
async function getClient() {
  if (_client) return _client;
  const url = process.env.TA_STORAGE_URL;
  if (!url) throw new Error("TA_STORAGE_URL is required for postgres/supabase storage");
  const sslUrl = url.replace(/[?&]sslmode=[^&]*/g, "");
  _client = new import_pg.Client({ connectionString: sslUrl, ssl: { rejectUnauthorized: false } });
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
    CREATE TABLE IF NOT EXISTS ta_competitors (
      id   SERIAL PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ta_benchmarks (
      id               SERIAL PRIMARY KEY,
      competitor_url   TEXT    NOT NULL,
      competitor_name  TEXT    NOT NULL,
      test_prompt      TEXT    NOT NULL,
      ai_platform      TEXT    NOT NULL,
      cited_rank       SMALLINT,
      test_date        TEXT    NOT NULL,
      test_notes       TEXT    NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS ta_benchmarks_url_idx      ON ta_benchmarks (competitor_url);
    CREATE INDEX IF NOT EXISTS ta_benchmarks_platform_idx ON ta_benchmarks (ai_platform);
    CREATE INDEX IF NOT EXISTS ta_benchmarks_date_idx     ON ta_benchmarks (test_date);
  `);
}
function buildBenchmarkWhere(f) {
  const clauses = [];
  const params = [];
  if (f.competitor_url) {
    params.push(f.competitor_url);
    clauses.push(`competitor_url = $${params.length}`);
  }
  if (f.ai_platform) {
    params.push(f.ai_platform);
    clauses.push(`ai_platform = $${params.length}`);
  }
  if (f.sinceDate) {
    params.push(f.sinceDate);
    clauses.push(`test_date >= $${params.length}`);
  }
  return { where: clauses.length ? "WHERE " + clauses.join(" AND ") : "", params };
}
function rowToBenchmark(r) {
  return {
    id: r.id,
    competitor_url: r.competitor_url,
    competitor_name: r.competitor_name,
    test_prompt: r.test_prompt,
    ai_platform: r.ai_platform,
    cited_rank: r.cited_rank,
    test_date: r.test_date,
    test_notes: r.test_notes
  };
}
var import_pg, _client, PostgresStore;
var init_postgres_store = __esm({
  "src/storage/postgres-store.ts"() {
    "use strict";
    import_pg = require("pg");
    _client = null;
    PostgresStore = class {
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
      // ── Cache browser ──────────────────────────────────────────────────────────
      async listCacheKeys(opts) {
        const params = [opts.limit, opts.offset];
        const where = opts.search ? `WHERE key ILIKE $3` : "";
        if (opts.search) params.push(`%${opts.search}%`);
        const { rows } = await this.q(
          `SELECT key, content, etag, cached_at, ttl FROM ta_cache ${where} ORDER BY cached_at DESC LIMIT $1 OFFSET $2`,
          params
        );
        return rows.map((r) => ({ key: r.key, content: r.content, etag: r.etag, cachedAt: Number(r.cached_at), ttl: r.ttl }));
      }
      async countCacheKeys(search) {
        const where = search ? `WHERE key ILIKE $1` : "";
        const params = search ? [`%${search}%`] : [];
        const { rows } = await this.q(`SELECT COUNT(*)::int AS n FROM ta_cache ${where}`, params);
        return rows[0]?.n ?? 0;
      }
      async deleteCacheKey(key) {
        await this.q("DELETE FROM ta_cache WHERE key = $1", [key]);
      }
      async clearExpiredCache() {
        const now = Date.now();
        const { rowCount } = await this.q(
          "DELETE FROM ta_cache WHERE (cached_at + ttl * 1000) < $1",
          [now]
        );
        return rowCount ?? 0;
      }
      // ── Competitor benchmarking ────────────────────────────────────────────────
      async getCompetitors() {
        const { rows } = await this.q("SELECT data FROM ta_competitors WHERE id = 1");
        if (!rows[0]) return [];
        try {
          return JSON.parse(rows[0].data);
        } catch {
          return [];
        }
      }
      async saveCompetitors(list) {
        await this.q(`
      INSERT INTO ta_competitors (id, data) VALUES (1, $1)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `, [JSON.stringify(list)]);
      }
      async appendBenchmark(r) {
        await this.q(`
      INSERT INTO ta_benchmarks (competitor_url, competitor_name, test_prompt, ai_platform, cited_rank, test_date, test_notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [r.competitor_url, r.competitor_name, r.test_prompt, r.ai_platform, r.cited_rank ?? null, r.test_date, r.test_notes ?? ""]);
      }
      async getBenchmarks(filters) {
        const { where, params } = buildBenchmarkWhere(filters);
        const { rows } = await this.q(
          `SELECT * FROM ta_benchmarks ${where} ORDER BY test_date DESC, id DESC`,
          params
        );
        return rows.map(rowToBenchmark);
      }
      async countBenchmarks(filters) {
        const { where, params } = buildBenchmarkWhere(filters);
        const { rows } = await this.q(`SELECT COUNT(*)::int AS n FROM ta_benchmarks ${where}`, params);
        return rows[0]?.n ?? 0;
      }
      async deleteBenchmark(id) {
        await this.q("DELETE FROM ta_benchmarks WHERE id = $1", [id]);
      }
      async clearBenchmarks() {
        await this.q("DELETE FROM ta_benchmarks");
      }
    };
  }
});

// src/storage/get-store.ts
var get_store_exports = {};
__export(get_store_exports, {
  getStore: () => getStore
});
function getStore() {
  if (_store) return _store;
  _store = new PostgresStore();
  return _store;
}
var _store;
var init_get_store = __esm({
  "src/storage/get-store.ts"() {
    "use strict";
    init_postgres_store();
    _store = null;
  }
});

// src/dashboard/routes/digest-route.ts
var digest_route_exports = {};
__export(digest_route_exports, {
  GET: () => GET,
  POST: () => POST
});
module.exports = __toCommonJS(digest_route_exports);
var import_server = require("next/server");

// src/notifications/mailer.ts
var import_nodemailer = __toESM(require("nodemailer"));
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
  const transporter = import_nodemailer.default.createTransport({
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
function sparkline(data) {
  if (data.length === 0) return "";
  const max = Math.max(...data.map((d) => d.visits), 1);
  const bars = data.slice(-14).map((d) => {
    const pct = Math.round(d.visits / max * 100);
    const color = pct > 66 ? "#3b82f6" : pct > 33 ? "#93c5fd" : "#dbeafe";
    return `<td style="vertical-align:bottom;padding:0 1px;width:${Math.floor(280 / Math.min(data.length, 14))}px">
      <div title="${d.date}: ${d.visits}" style="height:${Math.max(4, Math.round(pct * 0.4))}px;background:${color};border-radius:2px 2px 0 0"></div>
      </td>`;
  }).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr>${bars}</tr></table>`;
}
function digestEmail(data) {
  const label = data.period === "daily" ? "Daily Digest" : "Weekly Digest";
  const icon = data.period === "daily" ? "\u{1F4CA}" : "\u{1F4C8}";
  const platformBadgeColor = (name) => {
    const colors = {
      ChatGPT: "badge-green",
      Perplexity: "badge-blue",
      Claude: "badge-orange",
      Gemini: "badge-blue",
      Copilot: "badge-blue",
      "You.com": "badge-purple"
    };
    return colors[name] ?? "badge-blue";
  };
  const topBotsRows = data.visits.topBots.slice(0, 5).map((b) => {
    const pct = data.visits.total > 0 ? Math.round(b.visits / data.visits.total * 100) : 0;
    return `<tr>
      <td>${b.name}</td>
      <td>${b.visits.toLocaleString()}</td>
      <td style="width:120px">
        <div class="bar-container"><div class="bar" style="width:${pct}%"></div></div>
      </td>
      <td style="color:#64748b;font-size:12px">${pct}%</td>
    </tr>`;
  }).join("");
  const topPagesRows = data.visits.topPages.slice(0, 5).map(
    (p) => `<tr><td><code style="font-size:12px">${p.url}</code></td><td>${p.visits.toLocaleString()}</td></tr>`
  ).join("");
  const platformRows = data.citations.platforms.slice(0, 5).map((p) => {
    const pct = data.citations.total > 0 ? Math.round(p.count / data.citations.total * 100) : 0;
    return `<tr>
      <td><span class="badge ${platformBadgeColor(p.name)}">${p.name}</span></td>
      <td>${p.count.toLocaleString()}</td>
      <td style="width:120px">
        <div class="bar-container"><div class="bar" style="width:${pct}%;background:#8b5cf6"></div></div>
      </td>
      <td style="color:#64748b;font-size:12px">${pct}%</td>
    </tr>`;
  }).join("");
  const cacheRate = data.visits.cacheHitRate !== null ? `${Math.round(data.visits.cacheHitRate * 100)}%` : "\u2014";
  const avgMs = data.visits.avgResponseMs !== null ? `${Math.round(data.visits.avgResponseMs)}ms` : "\u2014";
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
    </table>` : ""}

    <!-- Top pages by visits -->
    ${data.visits.topPages.length > 0 ? `
    <div class="section-title">Most Crawled Pages</div>
    <table class="data">
      <thead><tr><th>Page</th><th>Visits</th></tr></thead>
      <tbody>${topPagesRows}</tbody>
    </table>` : ""}

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
    <p style="font-size:13px;color:#64748b;margin-top:24px">Avg response time: <strong>${avgMs}</strong></p>` : ""}
  `;
  return {
    subject: `${icon} ${label} \u2014 ${data.visits.total} bot visits, ${data.citations.total} citations`,
    html: shell(label, data.dateRange, body, data.siteUrl)
  };
}

// src/notifications/digest.ts
init_get_store();
function isoDateStr(d) {
  return d.toISOString().slice(0, 10);
}
function daysAgoIso(days) {
  return new Date(Date.now() - days * 864e5).toISOString();
}
async function buildDigest(period) {
  const store = getStore();
  const days = period === "daily" ? 1 : 7;
  const sinceIso = daysAgoIso(days);
  const [visits, citations] = await Promise.all([
    store.getVisits(sinceIso),
    store.getCitations(sinceIso)
  ]);
  const uniqueBots = new Set(visits.map((v) => v.bot_name ?? v.bot_category)).size;
  const totalRespMs = visits.filter((v) => v.response_ms !== null).map((v) => v.response_ms);
  const avgResponseMs = totalRespMs.length > 0 ? totalRespMs.reduce((a, b) => a + b, 0) / totalRespMs.length : null;
  const cacheHits = visits.filter((v) => v.cache_hit).length;
  const cacheHitRate = visits.length > 0 ? cacheHits / visits.length : null;
  const botCounts = {};
  for (const v of visits) {
    const name = v.bot_name ?? v.bot_category;
    botCounts[name] = (botCounts[name] ?? 0) + 1;
  }
  const topBots = Object.entries(botCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, visits: count }));
  const pageVisitCounts = {};
  for (const v of visits) {
    pageVisitCounts[v.url] = (pageVisitCounts[v.url] ?? 0) + 1;
  }
  const topPages = Object.entries(pageVisitCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([url, count]) => ({ url, visits: count }));
  const visitsByDayMap = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    visitsByDayMap[isoDateStr(d)] = 0;
  }
  for (const v of visits) {
    const day = v.timestamp.slice(0, 10);
    if (day in visitsByDayMap) visitsByDayMap[day]++;
  }
  const visitsByDay = Object.entries(visitsByDayMap).map(([date, count]) => ({ date, visits: count }));
  const platformCounts = {};
  for (const c of citations) {
    platformCounts[c.platform] = (platformCounts[c.platform] ?? 0) + 1;
  }
  const platforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  const citationPageCounts = {};
  for (const c of citations) {
    citationPageCounts[c.url] = (citationPageCounts[c.url] ?? 0) + 1;
  }
  const citationTopPages = Object.entries(citationPageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([url, count]) => ({ url, count }));
  const endDate = /* @__PURE__ */ new Date();
  const startDate = new Date(Date.now() - days * 864e5);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dateRange = days === 1 ? fmt(startDate) : `${fmt(startDate)} \u2013 ${fmt(endDate)}`;
  return {
    period,
    dateRange,
    visits: { total: visits.length, uniqueBots, avgResponseMs, cacheHitRate, topBots, topPages, visitsByDay },
    citations: { total: citations.length, platforms, topPages: citationTopPages }
  };
}
async function wasDigestSentRecently(period) {
  const store = getStore();
  const val = await store.getKv(`digest_last_sent_${period}`);
  if (!val) return false;
  const lastSent = new Date(val).getTime();
  const thresholdMs = period === "daily" ? 20 * 36e5 : 6 * 24 * 36e5;
  return Date.now() - lastSent < thresholdMs;
}
async function markDigestSent(period) {
  await getStore().setKv(`digest_last_sent_${period}`, (/* @__PURE__ */ new Date()).toISOString());
}

// src/notifications/alert-sender.ts
init_get_store();
async function sendDigest(period) {
  if (!isMailConfigured()) return { sent: false, reason: "mail not configured" };
  if (await wasDigestSentRecently(period)) {
    return { sent: false, reason: `${period} digest already sent recently` };
  }
  const data = await buildDigest(period);
  const { subject, html } = digestEmail(data);
  await sendMail({ to: "", subject, html });
  await markDigestSent(period);
  return { sent: true };
}

// src/dashboard/routes/digest-route.ts
async function POST(req) {
  const apiKey = req.headers.get("x-ta-api-key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  const configuredKey = process.env.TA_API_KEY;
  if (configuredKey && apiKey !== configuredKey) {
    return import_server.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let period = "daily";
  let force = false;
  try {
    const body = await req.json();
    if (body.period === "weekly") period = "weekly";
    if (body.force === true) force = true;
  } catch {
  }
  try {
    const result = await sendDigest(period);
    return import_server.NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return import_server.NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
async function GET(req) {
  const { getStore: getStore2 } = await Promise.resolve().then(() => (init_get_store(), get_store_exports));
  const store = getStore2();
  const [daily, weekly] = await Promise.all([
    store.getKv("digest_last_sent_daily"),
    store.getKv("digest_last_sent_weekly")
  ]);
  return import_server.NextResponse.json({ lastSent: { daily, weekly } });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET,
  POST
});
//# sourceMappingURL=digest-route.js.map