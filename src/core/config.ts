export interface ThirdAudienceConfig {
  /** Directory containing .mdx files, relative to project root. Default: 'content' */
  contentDir?: string
  /** Directory for JSONL data files. Default: 'data' */
  dataDir?: string
  /** Mount the /third-audience/ dashboard. Default: true */
  dashboard?: boolean
  /** Secret for dashboard access (HTTP Basic or bearer). Required when dashboard: true */
  dashboardSecret?: string
  notifications?: {
    email?: { smtp: string; to: string; from?: string }
    slack?: { webhookUrl: string }
  }
  bots?: {
    allowlist?: string[]
    blocklist?: string[]
  }
  cache?: {
    /** Cache TTL in seconds. Default: 3600 */
    ttl?: number
    /** Max in-memory entries. Default: 500 */
    maxMemoryEntries?: number
  }
}

export const defaultConfig: Required<ThirdAudienceConfig> = {
  contentDir: 'content',
  dataDir: 'data',
  dashboard: true,
  dashboardSecret: '',
  notifications: {},
  bots: { allowlist: [], blocklist: [] },
  cache: { ttl: 3600, maxMemoryEntries: 500 },
}

export function resolveConfig(partial: ThirdAudienceConfig = {}): Required<ThirdAudienceConfig> {
  return {
    ...defaultConfig,
    ...partial,
    bots: { ...defaultConfig.bots, ...partial.bots },
    cache: { ...defaultConfig.cache, ...partial.cache },
    notifications: { ...defaultConfig.notifications, ...partial.notifications },
  }
}
