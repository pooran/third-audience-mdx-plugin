import type { NextConfig } from 'next'
import { resolveConfig, type ThirdAudienceConfig } from './config.js'

/**
 * Wraps next.config.ts to inject Third Audience rewrites and headers.
 *
 * Usage:
 *   import { withThirdAudience } from 'third-audience-mdx'
 *   export default withThirdAudience({ contentDir: 'content' })
 */
export function withThirdAudience(
  options: ThirdAudienceConfig = {},
  nextConfig: NextConfig = {}
): NextConfig {
  const config = resolveConfig(options)

  return {
    ...nextConfig,
    async headers() {
      const existing = await nextConfig.headers?.() ?? []
      return [
        ...existing,
        {
          source: '/:path*.md',
          headers: [{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' }],
        },
        {
          source: '/llms.txt',
          headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
        },
        {
          source: '/okf/:path*',
          headers: [{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' }],
        },
      ]
    },
    env: {
      ...nextConfig.env,
      TA_CONTENT_DIR: config.contentDir,
      TA_DATA_DIR: config.dataDir,
      TA_DASHBOARD_ENABLED: String(config.dashboard),
      TA_STRIP_SEGMENTS: config.stripSegments.join(','),
      TA_STORAGE_TYPE: config.storage.type,
      ...('url' in config.storage ? { TA_STORAGE_URL: config.storage.url } : {}),
    },
  }
}
