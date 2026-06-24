import type { VisitRecord } from '../analytics/visit-tracker.js'
import type { CitationRecord } from '../citations/citation-tracker.js'

export interface AdminRecord {
  passwordHash: string
  isDefaultPassword: boolean
  createdAt: string
  lastLoginAt: string | null
  apiKey?: string
}

export interface BotsConfig {
  allowlist: string[]
  blocklist: string[]
  track_unknown: boolean
}

export interface CacheEntry {
  content: string
  etag: string
  cachedAt: number
  ttl: number
}

export interface Store {
  // Admin
  getAdmin(): Promise<AdminRecord | null>
  saveAdmin(record: AdminRecord): Promise<void>

  // Bots config
  getBotsConfig(): Promise<BotsConfig>
  saveBotsConfig(config: BotsConfig): Promise<void>

  // Visits
  appendVisit(record: VisitRecord): Promise<void>
  getVisits(sinceIso: string): Promise<VisitRecord[]>

  // Citations
  appendCitation(record: CitationRecord): Promise<void>
  getCitations(sinceIso: string): Promise<CitationRecord[]>
  getAllCitations(): Promise<CitationRecord[]>

  // Cache
  getCache(key: string): Promise<CacheEntry | null>
  setCache(key: string, entry: CacheEntry): Promise<void>
  deleteCache(keyPrefix: string): Promise<void>

  // Key-value store for internal state (digest timestamps, rate-limit flags)
  getKv(key: string): Promise<string | null>
  setKv(key: string, value: string): Promise<void>
}
