export type StorageConfig =
  | { type: 'sqlite' }
  | { type: 'postgres'; url: string }

export interface ThirdAudienceConfig {
  /** Directory containing .mdx files, relative to project root. Default: 'content' */
  contentDir?: string
  /** Directory for JSONL data files. Default: 'data' */
  dataDir?: string
  /**
   * Storage backend. Defaults to SQLite (local file, zero config).
   * Set { type: 'postgres', url: '...' } for Postgres/Supabase.
   */
  storage?: StorageConfig
  /**
   * URL path segments to strip when mapping a request slug to a content file.
   * Use when your route structure differs from your file layout — e.g. URLs
   * are /en/learn/hydroponics/x but files live at content/en/hydroponics/x.mdx.
   * Set ['learn'] to drop the 'learn' segment. Default: [] (no rewriting).
   */
  stripSegments?: string[]
  /** Mount the /third-audience/ dashboard. Default: true */
  dashboard?: boolean
  /** Secret for dashboard access (HTTP Basic or bearer). Required when dashboard: true */
  dashboardSecret?: string
  notifications?: {
    /**
     * SMTP config for transactional email.
     * Use Brevo (smtp-relay.brevo.com:587) or any SMTP provider.
     */
    smtp?: {
      host: string
      port?: number
      secure?: boolean
      user: string
      pass: string
    }
    /** Brevo API key — alternative to raw SMTP, uses Brevo transactional API */
    brevoApiKey?: string
    /** Recipient email address(es) for all alerts and digests */
    to?: string | string[]
    /** Sender name and address shown in emails */
    from?: string
    /** Alert triggers — all enabled by default when smtp/brevo is configured */
    alerts?: {
      firstBotVisit?: boolean
      firstCitation?: boolean
      newPlatform?: boolean
      citationSpike?: boolean
      dailyDigest?: boolean
      weeklyDigest?: boolean
    }
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
  stripSegments: [],
  storage: { type: 'sqlite' },
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
