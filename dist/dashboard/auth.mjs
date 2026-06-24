// src/dashboard/auth.ts
import { NextResponse } from "next/server";

// src/dashboard/admin-store.ts
import crypto from "crypto";

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

// src/dashboard/admin-store.ts
var CIPHER = "aes-256-gcm";
function getEncryptionKey() {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? "ta-fallback-key-change-me";
  return crypto.createHash("sha256").update(secret).digest();
}
function decryptApiKey(encoded) {
  try {
    const iv = Buffer.from(encoded.slice(0, 24), "hex");
    const tag = Buffer.from(encoded.slice(24, 56), "hex");
    const encrypted = Buffer.from(encoded.slice(56), "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(CIPHER, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    return null;
  }
}
async function getApiKey() {
  const record = await getStore().getAdmin();
  if (!record?.apiKey) return null;
  return decryptApiKey(record.apiKey);
}
async function verifyApiKey(key) {
  const stored = await getApiKey();
  if (!stored) return false;
  if (key.length !== stored.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(stored));
}
function verifySession(token) {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", process.env.THIRD_AUDIENCE_SECRET ?? "ta-salt").update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
}

// src/dashboard/auth.ts
var SESSION_COOKIE = "ta_session";
async function checkApiAuth(req) {
  const apiKeyHeader = req.headers.get("x-ta-api-key");
  if (apiKeyHeader) return verifyApiKey(apiKeyHeader);
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    return verifyApiKey(auth.slice(7));
  }
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (session) return verifySession(session);
  return false;
}
function checkDashboardAuth(req) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return false;
  return verifySession(session);
}
function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized. Provide X-TA-Api-Key header or a valid session cookie." },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="Third Audience API"' }
    }
  );
}
export {
  checkApiAuth,
  checkDashboardAuth,
  unauthorizedResponse
};
//# sourceMappingURL=auth.mjs.map