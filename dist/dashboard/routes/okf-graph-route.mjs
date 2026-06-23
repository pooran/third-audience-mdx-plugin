// src/dashboard/routes/okf-graph-route.ts
import { NextResponse as NextResponse2 } from "next/server";
import path2 from "path";

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

// src/okf/okf-bundle.ts
var renderer = new MarkdownRenderer();
function buildOkfGraph(files, baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  const slugSet = new Set(files.map((f) => f.slug));
  const mdMap = /* @__PURE__ */ new Map();
  for (const file of files) {
    mdMap.set(file.slug, renderer.render(file));
  }
  const degrees = new Map(files.map((f) => [f.slug, 0]));
  const rawEdges = [];
  for (const file of files) {
    const md = mdMap.get(file.slug) ?? "";
    const linkRe = /\[([^\]]+)\]\((\/[^)]+)\)/g;
    let m;
    while ((m = linkRe.exec(md)) !== null) {
      const candidate = m[2].replace(/^\//, "").replace(/\.md$/, "");
      if (slugSet.has(candidate) && candidate !== file.slug) {
        rawEdges.push({ source: file.slug, target: candidate });
        degrees.set(file.slug, (degrees.get(file.slug) ?? 0) + 1);
        degrees.set(candidate, (degrees.get(candidate) ?? 0) + 1);
      }
    }
  }
  const top100 = files.slice().sort((a, b) => (degrees.get(b.slug) ?? 0) - (degrees.get(a.slug) ?? 0)).slice(0, 100);
  const topSet = new Set(top100.map((f) => f.slug));
  const nodes = top100.map((f) => ({
    id: f.slug,
    title: String(f.frontmatter.title ?? f.slug),
    type: String(f.frontmatter.type ?? "WebPage"),
    url: `${base}/${f.slug}`
  }));
  const edges = rawEdges.filter((e) => topSet.has(e.source) && topSet.has(e.target));
  return { nodes, edges };
}

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
function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized. Provide X-TA-Api-Key header or a valid session cookie." },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="Third Audience API"' }
    }
  );
}

// src/dashboard/routes/okf-graph-route.ts
var reader = new MdxReader({ contentDir: path2.join(process.cwd(), process.env.TA_CONTENT_DIR ?? "content") });
async function GET(req) {
  if (!checkApiAuth(req)) return unauthorizedResponse();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const files = reader.readAll();
  const graph = buildOkfGraph(files, baseUrl);
  return NextResponse2.json({
    graph,
    stats: {
      pages: files.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length
    },
    indexUrl: `${baseUrl}/okf`
  });
}
export {
  GET
};
//# sourceMappingURL=okf-graph-route.mjs.map