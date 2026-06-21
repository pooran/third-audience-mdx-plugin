var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/storage/postgres-store.ts
var postgres_store_exports = {};
__export(postgres_store_exports, {
  PostgresStore: () => PostgresStore
});
import { Client } from "pg";
async function getClient() {
  if (_client) return _client;
  const url = process.env.TA_STORAGE_URL;
  if (!url) throw new Error("TA_STORAGE_URL is required for postgres/supabase storage");
  _client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
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
var _client, PostgresStore;
var init_postgres_store = __esm({
  "src/storage/postgres-store.ts"() {
    "use strict";
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
    };
  }
});

// src/storage/sqlite-store.ts
var sqlite_store_exports = {};
__export(sqlite_store_exports, {
  SqliteStore: () => SqliteStore
});
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
function dbPath() {
  const dataDir = path.join(process.cwd(), process.env.TA_DATA_DIR ?? "data");
  return path.join(dataDir, "ta-data.db");
}
function migrate2(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id                  INTEGER PRIMARY KEY,
      password_hash       TEXT    NOT NULL,
      is_default_password INTEGER NOT NULL DEFAULT 1,
      created_at          TEXT    NOT NULL,
      last_login_at       TEXT,
      api_key             TEXT
    );
    CREATE TABLE IF NOT EXISTS bots_config (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      allowlist     TEXT    NOT NULL DEFAULT '[]',
      blocklist     TEXT    NOT NULL DEFAULT '[]',
      track_unknown INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS visits (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
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
      cache_hit        INTEGER NOT NULL DEFAULT 0,
      content_length   INTEGER
    );
    CREATE INDEX IF NOT EXISTS visits_timestamp_idx ON visits (timestamp);
    CREATE TABLE IF NOT EXISTS citations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp   TEXT    NOT NULL,
      platform    TEXT    NOT NULL,
      query       TEXT,
      url         TEXT    NOT NULL,
      ip          TEXT    NOT NULL,
      user_agent  TEXT    NOT NULL,
      referer     TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS citations_timestamp_idx ON citations (timestamp);
    CREATE INDEX IF NOT EXISTS citations_platform_idx  ON citations (platform);
    CREATE TABLE IF NOT EXISTS cache (
      key       TEXT    PRIMARY KEY,
      content   TEXT    NOT NULL,
      etag      TEXT    NOT NULL DEFAULT '',
      cached_at INTEGER NOT NULL,
      ttl       INTEGER NOT NULL
    );
  `);
}
function getDb() {
  if (_db) return _db;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  _db = new Database(file);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate2(_db);
  return _db;
}
var _db, SqliteStore;
var init_sqlite_store = __esm({
  "src/storage/sqlite-store.ts"() {
    "use strict";
    _db = null;
    SqliteStore = class {
      get db() {
        return getDb();
      }
      async getAdmin() {
        const row = this.db.prepare("SELECT * FROM admin WHERE id = 1").get();
        if (!row) return null;
        return {
          passwordHash: row.password_hash,
          isDefaultPassword: Boolean(row.is_default_password),
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
          apiKey: row.api_key
        };
      }
      async saveAdmin(record) {
        this.db.prepare(`
      INSERT INTO admin (id, password_hash, is_default_password, created_at, last_login_at, api_key)
      VALUES (1, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        password_hash       = excluded.password_hash,
        is_default_password = excluded.is_default_password,
        created_at          = excluded.created_at,
        last_login_at       = excluded.last_login_at,
        api_key             = excluded.api_key
    `).run(
          record.passwordHash,
          record.isDefaultPassword ? 1 : 0,
          record.createdAt,
          record.lastLoginAt,
          record.apiKey ?? null
        );
      }
      async getBotsConfig() {
        const row = this.db.prepare("SELECT * FROM bots_config WHERE id = 1").get();
        if (!row) return { allowlist: [], blocklist: [], track_unknown: true };
        return {
          allowlist: JSON.parse(row.allowlist),
          blocklist: JSON.parse(row.blocklist),
          track_unknown: Boolean(row.track_unknown)
        };
      }
      async saveBotsConfig(config) {
        this.db.prepare(`
      INSERT INTO bots_config (id, allowlist, blocklist, track_unknown)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        allowlist     = excluded.allowlist,
        blocklist     = excluded.blocklist,
        track_unknown = excluded.track_unknown
    `).run(
          JSON.stringify(config.allowlist),
          JSON.stringify(config.blocklist),
          config.track_unknown ? 1 : 0
        );
      }
      async appendVisit(r) {
        this.db.prepare(`
      INSERT INTO visits (timestamp, bot_name, bot_category, detection_method, confidence, url, ip, country, user_agent, referer, response_ms, cache_hit, content_length)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r.timestamp, r.bot_name, r.bot_category, r.detection_method, r.confidence, r.url, r.ip, r.country, r.user_agent, r.referer, r.response_ms, r.cache_hit ? 1 : 0, r.content_length);
      }
      async getVisits(sinceIso) {
        const rows = this.db.prepare("SELECT * FROM visits WHERE timestamp >= ? ORDER BY timestamp").all(sinceIso);
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
          cache_hit: Boolean(r.cache_hit),
          content_length: r.content_length
        }));
      }
      async appendCitation(r) {
        this.db.prepare(`
      INSERT INTO citations (timestamp, platform, query, url, ip, user_agent, referer)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(r.timestamp, r.platform, r.query, r.url, r.ip, r.user_agent, r.referer);
      }
      async getCitations(sinceIso) {
        return this.db.prepare("SELECT * FROM citations WHERE timestamp >= ? ORDER BY timestamp").all(sinceIso);
      }
      async getAllCitations() {
        return this.db.prepare("SELECT * FROM citations ORDER BY timestamp").all();
      }
      async getCache(key) {
        const row = this.db.prepare("SELECT * FROM cache WHERE key = ?").get(key);
        if (!row) return null;
        return { content: row.content, etag: row.etag, cachedAt: row.cached_at, ttl: row.ttl };
      }
      async setCache(key, entry) {
        this.db.prepare(`
      INSERT INTO cache (key, content, etag, cached_at, ttl) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET content = excluded.content, etag = excluded.etag, cached_at = excluded.cached_at, ttl = excluded.ttl
    `).run(key, entry.content, entry.etag, entry.cachedAt, entry.ttl);
      }
      async deleteCache(keyPrefix) {
        this.db.prepare("DELETE FROM cache WHERE key LIKE ?").run(keyPrefix + "%");
      }
    };
  }
});

// src/dashboard/routes/citation-route.ts
import { NextResponse } from "next/server";

// src/storage/get-store.ts
var _store = null;
function getStore() {
  if (_store) return _store;
  const type = process.env.TA_STORAGE_TYPE ?? "sqlite";
  if (type === "postgres" || type === "supabase") {
    const { PostgresStore: PostgresStore2 } = (init_postgres_store(), __toCommonJS(postgres_store_exports));
    _store = new PostgresStore2();
  } else {
    const { SqliteStore: SqliteStore2 } = (init_sqlite_store(), __toCommonJS(sqlite_store_exports));
    _store = new SqliteStore2();
  }
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