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
  { name: "ChatGPT", patterns: [/openai\.com/i, /chatgpt\.com/i], queryParam: "q" },
  { name: "Perplexity", patterns: [/perplexity\.ai/i], queryParam: "q" },
  { name: "Claude", patterns: [/claude\.ai/i, /anthropic\.com/i] },
  { name: "Gemini", patterns: [/gemini\.google\.com/i, /bard\.google\.com/i] },
  { name: "Copilot", patterns: [/copilot\.microsoft\.com/i, /bing\.com\/chat/i] },
  { name: "You.com", patterns: [/you\.com/i], queryParam: "q" },
  { name: "Phind", patterns: [/phind\.com/i] },
  { name: "Kagi", patterns: [/kagi\.com/i], queryParam: "q" }
];
function detectAiPlatform(referer) {
  if (!referer) return null;
  let url;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }
  for (const p of AI_PLATFORMS) {
    if (p.patterns.some((rx) => rx.test(referer))) {
      const query = p.queryParam ? url.searchParams.get(p.queryParam) : null;
      return { platform: p.name, query };
    }
  }
  return null;
}
var CitationTracker = class {
  record(req) {
    const referer = req.headers.get("referer") ?? "";
    const detection = detectAiPlatform(referer);
    if (!detection) return null;
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

// src/citations/citation-alerts.ts
var CitationAlerts = class {
  async check(newRecord) {
    const alerts2 = [];
    const allRecords = await getStore().getAllCitations();
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
    const recent30d = await getStore().getCitations(since30d);
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
    const history24h = await getStore().getCitations(since24h);
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