import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import type { Store, AdminRecord, BotsConfig, CacheEntry } from './store.js'
import type { VisitRecord } from '../analytics/visit-tracker.js'
import type { CitationRecord } from '../citations/citation-tracker.js'

function dbPath(): string {
  const dataDir = path.join(process.cwd(), process.env.TA_DATA_DIR ?? 'data')
  return path.join(dataDir, 'ta-data.db')
}

function migrate(db: Database.Database): void {
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
    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  const file = dbPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  _db = new Database(file)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  migrate(_db)
  return _db
}

export class SqliteStore implements Store {
  private get db() { return getDb() }

  async getAdmin(): Promise<AdminRecord | null> {
    const row = this.db.prepare('SELECT * FROM admin WHERE id = 1').get() as Record<string, unknown> | undefined
    if (!row) return null
    return {
      passwordHash: row.password_hash as string,
      isDefaultPassword: Boolean(row.is_default_password),
      createdAt: row.created_at as string,
      lastLoginAt: row.last_login_at as string | null,
      apiKey: row.api_key as string | undefined,
    }
  }

  async saveAdmin(record: AdminRecord): Promise<void> {
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
      record.apiKey ?? null,
    )
  }

  async getBotsConfig(): Promise<BotsConfig> {
    const row = this.db.prepare('SELECT * FROM bots_config WHERE id = 1').get() as Record<string, unknown> | undefined
    if (!row) return { allowlist: [], blocklist: [], track_unknown: true }
    return {
      allowlist: JSON.parse(row.allowlist as string),
      blocklist: JSON.parse(row.blocklist as string),
      track_unknown: Boolean(row.track_unknown),
    }
  }

  async saveBotsConfig(config: BotsConfig): Promise<void> {
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
      config.track_unknown ? 1 : 0,
    )
  }

  async appendVisit(r: VisitRecord): Promise<void> {
    this.db.prepare(`
      INSERT INTO visits (timestamp, bot_name, bot_category, detection_method, confidence, url, ip, country, user_agent, referer, response_ms, cache_hit, content_length)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r.timestamp, r.bot_name, r.bot_category, r.detection_method, r.confidence, r.url, r.ip, r.country, r.user_agent, r.referer, r.response_ms, r.cache_hit ? 1 : 0, r.content_length)
  }

  async getVisits(sinceIso: string): Promise<VisitRecord[]> {
    const rows = this.db.prepare('SELECT * FROM visits WHERE timestamp >= ? ORDER BY timestamp').all(sinceIso) as Record<string, unknown>[]
    return rows.map(r => ({
      timestamp: r.timestamp as string,
      bot_name: r.bot_name as string | null,
      bot_category: r.bot_category as string,
      detection_method: r.detection_method as string,
      confidence: r.confidence as string,
      url: r.url as string,
      ip: r.ip as string,
      country: r.country as string | null,
      user_agent: r.user_agent as string,
      referer: r.referer as string | null,
      response_ms: r.response_ms as number | null,
      cache_hit: Boolean(r.cache_hit),
      content_length: r.content_length as number | null,
    }))
  }

  async appendCitation(r: CitationRecord): Promise<void> {
    this.db.prepare(`
      INSERT INTO citations (timestamp, platform, query, url, ip, user_agent, referer)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(r.timestamp, r.platform, r.query, r.url, r.ip, r.user_agent, r.referer)
  }

  async getCitations(sinceIso: string): Promise<CitationRecord[]> {
    return this.db.prepare('SELECT * FROM citations WHERE timestamp >= ? ORDER BY timestamp').all(sinceIso) as CitationRecord[]
  }

  async getAllCitations(): Promise<CitationRecord[]> {
    return this.db.prepare('SELECT * FROM citations ORDER BY timestamp').all() as CitationRecord[]
  }

  async getCache(key: string): Promise<CacheEntry | null> {
    const row = this.db.prepare('SELECT * FROM cache WHERE key = ?').get(key) as Record<string, unknown> | undefined
    if (!row) return null
    return { content: row.content as string, etag: row.etag as string, cachedAt: row.cached_at as number, ttl: row.ttl as number }
  }

  async setCache(key: string, entry: CacheEntry): Promise<void> {
    this.db.prepare(`
      INSERT INTO cache (key, content, etag, cached_at, ttl) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET content = excluded.content, etag = excluded.etag, cached_at = excluded.cached_at, ttl = excluded.ttl
    `).run(key, entry.content, entry.etag, entry.cachedAt, entry.ttl)
  }

  async deleteCache(keyPrefix: string): Promise<void> {
    this.db.prepare('DELETE FROM cache WHERE key LIKE ?').run(keyPrefix + '%')
  }

  async getKv(key: string): Promise<string | null> {
    const row = this.db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  async setKv(key: string, value: string): Promise<void> {
    this.db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
  }
}
