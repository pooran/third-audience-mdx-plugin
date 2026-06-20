import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

interface CacheEntry {
  content: string
  etag: string
  cachedAt: number
  ttl: number
}

/**
 * Two-tier cache:
 * 1. In-memory LRU (per Node.js process, instant)
 * 2. File-system cache in data/ta-cache/ (survives restarts)
 */
export class CacheManager {
  private memCache = new Map<string, CacheEntry>()
  private cacheDir: string
  private maxMemoryEntries: number
  private defaultTtl: number

  constructor(opts: { cacheDir: string; maxMemoryEntries?: number; ttl?: number }) {
    this.cacheDir = opts.cacheDir
    this.maxMemoryEntries = opts.maxMemoryEntries ?? 500
    this.defaultTtl = opts.ttl ?? 3600
  }

  get(key: string): string | null {
    // Check memory first
    const mem = this.memCache.get(key)
    if (mem && this.isValid(mem)) return mem.content
    if (mem) this.memCache.delete(key)

    // Check file cache
    const file = this.readFileCache(key)
    if (file && this.isValid(file)) {
      this.setMemory(key, file)
      return file.content
    }

    return null
  }

  set(key: string, content: string, etag = '', ttl = this.defaultTtl): void {
    const entry: CacheEntry = { content, etag, cachedAt: Date.now(), ttl }
    this.setMemory(key, entry)
    this.writeFileCache(key, entry)
  }

  /** Invalidate by key prefix — used when source .mdx file changes. */
  invalidate(keyPrefix: string): void {
    for (const k of this.memCache.keys()) {
      if (k.startsWith(keyPrefix)) this.memCache.delete(k)
    }
    const dir = this.cacheDir
    if (!fs.existsSync(dir)) return
    for (const file of fs.readdirSync(dir)) {
      if (file.startsWith(this.hashKey(keyPrefix).slice(0, 8))) {
        fs.unlinkSync(path.join(dir, file))
      }
    }
  }

  stats(): { memEntries: number; fsEntries: number } {
    const fsEntries = fs.existsSync(this.cacheDir)
      ? fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json')).length
      : 0
    return { memEntries: this.memCache.size, fsEntries }
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt < entry.ttl * 1000
  }

  private setMemory(key: string, entry: CacheEntry): void {
    if (this.memCache.size >= this.maxMemoryEntries) {
      // Evict oldest entry
      const firstKey = this.memCache.keys().next().value
      if (firstKey) this.memCache.delete(firstKey)
    }
    this.memCache.set(key, entry)
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex')
  }

  private filePath(key: string): string {
    return path.join(this.cacheDir, `${this.hashKey(key)}.json`)
  }

  private readFileCache(key: string): CacheEntry | null {
    const fp = this.filePath(key)
    if (!fs.existsSync(fp)) return null
    try {
      return JSON.parse(fs.readFileSync(fp, 'utf-8')) as CacheEntry
    } catch {
      return null
    }
  }

  private writeFileCache(key: string, entry: CacheEntry): void {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true })
      fs.writeFileSync(this.filePath(key), JSON.stringify(entry), 'utf-8')
    } catch {
      // Cache writes must never throw
    }
  }
}
