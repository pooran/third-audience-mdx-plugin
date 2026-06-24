"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/dashboard/routes/cache-browser-route.ts
var cache_browser_route_exports = {};
__export(cache_browser_route_exports, {
  GET: () => GET,
  POST: () => POST
});
module.exports = __toCommonJS(cache_browser_route_exports);
var import_server = require("next/server");

// src/storage/postgres-store.ts
var import_pg = require("pg");
var _client = null;
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

// src/storage/get-store.ts
var _store = null;
function getStore() {
  if (_store) return _store;
  _store = new PostgresStore();
  return _store;
}

// src/dashboard/routes/cache-browser-route.ts
async function GET(req) {
  const store = getStore();
  const p = req.nextUrl.searchParams;
  const search = p.get("search") ?? void 0;
  const limit = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset = parseInt(p.get("offset") ?? "0");
  const [entries, total] = await Promise.all([
    store.listCacheKeys({ search, limit, offset }),
    store.countCacheKeys(search)
  ]);
  const now = Date.now();
  const annotated = entries.map((e) => ({
    key: e.key,
    etag: e.etag,
    cachedAt: e.cachedAt,
    ttl: e.ttl,
    size: e.content.length,
    expired: now > e.cachedAt + e.ttl * 1e3,
    expiresAt: e.cachedAt + e.ttl * 1e3
  }));
  return import_server.NextResponse.json({ entries: annotated, total, offset, limit });
}
async function POST(req) {
  const store = getStore();
  const body = await req.json();
  const action = body.action;
  if (action === "delete_key") {
    const key = body.key;
    if (!key) return import_server.NextResponse.json({ error: "Missing key" }, { status: 400 });
    await store.deleteCacheKey(key);
    return import_server.NextResponse.json({ ok: true });
  }
  if (action === "clear_expired") {
    const deleted = await store.clearExpiredCache();
    return import_server.NextResponse.json({ ok: true, deleted });
  }
  if (action === "clear_all") {
    await store.deleteCache("");
    return import_server.NextResponse.json({ ok: true });
  }
  return import_server.NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET,
  POST
});
//# sourceMappingURL=cache-browser-route.js.map