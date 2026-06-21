import { getStore } from '../storage/get-store.js'
import type { CacheEntry } from '../storage/store.js'

export class CacheManager {
  private memCache = new Map<string, CacheEntry>()
  private maxMemoryEntries: number
  private defaultTtl: number

  constructor(opts: { cacheDir?: string; maxMemoryEntries?: number; ttl?: number } = {}) {
    this.maxMemoryEntries = opts.maxMemoryEntries ?? 500
    this.defaultTtl = opts.ttl ?? 3600
  }

  get(key: string): string | null {
    const mem = this.memCache.get(key)
    if (mem && this.isValid(mem)) return mem.content
    if (mem) this.memCache.delete(key)
    return null
  }

  async getAsync(key: string): Promise<string | null> {
    const mem = this.memCache.get(key)
    if (mem && this.isValid(mem)) return mem.content
    if (mem) this.memCache.delete(key)

    const entry = await getStore().getCache(key)
    if (entry && this.isValid(entry)) {
      this.setMemory(key, entry)
      return entry.content
    }
    return null
  }

  set(key: string, content: string, etag = '', ttl = this.defaultTtl): void {
    const entry: CacheEntry = { content, etag, cachedAt: Date.now(), ttl }
    this.setMemory(key, entry)
    getStore().setCache(key, entry).catch(() => {})
  }

  invalidate(keyPrefix: string): void {
    for (const k of this.memCache.keys()) {
      if (k.startsWith(keyPrefix)) this.memCache.delete(k)
    }
    getStore().deleteCache(keyPrefix).catch(() => {})
  }

  stats(): { memEntries: number } {
    return { memEntries: this.memCache.size }
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt < entry.ttl * 1000
  }

  private setMemory(key: string, entry: CacheEntry): void {
    if (this.memCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memCache.keys().next().value
      if (firstKey) this.memCache.delete(firstKey)
    }
    this.memCache.set(key, entry)
  }
}
