/**
 * third-audience-mdx
 * Public API surface for the package.
 */

export { withThirdAudience } from './core/with-third-audience.js'
export { thirdAudienceMiddleware } from './core/middleware.js'
export { detectBot } from './detection/bot-detection-pipeline.js'
export type { ThirdAudienceConfig } from './core/config.js'
export type { BotDetectionResult } from './detection/bot-detection-result.js'
