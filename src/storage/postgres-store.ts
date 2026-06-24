import { Client } from 'pg'
import type { Store, AdminRecord, BotsConfig, CacheEntry } from './store.js'
import type { VisitRecord } from '../analytics/visit-tracker.js'
import type { CitationRecord } from '../citations/citation-tracker.js'

let _client: Client | null = null

async function getClient(): Promise<Client> {
  if (_client) return _client
  const url = process.env.TA_STORAGE_URL
  if (!url) throw new Error('TA_STORAGE_URL is required for postgres/supabase storage')
  const sslUrl = url.replace(/[?&]sslmode=[^&]*/g, '')
  _client = new Client({ connectionString: sslUrl, ssl: { rejectUnauthorized: false } })
  await _client.connect()
  await migrate(_client)
  return _client
}

async function migrate(client: Client): Promise<void> {
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
  `)
}

export class PostgresStore implements Store {
  private clientPromise = getClient()

  private async q(sql: string, params: unknown[] = []) {
    const client = await this.clientPromise
    return client.query(sql, params)
  }

  async getAdmin(): Promise<AdminRecord | null> {
    const { rows } = await this.q('SELECT * FROM ta_admin WHERE id = 1')
    if (!rows[0]) return null
    const r = rows[0]
    return {
      passwordHash: r.password_hash,
      isDefaultPassword: r.is_default_password,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at ?? null,
      apiKey: r.api_key ?? undefined,
    }
  }

  async saveAdmin(record: AdminRecord): Promise<void> {
    await this.q(`
      INSERT INTO ta_admin (id, password_hash, is_default_password, created_at, last_login_at, api_key)
      VALUES (1, $1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        password_hash       = EXCLUDED.password_hash,
        is_default_password = EXCLUDED.is_default_password,
        created_at          = EXCLUDED.created_at,
        last_login_at       = EXCLUDED.last_login_at,
        api_key             = EXCLUDED.api_key
    `, [record.passwordHash, record.isDefaultPassword, record.createdAt, record.lastLoginAt, record.apiKey ?? null])
  }

  async getBotsConfig(): Promise<BotsConfig> {
    const { rows } = await this.q('SELECT * FROM ta_bots_config WHERE id = 1')
    if (!rows[0]) return { allowlist: [], blocklist: [], track_unknown: true }
    const r = rows[0]
    return {
      allowlist: JSON.parse(r.allowlist),
      blocklist: JSON.parse(r.blocklist),
      track_unknown: r.track_unknown,
    }
  }

  async saveBotsConfig(config: BotsConfig): Promise<void> {
    await this.q(`
      INSERT INTO ta_bots_config (id, allowlist, blocklist, track_unknown)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        allowlist     = EXCLUDED.allowlist,
        blocklist     = EXCLUDED.blocklist,
        track_unknown = EXCLUDED.track_unknown
    `, [JSON.stringify(config.allowlist), JSON.stringify(config.blocklist), config.track_unknown])
  }

  async appendVisit(r: VisitRecord): Promise<void> {
    await this.q(`
      INSERT INTO ta_visits (timestamp, bot_name, bot_category, detection_method, confidence, url, ip, country, user_agent, referer, response_ms, cache_hit, content_length)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [r.timestamp, r.bot_name, r.bot_category, r.detection_method, r.confidence, r.url, r.ip, r.country, r.user_agent, r.referer, r.response_ms, r.cache_hit, r.content_length])
  }

  async getVisits(sinceIso: string): Promise<VisitRecord[]> {
    const { rows } = await this.q('SELECT * FROM ta_visits WHERE timestamp >= $1 ORDER BY timestamp', [sinceIso])
    return rows.map(r => ({
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
      content_length: r.content_length,
    }))
  }

  async appendCitation(r: CitationRecord): Promise<void> {
    await this.q(`
      INSERT INTO ta_citations (timestamp, platform, query, url, ip, user_agent, referer)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [r.timestamp, r.platform, r.query, r.url, r.ip, r.user_agent, r.referer])
  }

  async getCitations(sinceIso: string): Promise<CitationRecord[]> {
    const { rows } = await this.q('SELECT * FROM ta_citations WHERE timestamp >= $1 ORDER BY timestamp', [sinceIso])
    return rows
  }

  async getAllCitations(): Promise<CitationRecord[]> {
    const { rows } = await this.q('SELECT * FROM ta_citations ORDER BY timestamp')
    return rows
  }

  async getCache(key: string): Promise<CacheEntry | null> {
    const { rows } = await this.q('SELECT * FROM ta_cache WHERE key = $1', [key])
    if (!rows[0]) return null
    return { content: rows[0].content, etag: rows[0].etag, cachedAt: Number(rows[0].cached_at), ttl: rows[0].ttl }
  }

  async setCache(key: string, entry: CacheEntry): Promise<void> {
    await this.q(`
      INSERT INTO ta_cache (key, content, etag, cached_at, ttl)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content, etag = EXCLUDED.etag, cached_at = EXCLUDED.cached_at, ttl = EXCLUDED.ttl
    `, [key, entry.content, entry.etag, entry.cachedAt, entry.ttl])
  }

  async deleteCache(keyPrefix: string): Promise<void> {
    await this.q('DELETE FROM ta_cache WHERE key LIKE $1', [keyPrefix + '%'])
  }

  async getKv(key: string): Promise<string | null> {
    const { rows } = await this.q('SELECT value FROM ta_kv WHERE key = $1', [key])
    return rows[0]?.value ?? null
  }

  async setKv(key: string, value: string): Promise<void> {
    await this.q('INSERT INTO ta_kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, value])
  }
}
