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

// src/storage/get-store.ts
function getStore() {
  if (_store) return _store;
  const type = process.env.TA_STORAGE_TYPE ?? "sqlite";
  if (type === "postgres") {
    const { PostgresStore: PostgresStore2 } = (init_postgres_store(), __toCommonJS(postgres_store_exports));
    _store = new PostgresStore2();
  } else {
    const { SqliteStore: SqliteStore2 } = (init_sqlite_store(), __toCommonJS(sqlite_store_exports));
    _store = new SqliteStore2();
  }
  return _store;
}
var _store;
var init_get_store = __esm({
  "src/storage/get-store.ts"() {
    "use strict";
    _store = null;
  }
});

// src/dashboard/admin-store.ts
var admin_store_exports = {};
__export(admin_store_exports, {
  DEFAULT_PASSWORD: () => DEFAULT_PASSWORD,
  decryptApiKey: () => decryptApiKey,
  encryptApiKey: () => encryptApiKey,
  generateApiKey: () => generateApiKey,
  generateDefaultPassword: () => generateDefaultPassword,
  getApiKey: () => getApiKey,
  hashPassword: () => hashPassword,
  initAdmin: () => initAdmin,
  loadAdmin: () => loadAdmin,
  recordLogin: () => recordLogin,
  rotateApiKey: () => rotateApiKey,
  saveAdmin: () => saveAdmin,
  signSession: () => signSession,
  updatePassword: () => updatePassword,
  verifyApiKey: () => verifyApiKey,
  verifyPassword: () => verifyPassword,
  verifySession: () => verifySession
});
function generateDefaultPassword() {
  return import_crypto.default.randomBytes(6).toString("hex");
}
function hashPassword(password) {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? "ta-salt";
  return import_crypto.default.createHash("sha256").update(secret + password).digest("hex");
}
function loadAdmin() {
  return getStore().getAdmin();
}
function saveAdmin(record) {
  return getStore().saveAdmin(record);
}
async function initAdmin() {
  const existing = await getStore().getAdmin();
  if (existing) return { password: "", apiKey: "", isNew: false };
  const apiKey = generateApiKey();
  await getStore().saveAdmin({
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    isDefaultPassword: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLoginAt: null,
    apiKey: encryptApiKey(apiKey)
  });
  return { password: DEFAULT_PASSWORD, apiKey, isNew: true };
}
async function verifyPassword(password) {
  const record = await getStore().getAdmin();
  if (!record) return false;
  return record.passwordHash === hashPassword(password);
}
async function updatePassword(newPassword) {
  const record = await getStore().getAdmin();
  if (!record) return;
  await getStore().saveAdmin({ ...record, passwordHash: hashPassword(newPassword), isDefaultPassword: false });
}
async function recordLogin() {
  const record = await getStore().getAdmin();
  if (!record) return;
  await getStore().saveAdmin({ ...record, lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
}
function getEncryptionKey() {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? "ta-fallback-key-change-me";
  return import_crypto.default.createHash("sha256").update(secret).digest();
}
function encryptApiKey(plaintext) {
  const iv = import_crypto.default.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = import_crypto.default.createCipheriv(CIPHER, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + tag.toString("hex") + encrypted.toString("hex");
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
function generateApiKey() {
  return "ta_" + import_crypto.default.randomBytes(24).toString("hex");
}
async function getApiKey() {
  const record = await getStore().getAdmin();
  if (!record?.apiKey) return null;
  return decryptApiKey(record.apiKey);
}
async function rotateApiKey() {
  const record = await getStore().getAdmin();
  if (!record) throw new Error("Admin store not initialised");
  const newKey = generateApiKey();
  await getStore().saveAdmin({ ...record, apiKey: encryptApiKey(newKey) });
  return newKey;
}
async function verifyApiKey(key) {
  const stored = await getApiKey();
  if (!stored) return false;
  if (key.length !== stored.length) return false;
  return import_crypto.default.timingSafeEqual(Buffer.from(key), Buffer.from(stored));
}
function signSession(payload) {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? "ta-salt";
  const sig = import_crypto.default.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
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
var import_crypto, DEFAULT_PASSWORD, CIPHER;
var init_admin_store = __esm({
  "src/dashboard/admin-store.ts"() {
    "use strict";
    import_crypto = __toESM(require("crypto"));
    init_get_store();
    DEFAULT_PASSWORD = "Chang3M3Now!";
    CIPHER = "aes-256-gcm";
  }
});

// src/dashboard/routes/login-route.ts
var login_route_exports = {};
__export(login_route_exports, {
  GET: () => GET,
  POST: () => POST
});
module.exports = __toCommonJS(login_route_exports);
var import_server = require("next/server");
init_admin_store();
var COOKIE_NAME = "ta_session";
var COOKIE_MAX_AGE = 60 * 60 * 8;
var LOGIN_HTML = (error, reset) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${reset ? "Reset Password" : "Third Audience \u2014 Login"}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f7; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 40px 48px; width: 100%; max-width: 380px; }
    .logo { font-size: 22px; font-weight: 700; color: #1d1d1f; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #6e6e73; margin-bottom: 32px; }
    label { display: block; font-size: 13px; font-weight: 500; color: #1d1d1f; margin-bottom: 6px; }
    input[type=password] { width: 100%; padding: 10px 14px; border: 1.5px solid #d2d2d7; border-radius: 10px; font-size: 15px; outline: none; transition: border-color .15s; }
    input[type=password]:focus { border-color: #007aff; }
    .error { background: #fff2f2; border: 1px solid #ffbaba; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #c0392b; margin-bottom: 20px; }
    .btn { width: 100%; background: #007aff; color: #fff; border: none; border-radius: 10px; padding: 12px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: background .15s; }
    .btn:hover { background: #0062cc; }
    .hint { font-size: 12px; color: #6e6e73; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Third Audience</div>
    <div class="subtitle">${reset ? "Choose a new password to continue" : "Sign in to your dashboard"}</div>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST">
      ${reset ? `
      <div style="margin-bottom:16px">
        <label for="password">New password</label>
        <input id="password" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters">
      </div>
      <div>
        <label for="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autocomplete="new-password" required placeholder="Repeat password">
      </div>
      <input type="hidden" name="action" value="reset">
      <button class="btn" type="submit">Set password</button>
      ` : `
      <div>
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password">
      </div>
      <button class="btn" type="submit">Sign in</button>
      `}
      <p class="hint">Third Audience Dashboard</p>
    </form>
  </div>
</body>
</html>`;
async function GET(req) {
  const reset = req.nextUrl.searchParams.get("reset") === "1";
  return new import_server.NextResponse(LOGIN_HTML(void 0, reset), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
async function POST(req) {
  const body = await req.formData();
  const action = body.get("action");
  const password = body.get("password");
  const confirm = body.get("confirm");
  if (action === "reset") {
    if (!password || password.length < 8) {
      return new import_server.NextResponse(LOGIN_HTML("Password must be at least 8 characters.", true), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (password !== confirm) {
      return new import_server.NextResponse(LOGIN_HTML("Passwords do not match.", true), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    const { updatePassword: updatePassword2 } = await Promise.resolve().then(() => (init_admin_store(), admin_store_exports));
    await updatePassword2(password);
    const token2 = signSession("admin:" + Date.now());
    const res2 = import_server.NextResponse.redirect(new URL("/third-audience/", req.nextUrl));
    res2.cookies.set(COOKIE_NAME, token2, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/"
    });
    return res2;
  }
  if (!password || !await verifyPassword(password)) {
    return new import_server.NextResponse(LOGIN_HTML("Incorrect password."), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
  await recordLogin();
  const admin = await loadAdmin();
  const token = signSession("admin:" + Date.now());
  if (admin?.isDefaultPassword) {
    const res2 = import_server.NextResponse.redirect(new URL("/third-audience/login?reset=1", req.nextUrl));
    res2.cookies.set(COOKIE_NAME + "_reset", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 300,
      path: "/third-audience/login"
    });
    return res2;
  }
  const res = import_server.NextResponse.redirect(new URL("/third-audience/", req.nextUrl));
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/"
  });
  return res;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET,
  POST
});
//# sourceMappingURL=login-route.js.map