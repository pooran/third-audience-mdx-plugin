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

// src/analytics/performance-stats.ts
var PerformanceStats = class {
  async compute(days = 30) {
    const cutoff = /* @__PURE__ */ new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const records = await getStore().getVisits(cutoff.toISOString());
    return summarise(records);
  }
};
function summarise(records) {
  const totalVisits = records.length;
  const uniqueBots = [...new Set(records.map((r) => r.bot_name).filter(Boolean))];
  const withResponseMs = records.filter((r) => r.response_ms !== null);
  const avgResponseMs = withResponseMs.length > 0 ? withResponseMs.reduce((s, r) => s + r.response_ms, 0) / withResponseMs.length : null;
  const cacheHitRate = records.length > 0 ? records.filter((r) => r.cache_hit).length / records.length : null;
  const pageCounts = /* @__PURE__ */ new Map();
  const botCounts = /* @__PURE__ */ new Map();
  const dayCounts = /* @__PURE__ */ new Map();
  for (const r of records) {
    pageCounts.set(r.url, (pageCounts.get(r.url) ?? 0) + 1);
    const name = r.bot_name ?? "unknown";
    botCounts.set(name, (botCounts.get(name) ?? 0) + 1);
    const day = r.timestamp.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([url, visits]) => ({ url, visits }));
  const topBots = [...botCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, visits]) => ({ name, visits }));
  const visitsByDay = [...dayCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, visits]) => ({ date, visits }));
  return { totalVisits, uniqueBots, avgResponseMs, cacheHitRate, topPages, topBots, visitsByDay };
}

// src/dashboard/ui/components/HeroCard.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function HeroCard({ label, value, meta, color = "blue", icon }) {
  return /* @__PURE__ */ jsxs("div", { className: `ta-hero-card ta-hero-card--${color}`, children: [
    /* @__PURE__ */ jsx("div", { className: "ta-hero-icon", children: icon }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "ta-hero-label", children: label }),
      /* @__PURE__ */ jsx("div", { className: "ta-hero-value", children: value }),
      meta && /* @__PURE__ */ jsx("div", { className: "ta-hero-meta", children: meta })
    ] })
  ] });
}

// src/dashboard/ui/components/Card.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Card({ title, action, children }) {
  return /* @__PURE__ */ jsxs2("div", { className: "ta-card ta-section", children: [
    /* @__PURE__ */ jsxs2("div", { className: "ta-card-header", children: [
      /* @__PURE__ */ jsx2("h2", { children: title }),
      action
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "ta-card-body", children })
  ] });
}

// src/dashboard/ui/components/VisitsChart.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function VisitsChart({ data, height = 160 }) {
  if (!data.length) {
    return /* @__PURE__ */ jsx3("div", { className: "ta-empty", children: /* @__PURE__ */ jsx3("p", { children: "No visit data yet." }) });
  }
  const max = Math.max(...data.map((d) => d.visits), 1);
  const barWidth = Math.max(4, Math.floor(560 / data.length) - 2);
  const showLabel = data.length <= 14;
  return /* @__PURE__ */ jsx3("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsx3(
    "svg",
    {
      width: "100%",
      viewBox: `0 0 ${Math.max(data.length * (barWidth + 2), 560)} ${height + 40}`,
      style: { display: "block", minWidth: 320 },
      children: data.map((d, i) => {
        const barH = Math.max(2, Math.round(d.visits / max * height));
        const x = i * (barWidth + 2);
        const y = height - barH;
        return /* @__PURE__ */ jsxs3("g", { children: [
          /* @__PURE__ */ jsx3(
            "rect",
            {
              x,
              y,
              width: barWidth,
              height: barH,
              rx: 3,
              fill: "var(--ta-blue)",
              opacity: 0.85,
              children: /* @__PURE__ */ jsx3("title", { children: `${d.date}: ${d.visits} visits` })
            }
          ),
          showLabel && /* @__PURE__ */ jsxs3(
            "text",
            {
              x: x + barWidth / 2,
              y: height + 16,
              textAnchor: "middle",
              fontSize: 9,
              fill: "var(--ta-gray-500)",
              children: [
                d.date.slice(5),
                " "
              ]
            }
          )
        ] }, d.date);
      })
    }
  ) });
}

