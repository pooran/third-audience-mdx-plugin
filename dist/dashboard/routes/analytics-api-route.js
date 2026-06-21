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
var postgres_store_exports = {};
__export(postgres_store_exports, {
  PostgresStore: () => PostgresStore
});
async function getClient() {
  if (_client) return _client;
  const url = process.env.TA_STORAGE_URL;
  if (!url) throw new Error("TA_STORAGE_URL is required for postgres/supabase storage");
  _client = new import_pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
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
    };
  }
});

// src/storage/sqlite-store.ts
var sqlite_store_exports = {};
__export(sqlite_store_exports, {
  SqliteStore: () => SqliteStore
});
function dbPath() {
  const dataDir = import_path.default.join(process.cwd(), process.env.TA_DATA_DIR ?? "data");
  return import_path.default.join(dataDir, "ta-data.db");
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
  import_fs.default.mkdirSync(import_path.default.dirname(file), { recursive: true });
  _db = new import_better_sqlite3.default(file);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate2(_db);
  return _db;
}
var import_better_sqlite3, import_fs, import_path, _db, SqliteStore;
var init_sqlite_store = __esm({
  "src/storage/sqlite-store.ts"() {
    "use strict";
    import_better_sqlite3 = __toESM(require("better-sqlite3"));
    import_fs = __toESM(require("fs"));
    import_path = __toESM(require("path"));
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

// src/dashboard/routes/analytics-api-route.ts
var analytics_api_route_exports = {};
__export(analytics_api_route_exports, {
  GET: () => GET
});
module.exports = __toCommonJS(analytics_api_route_exports);
var import_server2 = require("next/server");

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

// src/dashboard/auth.ts
var import_server = require("next/server");

// src/dashboard/admin-store.ts
var import_crypto = __toESM(require("crypto"));
var CIPHER = "aes-256-gcm";
function getEncryptionKey() {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? "ta-fallback-key-change-me";
  return import_crypto.default.createHash("sha256").update(secret).digest();
}
function decryptApiKey(encoded) {
  try {
    const iv = Buffer.from(encoded.slice(0, 24), "hex");
    const tag = Buffer.from(encoded.slice(24, 56), "hex");
    const encrypted = Buffer.from(encoded.slice(56), "hex");
    const key = getEncryptionKey();
    const decipher = import_crypto.default.createDecipheriv(CIPHER, key, iv);
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
  return import_crypto.default.timingSafeEqual(Buffer.from(key), Buffer.from(stored));
}
function verifySession(token) {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = import_crypto.default.createHmac("sha256", process.env.THIRD_AUDIENCE_SECRET ?? "ta-salt").update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  return import_crypto.default.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
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
function unauthorizedResponse() {
  return import_server.NextResponse.json(
    { error: "Unauthorized. Provide X-TA-Api-Key header or a valid session cookie." },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="Third Audience API"' }
    }
  );
}

// src/dashboard/routes/analytics-api-route.ts
var stats = new PerformanceStats();
async function GET(req) {
  if (!await checkApiAuth(req)) {
    return unauthorizedResponse();
  }
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const summary = await stats.compute(days);
  return import_server2.NextResponse.json(summary);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET
});
//# sourceMappingURL=analytics-api-route.js.map