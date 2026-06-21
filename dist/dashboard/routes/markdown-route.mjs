var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
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
import fs2 from "fs";
import path2 from "path";
function dbPath() {
  const dataDir = path2.join(process.cwd(), process.env.TA_DATA_DIR ?? "data");
  return path2.join(dataDir, "ta-data.db");
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
  fs2.mkdirSync(path2.dirname(file), { recursive: true });
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

// src/dashboard/routes/markdown-route.ts
import { NextResponse } from "next/server";
import path3 from "path";

// src/core/mdx-reader.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
var MdxReader = class {
  constructor(options) {
    this.contentDir = options.contentDir;
    this.stripSegments = options.stripSegments ?? [];
  }
  /**
   * Remove configured URL-only segments from a slug so it maps to the file
   * layout. e.g. stripSegments ['learn'] turns 'en/learn/hydroponics/x' into
   * 'en/hydroponics/x'. Only whole path segments are removed.
   */
  applyStrip(slug) {
    if (this.stripSegments.length === 0) return slug;
    const drop = new Set(this.stripSegments);
    return slug.split("/").filter((seg) => !drop.has(seg)).join("/");
  }
  /** Read a single MDX file by slug. Returns null if not found. */
  read(slug) {
    const resolved = this.applyStrip(slug);
    const candidates = [
      path.join(this.contentDir, `${resolved}.mdx`),
      path.join(this.contentDir, `${resolved}.md`),
      path.join(this.contentDir, resolved, "index.mdx"),
      path.join(this.contentDir, resolved, "index.md")
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return this.parseFile(slug, filePath);
      }
    }
    return null;
  }
  /** Read all MDX files recursively. */
  readAll() {
    if (!fs.existsSync(this.contentDir)) return [];
    return this.walkDir(this.contentDir, this.contentDir);
  }
  walkDir(dir, root) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkDir(fullPath, root));
      } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
        const relative = path.relative(root, fullPath);
        const slug = relative.replace(/\.(mdx|md)$/, "").replace(/\/index$/, "");
        results.push(this.parseFile(slug, fullPath));
      }
    }
    return results;
  }
  parseFile(slug, filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: rawContent } = matter(raw);
    return { slug, filePath, frontmatter, rawContent };
  }
};

