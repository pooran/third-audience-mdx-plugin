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

// src/dashboard/routes/track-route.ts
var track_route_exports = {};
__export(track_route_exports, {
  GET: () => GET
});
module.exports = __toCommonJS(track_route_exports);
var import_server = require("next/server");

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
    geoip = require("geoip-lite");
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
      url: meta.url ?? req.nextUrl.pathname,
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

// src/dashboard/routes/track-route.ts
async function GET(req) {
  const originalUrl = req.headers.get("x-ta-original-url") ?? void 0;
  VisitTracker.getInstance().record(req, { url: originalUrl });
  return new import_server.NextResponse(null, { status: 204 });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET
});
//# sourceMappingURL=track-route.js.map