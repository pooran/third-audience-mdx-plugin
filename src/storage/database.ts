import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let _db: Database.Database | null = null

function dbPath(): string {
  const dataDir = path.join(process.cwd(), process.env.TA_DATA_DIR ?? 'data')
  return path.join(dataDir, 'ta-data.db')
}

export function getDb(): Database.Database {
  if (_db) return _db

  const dbFile = dbPath()
  fs.mkdirSync(path.dirname(dbFile), { recursive: true })

  _db = new Database(dbFile)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  migrate(_db)
  return _db
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id              INTEGER PRIMARY KEY,
      password_hash   TEXT    NOT NULL,
      is_default_password INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT    NOT NULL,
      last_login_at   TEXT,
      api_key         TEXT
    );

    CREATE TABLE IF NOT EXISTS bots_config (
      id              INTEGER PRIMARY KEY CHECK (id = 1),
      allowlist       TEXT    NOT NULL DEFAULT '[]',
      blocklist       TEXT    NOT NULL DEFAULT '[]',
      track_unknown   INTEGER NOT NULL DEFAULT 1
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
  `)
}