// src/core/markdown-renderer.ts
var MarkdownRenderer = class {
  render(file) {
    const header = this.buildFrontmatterHeader(file.frontmatter);
    const body = this.stripJsx(file.rawContent);
    return header ? `${header}

${body}` : body;
  }
  buildFrontmatterHeader(fm) {
    const keys = Object.keys(fm);
    if (keys.length === 0) return "";
    const lines = keys.filter((k) => fm[k] !== void 0 && fm[k] !== null).map((k) => `${k}: ${this.yamlValue(fm[k])}`);
    return `---
${lines.join("\n")}
---`;
  }
  yamlValue(val) {
    if (typeof val === "string") {
      return /[:#\[\]{},&*?|<>=!%@`]/.test(val) ? `"${val.replace(/"/g, '\\"')}"` : val;
    }
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) return `[${val.map((v) => this.yamlValue(v)).join(", ")}]`;
    return String(val);
  }
  stripJsx(content) {
    let out = content;
    out = out.replace(/^import\s+.*?['"].*?['"]\s*\n?/gm, "");
    out = out.replace(/^export\s+(?:default\s+)?(?:const|let|var|function|class)\s+[\s\S]*?(?=\n(?=[^{]|\n)|\n{2,})/gm, "");
    out = out.replace(/^export\s*\{[^}]*\}\s*(?:from\s+['"][^'"]*['"])?\s*\n?/gm, "");
    out = out.replace(/<([A-Z][A-Za-z0-9.]*)[^>]*\/>/g, "");
    out = out.replace(/<([A-Z][A-Za-z0-9.]*)[^>]*>[\s\S]*?<\/\1>/g, "");
    out = out.replace(/^\s*\{[^}]+\}\s*\n/gm, "");
    out = out.replace(/\n{3,}/g, "\n\n");
    return out.trim();
  }
};

// src/storage/get-store.ts
var _store = null;
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

// src/cache/cache-manager.ts
var CacheManager = class {
  constructor(opts = {}) {
    this.memCache = /* @__PURE__ */ new Map();
    this.maxMemoryEntries = opts.maxMemoryEntries ?? 500;
    this.defaultTtl = opts.ttl ?? 3600;
  }
  get(key) {
    const mem = this.memCache.get(key);
    if (mem && this.isValid(mem)) return mem.content;
    if (mem) this.memCache.delete(key);
    return null;
  }
  async getAsync(key) {
    const mem = this.memCache.get(key);
    if (mem && this.isValid(mem)) return mem.content;
    if (mem) this.memCache.delete(key);
    const entry = await getStore().getCache(key);
    if (entry && this.isValid(entry)) {
      this.setMemory(key, entry);
      return entry.content;
    }
    return null;
  }
  set(key, content, etag = "", ttl = this.defaultTtl) {
    const entry = { content, etag, cachedAt: Date.now(), ttl };
    this.setMemory(key, entry);
    getStore().setCache(key, entry).catch(() => {
    });
  }
  invalidate(keyPrefix) {
    for (const k of this.memCache.keys()) {
      if (k.startsWith(keyPrefix)) this.memCache.delete(k);
    }
    getStore().deleteCache(keyPrefix).catch(() => {
    });
  }
  stats() {
    return { memEntries: this.memCache.size };
  }
  isValid(entry) {
    return Date.now() - entry.cachedAt < entry.ttl * 1e3;
  }
  setMemory(key, entry) {
    if (this.memCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memCache.keys().next().value;
      if (firstKey) this.memCache.delete(firstKey);
    }
    this.memCache.set(key, entry);
  }
};

// src/detection/known-patterns.ts
var KNOWN_BOTS = [
  // AI Crawlers
  { name: "ClaudeBot", category: "ai_crawler", patterns: [/claudebot/i, /claude-web/i] },
  { name: "GPTBot", category: "ai_crawler", patterns: [/gptbot/i] },
  { name: "ChatGPT-User", category: "ai_crawler", patterns: [/chatgpt-user/i] },
  { name: "PerplexityBot", category: "ai_crawler", patterns: [/perplexitybot/i] },
  { name: "Googlebot-AI", category: "ai_crawler", patterns: [/google-extended/i, /googleother/i] },
  { name: "FacebookBot", category: "ai_crawler", patterns: [/facebookbot/i] },
  { name: "Applebot-Extended", category: "ai_crawler", patterns: [/applebot-extended/i] },
  { name: "YouBot", category: "ai_crawler", patterns: [/youbot/i] },
  { name: "CCBot", category: "ai_crawler", patterns: [/ccbot/i] },
  { name: "CohereCrawler", category: "ai_crawler", patterns: [/cohere-ai/i] },
  { name: "AI2Bot", category: "ai_crawler", patterns: [/ai2bot/i] },
  { name: "Bytespider", category: "ai_crawler", patterns: [/bytespider/i] },
  { name: "Diffbot", category: "ai_crawler", patterns: [/diffbot/i] },
  // Search Engines
  { name: "Googlebot", category: "search_engine", patterns: [/googlebot/i] },
  { name: "Bingbot", category: "search_engine", patterns: [/bingbot/i, /msnbot/i] },
  { name: "DuckDuckBot", category: "search_engine", patterns: [/duckduckbot/i] },
  { name: "Baiduspider", category: "search_engine", patterns: [/baiduspider/i] },
  { name: "YandexBot", category: "search_engine", patterns: [/yandexbot/i] },
  { name: "Sogou", category: "search_engine", patterns: [/sogou/i] },
  { name: "Exabot", category: "search_engine", patterns: [/exabot/i] },
  { name: "ia_archiver", category: "search_engine", patterns: [/ia_archiver/i] }
];

// src/detection/bot-detection-pipeline.ts
function detectBot(input) {
  const ua = input.userAgent ?? "";
  for (const bot of KNOWN_BOTS) {
    for (const pattern of bot.patterns) {
      if (pattern.test(ua)) {
        return {
          isBot: true,
          botName: bot.name,
          confidence: "high",
          detectionMethod: "known_pattern",
          category: bot.category,
          rawUserAgent: ua
        };
      }
    }
  }
  const heuristicResult = checkHeuristics(ua, input.headers ?? {});
  if (heuristicResult) return { ...heuristicResult, rawUserAgent: ua };
  if (looksLikeBotUa(ua)) {
    return {
      isBot: true,
      botName: null,
      confidence: "low",
      detectionMethod: "auto_learned",
      category: "unknown_bot",
      rawUserAgent: ua
    };
  }
  return {
    isBot: false,
    botName: null,
    confidence: "high",
    detectionMethod: "none",
    category: "human",
    rawUserAgent: ua
  };
}
function checkHeuristics(ua, headers) {
  if (/headlesschrome/i.test(ua)) {
    return { isBot: true, botName: "HeadlessChrome", confidence: "medium", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  if (/phantomjs/i.test(ua)) {
    return { isBot: true, botName: "PhantomJS", confidence: "high", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  if (/selenium/i.test(ua)) {
    return { isBot: true, botName: "Selenium", confidence: "high", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  if (ua.trim().length < 10) {
    return { isBot: true, botName: null, confidence: "low", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  const hasAcceptLang = !!headers["accept-language"];
  const hasAcceptEncoding = !!headers["accept-encoding"];
  const claimsBrowser = /chrome|firefox|safari|edge|opera|gecko|applewebkit/i.test(ua);
  if (!hasAcceptLang && !hasAcceptEncoding && !claimsBrowser) {
    return { isBot: true, botName: null, confidence: "low", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  return null;
}
function looksLikeBotUa(ua) {
  return /bot|crawler|spider|scraper|fetch|http|python|curl|java|ruby|go-http|node/i.test(ua) && !/chrome|firefox|safari|edge|opera/i.test(ua);
}

// src/analytics/geolocation.ts
var geoip = null;
function loadGeoip() {
  if (geoip) return geoip;
  try {
    geoip = __require("geoip-lite");
  } catch {
    geoip = null;
  }
  return geoip;
}
function getCountry(ip) {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("::")) return null;
  const geo = loadGeoip();
  if (!geo) return null;
  try {
    const result = geo.lookup(ip);
    return result?.country ?? null;
  } catch {
    return null;
  }
}

// src/analytics/visit-tracker.ts
var _VisitTracker = class _VisitTracker {
  static getInstance() {
    if (!_VisitTracker.instance) {
      _VisitTracker.instance = new _VisitTracker();
    }
    return _VisitTracker.instance;
  }
  record(req, meta = {}) {
    const ua = req.headers.get("user-agent") ?? "";
    const headers = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const result = detectBot({ userAgent: ua, headers });
    if (!result.isBot) return;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const record = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      bot_name: result.botName,
      bot_category: result.category,
      detection_method: result.detectionMethod,
      confidence: result.confidence,
      url: req.nextUrl.pathname,
      ip,
      country: getCountry(ip),
      user_agent: ua,
      referer: req.headers.get("referer"),
      response_ms: meta.responseMs ?? null,
      cache_hit: meta.cacheHit ?? false,
      content_length: meta.contentLength ?? null
    };
    getStore().appendVisit(record).catch(() => {
    });
  }
};
_VisitTracker.instance = null;
var VisitTracker = _VisitTracker;

// src/dashboard/routes/markdown-route.ts
var reader = new MdxReader({
  contentDir: path3.join(process.cwd(), process.env.TA_CONTENT_DIR ?? "content"),
  stripSegments: (process.env.TA_STRIP_SEGMENTS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
});
var renderer = new MarkdownRenderer();
var cache = new CacheManager({
  cacheDir: path3.join(process.cwd(), process.env.TA_DATA_DIR ?? "data", "ta-cache")
});
async function GET(req, { params }) {
  const startedAt = Date.now();
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const cacheKey = `markdown:${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    VisitTracker.getInstance().record(req, {
      responseMs: Date.now() - startedAt,
      cacheHit: true,
      contentLength: cached.length
    });
    return new NextResponse(cached, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Cache": "HIT"
      }
    });
  }
  const file = reader.read(slug);
  if (!file) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const markdown = renderer.render(file);
  cache.set(cacheKey, markdown);
  VisitTracker.getInstance().record(req, {
    responseMs: Date.now() - startedAt,
    cacheHit: false,
    contentLength: markdown.length
  });
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Cache": "MISS"
    }
  });
}
export {
  GET
};
//# sourceMappingURL=markdown-route.mjs.map