import { NextConfig } from 'next';
import { NextRequest, NextResponse } from 'next/server';

type StorageConfig = {
    type: 'sqlite';
} | {
    type: 'postgres';
    url: string;
};
interface ThirdAudienceConfig {
    /** Directory containing .mdx files, relative to project root. Default: 'content' */
    contentDir?: string;
    /** Directory for JSONL data files. Default: 'data' */
    dataDir?: string;
    /**
     * Storage backend. Defaults to SQLite (local file, zero config).
     * Set { type: 'postgres', url: '...' } for Postgres/Supabase.
     */
    storage?: StorageConfig;
    /**
     * URL path segments to strip when mapping a request slug to a content file.
     * Use when your route structure differs from your file layout — e.g. URLs
     * are /en/learn/hydroponics/x but files live at content/en/hydroponics/x.mdx.
     * Set ['learn'] to drop the 'learn' segment. Default: [] (no rewriting).
     */
    stripSegments?: string[];
    /** Mount the /third-audience/ dashboard. Default: true */
    dashboard?: boolean;
    /** Secret for dashboard access (HTTP Basic or bearer). Required when dashboard: true */
    dashboardSecret?: string;
    notifications?: {
        email?: {
            smtp: string;
            to: string;
            from?: string;
        };
        slack?: {
            webhookUrl: string;
        };
    };
    bots?: {
        allowlist?: string[];
        blocklist?: string[];
    };
    cache?: {
        /** Cache TTL in seconds. Default: 3600 */
        ttl?: number;
        /** Max in-memory entries. Default: 500 */
        maxMemoryEntries?: number;
    };
}

/**
 * Wraps next.config.ts to inject Third Audience rewrites and headers.
 *
 * Usage:
 *   import { withThirdAudience } from 'third-audience-mdx'
 *   export default withThirdAudience({ contentDir: 'content' })
 */
declare function withThirdAudience(options?: ThirdAudienceConfig, nextConfig?: NextConfig): NextConfig;

/**
 * Third Audience middleware — Edge-runtime compatible (no Node.js crypto).
 *
 * Auth guard uses cookie presence only; HMAC verification happens in the
 * route handler (Node.js runtime) where crypto is available.
 *
 * Wire up in middleware.ts:
 *   export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
 *   export const config = { matcher: ['/((?!_next|api).*)'] }
 */
declare function thirdAudienceMiddleware(req: NextRequest): NextResponse | null;

interface BotDetectionResult {
    isBot: boolean;
    botName: string | null;
    confidence: 'high' | 'medium' | 'low';
    detectionMethod: 'known_pattern' | 'heuristic' | 'auto_learned' | 'none';
    category: 'ai_crawler' | 'search_engine' | 'unknown_bot' | 'human';
    rawUserAgent: string;
}

interface DetectBotInput {
    userAgent: string;
    /** Optional: headers map for heuristic checks */
    headers?: Record<string, string | string[] | undefined>;
    /** Optional: IP address */
    ip?: string;
}
/**
 * Three-layer bot detection pipeline:
 * 1. Known pattern matching (O(n) UA string match)
 * 2. Heuristic signals (missing headers, headless indicators)
 * 3. Auto-learner flag (unknown UAs that behave bot-like)
 */
declare function detectBot(input: DetectBotInput): BotDetectionResult;

export { type BotDetectionResult, type ThirdAudienceConfig, detectBot, thirdAudienceMiddleware, withThirdAudience };