// src/dashboard/ui/pages/BotAnalyticsPage.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var BOT_COLORS = {
  ClaudeBot: "orange",
  GPTBot: "green",
  PerplexityBot: "blue",
  "Googlebot-AI": "teal",
  default: "gray"
};
async function BotAnalyticsPage() {
  const stats = new PerformanceStats();
  const summary = await stats.compute(30);
  const cacheRate = summary.cacheHitRate !== null ? `${(summary.cacheHitRate * 100).toFixed(0)}%` : "\u2014";
  const avgMs = summary.avgResponseMs !== null ? `${Math.round(summary.avgResponseMs)}ms` : "\u2014";
  return /* @__PURE__ */ jsxs4("div", { children: [
    /* @__PURE__ */ jsx4("h1", { className: "ta-page-title", children: "Bot Analytics" }),
    /* @__PURE__ */ jsx4("p", { className: "ta-page-subtitle", children: "AI crawler visits over the last 30 days" }),
    /* @__PURE__ */ jsxs4("div", { className: "ta-hero-grid", children: [
      /* @__PURE__ */ jsx4(
        HeroCard,
        {
          label: "Total Bot Visits",
          value: summary.totalVisits.toLocaleString(),
          meta: `${summary.uniqueBots.length} unique bots`,
          color: "blue",
          icon: /* @__PURE__ */ jsx4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx4("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) })
        }
      ),
      /* @__PURE__ */ jsx4(
        HeroCard,
        {
          label: "Unique Pages Crawled",
          value: summary.topPages.length.toLocaleString(),
          meta: "distinct URLs visited",
          color: "teal",
          icon: /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
            /* @__PURE__ */ jsx4("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ jsx4("polyline", { points: "14 2 14 8 20 8" })
          ] })
        }
      ),
      /* @__PURE__ */ jsx4(
        HeroCard,
        {
          label: "Cache Hit Rate",
          value: cacheRate,
          meta: "higher = faster bot response",
          color: "green",
          icon: /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
            /* @__PURE__ */ jsx4("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
            /* @__PURE__ */ jsx4("polyline", { points: "22 4 12 14.01 9 11.01" })
          ] })
        }
      ),
      /* @__PURE__ */ jsx4(
        HeroCard,
        {
          label: "Avg Response",
          value: avgMs,
          meta: "for markdown requests",
          color: "orange",
          icon: /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
            /* @__PURE__ */ jsx4("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsx4("polyline", { points: "12 6 12 12 16 14" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx4(Card, { title: "Daily Visits (30 days)", children: /* @__PURE__ */ jsx4(VisitsChart, { data: summary.visitsByDay }) }),
    /* @__PURE__ */ jsxs4("div", { className: "ta-grid-2", children: [
      /* @__PURE__ */ jsx4(Card, { title: "Top Bots", children: summary.topBots.length === 0 ? /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "No bot visits recorded yet." }) }) : /* @__PURE__ */ jsxs4("table", { className: "ta-table", children: [
        /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { children: [
          /* @__PURE__ */ jsx4("th", { children: "Bot" }),
          /* @__PURE__ */ jsx4("th", { children: "Visits" }),
          /* @__PURE__ */ jsx4("th", { children: "Share" })
        ] }) }),
        /* @__PURE__ */ jsx4("tbody", { children: summary.topBots.map((b) => {
          const pct = summary.totalVisits > 0 ? (b.visits / summary.totalVisits * 100).toFixed(1) : "0";
          const color = BOT_COLORS[b.name] ?? BOT_COLORS.default;
          return /* @__PURE__ */ jsxs4("tr", { children: [
            /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsx4("span", { className: `ta-badge ta-badge--${color}`, children: b.name }) }),
            /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsx4("strong", { children: b.visits.toLocaleString() }) }),
            /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsx4("div", { style: { flex: 1, height: 6, background: "var(--ta-gray-100)", borderRadius: 3 }, children: /* @__PURE__ */ jsx4("div", { style: { width: `${pct}%`, height: "100%", background: "var(--ta-blue)", borderRadius: 3 } }) }),
              /* @__PURE__ */ jsxs4("span", { style: { fontSize: 12, color: "var(--ta-gray-600)", width: 36 }, children: [
                pct,
                "%"
              ] })
            ] }) })
          ] }, b.name);
        }) })
      ] }) }),
      /* @__PURE__ */ jsx4(Card, { title: "Top Pages Crawled", children: summary.topPages.length === 0 ? /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "No pages crawled yet." }) }) : /* @__PURE__ */ jsxs4("table", { className: "ta-table", children: [
        /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { children: [
          /* @__PURE__ */ jsx4("th", { children: "Page" }),
          /* @__PURE__ */ jsx4("th", { children: "Visits" })
        ] }) }),
        /* @__PURE__ */ jsx4("tbody", { children: summary.topPages.map((p) => /* @__PURE__ */ jsxs4("tr", { children: [
          /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsx4("a", { href: p.url, target: "_blank", rel: "noreferrer", style: { fontFamily: "var(--ta-font-mono)", fontSize: 12 }, children: p.url }) }),
          /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsx4("strong", { children: p.visits.toLocaleString() }) })
        ] }, p.url)) })
      ] }) })
    ] })
  ] });
}
export {
  BotAnalyticsPage
};
//# sourceMappingURL=BotAnalyticsPage.mjs.map