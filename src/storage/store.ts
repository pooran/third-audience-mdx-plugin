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

  // Cache browser
  listCacheKeys(opts: { search?: string; limit: number; offset: number }): Promise<Array<CacheEntry & { key: string }>>
  countCacheKeys(search?: string): Promise<number>
  deleteCacheKey(key: string): Promise<void>
  clearExpiredCache(): Promise<number>

  // Competitor benchmarking
  getCompetitors(): Promise<CompetitorRecord[]>
  saveCompetitors(list: CompetitorRecord[]): Promise<void>
  appendBenchmark(record: BenchmarkRecord): Promise<void>
  getBenchmarks(filters: BenchmarkFilters): Promise<BenchmarkRecord[]>
  countBenchmarks(filters: BenchmarkFilters): Promise<number>
  deleteBenchmark(id: number): Promise<void>
  clearBenchmarks(): Promise<void>
}

export interface CompetitorRecord {
  url: string
  name: string
}

export interface BenchmarkRecord {
  id?: number
  competitor_url: string
  competitor_name: string
  test_prompt: string
  ai_platform: string
  cited_rank: number | null
  test_date: string
  test_notes: string
}

export interface BenchmarkFilters {
  competitor_url?: string
  ai_platform?: string
  sinceDate?: string
}
